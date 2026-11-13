import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { requireViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Almost there" };

// For someone who can sign in but isn't linked to a client yet.
export default async function PendingPage() {
  const viewer = await requireViewer();
  if (viewer.clientId) redirect("/portal");

  return (
    <div className="app-page" style={{ maxWidth: 620 }}>
      <div className="page-head">
        <h1>Almost there.</h1>
        <p className="lede">
          You’re signed in as {viewer.email}, but this account isn’t linked to a client yet. Email
          hello@saltlight.studio and we’ll connect it.
        </p>
      </div>
      <form action={signOut}>
        <button type="submit" className="btn btn--ghost">
          Sign out
        </button>
      </form>
    </div>
  );
}
