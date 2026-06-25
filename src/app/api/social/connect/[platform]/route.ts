import { NextResponse } from "next/server";
import { guard, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { resolveCredential } from "@/lib/dal/integrations";
import { getOrCreateZernioProfileId, getZernioAuthUrl } from "@/services/zernio";
import { APP_URL } from "@/lib/env";

type Ctx = { params: Promise<{ platform: string }> };

export async function GET(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const { platform } = await ctx.params;
    const supabase = await createClient();

    // Query workspace info
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", auth.membership.workspace_id)
      .single();
    const workspaceName = workspace?.name || "My Workspace";

    // Resolve workspace integrations credential for publishing (Zernio)
    const resolved = await resolveCredential(auth.membership.workspace_id, "publishing");
    const apiKey = resolved?.credential?.apiKey || process.env.ZERNIO_API_KEY;

    if (!apiKey) {
      return NextResponse.redirect(
        `${APP_URL}/dashboard/user/publish?error=${encodeURIComponent(
          "No Zernio API key configured. Ask your admin to add one under Workspace Settings → API Settings."
        )}`
      );
    }

    // Build callback URL incorporating platform. Zernio appends
    // platform/profileId/accountId/username/status to this on completion.
    const callbackUrl = `${APP_URL}/api/social/callback?platform=${platform}`;

    // Get/create a profile, then ask Zernio for the OAuth authorization URL.
    // Both calls hit the Zernio API server-side with the Bearer key and may
    // throw on failure — surface those as an error toast on the publish page.
    let authUrl: string;
    try {
      const profileId = await getOrCreateZernioProfileId(workspaceName, apiKey);
      authUrl = await getZernioAuthUrl(platform, profileId, callbackUrl, apiKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect to Zernio";
      return NextResponse.redirect(
        `${APP_URL}/dashboard/user/publish?error=${encodeURIComponent(msg)}`
      );
    }

    // Redirect the browser to the platform's OAuth authorization page.
    return NextResponse.redirect(authUrl);
  });
}

