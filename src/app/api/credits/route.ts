import { z } from "zod";
import { guard, jsonOk, parseBody, requireApiMember } from "@/lib/api/http";
import { getWallet, listTransactions, recordCreditUsage } from "@/lib/dal/credits";

// GET /api/credits — the active workspace's wallet balances + recent ledger.
export async function GET() {
  return guard(async () => {
    const auth = await requireApiMember();
    if (!auth.ok) return auth.response;
    const [wallet, transactions] = await Promise.all([
      getWallet(auth.membership.workspace_id),
      listTransactions(auth.membership.workspace_id),
    ]);
    return jsonOk({ wallet, transactions });
  });
}

const grantSchema = z.object({
  kind: z.enum(["script", "voice", "video", "publish"]),
  amount: z.number().int().positive().max(100000),
  reason: z.string().max(200).optional(),
});

// POST /api/credits — owner/admin grants credits (recorded as a positive ledger
// entry). Track-only accounting, so this simply tops up a balance.
export async function POST(request: Request) {
  return guard(async () => {
    const auth = await requireApiMember(["owner", "admin"]);
    if (!auth.ok) return auth.response;
    const body = await parseBody(request, grantSchema);
    if (!body.ok) return body.response;

    const wallet = await recordCreditUsage(auth.membership.workspace_id, body.data.kind, {
      amount: -body.data.amount, // negative spend = positive grant
      reason: body.data.reason ?? "Manual credit grant",
    });
    return jsonOk({ wallet }, { status: 201 });
  });
}
