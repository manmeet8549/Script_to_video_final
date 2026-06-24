import { NextRequest } from "next/server";
import { guard, jsonOk, requireApiMember } from "@/lib/api/http";
import { listApprovals } from "@/lib/dal/collaboration";
import type { ApprovalStatus } from "@/types/db";

const STATUSES: ApprovalStatus[] = ["pending", "approved", "rejected", "changes_requested"];

// GET /api/approvals?status=pending — the admin approval queue for the workspace.
export async function GET(request: NextRequest) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;

    const raw = new URL(request.url).searchParams.get("status");
    const status = STATUSES.includes(raw as ApprovalStatus) ? (raw as ApprovalStatus) : undefined;
    const items = await listApprovals(auth.membership.workspace_id, status);
    return jsonOk({ items });
  });
}
