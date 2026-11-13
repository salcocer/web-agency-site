import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyCheckoutSession, getStripe, stripeId } from "@/lib/stripe";

// Stripe Checkout sends clients back here. Applying the session now means the
// portal shows the payment straight away instead of waiting for the webhook.
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (!sessionId || !viewer.clientId) redirect("/portal/billing");

  let outcome = "pending";
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const { data: client } = await createAdminClient()
      .from("clients")
      .select("stripe_customer_id")
      .eq("id", viewer.clientId)
      .single();

    // Only apply sessions that belong to this client.
    if (client?.stripe_customer_id && stripeId(session.customer) === client.stripe_customer_id) {
      await applyCheckoutSession(session);
      if (session.status === "complete") {
        if (session.mode === "subscription") outcome = "subscribed";
        else outcome = session.payment_status === "paid" ? "paid" : "processing";
      }
    }
  } catch (error) {
    console.error("Could not apply returning Checkout session:", error);
  }

  redirect(`/portal/billing?checkout=${outcome}`);
}
