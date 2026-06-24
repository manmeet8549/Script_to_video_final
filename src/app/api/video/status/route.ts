import { NextRequest } from "next/server";
import { guard, jsonError, jsonOk, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { getLatestVideo, pollVideo } from "@/lib/dal/pipeline";

// GET /api/video/status?projectId=... — poll the latest render for a project.
// When still generating it refreshes status from the provider and, on
// completion, back-fills the MP4/thumbnail into R2 (handled by pollVideo →
// applyVideoResult). Returns { status, videoUrl }.
export async function GET(request: NextRequest) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;

    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return jsonError("Missing projectId parameter", 400);
    if (!(await getProject(projectId))) return jsonError("Project not found", 404);

    let latest = await getLatestVideo(projectId);
    if (!latest) return jsonOk({ status: "idle", videoUrl: null });

    if (latest.status === "generating") {
      latest = await pollVideo(auth.membership.workspace_id, latest.id);
    }

    const status =
      latest.status === "completed"
        ? "completed"
        : latest.status === "failed"
          ? "failed"
          : "processing";

    return jsonOk({
      status,
      videoUrl: latest.video_url ?? null,
      thumbnailUrl: latest.thumbnail_url ?? null,
      error: latest.error ?? null,
    });
  });
}
