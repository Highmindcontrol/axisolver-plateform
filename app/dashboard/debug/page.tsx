import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Page de diagnostic — expose l'état réel du schéma DB côté prod.
 * Permet d'identifier les colonnes/tables manquantes qui bloquent
 * les queries. À retirer une fois le bug multi-admin résolu.
 */
export default async function PageDebug() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const checks: Array<{ nom: string; sql: string; resultat: string }> = [];

  async function check(nom: string, querySql: string) {
    try {
      const r = (await db.execute(sql.raw(querySql))) as unknown;
      const rows = Array.isArray(r)
        ? r
        : ((r as { rows?: unknown[] })?.rows ?? r);
      checks.push({
        nom,
        sql: querySql,
        resultat: JSON.stringify(rows, null, 2),
      });
    } catch (e) {
      checks.push({
        nom,
        sql: querySql,
        resultat: `❌ ERREUR: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  }

  await check(
    "Table workspaces existe ?",
    `SELECT to_regclass('public.workspaces') AS existe`,
  );
  await check(
    "Table workspace_members existe ?",
    `SELECT to_regclass('public.workspace_members') AS existe`,
  );
  await check(
    "Table workspace_invitations existe ?",
    `SELECT to_regclass('public.workspace_invitations') AS existe`,
  );
  await check(
    "Colonne sites.workspace_id existe ?",
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema='public' AND table_name='sites' AND column_name='workspace_id'`,
  );
  await check(
    "Mes sites (user auth)",
    `SELECT id, slug, owner_user_id, workspace_id, nom_entreprise
     FROM sites
     WHERE owner_user_id = '${user.id}'
     LIMIT 10`,
  );
  await check(
    "Mes workspaces (via membership)",
    `SELECT w.id, w.nom, w.cree_par_user_id, wm.role
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = '${user.id}'`,
  );
  await check(
    "Ma shadow row users",
    `SELECT id, email, cree_le FROM users WHERE id = '${user.id}'`,
  );
  await check(
    "Liste des migrations potentielles",
    `SELECT typname FROM pg_type WHERE typname IN ('workspace_role', 'workspace_invitation_statut', 'plan_abonnement') ORDER BY typname`,
  );

  return (
    <div className="flex-1 px-6 py-10 md:px-14 lg:px-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
        Diagnostic DB
      </h1>
      <p className="mb-8 text-sm text-slate-600">
        User ID : <code className="font-mono text-xs">{user.id}</code>
        <br />
        Email : <code className="font-mono text-xs">{user.email}</code>
      </p>

      <div className="space-y-4">
        {checks.map((c) => (
          <div
            key={c.nom}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900">{c.nom}</h3>
            <pre className="mt-2 overflow-x-auto rounded-md bg-slate-50 p-3 text-[11px] text-slate-700">
              {c.sql}
            </pre>
            <pre
              className={`mt-2 overflow-x-auto rounded-md p-3 text-[11px] ${
                c.resultat.startsWith("❌")
                  ? "bg-rose-50 text-rose-900"
                  : "bg-emerald-50 text-emerald-900"
              }`}
            >
              {c.resultat}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
