# Kata Studio website and client portal

The marketing site for a web design studio on Koh Samui and in Bangkok, plus a client portal where clients follow their website project, send change requests and pay.

- **Next.js 16** (App Router, TypeScript) for the site, portal and staff area, hosted on **Cloudflare Workers**
- **Supabase** for logins (email magic links), the database and row level security
- **Stripe** Checkout for one-time charges and care plan subscriptions, and Stripe's billing portal for cards and receipts

## What's in it

| Area | Path | Who | What |
| --- | --- | --- | --- |
| Marketing site | `/` | Everyone | The Notion-style design. The contact form saves to the `enquiries` table. |
| Client portal | `/portal` | Invited clients | Projects with status, launch date, milestones and studio notes. Change requests with a reply thread. Billing: pay charges, add a care plan, manage cards and receipts. |
| Staff area | `/admin` | Staff (`role = 'admin'`) | Add clients and invite their people, manage projects and milestones, reply to and close requests, issue and void charges, read enquiries. |

### How payments work

- **One-time charges** (deposits, build fees, extras): staff add a charge to a client in the staff area. The client clicks **Pay now**, pays on Stripe Checkout, and the charge is marked paid.
- **Subscriptions** (the care plan): the client adds a plan from a project page. Plans are defined in `lib/plans.ts` and created in Stripe by `npm run stripe:setup`. Prices are read from Stripe, so change them there.
- **Billing portal**: clients update cards, download receipts and cancel plans in Stripe's hosted portal.
- Stripe's webhook (`/api/stripe/webhook`) keeps the database in sync, including changes made in the Stripe dashboard. When a client returns from Checkout, `/portal/checkout/return` applies the payment straight away, so they never see a stale "due".

Amounts are stored in satang (฿1 = 100), the smallest THB unit, as Stripe expects.

## Set up

### 1. Install

```sh
npm install
cp .env.example .env.local
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com). Copy the project URL, publishable key and secret key (Project Settings → API Keys) into `.env.local`.
2. Create the tables: paste `supabase/migrations/20261026120000_client_portal.sql` into the SQL editor and run it. Or, with the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started): `supabase link` then `supabase db push`.
3. **Authentication → Sign In / Providers**: turn off **Allow new users to sign up**. The portal is invite-only, and invites still work with sign-ups off.
4. **Authentication → URL Configuration**: set **Site URL** to your site, and add `http://localhost:3000/**` and `https://your-domain/**` to **Redirect URLs**.
5. **Authentication → Emails**: change the links in two templates, so sign-in works even when the email is opened in a different browser:
   - **Magic link**: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in to the portal</a>`
   - **Invite user**: `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=invite">Open your client portal</a>`
6. **Make yourself staff**: Authentication → Users → **Invite user** with your own email. Then in the SQL editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
   Sign in at `/login`, and `/admin` is yours.

Supabase's built-in email sender is rate-limited and meant for testing. Before launch, add your own SMTP server (Authentication → Emails → SMTP settings), for example Resend or Postmark.

### 3. Stripe

1. Copy your **test** secret key into `.env.local` as `STRIPE_SECRET_KEY`.
2. Run `npm run stripe:setup`. It creates the care plan product and price, and the billing portal settings. Copy the `STRIPE_PORTAL_CONFIGURATION_ID` it prints into `.env.local`.
3. In the Stripe dashboard, choose payment methods under **Settings → Payment methods**. Checkout shows whichever are on, for example cards and PromptPay. PromptPay works for one-time charges only, not subscriptions.
4. Webhooks for local development: install the [Stripe CLI](https://docs.stripe.com/stripe-cli), run `npm run stripe:listen`, and put the `whsec_...` it prints into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

Test card: `4242 4242 4242 4242`, any future date, any CVC.

### 4. Run

```sh
npm run dev
```

Open http://localhost:3000. The marketing site works with no keys at all. The portal needs Supabase, and payments need Stripe.

## Deploy (Cloudflare)

The site runs on Cloudflare Workers at https://kata-studio.app, built with the [OpenNext adapter](https://opennext.js.org/cloudflare). The settings are in `wrangler.jsonc` (Worker name, custom domain) and `open-next.config.ts`.

```sh
npx wrangler login   # once per computer
npm run preview      # build and run the Worker locally on http://localhost:8787
npm run deploy       # build and deploy to kata-studio.app
```

Settings:

- **Public settings** (`NEXT_PUBLIC_...`) are written into the build, so they go in `.env.production`, which is committed. Never put secret keys there.
- **Secret keys** go into the Worker: `npx wrangler secret put SUPABASE_SECRET_KEY`, and the same for `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `STRIPE_PORTAL_CONFIGURATION_ID`.

### Marketing-only until Supabase is connected

Without `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the build, the site launches without the portal: the client login links are hidden, the contact form is replaced by an email button, and `/portal`, `/admin` and `/login` redirect to the home page. To turn the portal on:

1. Set up Supabase and Stripe (steps 2 and 3 above, with live Stripe keys at launch).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `.env.production`.
3. Add the secret keys with `npx wrangler secret put` (above).
4. In Stripe, add a webhook endpoint `https://kata-studio.app/api/stripe/webhook` with these events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Use its signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Run `npm run stripe:setup` once with the live key.
6. Add `https://kata-studio.app/**` to Supabase's redirect URLs (step 2.4), and set the Site URL to `https://kata-studio.app`.
7. `npm run deploy`, then test sign-in, a request and a payment on the live site.

### Cloudflare limits

- **Cache Components are off.** OpenNext can't run them on Workers yet ([opennextjs-cloudflare#1318](https://github.com/opennextjs/opennextjs-cloudflare/pull/1318)). The Stripe price lookup uses `unstable_cache` instead of `"use cache"`.
- **`middleware.ts`, not `proxy.ts`.** Next 16's `proxy.ts` always runs on Node.js, which OpenNext supports only experimentally, and it fails on requests with cookies. `middleware.ts` runs on the edge runtime. Next still supports it, but marks it deprecated.

## Security

- Every table has row level security. Clients can only read their own client's rows. Only staff can write projects, milestones, charges and request statuses. Only the Stripe webhook writes subscriptions. Nobody can change their own role or client.
- `npm run test:db` runs the migration in Postgres (PGlite) and checks 48 rules: what clients, unlinked users, staff and logged-out visitors can and can't do. Run it after every schema change.
- Server Actions and route handlers check the caller themselves, and don’t rely on the middleware (`middleware.ts`), which only redirects logged-out visitors.
- The secret Supabase key (`lib/supabase/admin.ts`) is used only for the webhook, invites, Stripe customer ids and the contact form.

## Project layout

```
app/(marketing)/   Home page, contact form
app/login/         Magic-link sign-in
app/auth/          Email link handler and sign-out
app/portal/        Client portal and its Server Actions
app/admin/         Staff area and its Server Actions
app/api/stripe/    Stripe webhook
components/        Shared UI (forms, request thread, pills)
lib/               Supabase clients, auth helpers, Stripe, formatting, plans
supabase/          Migrations and the RLS test
scripts/           Stripe setup
legacy/            The original static HTML version of the Notion design
```

After changing the schema, update `lib/database.types.ts`, either by hand or with `npm run db:types` (needs a linked Supabase CLI).

## Placeholders to replace

- Email address (hello@kata-studio.app), phone and addresses
- Package prices on the home page (฿35,000 / ฿85,000 / ฿4,500 per month), and the care plan in `lib/plans.ts`
- Portfolio projects (sample projects)
