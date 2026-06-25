import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { resolveCredential } from "@/lib/dal/integrations";
import { getOrCreateZernioProfileId, getZernioAuthUrl } from "@/services/zernio";
import { APP_URL } from "@/lib/env";

const schema = z.object({
  platform: z.string().min(1),
});

// POST /api/integrations/social-auth
// Returns { auth_url } for the given platform's OAuth flow, or a JSON error.
// The client calls this and only navigates when it gets a real auth_url — so a
// misconfigured/invalid Zernio key surfaces as a toast instead of a full-page
// redirect that looks like the page "refreshing".
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const { platform } = body.data;

    // Resolve the workspace's Zernio key (falls back to env for local dev).
    const resolved = await resolveCredential(auth.membership.workspace_id, "publishing");
    const apiKey = resolved?.credential?.apiKey || process.env.ZERNIO_API_KEY;

    if (!apiKey) {
      return jsonError(
        "No Zernio API key is configured for this workspace. Ask your workspace owner to add one under Workspace → API Settings (Publishing → Zernio).",
        422,
      );
    }

    // Workspace name is used when auto-creating a Zernio profile.
    const supabase = await createClient();
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", auth.membership.workspace_id)
      .single();
    const workspaceName = workspace?.name || "My Workspace";

    const callbackUrl = `${APP_URL}/api/social/callback?platform=${encodeURIComponent(platform)}`;

    try {
      const profileId = await getOrCreateZernioProfileId(workspaceName, apiKey);
      const authUrl = await getZernioAuthUrl(platform, profileId, callbackUrl, apiKey);
      return jsonOk({ auth_url: authUrl });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to contact Zernio.";
      console.error(`[social-auth] ${platform} connect failed:`, msg);
      return jsonError(msg, 502);
    }
  });
}
