import Link from "next/link";
import { notFound } from "next/navigation";
import { createCharge, createProject, inviteMember, removeMember, voidCharge } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/confirm-button";
import { ActionForm, SubmitButton } from "@/components/form";
import { StatusPill } from "@/components/pill";
import { displayName, requireAdmin } from "@/lib/auth";
import {
  chargeStatuses,
  formatDate,
  formatMoney,
  projectStatuses,
  subscriptionStatus,
} from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const statusOptions = Object.entries(projectStatuses);

function stripeDashboardUrl(customerId: string) {
  const test = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test") ? "/test" : "";
  return `https://dashboard.stripe.com${test}/customers/${customerId}`;
}

export default async function AdminClientPage({ params, searchParams }: PageProps<"/admin/clients/[id]">) {
  const { id } = await params;
  const { invite, reason } = await searchParams;
  await requireAdmin();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, name, stripe_customer_id, created_at, profiles(id, full_name, email), projects(id, name, status, launch_date, package), charges(id, description, amount, currency, status, created_at, paid_at, project:projects(name)), subscriptions(id, status, plan_name, amount, currency, interval, current_period_end, cancel_at, project:projects(name))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();

  const charges = [...client.charges].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="app-page">
      <div className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/admin">Overview</Link>
          <span>/</span>
          <span>{client.name}</span>
        </nav>
        <h1>{client.name}</h1>
        <p className="faint" style={{ fontSize: 14 }}>
          Client since {formatDate(client.created_at)}
          {client.stripe_customer_id && (
            <>
              {" · "}
              <a className="link" href={stripeDashboardUrl(client.stripe_customer_id)} target="_blank" rel="noreferrer">
                Open in Stripe
              </a>
            </>
          )}
        </p>
      </div>

      {invite === "sent" && <p className="notice" role="status">Client created and invite sent.</p>}
      {invite === "failed" && (
        <p className="notice notice--error" role="alert">
          Client created, but the invite failed{typeof reason === "string" ? `: ${reason}` : "."} Try again below.
        </p>
      )}

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Projects</h2>
          </div>
          {client.projects.length ? (
            <div className="rows">
              {client.projects.map((project) => (
                <Link href={`/admin/projects/${project.id}`} key={project.id}>
                  <span className="stack" style={{ gap: 2 }}>
                    <span>{project.name}</span>
                    <span className="meta">
                      {project.package ? `${project.package} · ` : ""}Launch {formatDate(project.launch_date)}
                    </span>
                  </span>
                  <StatusPill status={projectStatuses[project.status]} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">No projects yet.</p>
          )}
          <div className="panel-body" style={{ borderTop: "1px solid var(--line)" }}>
            <ActionForm action={createProject} className="stack">
              <input type="hidden" name="clientId" value={client.id} />
              <div className="field">
                <label className="f" htmlFor="p-name">
                  New project
                </label>
                <input id="p-name" name="name" required maxLength={200} placeholder="New website" />
              </div>
              <div className="row2">
                <div className="field">
                  <label className="f" htmlFor="p-package">
                    Package
                  </label>
                  <input id="p-package" name="package" list="packages" maxLength={100} />
                  <datalist id="packages">
                    <option value="Essential" />
                    <option value="Signature" />
                    <option value="Care only" />
                  </datalist>
                </div>
                <div className="field">
                  <label className="f" htmlFor="p-launch">
                    Launch date
                  </label>
                  <input id="p-launch" name="launchDate" type="date" />
                </div>
              </div>
              <div className="field">
                <label className="f" htmlFor="p-status">
                  Status
                </label>
                <select id="p-status" name="status" defaultValue="discovery">
                  {statusOptions.map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <SubmitButton pendingLabel="Creating…">Create project</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>People</h2>
          </div>
          {client.profiles.length ? (
            <div className="rows">
              {client.profiles.map((person) => (
                <div key={person.id}>
                  <span className="stack" style={{ gap: 2 }}>
                    <span>{displayName(person)}</span>
                    <span className="meta">{person.email}</span>
                  </span>
                  <form action={removeMember}>
                    <input type="hidden" name="profileId" value={person.id} />
                    <ConfirmButton message={`Remove ${person.email} from ${client.name}? They will lose access to this client.`}>
                      Remove
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">Nobody can sign in for this client yet.</p>
          )}
          <div className="panel-body" style={{ borderTop: "1px solid var(--line)" }}>
            <ActionForm action={inviteMember} className="stack">
              <input type="hidden" name="clientId" value={client.id} />
              <div className="field">
                <label className="f" htmlFor="i-name">
                  Name
                </label>
                <input id="i-name" name="fullName" maxLength={200} autoComplete="off" />
              </div>
              <div className="field">
                <label className="f" htmlFor="i-email">
                  Email
                </label>
                <input id="i-email" name="email" type="email" required autoComplete="off" />
              </div>
              <div>
                <SubmitButton pendingLabel="Inviting…">Invite to portal</SubmitButton>
              </div>
            </ActionForm>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Charges</h2>
        </div>
        {charges.length ? (
          <div className="db">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Project</th>
                  <th>Issued</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id}>
                    <td>{charge.description}</td>
                    <td>{charge.project?.name ?? "—"}</td>
                    <td>{formatDate(charge.created_at)}</td>
                    <td>
                      <StatusPill status={chargeStatuses[charge.status]} />
                      {charge.paid_at && <span className="faint"> {formatDate(charge.paid_at)}</span>}
                    </td>
                    <td className="num">{formatMoney(charge.amount, charge.currency)}</td>
                    <td className="num">
                      {charge.status === "due" && (
                        <form action={voidCharge}>
                          <input type="hidden" name="chargeId" value={charge.id} />
                          <ConfirmButton message={`Void “${charge.description}”? The client will no longer be able to pay it.`}>
                            Void
                          </ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No charges yet.</p>
        )}
        <div className="panel-body" style={{ borderTop: "1px solid var(--line)" }}>
          <ActionForm action={createCharge} className="stack">
            <input type="hidden" name="clientId" value={client.id} />
            <div className="inline">
              <div className="field" style={{ flexBasis: 260 }}>
                <label className="f" htmlFor="c-desc">
                  New charge
                </label>
                <input id="c-desc" name="description" required maxLength={300} placeholder="Signature website, 50% deposit" />
              </div>
              <div className="field" style={{ flex: "0 1 160px" }}>
                <label className="f" htmlFor="c-amount">
                  Amount (฿)
                </label>
                <input id="c-amount" name="amount" type="number" min={10} step="0.01" required inputMode="decimal" />
              </div>
              <div className="field" style={{ flex: "0 1 200px" }}>
                <label className="f" htmlFor="c-project">
                  Project
                </label>
                <select id="c-project" name="projectId" defaultValue="">
                  <option value="">None</option>
                  {client.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <SubmitButton pendingLabel="Adding…">Add charge</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Care plans</h2>
        </div>
        {client.subscriptions.length ? (
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
                {client.subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td>{sub.plan_name ?? "Care plan"}</td>
                    <td>{sub.project?.name ?? "—"}</td>
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
          <p className="empty">No care plans. Clients add them from their project page; changes in Stripe sync here.</p>
        )}
      </section>
    </div>
  );
}
