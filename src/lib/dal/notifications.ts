import "server-only";

import { createClient } from "@/lib/supabase/server";
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
