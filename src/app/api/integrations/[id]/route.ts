import { guard, jsonOk, requireApiMember } from "@/lib/api/http";
import { deleteApi } from "@/lib/dal/integrations";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;
    await deleteApi(id);
    return jsonOk({ id });
  });
}
