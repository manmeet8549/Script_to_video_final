import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/dal/auth";
import type {
  Project,
  ProjectPriority,
  ProjectStage,
  ProjectStatus,
  StageName,
} from "@/types/db";

const STAGE_ORDER: StageName[] = ["idea", "script", "voice", "video", "editing", "review", "publish"];

export async function listProjects(workspaceId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("*").eq("id", id).single();
  return data ?? null;
}

export async function getProjectStages(projectId: string): Promise<ProjectStage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_stages")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw error;
  const stages = data ?? [];
  // Return in canonical pipeline order.
  return stages.sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage_name) - STAGE_ORDER.indexOf(b.stage_name),
  );
}

export async function createProject(input: {
  workspaceId: string;
  title: string;
  description?: string | null;
  priority?: ProjectPriority;
  status?: ProjectStatus;
  deadline?: string | null;
}): Promise<Project> {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: input.workspaceId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      status: input.status ?? "idea",
      deadline: input.deadline ?? null,
      created_by: user.id,
      assigned_to: user.id,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Seed the pipeline timeline.
  const stages = STAGE_ORDER.map((stage_name, i) => ({
    project_id: project.id,
    stage_name,
    status: (i === 0 ? "in_progress" : "pending") as ProjectStage["status"],
  }));
  const { error: stageError } = await supabase.from("project_stages").insert(stages);
  if (stageError) throw stageError;

  return project;
}

export class ProjectUpdateForbidden extends Error {
  constructor() {
    super("You don't have permission to update this project");
    this.name = "ProjectUpdateForbidden";
  }
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project> {
  const supabase = await createClient();
  // Strip immutable / server-managed columns.
  const { id: _id, workspace_id: _ws, created_at: _c, updated_at: _u, ...safe } = patch;
  void _id;
  void _ws;
  void _c;
  void _u;
  const { data, error } = await supabase
    .from("projects")
    .update(safe)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  // No row came back: RLS denied the update (the caller can read the project
  // but isn't allowed to change it). Surface a clear authorization error rather
  // than letting an opaque 500 bubble up.
  if (!data) throw new ProjectUpdateForbidden();
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// Advance/record a pipeline stage and keep the project's status/progress in sync.
export async function setStageStatus(
  projectId: string,
  stageName: StageName,
  status: ProjectStage["status"],
  outputData?: Record<string, unknown>,
): Promise<ProjectStage> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("project_stages")
    .update({
      status,
      started_at: status === "in_progress" ? now : undefined,
      completed_at: status === "completed" ? now : undefined,
      ...(outputData ? { output_data: outputData } : {}),
    })
    .eq("project_id", projectId)
    .eq("stage_name", stageName)
    .select("*")
    .single();
  if (error) throw error;

  // Recompute coarse progress from completed stages.
  const stages = await getProjectStages(projectId);
  const completed = stages.filter((s) => s.status === "completed").length;
  const progress = Math.round((completed / STAGE_ORDER.length) * 100);
  await supabase.from("projects").update({ progress_percent: progress }).eq("id", projectId);

  return data;
}

export type ProjectWithWorkspaceAndCreator = Project & {
  workspaces: { name: string } | null;
  profiles: { full_name: string | null; email: string } | null;
};

export async function listAllProjects(): Promise<ProjectWithWorkspaceAndCreator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, workspaces(name), profiles:created_by(full_name, email)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as any) ?? [];
}
