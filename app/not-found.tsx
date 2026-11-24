import Link from "next/link";
import { supabaseEnabled } from "@/lib/env";
import "./app.css";

export default function NotFound() {
  return (
    <main className="auth">
      <div className="auth-card">
        <Link className="brand" href="/">
          <i>K</i>Kata
        </Link>
        <h1>Page not found</h1>
        <p className="muted">That page doesn’t exist, or you don’t have access to it.</p>
        <div className="actions">
          {supabaseEnabled() && (
            <Link className="btn" href="/portal">
              Go to the portal
            </Link>
          )}
          <Link className={supabaseEnabled() ? "btn btn--ghost" : "btn"} href="/">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
