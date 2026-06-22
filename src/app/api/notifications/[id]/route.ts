import { guard, jsonOk, requireApiUser } from "@/lib/api/http";
import { deleteNotification, markNotificationRead } from "@/lib/dal/notifications";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;

    await markNotificationRead(id, auth.user.id);
    return jsonOk({ id, is_read: true });
  });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;

    await deleteNotification(id, auth.user.id);
    return jsonOk({ id });
  });
}
