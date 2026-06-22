import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiUser } from "@/lib/api/http";
import { createWorkspace, listWorkspaces } from "@/lib/dal/workspaces";

export async function GET() {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    return jsonOk(await listWorkspaces());
  });
}

const createSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(120),
  slug: z
    .string()
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  description: z.string().max(2000).optional(),
  subscription_tier: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, createSchema);
    if (!body.ok) return body.response;

    const workspace = await createWorkspace(body.data);
    return jsonOk(workspace, { status: 201 });
  });
}
