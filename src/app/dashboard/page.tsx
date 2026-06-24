import { redirect } from "next/navigation";
import { getActiveMembership, hasPendingMembership, requireUser } from "@/lib/dal/auth";
import { getDefaultDashboard } from "@/lib/auth/roles";
import { acceptInvitation } from "@/lib/dal/invitations";

// Entry point for /dashboard — routes the user to the dashboard matching their
// active workspace role. Users with no workspace yet are sent to onboarding.
export default async function DashboardIndex() {
  const user = await requireUser();
  let membership = await getActiveMembership();

  if (!membership) {
    // No *active* membership. If they have a pending invitation, automatically
    // accept (activate) it since they have successfully authenticated.
    if (await hasPendingMembership()) {
      await acceptInvitation(user.id);
      membership = await getActiveMembership();
    }
  }

  if (!membership) {
    redirect("/dashboard/owner/workspaces/new");
  }

  redirect(getDefaultDashboard(membership.role));
}
