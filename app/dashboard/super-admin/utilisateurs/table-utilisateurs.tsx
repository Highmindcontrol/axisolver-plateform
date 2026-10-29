"use client";

import { Crown, Loader2, Shield, X, Edit3 } from "lucide-react";
import { useActionState, useState } from "react";

import type { UtilisateurPlateforme } from "@/lib/services/super-admin";

import {
  assignerRoleAction,
  retirerRoleAction,
  type EtatMutation,
} from "./actions";

const INIT: EtatMutation = { erreur: null };

export function TableUtilisateurs({
  utilisateurs,
  monUserId,
  peutModifier,
}: {
  utilisateurs: UtilisateurPlateforme[];
  monUserId: string;
  peutModifier: boolean;
}) {
  const [cibleId, setCibleId] = useState<string | null>(null);

  if (utilisateurs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <p className="text-sm text-slate-500">
          Aucun utilisateur trouvé pour cette recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Utilisateur
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Rôle plateforme
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Abonnement
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Sites
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600">
              Inscrit le
            </th>
            {peutModifier && (
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {utilisateurs.map((u, i) => (
            <tr
              key={u.userId}
              className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  {u.nomAffiche ?? u.email ?? "—"}
                </p>
                {u.nomAffiche && u.email && (
                  <p className="text-[11px] text-slate-500">{u.email}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <BadgeRole role={u.rolePlateforme} />
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {u.planAbonnement ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-medium">{u.planAbonnement}</span>
                    {u.statutAbonnement === "trialing" && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-800">
                        Essai
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                {u.nbSites}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {u.creeLe.toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              {peutModifier && (
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setCibleId(cibleId === u.userId ? null : u.userId)
                    }
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <Edit3 className="h-3 w-3" strokeWidth={2.2} />
                    Modifier
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {cibleId && (
        <PanneauMutation
          utilisateur={utilisateurs.find((u) => u.userId === cibleId)!}
          estMoi={cibleId === monUserId}
          onFermer={() => setCibleId(null)}
        />
      )}
    </div>
  );
}

function BadgeRole({ role }: { role: UtilisateurPlateforme["rolePlateforme"] }) {
  if (!role) {
    return <span className="text-[11px] text-slate-400">Utilisateur</span>;
  }
  const styles: Record<string, { bg: string; txt: string; libelle: string }> = {
    super_admin: {
      bg: "bg-gradient-to-r from-amber-400 to-rose-500",
      txt: "text-white",
      libelle: "Super-admin",
    },
    admin_plateforme: {
      bg: "bg-indigo-100",
      txt: "text-indigo-800",
      libelle: "Admin plateforme",
    },
    contributeur: {
      bg: "bg-emerald-100",
      txt: "text-emerald-800",
      libelle: "Contributeur",
    },
  };
  const s = styles[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.bg} ${s.txt}`}
    >
      {role === "super_admin" ? (
        <Crown className="h-3 w-3" strokeWidth={2.4} />
      ) : (
        <Shield className="h-3 w-3" strokeWidth={2.4} />
      )}
      {s.libelle}
    </span>
  );
}

function PanneauMutation({
  utilisateur,
  estMoi,
  onFermer,
}: {
  utilisateur: UtilisateurPlateforme;
  estMoi: boolean;
  onFermer: () => void;
}) {
  const [etatAssigner, assignerAction, pendingAssigner] = useActionState(
    assignerRoleAction,
    INIT,
  );
  const [etatRetirer, retirerAction, pendingRetirer] = useActionState(
    retirerRoleAction,
    INIT,
  );

  const pending = pendingAssigner || pendingRetirer;
  const etat = etatAssigner.erreur
    ? etatAssigner
    : etatRetirer.erreur
      ? etatRetirer
      : etatAssigner.succes
        ? etatAssigner
        : etatRetirer;

  return (
    <div className="border-t border-slate-200 bg-slate-50/60 p-5">
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Modifier le rôle plateforme
          </p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">
            {utilisateur.nomAffiche ?? utilisateur.email ?? utilisateur.userId}
          </h3>
          {estMoi && (
            <p className="mt-0.5 text-[11px] text-amber-700">
              C&apos;est ton propre compte. Attention en retirant un rôle.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onFermer}
          aria-label="Fermer"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-900"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </header>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {(
          [
            {
              role: "super_admin",
              libelle: "Super-admin",
              classes:
                "border-rose-300 bg-gradient-to-br from-amber-50 to-rose-50 text-rose-900 hover:border-rose-400",
            },
            {
              role: "admin_plateforme",
              libelle: "Admin plateforme",
              classes:
                "border-indigo-200 bg-indigo-50 text-indigo-900 hover:border-indigo-300",
            },
            {
              role: "contributeur",
              libelle: "Contributeur",
              classes:
                "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300",
            },
          ] as const
        ).map(({ role, libelle, classes }) => (
          <form key={role} action={assignerAction}>
            <input type="hidden" name="userId" value={utilisateur.userId} />
            <input type="hidden" name="role" value={role} />
            <button
              type="submit"
              disabled={pending || utilisateur.rolePlateforme === role}
              className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
            >
              {pendingAssigner ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              ) : null}
              {utilisateur.rolePlateforme === role
                ? `✓ ${libelle}`
                : `→ ${libelle}`}
            </button>
          </form>
        ))}

        <form action={retirerAction}>
          <input type="hidden" name="userId" value={utilisateur.userId} />
          <button
            type="submit"
            disabled={pending || !utilisateur.rolePlateforme}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingRetirer ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            ) : null}
            Retirer tout rôle
          </button>
        </form>
      </div>

      {etat.erreur && (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800">
          {etat.erreur}
        </p>
      )}
      {etat.succes && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {etat.succes}
        </p>
      )}
    </div>
  );
}
