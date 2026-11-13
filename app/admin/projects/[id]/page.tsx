import Link from "next/link";
import { notFound } from "next/navigation";
import { addMilestone, deleteMilestone, toggleMilestone, updateProject } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/form";
import { StatusPill } from "@/components/pill";
import { requireAdmin } from "@/lib/auth";
import { formatDate, projectStatuses, requestStatuses } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, status, package, launch_date, site_url, notes, client:clients(id, name), milestones(id, title, done, position), requests(id, title, status, updated_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const milestones = [...project.milestones].sort((a, b) => a.position - b.position);
  const requests = [...project.requests].sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return (
    <div className="app-page">
      <div className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/admin">Overview</Link>
          <span>/</span>
          {project.client && (
            <>
              <Link href={`/admin/clients/${project.client.id}`}>{project.client.name}</Link>
              <span>/</span>
            </>
          )}
          <span>{project.name}</span>
        </nav>
        <div className="row">
          <h1>{project.name}</h1>
          <StatusPill status={projectStatuses[project.status]} />
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Project details</h2>
            <span className="faint" style={{ fontSize: 13 }}>
              The client sees all of this
            </span>
          </div>
          <div className="panel-body">
            <ActionForm action={updateProject} className="stack">
              <input type="hidden" name="projectId" value={project.id} />
              <div className="field">
                <label className="f" htmlFor="name">
                  Name
                </label>
                <input id="name" name="name" required maxLength={200} defaultValue={project.name} />
              </div>
              <div className="row2">
                <div className="field">
                  <label className="f" htmlFor="status">
                    Status
                  </label>
                  <select id="status" name="status" defaultValue={project.status}>
                    {Object.entries(projectStatuses).map(([value, { label }]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="f" htmlFor="launchDate">
                    Launch date
                  </label>
                  <input id="launchDate" name="launchDate" type="date" defaultValue={project.launch_date ?? ""} />
                </div>
              </div>
              <div className="row2">
                <div className="field">
                  <label className="f" htmlFor="package">
                    Package
                  </label>
                  <input id="package" name="package" maxLength={100} defaultValue={project.package ?? ""} />
                </div>
                <div className="field">
                  <label className="f" htmlFor="siteUrl">
                    Website
                  </label>
                  <input id="siteUrl" name="siteUrl" maxLength={500} defaultValue={project.site_url ?? ""} placeholder="baantalay.com" />
                </div>
              </div>
              <div className="field">
                <label className="f" htmlFor="notes">
                  Notes for the client
                </label>
                <textarea id="notes" name="notes" maxLength={10000} defaultValue={project.notes ?? ""} />
              </div>
              <div>
                <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
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
              {milestones.length > 0 && (
                <ul className="checklist">
                  {milestones.map((m) => (
                    <li key={m.id} className={m.done ? "done" : undefined}>
                      <form action={toggleMilestone}>
                        <input type="hidden" name="milestoneId" value={m.id} />
                        <input type="hidden" name="done" value={String(!m.done)} />
                        <button
                          type="submit"
                          className={m.done ? "check check--on" : "check"}
                          aria-label={m.done ? `Mark “${m.title}” as not done` : `Mark “${m.title}” as done`}
                        >
                          {m.done ? "✓" : ""}
                        </button>
                      </form>
                      <span>{m.title}</span>
                      <form action={deleteMilestone}>
                        <input type="hidden" name="milestoneId" value={m.id} />
                        <button type="submit" className="link-btn faint" style={{ fontSize: 13 }} aria-label={`Delete “${m.title}”`}>
                          Delete
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <ActionForm action={addMilestone} className="inline">
                <input type="hidden" name="projectId" value={project.id} />
                <div className="field">
                  <label className="visually-hidden" htmlFor="milestone">
                    New milestone
                  </label>
                  <input id="milestone" name="title" required maxLength={300} placeholder="Add a milestone" />
                </div>
                <SubmitButton className="btn btn--ghost" pendingLabel="Adding…">
                  Add
                </SubmitButton>
              </ActionForm>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Requests</h2>
            </div>
            {requests.length ? (
              <div className="rows">
                {requests.map((request) => (
                  <Link href={`/admin/requests/${request.id}`} key={request.id}>
                    <span>{request.title}</span>
                    <span className="actions">
                      <span className="meta">{formatDate(request.updated_at)}</span>
                      <StatusPill status={requestStatuses[request.status]} />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="empty">No requests on this project.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
