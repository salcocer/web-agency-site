"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/form";
import { requireAdmin } from "@/lib/auth";
import { stripeEnabled } from "@/lib/env";
import { inviteToClient } from "@/lib/invite";
import { applyCheckoutSession, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Staff actions. Each one checks the caller is staff, and row level security
// checks again in the database.

const uuid = z.uuid();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);
const projectStatus = z.enum(["discovery", "design", "build", "review", "live", "paused"]);
const requestStatus = z.enum(["open", "in_progress", "done"]);
const dateOrNull = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/)
  .transform((v) => v || null);
const urlOrNull = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v || null))
  .pipe(z.url().nullable());

const fields = (formData: FormData, ...keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, formData.get(key) ?? ""]));

export async function createClientAccount(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = z
    .object({
      name: z.string().trim().min(1, "Please name the client.").max(200),
      contactName: z.string().trim().max(200),
      contactEmail: z.union([z.literal(""), z.email("That email doesn’t look right.")]),
    })
    .safeParse(fields(formData, "name", "contactName", "contactEmail"));
  if (!input.success) return { error: input.error.issues[0].message };

  const supabase = await createClient();
  const { data: client, error } = await supabase.from("clients").insert({ name: input.data.name }).select("id").single();
  if (error) return { error: "The client couldn’t be created." };

  let query = "";
  if (input.data.contactEmail) {
    const result = await inviteToClient({
      clientId: client.id,
      email: input.data.contactEmail,
      fullName: input.data.contactName || undefined,
    });
    query = "error" in result ? `?invite=failed&reason=${encodeURIComponent(result.error)}` : "?invite=sent";
  }
  redirect(`/admin/clients/${client.id}${query}`);
}

export async function inviteMember(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = z
    .object({ clientId: uuid, email: z.email("That email doesn’t look right."), fullName: z.string().trim().max(200) })
    .safeParse(fields(formData, "clientId", "email", "fullName"));
  if (!input.success) return { error: input.error.issues[0].message };

  const result = await inviteToClient({
    clientId: input.data.clientId,
    email: input.data.email,
    fullName: input.data.fullName || undefined,
  });
  if ("error" in result) return { error: result.error };

  refresh();
  return {
    ok: result.invited
      ? `Invite sent to ${input.data.email}.`
      : `${input.data.email} already had an account and is now linked. They can sign in at /login.`,
  };
}

export async function removeMember(formData: FormData) {
  await requireAdmin();
  const profileId = uuid.parse(formData.get("profileId"));
  await createAdminClient().from("profiles").update({ client_id: null }).eq("id", profileId);
  refresh();
}

export async function createProject(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = z
    .object({
      clientId: uuid,
      name: z.string().trim().min(1, "Please name the project.").max(200),
      package: optionalText(100),
      status: projectStatus,
      launchDate: dateOrNull,
    })
    .safeParse(fields(formData, "clientId", "name", "package", "status", "launchDate"));
  if (!input.success) return { error: input.error.issues[0].message };

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.data.clientId,
      name: input.data.name,
      package: input.data.package,
      status: input.data.status,
      launch_date: input.data.launchDate,
    })
    .select("id")
    .single();
  if (error) return { error: "The project couldn’t be created." };
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProject(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = z
    .object({
      projectId: uuid,
      name: z.string().trim().min(1, "Please name the project.").max(200),
      status: projectStatus,
      package: optionalText(100),
      launchDate: dateOrNull,
      siteUrl: urlOrNull,
      notes: optionalText(10000),
    })
    .safeParse(fields(formData, "projectId", "name", "status", "package", "launchDate", "siteUrl", "notes"));
  if (!input.success) return { error: input.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: input.data.name,
      status: input.data.status,
      package: input.data.package,
      launch_date: input.data.launchDate,
      site_url: input.data.siteUrl,
      notes: input.data.notes,
    })
    .eq("id", input.data.projectId);
  if (error) return { error: "The project couldn’t be saved." };

  refresh();
  return { ok: "Saved." };
}

export async function addMilestone(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = z
    .object({ projectId: uuid, title: z.string().trim().min(1).max(300) })
    .safeParse(fields(formData, "projectId", "title"));
  if (!input.success) return { error: "Please describe the milestone." };

  const supabase = await createClient();
  const { data: last } = await supabase
    .from("milestones")
    .select("position")
    .eq("project_id", input.data.projectId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("milestones").insert({
    project_id: input.data.projectId,
    title: input.data.title,
    position: (last?.position ?? 0) + 1,
  });
  if (error) return { error: "The milestone couldn’t be added." };

  refresh();
  return null;
}

export async function toggleMilestone(formData: FormData) {
  await requireAdmin();
  const milestoneId = uuid.parse(formData.get("milestoneId"));
  const done = formData.get("done") === "true";
  const supabase = await createClient();
  await supabase.from("milestones").update({ done }).eq("id", milestoneId);
  refresh();
}

export async function deleteMilestone(formData: FormData) {
  await requireAdmin();
  const milestoneId = uuid.parse(formData.get("milestoneId"));
  const supabase = await createClient();
  await supabase.from("milestones").delete().eq("id", milestoneId);
  refresh();
}

export async function createCharge(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const input = z
    .object({
      clientId: uuid,
      projectId: z.union([z.literal(""), uuid]).transform((v) => v || null),
      description: z.string().trim().min(1, "Please describe the charge.").max(300),
      // Stripe's minimum for THB is ฿10.
      amount: z.coerce.number().min(10, "The minimum charge is ฿10.").max(10_000_000),
    })
    .safeParse(fields(formData, "clientId", "projectId", "description", "amount"));
  if (!input.success) return { error: input.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("charges").insert({
    client_id: input.data.clientId,
    project_id: input.data.projectId,
    description: input.data.description,
    amount: Math.round(input.data.amount * 100),
    currency: "thb",
  });
  if (error) return { error: "The charge couldn’t be created." };

  refresh();
  return { ok: "Charge added. The client can pay it from their portal." };
}

export async function voidCharge(formData: FormData) {
  await requireAdmin();
  const chargeId = uuid.parse(formData.get("chargeId"));
  const supabase = await createClient();
  const { data: charge } = await supabase
    .from("charges")
    .select("status, checkout_session_id")
    .eq("id", chargeId)
    .single();
  if (charge?.status !== "due") return;

  // Close any open payment page so the client can't pay a void charge. If they've
  // just paid and the webhook hasn't landed, record the payment instead of voiding.
  if (charge.checkout_session_id && stripeEnabled()) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(charge.checkout_session_id);
    if (session.status === "open") await stripe.checkout.sessions.expire(session.id);
    if (session.status === "complete") await applyCheckoutSession(session);
  }
  await supabase.from("charges").update({ status: "void" }).eq("id", chargeId).eq("status", "due");
  refresh();
}

export async function setRequestStatus(formData: FormData) {
  await requireAdmin();
  const requestId = uuid.parse(formData.get("requestId"));
  const status = requestStatus.parse(formData.get("status"));
  const supabase = await createClient();
  await supabase.from("requests").update({ status }).eq("id", requestId);
  refresh();
}
