import { redirect } from "next/navigation";

import { aAccesSuperAdmin } from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Garde /dashboard/super-admin/* : seul un utilisateur avec un profil
 * plateforme (super_admin ou admin_plateforme) peut y accéder. Les
 * autres sont redirigés vers l'accueil dashboard.
 *
 * Doctrine : la garde est côté serveur sur CHAQUE page super-admin via
 * ce layout commun. On n'affiche pas de 403 : on redirige silencieusement
 * — l'existence même du back-office reste discrète pour un user standard.
 */
export const dynamic = "force-dynamic";

export default async function LayoutSuperAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const autorise = await aAccesSuperAdmin(user.id);
  if (!autorise) redirect("/dashboard");

  return <>{children}</>;
}
