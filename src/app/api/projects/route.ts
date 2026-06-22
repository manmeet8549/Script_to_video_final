import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember, requireApiUser } from "@/lib/api/http";
import { createProject, listProjects, listAllProjects } from "@/lib/dal/projects";

// GET /api/projects — projects in the caller's active workspace.
export async function GET(request: Request) {
  return guard(async () => {
    const url = new URL(request.url);
    const all = url.searchParams.get("all") === "true";

    if (all) {
      const auth = await requireApiUser();
      if (!auth.ok) return auth.response;
      const projects = await listAllProjects();
      return jsonOk(projects);
    }

    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    return jsonOk(await listProjects(auth.membership.workspace_id));
  });
}

const createSchema = z.object({
  title: z.string().min(1, "Project title is required").max(200),
  description: z.string().max(4000).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z
    .enum(["idea", "scripting", "voice_gen", "video_gen", "editing", "review", "published", "archived"])
    .optional(),
  deadline: z.string().datetime().optional(),
});

// POST /api/projects — create a project in the active workspace.
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, createSchema);
    if (!body.ok) return body.response;

    if (auth.membership.role === "user" && auth.membership.status !== "active") {
      return jsonError("Inactive membership", 403);
    }

    const project = await createProject({
      workspaceId: auth.membership.workspace_id,
      ...body.data,
    });
    return jsonOk(project, { status: 201 });
  });
}
