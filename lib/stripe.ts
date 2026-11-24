import "server-only";
import Stripe from "stripe";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { carePlans } from "@/lib/plans";

let stripe: Stripe | undefined;

export function getStripe() {
  stripe ??= new Stripe(env.stripeSecretKey(), { appInfo: { name: "Kata client portal" } });
  return stripe;
}

const id = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : (value?.id ?? null);

const isoFromUnix = (seconds: number | null | undefined) =>
  seconds ? new Date(seconds * 1000).toISOString() : null;

// Each client (company) is one Stripe customer, created the first time they pay.
export async function ensureStripeCustomer(clientId: string, email: string): Promise<string> {
  const admin = createAdminClient();
  const { data: client, error } = await admin
    .from("clients")
    .select("id, name, stripe_customer_id")
    .eq("id", clientId)
    .single();
  if (error) throw error;
  if (client.stripe_customer_id) return client.stripe_customer_id;

  // The idempotency key makes two simultaneous first payments share one customer.
  const customer = await getStripe().customers.create(
    { name: client.name, email, metadata: { client_id: client.id } },
    { idempotencyKey: `client-customer-${client.id}` },
  );

  const { data: saved } = await admin
    .from("clients")
    .update({ stripe_customer_id: customer.id })
    .eq("id", client.id)
    .is("stripe_customer_id", null)
    .select("stripe_customer_id")
    .maybeSingle();
  if (saved?.stripe_customer_id) return saved.stripe_customer_id;

  // Someone else saved a customer first; use theirs.
  const { data: again } = await admin.from("clients").select("stripe_customer_id").eq("id", client.id).single();
  return again?.stripe_customer_id ?? customer.id;
}

// Prices for the plans in lib/plans.ts, read from Stripe and cached for an hour.
// unstable_cache rather than "use cache": Cache Components don't work on Cloudflare yet.
export const getCarePlanPrices = unstable_cache(
  async () => {
    const prices = await getStripe().prices.list({
      lookup_keys: carePlans.map((plan) => plan.lookupKey),
      active: true,
      expand: ["data.product"],
    });
    return carePlans.flatMap((plan) => {
      const price = prices.data.find((p) => p.lookup_key === plan.lookupKey);
      if (!price || price.unit_amount == null) return [];
      return [{ ...plan, priceId: price.id, amount: price.unit_amount, currency: price.currency }];
    });
  },
  ["care-plan-prices"],
  { revalidate: 3600 },
);

export async function markChargePaid(session: Stripe.Checkout.Session) {
  const chargeId = session.metadata?.charge_id;
  if (session.mode !== "payment" || session.payment_status !== "paid" || !chargeId) return;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("charges")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      checkout_session_id: session.id,
      payment_intent_id: id(session.payment_intent),
    })
    .eq("id", chargeId)
    .eq("status", "due")
    .select("id");
  if (error) throw error;
  if (!data.length) {
    // Already paid (a repeated event) or voided after checkout started. A payment on a
    // void charge needs a manual refund in the Stripe dashboard.
    console.warn(`Checkout ${session.id} paid charge ${chargeId}, which was not due.`);
  }
}

export async function syncSubscription(subscriptionId: string) {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price.product"],
  });
  const admin = createAdminClient();

  let clientId = subscription.metadata.client_id || null;
  if (!clientId) {
    const { data } = await admin
      .from("clients")
      .select("id")
      .eq("stripe_customer_id", id(subscription.customer) ?? "")
      .maybeSingle();
    clientId = data?.id ?? null;
  }
  if (!clientId) {
    console.warn(`Subscription ${subscription.id} has no matching client; skipped.`);
    return;
  }

  const item = subscription.items.data[0];
  const price = item?.price;
  const product = price && typeof price.product === "object" && !price.product.deleted ? price.product : null;

  const { error } = await admin.from("subscriptions").upsert({
    id: subscription.id,
    client_id: clientId,
    project_id: subscription.metadata.project_id || null,
    status: subscription.status,
    price_id: price?.id ?? null,
    plan_name: product?.name ?? null,
    amount: price?.unit_amount ?? null,
    currency: price?.currency ?? null,
    interval: price?.recurring?.interval ?? null,
    current_period_end: isoFromUnix(item?.current_period_end),
    cancel_at: isoFromUnix(subscription.cancel_at),
  });
  if (error) throw error;
}

// Applies a finished Checkout session right away, so the portal is up to date when
// the client returns from Stripe even if the webhook hasn't arrived yet.
export async function applyCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.mode === "payment") await markChargePaid(session);
  const subscriptionId = id(session.subscription);
  if (session.mode === "subscription" && subscriptionId) await syncSubscription(subscriptionId);
}

export { id as stripeId };
