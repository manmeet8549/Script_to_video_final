import { NextResponse, type NextRequest } from "next/server";
import { resolveActiveRole, updateSession } from "@/lib/supabase/session";
import {
  ACTIVE_WORKSPACE_COOKIE,
  canAccessSegment,
  dashboardSegmentFromPath,
  getDefaultDashboard,
} from "@/lib/auth/roles";

// Next.js 16 renamed Middleware → Proxy. This runs before rendering to keep the
// Supabase session fresh, perform optimistic auth redirects, and enforce
// role-based access to each dashboard portal. Per-route authorization is also
// enforced in the DAL / route handlers (defense in depth).
export async function proxy(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthPage = pathname === "/auth/login" || pathname === "/auth/register";

  // Gate the dashboard behind authentication.
  if (isDashboard && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // Authenticated users shouldn't see the login/register screens.
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Authorize access to role-gated portals. A member must never reach a portal
  // above their role (e.g. a "user" or "editor" opening /dashboard/owner) — they
  // are bounced to the dashboard that matches their actual role.
  if (isDashboard && user) {
    const segment = dashboardSegmentFromPath(pathname);
    if (segment) {
      const activeWorkspaceId = request.cookies.get(ACTIVE_WORKSPACE_COOKIE)?.value;
      const role = await resolveActiveRole(supabase, user.id, activeWorkspaceId);

      // No active membership (e.g. a pending invitee): only the neutral user
      // view is permitted; everything else routes there.
      if (role == null) {
        if (segment !== "user") {
          const url = request.nextUrl.clone();
          url.pathname = "/dashboard/user";
          url.search = "";
          return NextResponse.redirect(url);
        }
      } else if (!canAccessSegment(segment, role)) {
        const url = request.nextUrl.clone();
        url.pathname = getDefaultDashboard(role);
        url.search = "";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  // Run on app routes but skip API routes (they enforce their own auth),
  // Next internals, and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
