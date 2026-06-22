import type { WorkspaceRole } from "@/types/db";

// Privilege ordering (higher number = more access). Used to pick a user's
// primary role when they belong to multiple workspaces and to gate routes.
export const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 60,
  admin: 50,
  user: 40,
  editor: 30,
  support: 20,
  viewer: 10,
};

// Which dashboard segment a role lands on by default.
export function getDefaultDashboard(role: WorkspaceRole | null | undefined): string {
  switch (role) {
    case "owner":
      return "/dashboard/owner";
    case "admin":
      return "/dashboard/admin";
    case "editor":
      return "/dashboard/editor";
    case "user":
      return "/dashboard/user";
    default:
      // support / viewer / unknown → read-only user view
      return "/dashboard/user";
  }
}

// Roles permitted to enter each top-level dashboard segment (super-set:
// higher-privilege roles can inspect lower dashboards).
export const SEGMENT_ROLES: Record<string, WorkspaceRole[]> = {
  owner: ["owner"],
  admin: ["owner", "admin"],
  user: ["owner", "admin", "user", "support", "viewer"],
  editor: ["owner", "admin", "editor"],
};

export function canAccessSegment(segment: string, role: WorkspaceRole | null): boolean {
  const allowed = SEGMENT_ROLES[segment];
  if (!allowed) return true; // non-role-gated segment (e.g. settings, notifications)
  return role != null && allowed.includes(role);
}

// Pick the highest-privilege role from a set of memberships.
export function primaryRole(roles: WorkspaceRole[]): WorkspaceRole | null {
  if (roles.length === 0) return null;
  return roles.reduce((best, r) => (ROLE_RANK[r] > ROLE_RANK[best] ? r : best), roles[0]);
}
