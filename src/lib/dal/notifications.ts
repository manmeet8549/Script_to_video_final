import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Notification } from "@/types/db";

export async function listNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteNotification(id: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function createNotification(input: {
  userId: string;
  workspaceId?: string | null;
  type: Notification["type"];
  title: string;
  message?: string | null;
  relatedProjectId?: string | null;
  relatedTaskId?: string | null;
  actionUrl?: string | null;
}): Promise<Notification> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.userId,
      workspace_id: input.workspaceId || null,
      type: input.type,
      title: input.title,
      message: input.message || null,
      related_project_id: input.relatedProjectId || null,
      related_task_id: input.relatedTaskId || null,
      action_url: input.actionUrl || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function broadcastNotifications(input: {
  userIds: string[];
  workspaceId: string;
  type: Notification["type"];
  title: string;
  message?: string | null;
  relatedProjectId?: string | null;
  actionUrl?: string | null;
}): Promise<void> {
  if (input.userIds.length === 0) return;
  const admin = createAdminClient();
  const rows = input.userIds.map((userId) => ({
    user_id: userId,
    workspace_id: input.workspaceId,
    type: input.type,
    title: input.title,
    message: input.message ?? null,
    related_project_id: input.relatedProjectId ?? null,
    action_url: input.actionUrl ?? null,
  }));
  const { error } = await admin.from("notifications").insert(rows);
  if (error) throw error;
}

export async function notifyAdmins(workspaceId: string, input: {
  type: Notification["type"];
  title: string;
  message?: string | null;
  relatedProjectId?: string | null;
  actionUrl?: string | null;
}): Promise<void> {
  try {
    const { listMembers } = require("@/lib/dal/members");
    const members = await listMembers(workspaceId);
    const adminIds = members
      .filter((m: any) => m.role === "admin" || m.role === "owner")
      .map((m: any) => m.user_id);

    if (adminIds.length > 0) {
      await broadcastNotifications({
        userIds: adminIds,
        workspaceId,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedProjectId: input.relatedProjectId,
        actionUrl: input.actionUrl,
      });
    }
  } catch (err) {
    console.error("notifyAdmins helper error:", err);
  }
}

export async function notifyAdminsOnPublish(workspaceId: string | null | undefined, projectId: string): Promise<void> {
  try {
    const { getProject } = require("@/lib/dal/projects");
    const project = await getProject(projectId);
    const title = project?.title || "a project";
    const resolvedWorkspaceId = workspaceId || project?.workspace_id;
    if (resolvedWorkspaceId) {
      await notifyAdmins(resolvedWorkspaceId, {
        type: "publish_complete",
        title: "Project Published",
        message: `The project "${title}" has been successfully published.`,
        relatedProjectId: projectId,
        actionUrl: `/dashboard/admin/projects`,
      });
    }
  } catch (err) {
    console.error("notifyAdminsOnPublish helper error:", err);
  }
}
