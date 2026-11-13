import type { Metadata } from "next";
import { signOut } from "@/app/auth/actions";
import { updateProfile } from "@/app/portal/actions";
import { ActionForm, SubmitButton } from "@/components/form";
import { displayName, requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function AccountPage() {
  const viewer = await requireMember();
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("client_id", viewer.clientId)
    .order("created_at");

  return (
    <div className="app-page" style={{ maxWidth: 760 }}>
      <div className="page-head">
        <span className="eyebrow">{viewer.clientName}</span>
        <h1>Settings</h1>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Your details</h2>
        </div>
        <div className="panel-body">
          <ActionForm action={updateProfile} className="stack">
            <div className="row2">
              <div className="field">
                <label className="f" htmlFor="fullName">
                  Name
                </label>
                <input id="fullName" name="fullName" defaultValue={viewer.fullName ?? ""} maxLength={200} autoComplete="name" />
              </div>
              <div className="field">
                <span className="f">Email</span>
                <input value={viewer.email} readOnly disabled aria-label="Email" />
                <span className="hint">To change your login email, contact us.</span>
              </div>
            </div>
            <div>
              <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
            </div>
          </ActionForm>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>People at {viewer.clientName}</h2>
        </div>
        <div className="rows">
          {team?.map((person) => (
            <div key={person.id}>
              <span>
                {displayName(person)}
                {person.id === viewer.id && <span className="faint"> (you)</span>}
              </span>
              <span className="meta">{person.email}</span>
            </div>
          ))}
        </div>
        <div className="panel-body" style={{ borderTop: "1px solid var(--line)" }}>
          <p className="faint" style={{ fontSize: 14 }}>
            Need to add a colleague? Send us their name and email and we’ll invite them.
          </p>
        </div>
      </section>

      <form action={signOut}>
        <button type="submit" className="btn btn--ghost">
          Sign out
        </button>
      </form>
    </div>
  );
}
