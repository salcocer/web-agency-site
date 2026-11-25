import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { NavLink } from "@/components/nav-link";
import { NavSkeleton } from "@/components/page-skeleton";
import { SideFoot } from "@/components/side-foot";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import "../app.css";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="shell">
      <aside className="side">
        <Link className="brand" href="/admin">
          <Logo />
          <span>staff</span>
        </Link>
        <Suspense fallback={<NavSkeleton />}>
          <AdminNav />
        </Suspense>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

async function AdminNav() {
  const viewer = await requireAdmin();
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");

  return (
    <>
      <nav aria-label="Staff">
        <NavLink href="/admin" exact>
          📊 Overview
        </NavLink>
        <NavLink href="/admin/enquiries">📨 Enquiries</NavLink>
        <b>Clients</b>
        {clients?.map((client) => (
          <NavLink key={client.id} href={`/admin/clients/${client.id}`} className="proj-link">
            🏢 {client.name}
          </NavLink>
        ))}
        <NavLink href="/admin/clients/new" exact>
          ＋ New client
        </NavLink>
      </nav>
      <SideFoot viewer={viewer} subtitle="Staff" />
    </>
  );
}
