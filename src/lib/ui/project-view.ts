import type { Project, ProjectStatus } from "@/types/db";

// View model the project cards/list render. Maps the normalized DB project into
// the labels/colors the existing UI expects.
export type ProjectCardView = {
  id: string;
  name: string;
  projectId: string;
  priority: "High" | "Medium" | "Low";
  priorityColor: string;
  status: "In Progress" | "Completed" | "Overdue" | "Draft";
  statusColor: string;
  stage: string;
  dueDate: string;
  progress: number;
  created: string;
  lastUpdated: string;
  videoUrl?: string | null;
};

const PRIORITY_LABEL: Record<Project["priority"], "High" | "Medium" | "Low"> = {
  urgent: "High",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const PRIORITY_COLOR: Record<"High" | "Medium" | "Low", string> = {
  High: "bg-red-50 text-red-700 border-red-100",
  Medium: "bg-amber-50 text-amber-700 border-amber-100",
  Low: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const STAGE_LABEL: Record<ProjectStatus, string> = {
  idea: "Idea Selection",
  scripting: "AI Script Gen",
  voice_gen: "Voiceover",
  video_gen: "Video Generation",
  editing: "Editing",
  review: "Under Review",
  published: "Completed",
  archived: "Archived",
};

function statusView(p: Project): { status: ProjectCardView["status"]; statusColor: string } {
  const overdue =
    p.deadline != null && new Date(p.deadline) < new Date() && p.status !== "published";
  if (overdue) return { status: "Overdue", statusColor: "bg-red-50 text-red-800 border-red-200" };
  if (p.status === "published")
    return {
      status: "Completed",
      statusColor: "bg-brand-green-light text-brand-green border-brand-green-light",
    };
  if (p.status === "idea" || p.status === "archived")
    return { status: "Draft", statusColor: "bg-zinc-50 text-zinc-400 border-zinc-150" };
  return { status: "In Progress", statusColor: "bg-zinc-100 text-zinc-800" };
}

function formatDue(deadline: string | null): string {
  if (!deadline) return "No deadline";
  const d = new Date(deadline);
  return `Due: ${d.toLocaleDateString("en-US", { month: "short", day: "2-digit" })}`;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function mapProjectToCard(p: Project): ProjectCardView {
  const priority = PRIORITY_LABEL[p.priority];
  const { status, statusColor } = statusView(p);
  return {
    id: p.id,
    name: p.title,
    projectId: p.id.slice(0, 8).toUpperCase(),
    priority,
    priorityColor: PRIORITY_COLOR[priority],
    status,
    statusColor,
    stage: STAGE_LABEL[p.status],
    dueDate: formatDue(p.deadline),
    progress: p.progress_percent,
    created: new Date(p.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    lastUpdated: relativeTime(p.updated_at),
    videoUrl: p.video_url,
  };
}
