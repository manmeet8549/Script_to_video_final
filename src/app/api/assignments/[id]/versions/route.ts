import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { addEditedVersion, getAssignment, listVersions } from "@/lib/dal/collaboration";
import { createNotification } from "@/lib/dal/notifications";
import { getProject } from "@/lib/dal/projects";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/assignments/[id]/versions — all uploaded edited cuts for an assignment.
export async function GET(_request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;
    if (!(await getAssignment(id))) return jsonError("Assignment not found", 404);
    return jsonOk({ versions: await listVersions(id) });
  });
}

const schema = z.object({
  video_url: z.string().min(1, "An edited video URL is required"),
  notes: z.string().max(2000).optional(),
  r2_key: z.string().optional(),
});

// POST /api/assignments/[id]/versions — editor uploads a new edited version,
// moving the assignment into review.
export async function POST(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "editor"]);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;
    const assignment = await getAssignment(id);
    if (!assignment) return jsonError("Assignment not found", 404);

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    const version = await addEditedVersion(id, {
      videoUrl: body.data.video_url,
      notes: body.data.notes,
      r2Key: body.data.r2_key,
    });

    if (assignment.requested_by) {
      try {
        const project = await getProject(assignment.project_id);
        const title = project?.title || "your project";
        await createNotification({
          userId: assignment.requested_by,
          workspaceId: auth.membership.workspace_id,
          type: "edit_complete",
          title: "New Edited Draft Uploaded",
          message: `An editor uploaded draft version ${version.version} for project "${title}".`,
          relatedProjectId: assignment.project_id,
          relatedTaskId: assignment.id,
          actionUrl: `/dashboard/user/edit/manual`,
        });
      } catch (err) {
        console.error("Failed to send draft notification:", err);
      }
    }

    return jsonOk(version, { status: 201 });
  });
}
