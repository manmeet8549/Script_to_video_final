import { NextRequest } from "next/server";
import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { createEditTask } from "@/lib/dal/pipeline";
import { listAssignments } from "@/lib/dal/collaboration";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/dal/notifications";

// GET /api/assignments?mine=1 — assignments for the workspace, optionally
// scoped to the current editor (?mine=1) or a project (?projectId=).
export async function GET(request: NextRequest) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine");
    const projectId = searchParams.get("projectId") ?? undefined;

    const items = await listAssignments({
      projectId,
      editorId: mine ? auth.user.id : undefined,
    });
    return jsonOk({ items });
  });
}

const createSchema = z.object({
  project_id: z.string().uuid(),
  editor_id: z.string().uuid().nullable().optional(),
  instructions: z.string().max(4000).optional(),
  source_video_url: z.string().optional().nullable(),
});

// POST /api/assignments — creator assigns a generated video to an editor (a
// manual edit task).
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, createSchema);
    if (!body.ok) return body.response;
    if (!(await getProject(body.data.project_id))) return jsonError("Project not found", 404);

    // Delete any unassigned draft assignments for this project first to avoid duplicate/active constraints
    const supabase = await createClient();
    await supabase.from("editing_tasks").delete().eq("project_id", body.data.project_id).is("editor_id", null);

    const task = await createEditTask(auth.membership.workspace_id, body.data.project_id, {
      editType: "manual",
      editorId: body.data.editor_id ?? null,
      instructions: body.data.instructions,
      sourceVideoUrl: body.data.source_video_url,
    });

    if (body.data.editor_id) {
      try {
        const project = await getProject(body.data.project_id);
        const title = project?.title || "assigned project";
        await createNotification({
          userId: body.data.editor_id,
          workspaceId: auth.membership.workspace_id,
          type: "edit_request",
          title: "New Editing Assignment",
          message: `You have been assigned to edit "${title}".`,
          relatedProjectId: body.data.project_id,
          relatedTaskId: task.id,
          actionUrl: `/dashboard/editor/assignments?status=pending`,
        });
      } catch (err) {
        console.error("Failed to send assignment notification:", err);
      }
    }

    return jsonOk(task, { status: 201 });
  });
}
