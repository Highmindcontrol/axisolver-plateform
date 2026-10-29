import { CheckCircle2, Clock, XCircle, AlertTriangle, Hourglass } from "lucide-react";
import type { Intervention } from "@/lib/packs/security-shield";
import {
  BoutonApprouver,
  BoutonRefuser,
} from "./boutons-validation";

/**
 * Section « Interventions AXI » affichée sur la page sécurité :
 * - En haut : interventions en attente de validation (orange)
 * - Puis : journal des interventions récentes (terminées, échecs, refusées)
 */
export function SectionInterventions({
  interventions,
  slug,
}: {
  interventions: Intervention[];
  slug: string;
}) {
  if (interventions.length === 0) return null;

  const enAttente = interventions.filter(
    (i) => i.statut === "en_attente_validation",
  );
  const recentes = interventions.filter(
    (i) => i.statut !== "en_attente_validation",
  );

  return (
    <section className="mb-10 space-y-6">
      {/* ─── En attente de validation ─── */}
      {enAttente.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <header className="mb-4 flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700"
              aria-hidden
            >
              <Hourglass className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-amber-900">
                {enAttente.length} intervention
                {enAttente.length > 1 ? "s" : ""} AXI en attente de ta
                validation
              </h2>
              <p className="mt-0.5 text-xs text-amber-700">
                AXI propose ces corrections mais attend ton feu vert
                avant d&apos;agir (mode « avec validation » actif).
              </p>
            </div>
          </header>

          <ul className="space-y-3">
            {enAttente.map((i) => (
              <li
                key={i.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-white p-4"
              >
                <div className="flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                      {i.pilier}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {i.findingCode}
                    </span>
                  </p>
                  <h3 className="mt-1.5 text-sm font-semibold text-slate-900">
                    {i.titre}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-700">
                    {i.descriptionAction}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Proposée le{" "}
                    {new Date(i.creeLe).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col gap-2">
                  <BoutonApprouver slug={slug} interventionId={i.id} />
                  <BoutonRefuser slug={slug} interventionId={i.id} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Journal des interventions récentes ─── */}
      {recentes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-slate-600" strokeWidth={2} aria-hidden />
            <h2 className="text-sm font-semibold text-slate-900">
              Historique des interventions AXI
            </h2>
          </header>
          <ul className="divide-y divide-slate-100">
            {recentes.slice(0, 15).map((i) => (
              <LigneIntervention key={i.id} intervention={i} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function LigneIntervention({ intervention: i }: { intervention: Intervention }) {
  const styleStatut: Record<
    string,
    { bg: string; txt: string; Icone: typeof CheckCircle2; libelle: string }
  > = {
    terminee: {
      bg: "bg-emerald-100",
      txt: "text-emerald-800",
      Icone: CheckCircle2,
      libelle: "Appliquée",
    },
    echec: {
      bg: "bg-rose-100",
      txt: "text-rose-800",
      Icone: XCircle,
      libelle: "Échec",
    },
    refusee: {
      bg: "bg-slate-100",
      txt: "text-slate-700",
      Icone: XCircle,
      libelle: "Refusée",
    },
    annulee: {
      bg: "bg-slate-100",
      txt: "text-slate-700",
      Icone: XCircle,
      libelle: "Annulée",
    },
    en_cours: {
      bg: "bg-amber-100",
      txt: "text-amber-800",
      Icone: Clock,
      libelle: "En cours",
    },
    programmee: {
      bg: "bg-blue-100",
      txt: "text-blue-800",
      Icone: Clock,
      libelle: "Programmée",
    },
  };
  const s = styleStatut[i.statut] ?? styleStatut.terminee;
  const Icone = s.Icone;

  const resultat = (i.resultat as { journal?: string } | null) ?? null;

  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-semibold ${s.bg} ${s.txt}`}
      >
        <Icone className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        {s.libelle}
      </span>
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            {i.titre}
          </span>
          <span className="text-[10px] text-slate-500">
            {new Date(i.creeLe).toLocaleString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </p>
        {resultat?.journal && (
          <p className="mt-0.5 text-xs text-slate-600">{resultat.journal}</p>
        )}
        {i.erreur && (
          <p className="mt-0.5 inline-flex items-start gap-1 text-xs text-rose-700">
            <AlertTriangle
              className="mt-0.5 h-3 w-3 flex-shrink-0"
              strokeWidth={2.4}
            />
            {i.erreur}
          </p>
        )}
      </div>
    </li>
  );
}
