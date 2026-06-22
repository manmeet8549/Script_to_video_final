import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiUser } from "@/lib/api/http";
import { listNotifications, markAllNotificationsRead } from "@/lib/dal/notifications";

export async function GET() {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    return jsonOk(await listNotifications(auth.user.id));
  });
}

const actionSchema = z.object({
  action: z.literal("read-all"),
});

export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, actionSchema);
    if (!body.ok) return body.response;

    await markAllNotificationsRead(auth.user.id);
    return jsonOk({ success: true });
  });
}
