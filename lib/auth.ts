import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Enums } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  id: string;
  email: string;
  fullName: string | null;
  role: Enums<"user_role">;
  clientId: string | null;
  clientName: string | null;
};

// The signed-in person and their client, read once per request.
// getClaims() verifies the JWT, so the id can be trusted for authorization.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, client_id, clients(name)")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    clientId: profile.client_id,
    clientName: profile.clients?.name ?? null,
  };
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

// Portal pages are for people who belong to a client. Staff without a client go to
// the staff area; invited people who aren't linked yet see a holding page.
export async function requireMember(): Promise<Viewer & { clientId: string }> {
  const viewer = await requireViewer();
  if (!viewer.clientId) redirect(viewer.role === "admin" ? "/admin" : "/portal/pending");
  return { ...viewer, clientId: viewer.clientId };
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.role !== "admin") redirect("/portal");
  return viewer;
}

export function displayName(person: { full_name?: string | null; fullName?: string | null; email: string }) {
  return person.full_name || person.fullName || person.email.split("@")[0];
}
