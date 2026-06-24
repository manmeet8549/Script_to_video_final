import { NextRequest } from "next/server";
import { guard, jsonError, jsonOk, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { resolveCredential } from "@/lib/dal/integrations";

export async function GET(request: NextRequest) {
  return guard(async () => {
    // 1. Authenticate user membership
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    // 2. Get projectId query parameter
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return jsonError("Missing projectId parameter", 400);

    // 3. Fetch project to get its workspace_id
    const project = await getProject(projectId);
    if (!project) return jsonError("Project not found", 404);

    // 4. Resolve voice integration credential for the workspace
    const resolved = await resolveCredential(project.workspace_id, "voice");
    if (!resolved) {
      return jsonOk({ voices: [], provider: null });
    }

    const { api: workspaceApi, credential } = resolved;

    // 5. Fetch voices from ElevenLabs if it's the active provider
    if (workspaceApi.provider_key === "elevenlabs") {
      const base = credential.endpointUrl?.replace(/\/$/, "") || "https://api.elevenlabs.io";
      try {
        const res = await fetch(`${base}/v1/voices`, {
          method: "GET",
          headers: {
            "xi-api-key": credential.apiKey,
          },
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return jsonError(`ElevenLabs API error: ${detail.slice(0, 200)}`, res.status);
        }

        type ElevenLabsVoice = {
          voice_id: string;
          name: string;
          description?: string;
          category?: string;
          labels?: { gender?: string; accent?: string };
        };
        const data = (await res.json()) as { voices?: ElevenLabsVoice[] };
        const voices = (data.voices || []).map((v) => ({
          id: v.voice_id,
          name: v.name,
          gender: v.labels?.gender || "Unknown",
          accent: v.labels?.accent || "Unknown",
          description: v.description || `${v.labels?.gender || ""} ${v.labels?.accent || ""} voice`,
          category: v.category,
        }));

        return jsonOk({ voices, provider: "elevenlabs" });
      } catch (err) {
        return jsonError(err instanceof Error ? err.message : "Failed to fetch ElevenLabs voices", 500);
      }
    }

    return jsonOk({ voices: [], provider: workspaceApi.provider_key });
  });
}
