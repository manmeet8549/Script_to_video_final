import { guard, jsonError, jsonOk, requireApiUser } from "@/lib/api/http";
import { getWorkspaceDetail } from "@/lib/dal/workspaces";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ workspaceId: string }> },
) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const { workspaceId } = await ctx.params;
    const detail = await getWorkspaceDetail(workspaceId);
    if (!detail) return jsonError("Workspace not found", 404);

    return jsonOk(detail);
  });
}
