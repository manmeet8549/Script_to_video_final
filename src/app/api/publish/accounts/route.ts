import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const supabase = await createClient();
    const { data: accounts, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("workspace_id", auth.membership.workspace_id)
      .order("platform")
      .order("created_at", { ascending: true });

    if (error) return jsonError(error.message, 500);
    return jsonOk(accounts || []);
  });
}

const addSchema = z.object({
  platform: z.enum(["youtube", "tiktok", "instagram", "linkedin", "facebook", "x"]),
  zernio_account_id: z.string().min(1),
  channel_name: z.string().min(1),
  account_handle: z.string().optional(),
});

export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, addSchema);
    if (!body.ok) return body.response;

    const supabase = await createClient();

    // Check if default exists
    const { data: existing } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("workspace_id", auth.membership.workspace_id)
      .eq("platform", body.data.platform);

    const isDefault = !existing || existing.length === 0;

    const { data: account, error } = await supabase
      .from("social_accounts")
      .insert({
        workspace_id: auth.membership.workspace_id,
        user_id: auth.user.id,
        platform: body.data.platform,
        zernio_account_id: body.data.zernio_account_id,
        channel_name: body.data.channel_name,
        account_handle:
          body.data.account_handle ||
          `@${body.data.channel_name.toLowerCase().replace(/\s+/g, "")}`,
        is_default: isDefault,
        access_token: "encrypted-mock-token",
      })
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);
    return jsonOk(account, { status: 201 });
  });
}

const patchSchema = z.object({
  id: z.string().uuid(),
  channel_name: z.string().min(1).optional(),
  is_default: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, patchSchema);
    if (!body.ok) return body.response;

    const supabase = await createClient();

    // Verify account ownership
    const { data: account } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", body.data.id)
      .eq("workspace_id", auth.membership.workspace_id)
      .single();

    if (!account) return jsonError("Account not found", 404);

    const updates: any = {};
    if (body.data.channel_name !== undefined) {
      updates.channel_name = body.data.channel_name;
    }

    if (body.data.is_default === true) {
      // Set all other accounts for this platform to false
      await supabase
        .from("social_accounts")
        .update({ is_default: false })
        .eq("workspace_id", auth.membership.workspace_id)
        .eq("platform", account.platform);

      updates.is_default = true;
    }

    const { data: updated, error } = await supabase
      .from("social_accounts")
      .update(updates)
      .eq("id", body.data.id)
      .select("*")
      .single();

    if (error) return jsonError(error.message, 400);
    return jsonOk(updated);
  });
}

export async function DELETE(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return jsonError("Missing account id", 400);

    const supabase = await createClient();

    // Verify ownership
    const { data: account } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", auth.membership.workspace_id)
      .single();

    if (!account) return jsonError("Account not found", 404);

    // Delete account
    const { error } = await supabase.from("social_accounts").delete().eq("id", id);

    if (error) return jsonError(error.message, 400);

    // If we deleted the default, set another account on same platform as default
    if (account.is_default) {
      const { data: others } = await supabase
        .from("social_accounts")
        .select("id")
        .eq("workspace_id", auth.membership.workspace_id)
        .eq("platform", account.platform)
        .limit(1);

      if (others && others.length > 0) {
        await supabase
          .from("social_accounts")
          .update({ is_default: true })
          .eq("id", others[0].id);
      }
    }

    return jsonOk({ success: true });
  });
}
