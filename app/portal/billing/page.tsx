import type { Metadata } from "next";
import Link from "next/link";
import { openBillingPortal } from "@/app/portal/actions";
import { ActionForm, SubmitButton } from "@/components/form";
import { PayButton } from "@/components/pay-button";
import { StatusPill } from "@/components/pill";
import { requireMember } from "@/lib/auth";
import { stripeEnabled } from "@/lib/env";
import { chargeStatuses, formatDate, formatMoney, subscriptionStatus } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Billing" };

const checkoutMessages: Record<string, { text: string; error?: boolean }> = {
  paid: { text: "Thank you, your payment was received." },
  subscribed: { text: "Thank you, your care plan is now active." },
  processing: { text: "Thank you. Your payment is processing; we’ll mark it paid as soon as it clears." },
  pending: { text: "We’re confirming your payment with Stripe. Refresh in a moment if it isn’t shown yet." },
};

export default async function BillingPage({ searchParams }: PageProps<"/portal/billing">) {
  const viewer = await requireMember();
  const { checkout } = await searchParams;
  const supabase = await createClient();

  const [charges, subscriptions] = await Promise.all([
    supabase
      .from("charges")
      .select("id, description, amount, currency, status, paid_at, created_at, project:projects(id, name)")
      .eq("client_id", viewer.clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("id, status, plan_name, amount, currency, interval, current_period_end, cancel_at, project:projects(id, name)")
      .eq("client_id", viewer.clientId)
      .order("created_at", { ascending: false }),
  ]);

  const due = charges.data?.filter((c) => c.status === "due") ?? [];
  const history = charges.data?.filter((c) => c.status !== "due") ?? [];
  const message = typeof checkout === "string" ? checkoutMessages[checkout] : undefined;

  return (
    <div className="app-page">
      <div className="page-head">
        <span className="eyebrow">{viewer.clientName}</span>
        <div className="row">
          <h1>Billing</h1>
          {stripeEnabled() && (
            <ActionForm action={openBillingPortal} className="actions">
              <SubmitButton className="btn btn--ghost btn--sm" pendingLabel="Opening…">
                Payment methods &amp; receipts
              </SubmitButton>
            </ActionForm>
          )}
        </div>
        <p className="lede">Pay invoices, manage your care plans, and download receipts. Payments are handled securely by Stripe.</p>
      </div>

      {message && (
        <p className="notice" role="status">
          {message.text}
        </p>
      )}
      {!stripeEnabled() && (
        <p className="notice notice--error">Online payments aren’t switched on yet. Please contact us to pay.</p>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Due now</h2>
        </div>
        {due.length ? (
          <div className="rows">
            {due.map((charge) => (
              <div key={charge.id}>
                <div className="stack" style={{ gap: 2 }}>
                  <span>{charge.description}</span>
                  <span className="meta">
                    {charge.project ? `${charge.project.name} · ` : ""}Issued {formatDate(charge.created_at)}
                  </span>
                </div>
                <div className="actions">
                  <strong>{formatMoney(charge.amount, charge.currency)}</strong>
                  <PayButton chargeId={charge.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">Nothing to pay right now.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Care plans</h2>
        </div>
        {subscriptions.data?.length ? (
          <div className="db">
            <table>
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Next date</th>
                  <th className="num">Price</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.data.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.plan_name ?? "Care plan"}</td>
                    <td>
                      {sub.project ? (
                        <Link className="link" href={`/portal/projects/${sub.project.id}`}>
                          {sub.project.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <StatusPill status={subscriptionStatus(sub.status)} />
                    </td>
                    <td>
                      {sub.status === "canceled"
                        ? "Ended"
                        : sub.cancel_at
                          ? `Ends ${formatDate(sub.cancel_at)}`
                          : `Renews ${formatDate(sub.current_period_end)}`}
                    </td>
                    <td className="num">
                      {sub.amount != null ? `${formatMoney(sub.amount, sub.currency ?? "thb")} / ${sub.interval}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No care plans yet. You can add one from any project page.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Payment history</h2>
        </div>
        {history.length ? (
          <div className="db">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((charge) => (
                  <tr key={charge.id}>
                    <td>{charge.description}</td>
                    <td>{formatDate(charge.paid_at ?? charge.created_at)}</td>
                    <td>
                      <StatusPill status={chargeStatuses[charge.status]} />
                    </td>
                    <td className="num">{formatMoney(charge.amount, charge.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">Paid invoices will appear here. Care plan receipts are under Payment methods &amp; receipts.</p>
        )}
      </section>
    </div>
  );
}
