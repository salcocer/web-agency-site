"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/form";
import { requireViewer } from "@/lib/auth";
import { env, stripeEnabled } from "@/lib/env";
import { LIVE_SUBSCRIPTION_STATUSES } from "@/lib/format";
import { siteUrl } from "@/lib/site-url";
import { ensureStripeCustomer, getCarePlanPrices, getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Every action re-checks who is calling: Server Actions are public endpoints.
// Row level security is the second line of defence for every query below.

const uuid = z.uuid();
const text = (max: number) => z.string().trim().min(1).max(max);

async function requireMemberAction() {
  const viewer = await requireViewer();
  if (!viewer.clientId) throw new Error("This account isn’t linked to a client.");
  return { ...viewer, clientId: viewer.clientId };
}

const NOT_SET_UP: FormState = { error: "Online payments aren’t set up yet. Please contact us to pay." };

export async function createRequest(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const input = z
    .object({ projectId: uuid, title: text(200), body: text(10000) })
    .safeParse({ projectId: formData.get("projectId"), title: formData.get("title"), body: formData.get("body") });
  if (!input.success) return { error: "Please add a short title and some details." };

  const supabase = await createClient();
  const { data: request, error } = await supabase
    .from("requests")
    .insert({ project_id: input.data.projectId, author_id: viewer.id, title: input.data.title })
    .select("id")
    .single();
  if (error) return { error: "We couldn’t create that request. Please try again." };

  const { error: messageError } = await supabase
    .from("request_messages")
    .insert({ request_id: request.id, author_id: viewer.id, body: input.data.body });
  if (messageError) return { error: "The request was created but its details didn’t save. Please add them as a reply." };

  redirect(viewer.role === "admin" ? `/admin/requests/${request.id}` : `/portal/requests/${request.id}`);
}

export async function postMessage(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const input = z
    .object({ requestId: uuid, body: text(10000) })
    .safeParse({ requestId: formData.get("requestId"), body: formData.get("body") });
  if (!input.success) return { error: "Please write a message first." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("request_messages")
    .insert({ request_id: input.data.requestId, author_id: viewer.id, body: input.data.body });
  if (error) return { error: "Your reply didn’t send. Please try again." };

  refresh();
  return null;
}

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireViewer();
  const name = z.string().trim().max(200).safeParse(formData.get("fullName"));
  if (!name.success) return { error: "That name is too long." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name.data || null })
    .eq("id", viewer.id);
  if (error) return { error: "Your name didn’t save. Please try again." };

  refresh();
  return { ok: "Saved." };
}

export async function payCharge(_: FormState, formData: FormData): Promise<FormState> {
  if (!stripeEnabled()) return NOT_SET_UP;
  const viewer = await requireMemberAction();
  const chargeId = uuid.safeParse(formData.get("chargeId"));
  if (!chargeId.success) return { error: "Unknown charge." };

  const supabase = await createClient();
  const { data: charge } = await supabase
    .from("charges")
    .select("id, description, amount, currency, status, checkout_session_id")
    .eq("id", chargeId.data)
    .eq("client_id", viewer.clientId)
    .maybeSingle();
  if (!charge || charge.status !== "due") return { error: "This charge is no longer due." };

  const stripe = getStripe();
  let url: string | null = null;
  try {
    // Send a second click to the checkout page that's already open, so one
    // charge never gets two payments.
    if (charge.checkout_session_id) {
      const existing = await stripe.checkout.sessions.retrieve(charge.checkout_session_id);
      if (existing.status === "open") url = existing.url;
    }

    if (!url) {
      const customer = await ensureStripeCustomer(viewer.clientId, viewer.email);
      const base = await siteUrl();
      const metadata = { charge_id: charge.id, client_id: viewer.clientId };
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: charge.currency,
              unit_amount: charge.amount,
              product_data: { name: charge.description },
            },
          },
        ],
        metadata,
        payment_intent_data: { metadata, description: charge.description },
        success_url: `${base}/portal/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}/portal/billing`,
      });
      await createAdminClient().from("charges").update({ checkout_session_id: session.id }).eq("id", charge.id);
      url = session.url;
    }
  } catch (error) {
    console.error("Could not start Checkout for a charge:", error);
    return { error: "We couldn’t open the payment page. Please try again." };
  }

  if (!url) return { error: "We couldn’t open the payment page. Please try again." };
  redirect(url);
}

export async function subscribeToPlan(_: FormState, formData: FormData): Promise<FormState> {
  if (!stripeEnabled()) return NOT_SET_UP;
  const viewer = await requireMemberAction();
  const input = z
    .object({ projectId: uuid, lookupKey: z.string().min(1) })
    .safeParse({ projectId: formData.get("projectId"), lookupKey: formData.get("lookupKey") });
  if (!input.success) return { error: "Please choose a plan." };

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", input.data.projectId)
    .eq("client_id", viewer.clientId)
    .maybeSingle();
  if (!project) return { error: "Unknown project." };

  const { data: running } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("project_id", project.id)
    .in("status", LIVE_SUBSCRIPTION_STATUSES)
    .limit(1);
  if (running?.length) return { error: "This project already has a care plan." };

  let url: string | null = null;
  try {
    const plan = (await getCarePlanPrices()).find((p) => p.lookupKey === input.data.lookupKey);
    if (!plan) return { error: "That plan isn’t available." };

    const customer = await ensureStripeCustomer(viewer.clientId, viewer.email);
    const base = await siteUrl();
    const metadata = { client_id: viewer.clientId, project_id: project.id };
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: plan.priceId, quantity: 1 }],
      metadata,
      subscription_data: { metadata, description: `${plan.name} for ${project.name}` },
      success_url: `${base}/portal/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/portal/projects/${project.id}`,
    });
    url = session.url;
  } catch (error) {
    console.error("Could not start Checkout for a subscription:", error);
    return { error: "We couldn’t open the payment page. Please try again." };
  }

  if (!url) return { error: "We couldn’t open the payment page. Please try again." };
  redirect(url);
}

export async function openBillingPortal(): Promise<FormState> {
  if (!stripeEnabled()) return NOT_SET_UP;
  const viewer = await requireMemberAction();

  const { data: client } = await createAdminClient()
    .from("clients")
    .select("stripe_customer_id")
    .eq("id", viewer.clientId)
    .single();
  if (!client?.stripe_customer_id) {
    return { error: "Your billing account is created with your first payment." };
  }

  let url: string;
  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: client.stripe_customer_id,
      return_url: `${await siteUrl()}/portal/billing`,
      configuration: env.stripePortalConfiguration(),
    });
    url = session.url;
  } catch (error) {
    console.error("Could not open the Stripe billing portal:", error);
    return { error: "We couldn’t open billing settings. Please try again." };
  }
  redirect(url);
}
