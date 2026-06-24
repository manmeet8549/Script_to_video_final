import { z } from "zod";
import { guard, jsonError, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { createVideo } from "@/lib/dal/pipeline";

const generateSchema = z.object({
  project_id: z.string().uuid(),
  avatar_id: z.string().min(1, "An avatar is required"),
  aspect_ratio: z.enum(["16:9", "9:16", "1:1"]).optional(),
  voice_id: z.string().optional(),
  background: z.string().optional(),
});

// Map an aspect ratio to HeyGen output dimensions.
const DIMENSIONS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 720, height: 720 },
};

// POST /api/video/generate — kick off an avatar video render through the pipeline
// DAL (inserts a tracked video_generations row, uses the project's narration
// audio, and is polled via /api/video/status?projectId=...).
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin", "user"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, generateSchema);
    if (!body.ok) return body.response;
    if (!(await getProject(body.data.project_id))) return jsonError("Project not found", 404);

    const aspect = body.data.aspect_ratio ?? "16:9";
    const video = await createVideo(auth.membership.workspace_id, body.data.project_id, {
      settings: {
        avatar_id: body.data.avatar_id,
        voice_id: body.data.voice_id,
        dimension: DIMENSIONS[aspect],
        ...(body.data.background
          ? { background: { type: "color", value: body.data.background } }
          : {}),
      },
    });

    if (video.status === "failed") {
      return jsonError(video.error || "Video generation failed to start.", 502);
    }
    return jsonOk(
      { id: video.id, videoId: video.provider_job_id, status: "processing" },
      { status: 201 },
    );
  });
}
