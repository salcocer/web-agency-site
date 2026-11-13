import type Stripe from "stripe";
import { env } from "@/lib/env";
import { applyCheckoutSession, getStripe, syncSubscription } from "@/lib/stripe";

// Stripe calls this for payments and subscription changes, including ones made in
// the Stripe billing portal or dashboard. Events can repeat or arrive out of order,
// so every handler is idempotent and re-reads the latest state from Stripe.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, env.stripeWebhookSecret());
  } catch (error) {
    console.warn("Rejected Stripe webhook:", error instanceof Error ? error.message : error);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await applyCheckoutSession(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object.id);
        break;
    }
  } catch (error) {
    // A 500 makes Stripe retry the event later.
    console.error(`Stripe webhook ${event.type} (${event.id}) failed:`, error);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return Response.json({ received: true });
}
