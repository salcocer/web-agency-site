import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { HashSession } from "./hash-session";
import "../app.css";

export const metadata: Metadata = { title: "Client login" };

export default function LoginPage() {
  return (
    <main className="auth">
      <div className="auth-card">
        <Link className="brand" href="/">
          <i>K</i>Kata
        </Link>
        <div className="stack" style={{ gap: 8 }}>
          <h1>Client portal</h1>
          <p className="muted">Follow your project, send change requests and pay invoices. We’ll email you a sign-in link.</p>
        </div>
        <LoginForm />
        <HashSession />
        <p className="faint" style={{ fontSize: 14 }}>
          Not a client yet? <Link className="link" href="/#contact">Book a free consultation</Link>.
        </p>
      </div>
    </main>
  );
}
