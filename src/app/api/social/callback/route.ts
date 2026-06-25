import { NextResponse } from "next/server";
import { guard, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto/secrets";
import { APP_URL } from "@/lib/env";

export async function GET(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    // Zernio appends: platform, profileId, accountId, username, status.
    const status = searchParams.get("status");
    const accountId = searchParams.get("accountId") || searchParams.get("zernioAccountId");
    const username = searchParams.get("username") || searchParams.get("name") || "Connected Account";
    const platform = searchParams.get("platform");
    // Treat an explicit error status, or a missing account id, as failure.
    const failed = status === "error" || !accountId;

    if (failed || !platform) {
      const errorMsg =
        searchParams.get("error") || searchParams.get("message") || "Account connection failed";
      return NextResponse.redirect(
        `${APP_URL}/dashboard/user/publish?error=${encodeURIComponent(errorMsg)}`
      );
    }

    const supabase = await createClient();

    // Check if there is already a default account for this platform in this workspace
    const { data: existingAccounts } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("workspace_id", auth.membership.workspace_id)
      .eq("platform", platform as any);

    const hasDefault = existingAccounts && existingAccounts.length > 0;
    const isDefault = !hasDefault;

    // Encrypt placeholder token for schema compatibility
    const encryptedPlaceholder = encryptSecret("zernio-connected-token");

    // Upsert the social account link
    const { error } = await supabase.from("social_accounts").upsert(
      {
        workspace_id: auth.membership.workspace_id,
        user_id: auth.user.id,
        platform: platform as any,
        zernio_account_id: accountId,
        channel_name: username,
        account_handle: username.startsWith("@") ? username : `@${username.replace(/\s+/g, "").toLowerCase()}`,
        is_default: isDefault,
        access_token: encryptedPlaceholder,
      },
      { onConflict: "workspace_id,platform,zernio_account_id" }
    );

    if (error) {
      console.error("Failed to save connected social account:", error);
      return NextResponse.redirect(
        `${APP_URL}/dashboard/user/publish?error=${encodeURIComponent(
          "Failed to save social account connection"
        )}`
      );
    }

    return NextResponse.redirect(`${APP_URL}/dashboard/user/publish?connected=${platform}`);
  });
}
