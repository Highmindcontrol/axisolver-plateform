"use client";

import {
  BookOpenCheck,
  FolderOpen,
  History,
  MessageSquareText,
  Upload,
  BarChart3,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

type CleDrawer =
  | "sites"
  | "conversations"
  | "historique"
  | "statistiques"
  | "telecharger"
  | "guide";

type Item = {
  cle: CleDrawer;
  label: string;
  icone: LucideIcon;
  actif: boolean;
};

/**
 * Bandeau d'actions dashboard — six accès rapides en bas d'écran,
 * chaque bouton déplie un panneau accordion inline juste en dessous.
 *
 * Modèle AxiHub : <BandeauActionsDashboard>. Les panneaux affichent
 * pour l'instant un placeholder — ils seront branchés sur les tables
 * usage_conversations, security_audits, etc. dans un prochain lot.
 */
export function BandeauActions({
  nbSites,
  conversationsCeMois,
}: {
  nbSites: number;
  conversationsCeMois: number;
}) {
  const [ouvert, setOuvert] = useState<CleDrawer | null>(null);

  const items: Item[] = [
    { cle: "sites", label: "Mes sites", icone: FolderOpen, actif: true },
    {
      cle: "conversations",
      label: "Conversations visiteurs",
      icone: MessageSquareText,
      actif: true,
    },
    { cle: "historique", label: "Historique AXI", icone: History, actif: false },
    {
      cle: "statistiques",
      label: "Statistiques",
      icone: BarChart3,
      actif: true,
    },
    {
      cle: "telecharger",
      label: "Télécharger un document",
      icone: Upload,
      actif: true,
    },
    {
      cle: "guide",
      label: "Guide d'AXI",
      icone: BookOpenCheck,
      actif: true,
    },
  ];

  const panneauCourant = items.find((i) => i.cle === ouvert && i.actif);
  const IconePanneau = panneauCourant?.icone;

  return (
    <>
      <div className="border border-slate-300/60 bg-slate-100/80 px-5 py-3 shadow-[0_1px_2px_0_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {items.map(({ cle, label, icone: Icone, actif }) => {
            const estOuvert = ouvert === cle;
            return (
              <button
                key={cle}
                type="button"
                onClick={() => {
                  if (!actif) return;
                  setOuvert((prev) => (prev === cle ? null : cle));
                }}
                disabled={!actif}
                title={
                  actif
                    ? undefined
                    : "Bientôt disponible — en cours d'implémentation"
                }
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  estOuvert
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white/80 text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
                } disabled:hover:border-slate-200 disabled:hover:bg-white/80 disabled:hover:text-slate-700`}
              >
                <Icone className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {panneauCourant && IconePanneau && (
        <div className="overflow-hidden border-b border-slate-200 bg-[#f5f5f7]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/60 px-6 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <IconePanneau className="h-4 w-4 text-slate-700" aria-hidden />
              {panneauCourant.label}
            </h2>
            <button
              type="button"
              onClick={() => setOuvert(null)}
              className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
              aria-label="Fermer le panneau"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <ContenuPanneau
            cle={panneauCourant.cle}
            nbSites={nbSites}
            conversationsCeMois={conversationsCeMois}
          />
        </div>
      )}
    </>
  );
}

function ContenuPanneau({
  cle,
  nbSites,
  conversationsCeMois,
}: {
  cle: CleDrawer;
  nbSites: number;
  conversationsCeMois: number;
}) {
  switch (cle) {
    case "sites":
      return (
        <div className="px-6 py-6">
          <p className="text-sm text-slate-700">
            Vous gérez actuellement{" "}
            <strong className="font-semibold text-slate-900">
              {nbSites} site{nbSites > 1 ? "s" : ""}
            </strong>
            . Pour la vue détaillée, utilisez la liste à gauche ou la
            page « Accueil » du dashboard.
          </p>
        </div>
      );
    case "conversations":
      return (
        <div className="px-6 py-6">
          <p className="text-sm text-slate-700">
            <strong className="font-semibold text-slate-900">
              {conversationsCeMois}
            </strong>{" "}
            conversation{conversationsCeMois > 1 ? "s" : ""} ce mois-ci sur
            l&apos;ensemble de vos sites. Le détail par site et par visiteur
            arrive dans un prochain lot.
          </p>
        </div>
      );
    case "statistiques":
      return (
        <div className="px-6 py-6">
          <p className="text-sm text-slate-700">
            Les statistiques consolidées (taux de résolution, satisfaction,
            volumes par site, pics d&apos;activité) sont en cours
            d&apos;intégration. Les rapports par site sont déjà disponibles
            dans l&apos;onglet « Rapports » de chaque site.
          </p>
        </div>
      );
    case "telecharger":
      return (
        <div className="px-6 py-6">
          <p className="text-sm text-slate-700">
            Pour alimenter la base de connaissances d&apos;un site, ouvrez
            le site concerné à gauche puis l&apos;onglet{" "}
            <em>Base de connaissances</em>. L&apos;upload multi-sites
            global arrive dans un prochain lot.
          </p>
        </div>
      );
    case "guide":
      return (
        <div className="space-y-3 px-6 py-6 text-sm leading-relaxed text-slate-700">
          <p>
            <strong className="font-semibold text-slate-900">
              AxiSolver en 3 étapes
            </strong>{" "}
            : (1) créez un site et vérifiez la propriété du domaine, (2)
            alimentez la base de connaissances (URL, PDF, sitemap), (3)
            installez le snippet sur votre site.
          </p>
          <p>
            Posez vos questions à AXI directement dans la zone de
            conversation ci-dessus — il connaît votre configuration et
            peut déclencher des actions pour vous.
          </p>
        </div>
      );
    default:
      return null;
  }
}
