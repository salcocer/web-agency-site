import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only the signed-in areas need the session. The marketing site and the Stripe
  // webhook skip the proxy entirely.
  matcher: ["/portal/:path*", "/admin/:path*", "/login"],
};
