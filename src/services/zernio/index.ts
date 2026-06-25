import { getZernioApiKey, getZernioBaseUrl } from "@/lib/zernio";

// Our app uses "x" as the platform key; Zernio's API calls it "twitter".
// All other platform keys match Zernio's naming.
function toZernioPlatform(platform: string): string {
  return platform === "x" ? "twitter" : platform;
}

export async function getOrCreateZernioProfileId(workspaceName: string, apiKey?: string): Promise<string> {
  let activeApiKey = apiKey;
  if (!activeApiKey) {
    try {
      activeApiKey = getZernioApiKey();
    } catch (err) {
      // If the key is missing from environment, check if it's running in test/mock mode
      if (process.env.NODE_ENV !== "production") {
        console.warn("ZERNIO_API_KEY is not configured. Falling back to mock profile ID.");
        return "mock-profile-id";
      }
      throw err;
    }
  }

  const base = getZernioBaseUrl();

  if (activeApiKey === "test_key") {
    return "mock-profile-id";
  }

  // Fetch existing profiles. Zernio returns { profiles: [{ _id, isDefault, ... }] }.
  const res = await fetch(`${base}/profiles`, {
    headers: { "Authorization": `Bearer ${activeApiKey}` },
  });

  if (!res.ok) {
    throw new Error(
      `Zernio API returned ${res.status} when fetching profiles. Check that your API key is correct.`,
    );
  }

  const payload = await res.json();
  const list: Array<{ _id?: string; id?: string; isDefault?: boolean }> = Array.isArray(payload)
    ? payload
    : payload.profiles || payload.data || [];

  // Reuse an existing profile (prefer the default) — every Zernio account has at
  // least one. This avoids a 400 from trying to re-create a profile whose name
  // already exists.
  const existing = list.find((p) => p.isDefault) || list[0];
  if (existing) {
    return existing._id || existing.id || "";
  }

  // No profile at all — create one.
  const createRes = await fetch(`${base}/profiles`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${activeApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: `${workspaceName} Profile` }),
  });

  if (!createRes.ok) {
    const detail = await createRes.text().catch(() => "");
    throw new Error(
      `Zernio API returned ${createRes.status} when creating a profile.${detail ? ` ${detail}` : ""}`,
    );
  }

  const created = await createRes.json();
  const profile = created.profile || created;
  return profile._id || profile.id || "";
}

// Requests the platform OAuth authorization URL from Zernio. Per the Zernio API,
// `GET /connect/{platform}?profileId=&redirect_url=` must be called server-side
// with the Bearer API key and returns `{ authUrl, state }`. The browser is then
// redirected to that authUrl (it cannot hit /connect directly — that needs the
// Authorization header and would return 401 Unauthorized).
export async function getZernioAuthUrl(
  platform: string,
  profileId: string,
  callbackUrl: string,
  apiKey?: string
): Promise<string> {
  const base = getZernioBaseUrl();

  let activeApiKey = apiKey;
  if (!activeApiKey) {
    try {
      activeApiKey = getZernioApiKey();
    } catch {}
  }

  // Mock mode: skip the real OAuth and bounce straight to our callback with
  // simulated success params so the flow can be exercised without real creds.
  if (!activeApiKey || activeApiKey === "test_key") {
    const urlObj = new URL(callbackUrl);
    urlObj.searchParams.set("status", "success");
    urlObj.searchParams.set("profileId", profileId);
    urlObj.searchParams.set("accountId", `mock-${platform}-${Date.now()}`);
    urlObj.searchParams.set("username", `@thinknext_mock_${platform}`);
    return urlObj.toString();
  }

  const url = `${base}/connect/${toZernioPlatform(platform)}?profileId=${encodeURIComponent(
    profileId
  )}&redirect_url=${encodeURIComponent(callbackUrl)}`;

  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${activeApiKey}` },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      json.message || json.error || `Zernio returned ${res.status} when requesting the ${platform} authorization URL.`
    );
  }

  const authUrl: string | undefined = json.authUrl || json.auth_url || json.url;
  if (!authUrl) {
    throw new Error(`Zernio did not return an authorization URL for ${platform}.`);
  }

  return authUrl;
}

export async function createZernioPost(
  zernioAccountId: string,
  platform: string,
  videoUrl: string,
  content: string,
  title?: string,
  scheduledFor?: string,
  apiKey?: string
): Promise<{ id: string; status: string; url?: string }> {
  let activeApiKey = apiKey;
  if (!activeApiKey) {
    try {
      activeApiKey = getZernioApiKey();
    } catch {}
  }

  if (!activeApiKey || activeApiKey === "test_key" || zernioAccountId.startsWith("mock-")) {
    console.log("Simulating Zernio post creation for account:", zernioAccountId);
    return {
      id: `zpost-${Date.now()}`,
      status: "completed",
      url: platform === "x" ? "https://x.com/thinknext_mock" : `https://www.${platform}.com/thinknext_mock_post`,
    };
  }

  const base = getZernioBaseUrl();
  // Zernio POST /posts contract: content (not text), platforms as an array of
  // { platform, accountId } objects, media via mediaItems, and publishNow:true
  // to actually publish — WITHOUT it Zernio saves the post as a draft (nothing
  // appears on the channel).
  const body: Record<string, unknown> = {
    content,
    platforms: [{ platform: toZernioPlatform(platform), accountId: zernioAccountId }],
    mediaItems: [{ type: "video", url: videoUrl, title: title || undefined }],
  };
  if (title) body.title = title;
  if (scheduledFor) {
    body.scheduledFor = scheduledFor;
  } else {
    body.publishNow = true;
  }

  const res = await fetch(`${base}/posts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${activeApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Zernio post creation failed (${res.status}): ${
        json.message || json.error || JSON.stringify(json)
      }`,
    );
  }

  // Response wraps the created post; the live link is platformPostUrl.
  const post = json.post || json;
  const platformResult = Array.isArray(post.platforms) ? post.platforms[0] : undefined;
  const id = post._id || post.id || json.id || `zpost-${Date.now()}`;
  const status = String(
    post.status || json.status || (scheduledFor ? "scheduled" : "published"),
  ).toLowerCase();
  const url =
    json.platformPostUrl ||
    post.platformPostUrl ||
    platformResult?.platformPostUrl ||
    platformResult?.postUrl ||
    undefined;

  return { id, status, url };
}
