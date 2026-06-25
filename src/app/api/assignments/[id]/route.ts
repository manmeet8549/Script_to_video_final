import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { approveAssignment, getAssignment, setAssignmentStatus } from "@/lib/dal/collaboration";
import { createNotification, notifyAdmins } from "@/lib/dal/notifications";
import { getProject } from "@/lib/dal/projects";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  action: z.enum(["accept", "request_revision", "approve", "reject"]),
  feedback: z.string().max(2000).optional(),
});

// PATCH /api/assignments/[id] — editor accepts work; creator requests a revision,
// accepts (approve), or rejects.
export async function PATCH(request: Request, ctx: Ctx) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user", "editor"]);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;

    const body = await parseBody(request, schema);
    if (!body.ok) return body.response;

    if (!(await getAssignment(id))) return jsonError("Assignment not found", 404);

    const assignment = await getAssignment(id);
    if (!assignment) return jsonError("Assignment not found", 404);

    switch (body.data.action) {
      case "accept": {
        const acceptedTask = await setAssignmentStatus(id, "in_progress");
        if (assignment.requested_by) {
          try {
            const project = await getProject(assignment.project_id);
            const title = project?.title || "your project";
            await createNotification({
              userId: assignment.requested_by,
              workspaceId: auth.membership.workspace_id,
              type: "stage_complete",
              title: "Assignment Accepted",
              message: `An editor has accepted and started work on project "${title}".`,
              relatedProjectId: assignment.project_id,
              relatedTaskId: assignment.id,
              actionUrl: `/dashboard/user/edit/manual`,
            });
          } catch (err) {
            console.error("Failed to notify creator of acceptance:", err);
          }
        }
        return jsonOk(acceptedTask);
      }
      case "request_revision": {
        const revisionTask = await setAssignmentStatus(id, "revision_requested", { feedback: body.data.feedback ?? null });
        if (assignment.editor_id) {
          try {
            const project = await getProject(assignment.project_id);
            const title = project?.title || "your assigned project";
            await createNotification({
              userId: assignment.editor_id,
              workspaceId: auth.membership.workspace_id,
              type: "edit_rejected",
              title: "Revision Requested",
              message: `Creator requested changes for project "${title}".`,
              relatedProjectId: assignment.project_id,
              relatedTaskId: assignment.id,
              actionUrl: `/dashboard/editor/assignments?status=in_progress`,
            });
          } catch (err) {
            console.error("Failed to notify editor of revision:", err);
          }
        }
        return jsonOk(revisionTask);
      }
      case "reject":
        return jsonOk(
          await setAssignmentStatus(id, "rejected", { feedback: body.data.feedback ?? null }),
        );
      case "approve": {
        const approvedTask = await approveAssignment(id);
        if (assignment.editor_id) {
          try {
            const project = await getProject(assignment.project_id);
            const title = project?.title || "your edited project";
            await createNotification({
              userId: assignment.editor_id,
              workspaceId: auth.membership.workspace_id,
              type: "edit_complete",
              title: "Assignment Approved",
              message: `The creator approved your edits for project "${title}".`,
              relatedProjectId: assignment.project_id,
              relatedTaskId: assignment.id,
              actionUrl: `/dashboard/editor/assignments?status=completed`,
            });
          } catch (err) {
            console.error("Failed to notify editor of approval:", err);
          }
        }
        try {
          const project = await getProject(assignment.project_id);
          const title = project?.title || "a project";
          await notifyAdmins(auth.membership.workspace_id, {
            type: "stage_complete",
            title: "Project Editing Completed",
            message: `The post-production editing for project "${title}" was approved by the creator.`,
            relatedProjectId: assignment.project_id,
            actionUrl: `/dashboard/admin/projects`,
          });
        } catch (err) {
          console.error("Failed to notify admins of project completion:", err);
        }
        return jsonOk(approvedTask);
      }
    }
  });
}
