import type { Metadata } from "next";
import Link from "next/link";
import { createClientAccount } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/form";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "New client" };

export default async function NewClientPage() {
  await requireAdmin();
  return (
    <div className="app-page" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/admin">Overview</Link>
          <span>/</span>
          <span>New client</span>
        </nav>
        <h1>New client</h1>
        <p className="lede">Add the business, and invite your contact there to the portal.</p>
      </div>
      <section className="panel">
        <div className="panel-body">
          <ActionForm action={createClientAccount} className="stack">
            <div className="field">
              <label className="f" htmlFor="name">
                Business name
              </label>
              <input id="name" name="name" required maxLength={200} placeholder="Baan Talay Villa" />
            </div>
            <div className="row2">
              <div className="field">
                <label className="f" htmlFor="contactName">
                  Contact name
                </label>
                <input id="contactName" name="contactName" maxLength={200} autoComplete="off" />
              </div>
              <div className="field">
                <label className="f" htmlFor="contactEmail">
                  Contact email
                </label>
                <input id="contactEmail" name="contactEmail" type="email" autoComplete="off" />
              </div>
            </div>
            <p className="hint">Leave the email empty to invite people later. Invited people get a sign-in link by email.</p>
            <div>
              <SubmitButton pendingLabel="Creating…">Create client</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </section>
    </div>
  );
}
