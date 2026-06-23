import { redirect } from "next/navigation";
import { getActiveMembership, hasPendingMembership, requireUser } from "@/lib/dal/auth";
import { getDefaultDashboard } from "@/lib/auth/roles";

// Entry point for /dashboard — routes the user to the dashboard matching their
// active workspace role. Users with no workspace yet are sent to onboarding.
export default async function DashboardIndex() {
  await requireUser();
  const membership = await getActiveMembership();

  if (!membership) {
    // No *active* membership. An invitee whose membership is still pending must
    // not be dropped onto the owner console — send them to the neutral user
    // view (which renders an empty state). Only a genuine new user with no
    // memberships at all is routed to workspace creation as a prospective owner.
    if (await hasPendingMembership()) {
      redirect("/dashboard/user");
    }
    redirect("/dashboard/owner/workspaces/new");
  }

  redirect(getDefaultDashboard(membership.role));
}
