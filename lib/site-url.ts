import "server-only";
import { headers } from "next/headers";

// The public origin for links in emails and Stripe redirects. Set NEXT_PUBLIC_SITE_URL
// in production; locally it falls back to the request's host.
export async function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Only same-site paths are allowed as a post-login destination.
export function safeNextPath(value: unknown, fallback = "/portal") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
