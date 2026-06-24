import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiUser } from "@/lib/api/http";
import { listApis, saveApi } from "@/lib/dal/integrations";
import { getWorkspaceDetail } from "@/lib/dal/workspaces";

type Ctx = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const { workspaceId } = await ctx.params;

    // Check membership & role (getWorkspaceDetail returns null if inaccessible)
    const detail = await getWorkspaceDetail(workspaceId);
    if (!detail) {
      return jsonError("Workspace not found or unauthorized", 403);
    }

    return jsonOk(await listApis(workspaceId));
  });
}

const saveSchema = z.object({
  provider: z.enum(["script", "voice", "video", "editing", "publishing"]),
  provider_key: z.string().min(1),
  api_name: z.string().min(1).max(80),
  api_key: z.string().min(1),
  api_secret: z.string().optional(),
  endpoint_url: z.string().url().optional().or(z.literal("")),
  config: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const { workspaceId } = await ctx.params;

    const detail = await getWorkspaceDetail(workspaceId);
    if (!detail) {
      return jsonError("Workspace not found or unauthorized", 403);
    }

    // Must be Owner, Admin or Platform Owner
    const isPlatformOwner = detail.members.find(m => m.user_id === auth.user.id)?.profile?.is_platform_owner;
    if (detail.role !== "owner" && detail.role !== "admin" && !isPlatformOwner) {
      return jsonError("Unauthorized to manage integrations", 403);
    }

    const body = await parseBody(request, saveSchema);
    if (!body.ok) return body.response;

    const api = await saveApi({
      workspaceId,
      provider: body.data.provider,
      providerKey: body.data.provider_key,
      apiName: body.data.api_name,
      apiKey: body.data.api_key,
      apiSecret: body.data.api_secret || null,
      endpointUrl: body.data.endpoint_url || null,
      config: body.data.config,
    });
    return jsonOk(api, { status: 201 });
  });
}
