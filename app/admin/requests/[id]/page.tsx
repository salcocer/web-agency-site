import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestStatus } from "@/app/admin/actions";
import { StatusPill } from "@/components/pill";
import { RequestThread } from "@/components/request-thread";
import { requireAdmin } from "@/lib/auth";
import { formatDate, requestStatuses } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function AdminRequestPage({ params }: PageProps<"/admin/requests/[id]">) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("id, title, status, created_at, project:projects(id, name, client:clients(id, name))")
    .eq("id", id)
    .maybeSingle();
  if (!request) notFound();

  return (
    <div className="app-page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/admin">Overview</Link>
          {request.project?.client && (
            <>
              <span>/</span>
              <Link href={`/admin/clients/${request.project.client.id}`}>{request.project.client.name}</Link>
            </>
          )}
          {request.project && (
            <>
              <span>/</span>
              <Link href={`/admin/projects/${request.project.id}`}>{request.project.name}</Link>
            </>
          )}
        </nav>
        <h1>{request.title}</h1>
        <div className="actions">
          <StatusPill status={requestStatuses[request.status]} />
          <span className="faint" style={{ fontSize: 14 }}>
            Opened {formatDate(request.created_at)}
          </span>
        </div>
        <div className="actions">
          {Object.entries(requestStatuses)
            .filter(([value]) => value !== request.status)
            .map(([value, { label }]) => (
              <form action={setRequestStatus} key={value}>
                <input type="hidden" name="requestId" value={request.id} />
                <input type="hidden" name="status" value={value} />
                <button type="submit" className="btn btn--ghost btn--sm">
                  Mark {label.toLowerCase()}
                </button>
              </form>
            ))}
        </div>
      </div>
      <RequestThread requestId={request.id} />
    </div>
  );
}
