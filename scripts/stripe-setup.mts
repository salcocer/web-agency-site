// Creates what the portal needs in Stripe: a product and price for each plan in
// lib/plans.ts, and the settings for Stripe's billing portal. Safe to run again.
//
//   npm run stripe:setup
import Stripe from "stripe";
import { carePlans } from "../lib/plans.ts";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error("Set STRIPE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
const stripe = new Stripe(key);
console.log(`Stripe ${key.startsWith("sk_live") ? "LIVE" : "test"} mode\n`);

for (const plan of carePlans) {
  const existing = await stripe.prices.list({ lookup_keys: [plan.lookupKey], active: true, limit: 1 });
  if (existing.data.length) {
    console.log(`✓ ${plan.name}: price ${existing.data[0].id} already exists`);
    continue;
  }
  const price = await stripe.prices.create({
    currency: plan.currency,
    unit_amount: plan.amount,
    recurring: { interval: plan.interval },
    lookup_key: plan.lookupKey,
    product_data: { name: plan.name },
  });
  console.log(`+ ${plan.name}: created price ${price.id}`);
}

const portalSettings: Stripe.BillingPortal.ConfigurationCreateParams = {
  business_profile: { headline: "Kata Studio billing" },
  features: {
    customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: { enabled: true, mode: "at_period_end" },
  },
};

const existingId = process.env.STRIPE_PORTAL_CONFIGURATION_ID;
if (existingId) {
  await stripe.billingPortal.configurations.update(existingId, portalSettings);
  console.log(`✓ Billing portal settings ${existingId} updated`);
} else {
  const configuration = await stripe.billingPortal.configurations.create(portalSettings);
  console.log(`+ Billing portal settings created. Add this line to .env.local:\n\nSTRIPE_PORTAL_CONFIGURATION_ID=${configuration.id}`);
}
