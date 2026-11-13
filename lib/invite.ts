import "server-only";
import { siteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";

// Links a person to a client, inviting them by email if they have no account yet.
// Membership is set here with the secret key, never from anything the person controls.
export async function inviteToClient({
  clientId,
  email,
  fullName,
}: {
  clientId: string;
  email: string;
  fullName?: string;
}): Promise<{ error: string } | { invited: boolean }> {
  const admin = createAdminClient();
  const address = email.trim().toLowerCase();

  const { data: existing } = await admin
    .from("profiles")
    .select("id, client_id")
    .eq("email", address)
    .maybeSingle();
  if (existing?.client_id && existing.client_id !== clientId) {
    return { error: "That email already belongs to another client." };
  }

  let userId = existing?.id;
  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(address, {
      redirectTo: `${await siteUrl()}/auth/confirm?next=/portal`,
      data: fullName ? { full_name: fullName } : undefined,
    });
    if (error) return { error: `The invite didn’t send: ${error.message}` };
    userId = data.user.id;
  }

  const { error } = await admin
    .from("profiles")
    .update(fullName ? { client_id: clientId, full_name: fullName } : { client_id: clientId })
    .eq("id", userId);
  if (error) return { error: `The invite was sent but linking failed: ${error.message}` };

  return { invited: !existing };
}
