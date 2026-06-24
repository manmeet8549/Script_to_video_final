import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { listApis, saveApi } from "@/lib/dal/integrations";

// GET /api/integrations — configured provider APIs for the active workspace
// (owner/admin only; secrets are never returned).
export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;
    return jsonOk(await listApis(auth.membership.workspace_id));
  });
}

const saveSchema = z.object({
  provider: z.enum(["script", "voice", "video", "editing", "publishing"]),
  provider_key: z.string().min(1),
  api_name: z.string().min(1).max(80),
  api_key: z.string().min(1),
  api_secret: z.string().optional(),
  endpoint_url: z.string().url().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// POST /api/integrations — store an encrypted provider API key.
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await parseBody(request, saveSchema);
    if (!body.ok) return body.response;

    const api = await saveApi({
      workspaceId: auth.membership.workspace_id,
      provider: body.data.provider,
      providerKey: body.data.provider_key,
      apiName: body.data.api_name,
      apiKey: body.data.api_key,
      apiSecret: body.data.api_secret,
      endpointUrl: body.data.endpoint_url,
      config: body.data.config,
    });
    return jsonOk(api, { status: 201 });
  });
}
