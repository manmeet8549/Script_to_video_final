import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser, getActiveMembership } from "@/lib/dal/auth";
import type { WorkspaceMember, WorkspaceRole } from "@/types/db";
import type { User } from "@supabase/supabase-js";

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

type AuthOk = { ok: true; user: User };
type AuthFail = { ok: false; response: NextResponse };

// Require an authenticated user for a route handler.
export async function requireApiUser(): Promise<AuthOk | AuthFail> {
  const user = await getUser();
  if (!user) return { ok: false, response: jsonError("Unauthorized", 401) };
  return { ok: true, user };
}

type MemberOk = { ok: true; user: User; membership: WorkspaceMember };

// Require an authenticated user with an active workspace membership, optionally
// constrained to a set of roles.
export async function requireApiMember(roles?: WorkspaceRole[]): Promise<MemberOk | AuthFail> {
  const user = await getUser();
  if (!user) return { ok: false, response: jsonError("Unauthorized", 401) };

  const membership = await getActiveMembership();
  if (!membership) return { ok: false, response: jsonError("No active workspace", 403) };
  if (roles && !roles.includes(membership.role)) {
    return { ok: false, response: jsonError("Insufficient permissions", 403) };
  }
  return { ok: true, user, membership };
}

// Parse + validate a JSON body with a Zod schema.
export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body", 400) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join("; ");
    return { ok: false, response: jsonError(message || "Validation failed", 422) };
  }
  return { ok: true, data: result.data };
}

// Wrap a handler body so thrown errors become clean 500 responses.
export async function guard(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonError(message, 500);
  }
}
