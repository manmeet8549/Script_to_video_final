import { redirect } from "next/navigation";
import { getActiveMembership, requireUser } from "@/lib/dal/auth";
import { getDefaultDashboard } from "@/lib/auth/roles";

// Entry point for /dashboard — routes the user to the dashboard matching their
// active workspace role. Users with no workspace yet are sent to onboarding.
export default async function DashboardIndex() {
  await requireUser();
  const membership = await getActiveMembership();

  if (!membership) {
    // No workspace membership yet — send platform owners to workspace creation,
    // everyone else to a holding view (the user dashboard renders an empty state).
    redirect("/dashboard/owner/workspaces/new");
  }

  redirect(getDefaultDashboard(membership.role));
}
