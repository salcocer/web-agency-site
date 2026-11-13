import type { Metadata } from "next";
import Link from "next/link";
import { StatusPill } from "@/components/pill";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatMoney, LIVE_SUBSCRIPTION_STATUSES, requestStatuses } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Staff overview" };

export default async function AdminHome() {
  await requireAdmin();
  const supabase = await createClient();

  const [requests, clients, enquiries] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status, updated_at, project:projects!inner(id, name, client:clients!inner(id, name))")
      .neq("status", "done")
      .order("updated_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name, profiles(id), projects(id), charges(amount, status), subscriptions(status, amount, interval)")
      .order("name"),
    supabase.from("enquiries").select("id", { count: "exact", head: true }),
  ]);

  const rows = (clients.data ?? []).map((client) => {
    const due = client.charges.filter((c) => c.status === "due").reduce((sum, c) => sum + c.amount, 0);
    const live = client.subscriptions.filter((s) => LIVE_SUBSCRIPTION_STATUSES.includes(s.status));
    return { ...client, due, live };
  });
  const totalDue = rows.reduce((sum, row) => sum + row.due, 0);
  const monthly = rows
    .flatMap((row) => row.live)
    .reduce((sum, s) => sum + (s.amount ?? 0) / (s.interval === "year" ? 12 : 1), 0);

  return (
    <div className="app-page">
      <div className="page-head">
        <div className="row">
          <h1>Overview</h1>
          <Link className="btn btn--sm" href="/admin/clients/new">
            New client
          </Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Open requests</span>
          <strong>{requests.data?.length ?? 0}</strong>
        </div>
        <div className="stat">
          <span>Unpaid charges</span>
          <strong>{formatMoney(totalDue)}</strong>
        </div>
        <div className="stat">
          <span>Care plans, monthly</span>
          <strong>{formatMoney(Math.round(monthly))}</strong>
        </div>
        <Link className="stat" href="/admin/enquiries">
          <span>Enquiries</span>
          <strong>{enquiries.count ?? 0}</strong>
        </Link>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Open requests</h2>
        </div>
        {requests.data?.length ? (
          <div className="rows">
            {requests.data.map((request) => (
              <Link href={`/admin/requests/${request.id}`} key={request.id}>
                <span className="stack" style={{ gap: 2 }}>
                  <span>{request.title}</span>
                  <span className="meta">
                    {request.project.client.name} · {request.project.name}
                  </span>
                </span>
                <span className="actions">
                  <span className="meta">{formatDate(request.updated_at)}</span>
                  <StatusPill status={requestStatuses[request.status]} />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="empty">No open requests. Nice.</p>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Clients</h2>
        </div>
        {rows.length ? (
          <div className="db">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th className="num">People</th>
                  <th className="num">Projects</th>
                  <th className="num">Care plans</th>
                  <th className="num">Due</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="link" href={`/admin/clients/${row.id}`}>
                        {row.name}
                      </Link>
                    </td>
                    <td className="num">{row.profiles.length}</td>
                    <td className="num">{row.projects.length}</td>
                    <td className="num">{row.live.length}</td>
                    <td className="num">{row.due ? formatMoney(row.due) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            No clients yet. <Link className="link" href="/admin/clients/new">Add your first client</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
