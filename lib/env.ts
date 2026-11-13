// Environment variables, read when first used so a missing key fails with a clear
// message instead of an undefined somewhere deeper. See .env.example.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: () =>
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  supabaseSecretKey: () => required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
  stripeSecretKey: () => required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: () => required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET),
  stripePortalConfiguration: () => process.env.STRIPE_PORTAL_CONFIGURATION_ID || undefined,
};

export const stripeEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);
