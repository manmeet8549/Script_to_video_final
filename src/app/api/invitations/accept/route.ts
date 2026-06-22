import { guard, jsonOk, requireApiUser } from "@/lib/api/http";
import { acceptInvitation } from "@/lib/dal/invitations";

// POST /api/invitations/accept
// Finalize the current user's pending invitations: activate their memberships
// and stamp password_changed_at. Called after the invitee establishes a session
// (signed in with a temp password, or arrived via a setup link) and sets their
// own password.
export async function POST() {
  return guard(async () => {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;

    const accepted = await acceptInvitation(auth.user.id);
    return jsonOk({ accepted });
  });
}
