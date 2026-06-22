import { cookies } from "next/headers";
import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiUser } from "@/lib/api/http";
import { getMemberships, ACTIVE_WORKSPACE_COOKIE } from "@/lib/dal/auth";

const schema = z.object({ workspace_id: z.string().uuid() });

// Switch the caller's "active" workspace by setting a cookie. Only workspaces
// the user actually belongs to are allowed.
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const memberships = await getMemberships();
    if (!memberships.some((m) => m.workspace_id === body.data.workspace_id)) {
      return jsonError("Not a member of this workspace", 403);
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_WORKSPACE_COOKIE, body.data.workspace_id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return jsonOk({ active_workspace_id: body.data.workspace_id });
  });
}
