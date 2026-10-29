import { Clock3, Mail, Shield, Users } from "lucide-react";

import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  getWorkspaceActif,
  listerInvitationsEnAttente,
  listerMembres,
} from "@/lib/services/workspace";

import {
  BoutonRetirerMembre,
  BoutonRevoquerInvitation,
} from "./boutons-revoquer";
import { DialogInviterAdmin } from "./dialog-inviter-admin";

/**
 * Section Co-administrateurs — version câblée après migration 0016.
 *
 * Charge le workspace actif, liste les membres + invitations en
 * attente. Fallback propre si la migration SQL n'est pas encore
 * appliquée en prod : affiche l'admin principal + un bandeau
 * explicatif « bientôt disponible ».
 */
export async function SectionAdministrateurs({
  user,
}: {
  user: User;
}) {
  const workspace = await getWorkspaceActif(user.id);

  if (!workspace) {
    return <SectionBientotDisponible user={user} />;
  }

  const [membresBruts, invitations] = await Promise.all([
    listerMembres(workspace.id),
    listerInvitationsEnAttente(workspace.id),
  ]);

  // Enrichit les membres avec leurs infos user via l'admin API Supabase.
  const supabaseAdmin = createSupabaseAdminClient();
  const membresEnrichis = await Promise.all(
    membresBruts.map(async (m) => {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(m.userId);
        const u = data?.user;
        const meta = (u?.user_metadata ?? {}) as Record<string, unknown>;
        return {
          userId: m.userId,
          email: u?.email ?? "—",
          prenom: typeof meta.prenom === "string" ? meta.prenom : "",
          nom: typeof meta.nom === "string" ? meta.nom : "",
          ajouteLe: m.ajouteLe,
          estCreateur: m.estCreateur,
        };
      } catch {
        return {
          userId: m.userId,
          email: "—",
          prenom: "",
          nom: "",
          ajouteLe: m.ajouteLe,
          estCreateur: m.estCreateur,
        };
      }
    }),
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Users
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Co-administrateurs
      </h2>

      <p className="mb-5 text-sm leading-relaxed text-slate-600">
        Les co-administrateurs ont{" "}
        <strong>exactement les mêmes droits</strong> que vous : gestion
        des sites, base de connaissances, audits, facturation,
        invitation d&apos;autres administrateurs.
      </p>

      {/* Membres actifs */}
      <ul className="mb-4 space-y-2">
        {membresEnrichis.map((m) => {
          const nomAffiche =
            [m.prenom, m.nom].filter(Boolean).join(" ") || m.email;
          const estMoi = m.userId === user.id;
          return (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    m.estCreateur
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                  aria-hidden
                >
                  <Shield className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {nomAffiche}
                    {estMoi && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        (vous)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    m.estCreateur
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {m.estCreateur ? "Admin principal" : "Co-admin"}
                </span>
                {!m.estCreateur && !estMoi && (
                  <BoutonRetirerMembre userIdCible={m.userId} />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Invitations en attente */}
      {invitations.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Invitations en attente
          </p>
          <ul className="space-y-2">
            {invitations.map((inv) => {
              const nomAffiche =
                [inv.prenom, inv.nom].filter(Boolean).join(" ") || inv.email;
              return (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
                      aria-hidden
                    >
                      <Mail className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {nomAffiche}
                      </p>
                      <p className="text-xs text-slate-600">{inv.email}</p>
                      <p className="mt-0.5 text-[11px] text-amber-800">
                        Expire le{" "}
                        {inv.expireLe.toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900">
                      En attente
                    </span>
                    <BoutonRevoquerInvitation invitationId={inv.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Bouton d'invitation */}
      <div className="flex justify-end border-t border-slate-100 pt-4">
        <DialogInviterAdmin />
      </div>
    </section>
  );
}

/**
 * Fallback affiché tant que la migration workspace n'est pas appliquée
 * en production. Affiche juste l'admin principal + mention bientôt.
 */
function SectionBientotDisponible({ user }: { user: User }) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const prenom = typeof meta.prenom === "string" ? meta.prenom : "";
  const nom = typeof meta.nom === "string" ? meta.nom : "";
  const email = user.email ?? "";
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || email;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Users
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Co-administrateurs
      </h2>

      <ul className="mb-5 space-y-2">
        <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"
              aria-hidden
            >
              <Shield className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {nomComplet}
              </p>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
          </div>
          <span className="flex-shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
            Administrateur principal
          </span>
        </li>
      </ul>

      <p className="inline-flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
        <Clock3
          className="mt-0.5 h-3 w-3 flex-shrink-0"
          strokeWidth={2.2}
          aria-hidden
        />
        Multi-administration prête côté code. Activation effective
        après exécution de la migration SQL{" "}
        <code className="font-mono">0016_workspaces_multi_admin.sql</code>{" "}
        dans Supabase.
      </p>
    </section>
  );
}
