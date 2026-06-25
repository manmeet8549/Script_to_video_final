import { NextResponse } from "next/server";
import { APP_URL } from "@/lib/env";

// GET /api/integrations/social-auth/callback
// Zernio (or the social platform) redirects here after the user completes OAuth.
// We parse the result and redirect the user back to the publish hub with a
// success or error toast trigger in the query string.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") ?? "unknown";
  const error = url.searchParams.get("error") || url.searchParams.get("error_message");
  const success =
    url.searchParams.get("success") === "true" ||
    url.searchParams.get("status") === "connected" ||
    url.searchParams.get("code") !== null;

  const destination = new URL("/dashboard/user/publish", APP_URL);

  if (error) {
    destination.searchParams.set("error", error);
  } else {
    destination.searchParams.set("connected", platform);
  }

  return NextResponse.redirect(destination.toString());
}
