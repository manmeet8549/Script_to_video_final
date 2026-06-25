import { NextRequest } from "next/server";
import { guard, jsonError, jsonOk, requireApiMember } from "@/lib/api/http";
import { uploadMedia } from "@/lib/storage/media";
import crypto from "crypto";

// POST /api/media/upload — upload an edited video cut to R2
export async function POST(request: NextRequest) {
  return guard(async () => {
    // 1. Ensure user is logged in as owner, admin, editor, or user
    const auth = await requireApiMember(["owner", "admin", "editor", "user"]);
    if (!auth.ok) return auth.response;

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const assignmentId = formData.get("assignmentId") as string | null;

    if (!file) {
      return jsonError("No file provided", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Construct clean key
    const folder = assignmentId ? `assignments/${assignmentId}` : `editor-uploads`;
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueId = crypto.randomUUID();
    const key = `${folder}/${uniqueId}-${sanitizedName}`;

    // 3. Upload to R2 — public:true so the URL is an absolute R2 URL that
    // passes z.string().url() validation and is fetchable by Zernio when publishing.
    const url = await uploadMedia(key, buffer, file.type || "video/mp4", { public: true });

    return jsonOk({
      url,
      key,
      name: file.name,
      size: file.size,
    });
  });
}
