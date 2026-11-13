import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Enquiries" };

export default async function EnquiriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: enquiries } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="app-page">
      <div className="page-head">
        <h1>Enquiries</h1>
        <p className="lede">Messages from the contact form on the website, newest first.</p>
      </div>
      <section className="panel">
        {enquiries?.length ? (
          <div className="rows">
            {enquiries.map((enquiry) => (
              <article key={enquiry.id} style={{ display: "grid", gap: 6, justifyContent: "stretch" }}>
                <div className="actions" style={{ justifyContent: "space-between" }}>
                  <strong>
                    {enquiry.name}
                    {enquiry.business && <span className="faint" style={{ fontWeight: 400 }}> · {enquiry.business}</span>}
                  </strong>
                  <span className="meta">{formatDateTime(enquiry.created_at)}</span>
                </div>
                <div className="actions">
                  <a className="link" href={`mailto:${enquiry.email}`}>
                    {enquiry.email}
                  </a>
                  {enquiry.need && <span className="pill pill--g">{enquiry.need}</span>}
                </div>
                {enquiry.message && <p className="notes">{enquiry.message}</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty">No enquiries yet.</p>
        )}
      </section>
    </div>
  );
}
