import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/pill";
import { RequestThread } from "@/components/request-thread";
import { requireMember } from "@/lib/auth";
import { formatDate, requestStatuses } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function RequestPage({ params }: PageProps<"/portal/requests/[id]">) {
  const { id } = await params;
  const viewer = await requireMember();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select("id, title, status, created_at, project:projects!inner(id, name, client_id)")
    .eq("id", id)
    .eq("project.client_id", viewer.clientId)
    .maybeSingle();
  if (!request) notFound();

  return (
    <div className="app-page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/portal">Home</Link>
          <span>/</span>
          <Link href={`/portal/projects/${request.project.id}`}>{request.project.name}</Link>
          <span>/</span>
          <span>Request</span>
        </nav>
        <h1>{request.title}</h1>
        <div className="actions">
          <StatusPill status={requestStatuses[request.status]} />
          <span className="faint" style={{ fontSize: 14 }}>
            Opened {formatDate(request.created_at)}
          </span>
        </div>
      </div>
      <RequestThread requestId={request.id} />
    </div>
  );
}
