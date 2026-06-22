import { guard, jsonError, jsonOk, requireApiUser } from "@/lib/api/http";
import { isSlugAvailable } from "@/lib/dal/workspaces";

// GET /api/workspaces/slug-available?slug=acme-corp
// Returns whether the (normalized) slug is free. Auth-gated to authenticated
// users so it can't be used to enumerate slugs anonymously.
export async function GET(request: Request) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const slug = new URL(request.url).searchParams.get("slug") ?? "";
    if (!slug.trim()) return jsonError("A slug is required", 422);

    const result = await isSlugAvailable(slug);
    return jsonOk(result);
  });
}
