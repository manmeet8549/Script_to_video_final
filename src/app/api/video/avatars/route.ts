import { NextRequest } from "next/server";
import { guard, jsonError, jsonOk, requireApiMember } from "@/lib/api/http";
import { getProject } from "@/lib/dal/projects";
import { resolveCredential } from "@/lib/dal/integrations";

export type Avatar = {
  id: string;
  name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
  description: string;
};

// Stock avatars used in demo mode (no HeyGen key configured) and as a fallback
// when the HeyGen API is unreachable. Images come from fast CDNs and preview
// videos from small public sample buckets so demo previews load instantly.
const MOCK_AVATARS: Avatar[] = [
  {
    id: "Daniel_casual_20220925",
    name: "Daniel (Corporate)",
    gender: "Male",
    preview_image_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70&auto=format&fit=crop",
    preview_video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    description: "Corporate Shirt & Tie",
  },
  {
    id: "Anna_professional_20220803",
    name: "Anna (Executive)",
    gender: "Female",
    preview_image_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=70&auto=format&fit=crop",
    preview_video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    description: "Executive Office Blazer",
  },
  {
    id: "Tyler_casual_20220912",
    name: "Tyler (Startup)",
    gender: "Male",
    preview_image_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=70&auto=format&fit=crop",
    preview_video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    description: "Casual Smart Outfit",
  },
  {
    id: "Susan_casual_20221005",
    name: "Susan (Warm)",
    gender: "Female",
    preview_image_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=70&auto=format&fit=crop",
    preview_video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    description: "Friendly Cozy Sweater",
  },
  {
    id: "Kayla_professional_20220818",
    name: "Kayla (Presenter)",
    gender: "Female",
    preview_image_url:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=70&auto=format&fit=crop",
    preview_video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    description: "Confident Presenter Look",
  },
  {
    id: "Wade_casual_20220721",
    name: "Wade (Creator)",
    gender: "Male",
    preview_image_url:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=70&auto=format&fit=crop",
    preview_video_url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    description: "Relaxed Content Creator",
  },
];

// In-memory cache of the resolved avatar catalog, keyed by workspace. Serving
// repeat requests from server memory bypasses HeyGen's 1–3s API latency. Lives
// for the lifetime of the server process (per-node), refreshed every 5 minutes.
const CACHE_DURATION_MS = 5 * 60 * 1000;
type AvatarCacheEntry = { avatars: Avatar[]; provider: string | null; cachedAt: number };
const avatarCache = new Map<string, AvatarCacheEntry>();

type HeygenAvatar = {
  id?: string;
  avatar_id?: string;
  name?: string;
  avatar_name?: string;
  gender?: string;
  preview_image_url?: string;
  preview_video_url?: string;
  description?: string;
};

function mapHeygenAvatar(item: HeygenAvatar): Avatar {
  return {
    id: item.id || item.avatar_id || "",
    name: item.name || item.avatar_name || "HeyGen Avatar",
    gender: item.gender || "Unknown",
    preview_image_url:
      item.preview_image_url || "https://files.heygen.ai/avatar/Daniel_casual_20220925/preview.jpg",
    preview_video_url: item.preview_video_url,
    description: item.description || `${item.gender || ""} avatar`.trim(),
  };
}

// Resolve the workspace for this request. Prefer an explicit projectId (the DB
// pipeline), but fall back to the caller's active workspace so the demo flow
// (localStorage projects) still gets live avatars.
async function resolveWorkspaceId(
  projectId: string | null,
  fallbackWorkspaceId: string,
): Promise<string> {
  if (projectId) {
    const project = await getProject(projectId);
    if (project) return project.workspace_id;
  }
  return fallbackWorkspaceId;
}

export async function GET(request: NextRequest) {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const avatarId = searchParams.get("id");

    const workspaceId = await resolveWorkspaceId(projectId, auth.membership.workspace_id);
    const resolved = await resolveCredential(workspaceId, "video");
    const hasHeygen = !!resolved && resolved.api.provider_key === "heygen";
    const base =
      resolved?.credential.endpointUrl?.replace(/\/$/, "") || "https://api.heygen.com";

    // ---- Single-avatar verification (custom avatar ID) --------------------
    if (avatarId) {
      // Without a live HeyGen key we can only verify against the mock catalog.
      if (!hasHeygen) {
        const mock = MOCK_AVATARS.find((a) => a.id === avatarId);
        if (mock) return jsonOk({ avatar: mock, verified: true, provider: null });
        return jsonError("Avatar ID could not be verified (no HeyGen key configured).", 404);
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${base}/v3/avatars/looks/${encodeURIComponent(avatarId)}`, {
          headers: { "x-api-key": resolved!.credential.apiKey },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          return jsonError(`Avatar ID "${avatarId}" was not found in your HeyGen account.`, 404);
        }
        const json = await res.json();
        const data = (json.data || json) as HeygenAvatar;
        return jsonOk({ avatar: mapHeygenAvatar({ ...data, id: data.id || avatarId }), verified: true, provider: "heygen" });
      } catch (err) {
        return jsonError("Failed to reach HeyGen to verify the avatar ID.", 502);
      }
    }

    // ---- Full avatar catalog ----------------------------------------------
    // Serve from the in-memory cache when fresh — bypasses HeyGen's latency.
    const cached = avatarCache.get(workspaceId);
    if (cached && Date.now() - cached.cachedAt < CACHE_DURATION_MS) {
      return jsonOk({ avatars: cached.avatars, provider: cached.provider, cached: true });
    }

    if (!hasHeygen) {
      const provider = resolved?.api.provider_key ?? null;
      // Cache demo/other-provider results too so navigation stays instant.
      avatarCache.set(workspaceId, { avatars: MOCK_AVATARS, provider, cachedAt: Date.now() });
      return jsonOk({ avatars: MOCK_AVATARS, provider });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${base}/v3/avatars/looks?limit=36`, {
        headers: { "x-api-key": resolved!.credential.apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        // Don't cache a transient failure — retry on the next request.
        return jsonOk({
          avatars: MOCK_AVATARS,
          provider: "heygen",
          warning: `HeyGen API returned ${res.status}. Showing default stock avatars.`,
        });
      }
      const json = await res.json();
      const raw: HeygenAvatar[] = json.data?.avatars || json.data || [];
      // HeyGen can return the same avatar id in multiple groups — dedupe so the
      // client never renders duplicate React keys.
      const seen = new Set<string>();
      const avatars = raw
        .map(mapHeygenAvatar)
        .filter((a) => {
          if (!a.id || seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        })
        .slice(0, 36);
      if (avatars.length === 0) {
        return jsonOk({ avatars: MOCK_AVATARS, provider: "heygen" });
      }
      avatarCache.set(workspaceId, { avatars, provider: "heygen", cachedAt: Date.now() });
      return jsonOk({ avatars, provider: "heygen" });
    } catch {
      return jsonOk({
        avatars: MOCK_AVATARS,
        provider: "heygen",
        warning: "Failed to connect to HeyGen. Showing default stock avatars.",
      });
    }
  });
}
