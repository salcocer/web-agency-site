import type { Metadata } from "next";
import Link from "next/link";
import { StatusPill } from "@/components/pill";
import { displayName, requireMember } from "@/lib/auth";
import { formatDate, formatMoney, LIVE_SUBSCRIPTION_STATUSES, projectStatuses } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Client portal" };

export default async function PortalHome() {
  const viewer = await requireMember();
  const supabase = await createClient();

  const [projects, charges, subscriptions, requests] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, status, launch_date, package, milestones(done)")
      .eq("client_id", viewer.clientId)
      .order("created_at"),
    supabase.from("charges").select("amount, currency").eq("client_id", viewer.clientId).eq("status", "due"),
    supabase
      .from("subscriptions")
      .select("id")
      .eq("client_id", viewer.clientId)
      .in("status", LIVE_SUBSCRIPTION_STATUSES),
    supabase
      .from("requests")
      .select("id, projects!inner(client_id)")
      .eq("projects.client_id", viewer.clientId)
      .neq("status", "done"),
  ]);

  const due = charges.data ?? [];
  const dueTotal = due.reduce((sum, charge) => sum + charge.amount, 0);

  return (
    <div className="app-page">
      <div className="page-head">
        <span className="eyebrow">{viewer.clientName}</span>
        <h1>Welcome back, {displayName(viewer).split(" ")[0]}.</h1>
        <p className="lede">Everything about your website in one place: progress, requests and billing.</p>
      </div>

      <div className="stats">
        <Link className="stat" href="/portal/billing">
          <span>Amount due</span>
          <strong>{dueTotal ? formatMoney(dueTotal, due[0].currency) : "Nothing due"}</strong>
        </Link>
        <Link className="stat" href="/portal/billing">
          <span>Care plans</span>
          <strong>{subscriptions.data?.length ? `${subscriptions.data.length} active` : "None yet"}</strong>
        </Link>
        <div className="stat">
          <span>Open requests</span>
          <strong>{requests.data?.length ?? 0}</strong>
        </div>
      </div>

      <section className="stack">
        <h2 style={{ fontSize: 20 }}>Your projects</h2>
        {projects.data?.length ? (
          <div className="cards">
            {projects.data.map((project) => {
              const done = project.milestones.filter((m) => m.done).length;
              const total = project.milestones.length;
              return (
                <Link className="card" href={`/portal/projects/${project.id}`} key={project.id}>
                  <div className="cover" aria-hidden="true" />
                  <div className="card-body">
                    <h3>{project.name}</h3>
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
                    </dl>
                    {total > 0 && (
                      <div className="stack" style={{ gap: 6 }}>
                        <div className="progress" aria-hidden="true">
                          <i style={{ width: `${Math.round((done / total) * 100)}%` }} />
                        </div>
                        <span className="faint" style={{ fontSize: 13 }}>
                          {done} of {total} milestones done
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="panel">
            <p className="empty">
              Your first project will appear here once we’ve set it up. Questions in the meantime? Email
              hello@kata.studio.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
