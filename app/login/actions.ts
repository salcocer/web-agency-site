"use server";

import { z } from "zod";
import type { FormState } from "@/components/form";
import { safeNextPath, siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

const SENT = "Check your inbox. If that email has a portal account, a sign-in link is on its way.";

export async function sendMagicLink(_: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Please enter a valid email address." };

  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      // The portal is invite-only: unknown emails never get an account.
      shouldCreateUser: false,
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    // Don't reveal whether an email has an account.
    if (error.code === "otp_disabled" || error.code === "user_not_found" || /signups not allowed/i.test(error.message)) {
      return { ok: SENT };
    }
    if (error.status === 429) return { error: "Too many sign-in attempts. Please wait a minute and try again." };
    console.error("Magic link failed:", error);
    return { error: "We couldn’t send a sign-in link just now. Please try again shortly." };
  }

  return { ok: SENT };
}
