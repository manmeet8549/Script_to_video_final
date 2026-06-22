import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Next.js 16 renamed Middleware → Proxy. This runs before rendering to keep the
// Supabase session fresh and to perform optimistic auth redirects. Per-route
// authorization is still enforced in the DAL / route handlers (defense in depth).
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
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

  return response;
}

export const config = {
  // Run on app routes but skip API routes (they enforce their own auth),
  // Next internals, and static assets.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
