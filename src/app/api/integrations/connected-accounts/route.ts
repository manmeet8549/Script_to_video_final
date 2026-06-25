import { guard, jsonOk, requireApiMember } from "@/lib/api/http";
import { resolveCredential } from "@/lib/dal/integrations";

// GET /api/integrations/connected-accounts
// Fetch the active connected accounts from Zernio if configured, otherwise return fallback mock list.
export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;

    const resolved = await resolveCredential(auth.membership.workspace_id, "publishing");
    
    // If no credential is configured or it is not Zernio, return fallback mock list
    if (!resolved || resolved.api.provider_key !== "zernio") {
      return jsonOk({
        provider: null,
        accounts: [
          { name: "YouTube", key: "youtube", connected: false, username: null },
          { name: "TikTok", key: "tiktok", connected: false, username: null },
          { name: "Instagram", key: "instagram", connected: false, username: null },
          { name: "LinkedIn", key: "linkedin", connected: false, username: null },
          { name: "Facebook", key: "facebook", connected: false, username: null },
          { name: "X", key: "x", connected: false, username: null },
        ]
      });
    }

    const { apiKey, endpointUrl } = resolved.credential;
    const base = endpointUrl?.replace(/\/$/, "") || "https://zernio.com/api/v1";

    // For testing/mock keys, return mock connected accounts so it works immediately
    if (apiKey === "test_key") {
      return jsonOk({
        provider: "zernio",
        accounts: [
          { name: "YouTube", key: "youtube", connected: true, username: "ThinkNEXT Studio (Demo)" },
          { name: "TikTok", key: "tiktok", connected: true, username: "@thinknext_studio_demo" },
          { name: "Instagram", key: "instagram", connected: false, username: null },
          { name: "LinkedIn", key: "linkedin", connected: true, username: "ThinkNEXT AI Agency" },
          { name: "Facebook", key: "facebook", connected: false, username: null },
          { name: "X", key: "x", connected: false, username: null },
        ]
      });
    }

    try {
      // Query connected accounts from Zernio: GET /accounts → { accounts: [...] }
      const res = await fetch(`${base}/accounts`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      });

      if (!res.ok) {
        throw new Error(`Zernio API returned status ${res.status}`);
      }

      const payload = await res.json();
      const accountsList = Array.isArray(payload)
        ? payload
        : payload.accounts || payload.data || [];

      const connectionsMap: Record<string, { connected: boolean; username: string | null }> = {
        youtube: { connected: false, username: null },
        tiktok: { connected: false, username: null },
        instagram: { connected: false, username: null },
        linkedin: { connected: false, username: null },
        facebook: { connected: false, username: null },
        x: { connected: false, username: null },
      };

      for (const acc of accountsList) {
        // Zernio uses "twitter" for the X platform.
        let platform = (acc.platform || "").toLowerCase();
        if (platform === "twitter") platform = "x";
        if (platform in connectionsMap) {
          connectionsMap[platform] = {
            connected: true,
            username: acc.username || acc.name || "Connected Account",
          };
        }
      }

      return jsonOk({
        provider: "zernio",
        accounts: [
          { name: "YouTube", key: "youtube", connected: connectionsMap.youtube.connected, username: connectionsMap.youtube.username },
          { name: "TikTok", key: "tiktok", connected: connectionsMap.tiktok.connected, username: connectionsMap.tiktok.username },
          { name: "Instagram", key: "instagram", connected: connectionsMap.instagram.connected, username: connectionsMap.instagram.username },
          { name: "LinkedIn", key: "linkedin", connected: connectionsMap.linkedin.connected, username: connectionsMap.linkedin.username },
          { name: "Facebook", key: "facebook", connected: connectionsMap.facebook.connected, username: connectionsMap.facebook.username },
          { name: "X", key: "x", connected: connectionsMap.x.connected, username: connectionsMap.x.username },
        ]
      });

    } catch (err) {
      console.error("Failed to fetch profiles from Zernio:", err);
      return jsonOk({
        provider: "zernio",
        error: err instanceof Error ? err.message : "Failed to fetch connected accounts",
        accounts: [
          { name: "YouTube", key: "youtube", connected: false, username: null },
          { name: "TikTok", key: "tiktok", connected: false, username: null },
          { name: "Instagram", key: "instagram", connected: false, username: null },
          { name: "LinkedIn", key: "linkedin", connected: false, username: null },
          { name: "Facebook", key: "facebook", connected: false, username: null },
          { name: "X", key: "x", connected: false, username: null },
        ]
      });
    }
  });
}
