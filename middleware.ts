import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnabled } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

// Next 16 prefers proxy.ts, but proxy.ts always runs on Node.js, which OpenNext only
// supports experimentally on Cloudflare (and it breaks on requests with cookies).
// middleware.ts runs on the edge runtime, which Cloudflare supports fully.
export async function middleware(request: NextRequest) {
  // Without Supabase there's no portal yet, so its pages send visitors home.
  if (!supabaseEnabled()) return NextResponse.redirect(new URL("/", request.url));
  return updateSession(request);
}

export const config = {
  // Only the signed-in areas need the session. The marketing site and the Stripe
  // webhook skip the middleware entirely.
  matcher: ["/portal/:path*", "/admin/:path*", "/login"],
};
