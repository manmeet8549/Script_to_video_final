import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal/auth";
import { setStageStatus } from "@/lib/dal/projects";
import { publishApprovedTask } from "@/lib/dal/pipeline";
import type {
  ApprovalItem,
  ApprovalStatus,
  EditedVideo,
  EditStatus,
  EditingTask,
} from "@/types/db";

// ---------------------------------------------------------- assignments ----
// Editor collaboration is modelled on the existing `editing_tasks` table (one
// row per assignment) plus `edited_videos` (one row per uploaded version).

export async function listAssignments(filter: {
  projectId?: string;
  editorId?: string;
}): Promise<EditingTask[]> {
  const supabase = await createClient();
  let query = supabase.from("editing_tasks").select("*").order("created_at", { ascending: false });
  if (filter.projectId) query = query.eq("project_id", filter.projectId);
  if (filter.editorId) query = query.eq("editor_id", filter.editorId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getAssignment(id: string): Promise<EditingTask | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("editing_tasks").select("*").eq("id", id).single();
  return data ?? null;
}

export async function setAssignmentStatus(
  id: string,
  status: EditStatus,
  patch: { feedback?: string | null; editedVideoUrl?: string | null } = {},
): Promise<EditingTask> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("editing_tasks")
    .update({
      status,
      ...(patch.feedback !== undefined ? { feedback: patch.feedback } : {}),
      ...(patch.editedVideoUrl !== undefined ? { edited_video_url: patch.editedVideoUrl } : {}),
      ...(status === "completed" || status === "approved"
        ? { completed_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listVersions(editingTaskId: string): Promise<EditedVideo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("edited_videos")
    .select("*")
    .eq("editing_task_id", editingTaskId)
    .order("version", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Add an editor's uploaded version. Auto-increments the version number and moves
// the assignment into review.
export async function addEditedVersion(
  editingTaskId: string,
  input: { videoUrl: string; r2Key?: string | null; notes?: string | null },
): Promise<EditedVideo> {
  const supabase = await createClient();
  const user = await getUser();
  const existing = await listVersions(editingTaskId);
  const version = existing.length + 1;

  const { data, error } = await supabase
    .from("edited_videos")
    .insert({
      editing_task_id: editingTaskId,
      version,
      video_url: input.videoUrl,
      r2_key: input.r2Key ?? null,
      notes: input.notes ?? null,
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  await setAssignmentStatus(editingTaskId, "under_review", { editedVideoUrl: input.videoUrl });
  return data;
}

// Creator accepts an edited assignment: mark approved and promote the edited cut
// to the project's video.
export async function approveAssignment(id: string): Promise<EditingTask> {
  const supabase = await createClient();
  const task = await getAssignment(id);
  if (!task) throw new Error("Assignment not found");

  const updated = await setAssignmentStatus(id, "approved");
  if (task.edited_video_url) {
    await supabase
      .from("projects")
      .update({ video_url: task.edited_video_url })
      .eq("id", task.project_id);
    await setStageStatus(task.project_id, "editing", "completed", {
      edited_video_url: task.edited_video_url,
    });
  }
  return updated;
}

// ------------------------------------------------------------ approvals ----

export async function listApprovals(
  workspaceId: string,
  status?: ApprovalStatus,
): Promise<ApprovalItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("approval_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Admin decision on a queued publish. Approving releases the held publishing task.
export async function decideApproval(
  workspaceId: string,
  id: string,
  decision: ApprovalStatus,
  feedback?: string,
): Promise<ApprovalItem> {
  const supabase = await createClient();
  const user = await getUser();

  const { data: item } = await supabase
    .from("approval_items")
    .select("*")
    .eq("id", id)
    .single();
  if (!item) throw new Error("Approval item not found");

  const { data: updated, error } = await supabase
    .from("approval_items")
    .update({
      status: decision,
      feedback: feedback ?? null,
      decided_by: user?.id ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  if (decision === "approved" && item.publishing_task_id) {
    await publishApprovedTask(workspaceId, item.publishing_task_id);
  } else if (decision !== "approved" && item.publishing_task_id) {
    // Reject / changes requested → mark the held task accordingly.
    await supabase
      .from("publishing_tasks")
      .update({ status: "failed", error: feedback ?? `Publish ${decision}` })
      .eq("id", item.publishing_task_id);
  }
  return updated;
}
