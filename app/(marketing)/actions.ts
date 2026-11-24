"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const Enquiry = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(200),
  email: z.email("Please add a valid email address.").max(320),
  business: z.string().trim().max(200).optional(),
  need: z.string().trim().max(100).optional(),
  message: z.string().trim().max(5000).optional(),
});

// Values are sent back on error so the form can keep what the visitor typed.
export type EnquiryState = { ok?: string; error?: string; values?: Record<string, string> } | null;

export async function submitEnquiry(_: EnquiryState, formData: FormData): Promise<EnquiryState> {
  // Bots fill in every field, including this one, which people never see.
  if (formData.get("website")) return { ok: "Thank you. We’ll be in touch within one working day." };

  const parsed = Enquiry.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim(),
    business: formData.get("business") || undefined,
    need: formData.get("need") || undefined,
    message: formData.get("message") || undefined,
  });
  const values = Object.fromEntries(
    ["name", "email", "business", "need", "message"].map((key) => [key, String(formData.get(key) ?? "")]),
  );
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  const { error } = await createAdminClient().from("enquiries").insert(parsed.data);
  if (error) {
    console.error("Could not save enquiry:", error);
    return { error: "Sorry, that didn’t send. Please email hello@kata.studio instead.", values };
  }

  const firstName = parsed.data.name.split(" ")[0];
  return { ok: `Thank you, ${firstName}. We’ll reply within one working day.` };
}
