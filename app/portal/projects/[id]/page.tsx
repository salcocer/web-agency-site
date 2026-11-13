import Link from "next/link";
import { notFound } from "next/navigation";
import { createRequest, subscribeToPlan } from "@/app/portal/actions";
import { ActionForm, SubmitButton } from "@/components/form";
import { PayButton } from "@/components/pay-button";
import { StatusPill } from "@/components/pill";
import { requireMember } from "@/lib/auth";
import { stripeEnabled } from "@/lib/env";
import {
  formatDate,
  formatMoney,
  LIVE_SUBSCRIPTION_STATUSES,
  projectStatuses,
  requestStatuses,
  subscriptionStatus,
} from "@/lib/format";
import { getCarePlanPrices } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectPage({ params }: PageProps<"/portal/projects/[id]">) {
  const { id } = await params;
  const viewer = await requireMember();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, status, launch_date, package, site_url, notes, milestones(id, title, done, position), requests(id, title, status, updated_at), charges(id, description, amount, currency, status), subscriptions(id, status, plan_name, current_period_end, cancel_at)",
    )
    .eq("id", id)
    .eq("client_id", viewer.clientId)
    .maybeSingle();
  if (!project) notFound();

  const milestones = [...project.milestones].sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));
  const requests = [...project.requests].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const due = project.charges.filter((c) => c.status === "due");
  const plan = project.subscriptions.find((s) => LIVE_SUBSCRIPTION_STATUSES.includes(s.status));
  const offers = !plan && stripeEnabled() ? await getCarePlanPrices().catch(() => []) : [];

  return (
    <div className="app-page">
      <div className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/portal">Home</Link>
          <span>/</span>
          <span>{project.name}</span>
        </nav>
        <div className="cover" aria-hidden="true" />
        <h1>{project.name}</h1>
        <dl className="props">
          <dt>Status</dt>
          <dd>
            <StatusPill status={projectStatuses[project.status]} />
          </dd>
          <dt>Launch</dt>
          <dd>{formatDate(project.launch_date)}</dd>
          {project.package && (
            <>
              <dt>Package</dt>
              <dd>
                <span className="pill pill--g">{project.package}</span>
              </dd>
            </>
          )}
          {project.site_url && (
            <>
              <dt>Website</dt>
              <dd>
                <a className="link" href={project.site_url} target="_blank" rel="noreferrer">
                  {project.site_url.replace(/^https?:\/\//, "")}
                </a>
              </dd>
            </>
          )}
          <dt>Care plan</dt>
          <dd>
            {plan ? (
              <>
                <StatusPill status={subscriptionStatus(plan.status)} />{" "}
                <span className="faint">
                  {plan.cancel_at ? `ends ${formatDate(plan.cancel_at)}` : `renews ${formatDate(plan.current_period_end)}`}
                </span>
              </>
            ) : (
              <span className="faint">None</span>
            )}
          </dd>
        </dl>
      </div>

      {due.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Payments due</h2>
          </div>
          <div className="rows">
            {due.map((charge) => (
              <div key={charge.id}>
                <span>{charge.description}</span>
                <div className="actions">
                  <strong>{formatMoney(charge.amount, charge.currency)}</strong>
                  <PayButton chargeId={charge.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Change requests</h2>
          </div>
          {requests.length ? (
            <div className="rows">
              {requests.map((request) => (
                <Link href={`/portal/requests/${request.id}`} key={request.id}>
                  <span>{request.title}</span>
                  <span className="actions">
                    <span className="meta">{formatDate(request.updated_at)}</span>
                    <StatusPill status={requestStatuses[request.status]} />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">No requests yet. Need a change? Send one below.</p>
          )}
          <div className="panel-body" style={{ borderTop: "1px solid var(--line)" }}>
            <ActionForm action={createRequest} className="stack">
              <input type="hidden" name="projectId" value={project.id} />
              <div className="field">
                <label className="f" htmlFor="title">
                  New request
                </label>
                <input id="title" name="title" required maxLength={200} placeholder="e.g. Update the room prices" />
              </div>
              <div className="field">
                <label className="f" htmlFor="body">
                  Details
                </label>
                <textarea id="body" name="body" required maxLength={10000} placeholder="What should change, and where?" />
              </div>
              <div>
                <SubmitButton pendingLabel="Sending…">Send request</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </section>

        <div className="stack" style={{ gap: 20 }}>
          <section className="panel">
            <div className="panel-head">
              <h2>Milestones</h2>
            </div>
            <div className="panel-body">
              {milestones.length ? (
                <ul className="todo">
                  {milestones.map((m) => (
                    <li key={m.id} className={m.done ? "done" : undefined}>
                      {m.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="faint">We’ll add milestones once the plan is agreed.</p>
              )}
            </div>
          </section>

          {project.notes && (
            <section className="panel">
              <div className="panel-head">
                <h2>Notes from the studio</h2>
              </div>
              <div className="panel-body">
                <p className="notes">{project.notes}</p>
              </div>
            </section>
          )}

          {offers.map((offer) => (
            <section className="panel" key={offer.lookupKey}>
              <div className="panel-head">
                <h2>{offer.name}</h2>
                <strong>
                  {formatMoney(offer.amount, offer.currency)}
                  <span className="faint" style={{ fontWeight: 400 }}> / {offer.interval}</span>
                </strong>
              </div>
              <div className="panel-body">
                <p className="muted" style={{ fontSize: 15 }}>
                  {offer.summary}
                </p>
                <ul className="todo">
                  {offer.features.map((feature) => (
                    <li key={feature} className="done" style={{ textDecoration: "none", color: "var(--text)" }}>
                      {feature}
                    </li>
                  ))}
                </ul>
                <ActionForm action={subscribeToPlan} className="stack">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input type="hidden" name="lookupKey" value={offer.lookupKey} />
                  <div>
                    <SubmitButton pendingLabel="Opening…">Add {offer.name.toLowerCase()}</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
