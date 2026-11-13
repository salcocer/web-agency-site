// Subscription plans clients can add to a project from the portal.
// scripts/stripe-setup.ts creates a Stripe product and price for each plan, found
// again by its lookup key. Stripe is the source of truth for the price; the amount
// here is only what the setup script creates.

export type CarePlan = {
  lookupKey: string;
  name: string;
  amount: number; // smallest currency unit
  currency: string;
  interval: "month" | "year";
  summary: string;
  features: string[];
};

export const carePlans: CarePlan[] = [
  {
    lookupKey: "care_plan_monthly",
    name: "Care plan",
    amount: 450000,
    currency: "thb",
    interval: "month",
    summary: "Keep everything fast, secure and up to date after launch.",
    features: ["Hosting & daily backups", "Updates & security", "Small content changes", "Monthly visibility report"],
  },
];
