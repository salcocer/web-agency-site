"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Supabase's default invite email signs people in with tokens in the URL fragment,
// which the server never sees. If they land here that way, store the session and
// continue to the portal. (With the email templates in the README this isn't needed.)
export function HashSession() {
  const router = useRouter();

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access_token = hash.get("access_token");
    const refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      history.replaceState(null, "", window.location.pathname);
      if (!error) router.replace("/portal");
    });
  }, [router]);

  return null;
}
