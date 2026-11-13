import Link from "next/link";
import { Suspense } from "react";
import { NavLink } from "@/components/nav-link";
import { NavSkeleton } from "@/components/page-skeleton";
import { SideFoot } from "@/components/side-foot";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import "../app.css";

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <div className="shell">
      <aside className="side">
        <Link className="brand" href="/portal">
          <i>S</i>
          <span>Saltlight</span>
        </Link>
        <Suspense fallback={<NavSkeleton />}>
          <PortalNav />
        </Suspense>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

async function PortalNav() {
  const viewer = await requireViewer();
  let projects: { id: string; name: string }[] = [];
  if (viewer.clientId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("projects")
      .select("id, name")
      .eq("client_id", viewer.clientId)
      .order("created_at");
    projects = data ?? [];
  }

  return (
    <>
      <nav aria-label="Portal">
        <NavLink href="/portal" exact>
          🏠 Home
        </NavLink>
        {projects.length > 0 && <b>Projects</b>}
        {projects.map((project) => (
          <NavLink key={project.id} href={`/portal/projects/${project.id}`} className="proj-link">
            🌐 {project.name}
          </NavLink>
        ))}
        <b>Account</b>
        <NavLink href="/portal/billing">💳 Billing</NavLink>
        <NavLink href="/portal/account">⚙️ Settings</NavLink>
        {viewer.role === "admin" && <NavLink href="/admin">🛠 Staff area</NavLink>}
      </nav>
      <SideFoot viewer={viewer} subtitle={viewer.clientName} />
    </>
  );
}
