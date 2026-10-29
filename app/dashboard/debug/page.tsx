import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    "Tous mes sites (via workspace + ownership)",
    `SELECT s.id, s.slug, s.nom_entreprise, s.domaine_principal, s.owner_user_id, s.workspace_id, s.plan, s.cree_le
     FROM sites s
     LEFT JOIN workspace_members wm ON wm.workspace_id = s.workspace_id AND wm.user_id = '${user.id}'
     WHERE s.owner_user_id = '${user.id}' OR wm.user_id IS NOT NULL
     ORDER BY s.cree_le`,
  );

  await check(
    "Mes workspaces",
    `SELECT w.id, w.nom, w.cree_par_user_id = '${user.id}' AS je_suis_createur, wm.role
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = '${user.id}'`,
  );

  await check(
    "Membres de mes workspaces",
    `SELECT w.nom AS workspace, wm.user_id, wm.role, wm.ajoute_le
     FROM workspace_members wm
     JOIN workspaces w ON w.id = wm.workspace_id
     WHERE w.id IN (
       SELECT workspace_id FROM workspace_members WHERE user_id = '${user.id}'
     )
     ORDER BY w.nom, wm.ajoute_le`,
  );

  return (
    <div className="flex-1 px-6 py-10 md:px-14 lg:px-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
        Diagnostic sites + workspaces
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
