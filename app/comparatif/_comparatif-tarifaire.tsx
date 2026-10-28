"use client";

import { useState } from "react";
import { MessageCircle, Search, ShieldCheck, Target } from "lucide-react";

/**
 * Comparatif tarifaire multi-onglets pour la page /comparatif.
 *
 * Un bouton par mission (Accueil / Référencement / Publicité /
 * Sécurité). Clic sur un onglet affiche son tableau — chaque tableau
 * liste les solutions marché avec leurs prix, et une ligne finale
 * "AxiSolver inclus" (99 € HT/mois).
 *
 * Les sections Interface et Base de connaissances déjà présentes sur
 * cette page ont leur propre tableau dédié — ce composant couvre
 * uniquement les 4 missions principales.
 */

type Tarif = { label: string; detail: string; prix: string };

type Section = {
  slug: "accueil" | "seo" | "ads" | "securite";
  categorie: string;
  Icon: typeof MessageCircle;
  tarifsHeader: string;
  tarifsSubtitle: string;
  tarifs: Tarif[];
  resumeAxisolver: string;
};

const SECTIONS: Section[] = [
  {
    slug: "accueil",
    categorie: "Accueil",
    Icon: MessageCircle,
    tarifsHeader: "Combien coûte un vrai accueil 24/7",
    tarifsSubtitle:
      "AxiSolver est présent jour, nuit, dimanche, en toutes langues, sans arrêt maladie.",
    tarifs: [
      {
        label: "Standardiste / accueil téléphonique à temps plein",
        detail:
          "Poste à mi-carrière en France, salaire brut + charges employeur, 8 h / jour, 5 j / 7",
        prix: "2 800 à 3 800 €/mois",
      },
      {
        label: "Chargé de clientèle digital interne",
        detail:
          "Répond au chat, aux emails, qualifie les demandes. Poste junior-confirmé.",
        prix: "3 200 à 4 500 €/mois",
      },
      {
        label: "Service client externalisé (agence)",
        detail:
          "Facturation à la conversation ou au forfait mensuel, horaires limités",
        prix: "1 500 à 5 000 €/mois",
      },
      {
        label: "Permanence téléphonique partagée",
        detail: "Services type Pretik, Preachat, avec forfait appels/mois",
        prix: "300 à 1 500 €/mois",
      },
      {
        label: "Chatbot classique (Intercom, Zendesk, Hubspot)",
        detail:
          "Abonnement SaaS + nécessite une configuration humaine et un modérateur",
        prix: "50 à 500 €/mois + main-d'œuvre",
      },
    ],
    resumeAxisolver:
      "Accueil 24/7 · voix et écrit · toutes langues européennes · qualification + routage CRM",
  },
  {
    slug: "seo",
    categorie: "Référencement",
    Icon: Search,
    tarifsHeader: "Combien coûte un vrai SEO suivi",
    tarifsSubtitle:
      "AxiSolver automatise la veille et vous présente les priorités chaque mois.",
    tarifs: [
      {
        label: "Agence SEO (full service)",
        detail:
          "Mission mensuelle avec audits, contenu, netlinking, suivi positions",
        prix: "1 500 à 5 000 €/mois",
      },
      {
        label: "Consultant SEO freelance senior",
        detail: "Mission continue 2-3 jours/mois, marché français",
        prix: "800 à 2 500 €/mois",
      },
      {
        label: "Audit SEO ponctuel",
        detail: "Audit technique + stratégique one-shot par un consultant",
        prix: "1 500 à 5 000 €",
      },
      {
        label: "Logiciels dédiés (Semrush, Ahrefs, Moz Pro)",
        detail:
          "Abonnement SaaS pour recherche de mots-clés, backlinks, suivi positions",
        prix: "100 à 400 €/mois",
      },
      {
        label: "Salarié SEO Manager interne",
        detail:
          "Poste junior à mi-carrière, salaire brut + charges employeur",
        prix: "3 000 à 5 000 €/mois",
      },
      {
        label: "Rédacteur SEO freelance",
        detail: "Contenu optimisé publié mensuellement sur votre blog",
        prix: "500 à 2 000 €/mois",
      },
    ],
    resumeAxisolver:
      "Audit SEO initial · re-check hebdomadaire · détection pages de fuite · rapport mensuel narratif",
  },
  {
    slug: "ads",
    categorie: "Publicité",
    Icon: Target,
    tarifsHeader: "Combien coûte une gestion Ads professionnelle",
    tarifsSubtitle:
      "AxiSolver inclut la préparation complète de vos campagnes, à valider d'un clic.",
    tarifs: [
      {
        label: "Agence SEA (Google Ads certifiée)",
        detail: "Fee gestion mensuel + commission 10-20 % du budget médias",
        prix: "1 500 à 5 000 €/mois",
      },
      {
        label: "Traffic manager freelance senior",
        detail: "Mission continue 2-3 jours/semaine, marché français",
        prix: "1 500 à 3 000 €/mois",
      },
      {
        label: "Traffic manager freelance junior",
        detail: "Mission continue 1-2 jours/semaine, marché français",
        prix: "800 à 1 500 €/mois",
      },
      {
        label: "Logiciels dédiés de gestion (AdEspresso, Smartly, Marin)",
        detail: "Abonnement SaaS sans la main humaine qui pilote",
        prix: "49 à 1 500 €/mois",
      },
      {
        label: "Salarié traffic manager interne",
        detail:
          "Poste junior à mi-carrière, salaire brut + charges employeur",
        prix: "3 500 à 5 500 €/mois",
      },
    ],
    resumeAxisolver:
      "Audience · mots-clés · créatives · budget · split testing permanent · validation d'un clic",
  },
  {
    slug: "securite",
    categorie: "Sécurité",
    Icon: ShieldCheck,
    tarifsHeader: "Combien coûte une sécurité de site professionnelle",
    tarifsSubtitle:
      "AxiSolver ajoute sa couche de veille pour une fraction de ces budgets.",
    tarifs: [
      {
        label: "Sucuri Website Security Platform",
        detail:
          "Scan + firewall + nettoyage malware, offres Basic à Business",
        prix: "20 à 50 €/mois",
      },
      {
        label: "Wordfence Premium (WordPress)",
        detail:
          "Firewall WAF + scan + alerte temps réel + support premium",
        prix: "10 à 25 €/mois",
      },
      {
        label: "Pentest ponctuel (annuel)",
        detail: "Audit complet par un cabinet spécialisé, périmètre PME",
        prix: "3 000 à 15 000 €",
      },
      {
        label: "Consultant sécurité externe",
        detail: "Mission ponctuelle, tarif journalier marché français",
        prix: "500 à 1 200 €/jour",
      },
      {
        label: "Audit RGPD complet",
        detail: "Vérification conformité données personnelles + registre",
        prix: "2 500 à 8 000 €",
      },
    ],
    resumeAxisolver:
      "Audit sécurité initial · surveillance 24/7 · rapport mensuel · blocage temps réel",
  },
];

export function ComparatifTarifaire() {
  const [actif, setActif] = useState<Section["slug"]>("accueil");
  const section = SECTIONS.find((s) => s.slug === actif) ?? SECTIONS[0];

  return (
    <section className="border-b border-zinc-900 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Comparatif tarifaire
          </p>
          <h2 className="mt-5 text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-6xl">
            Un salarié par mission.{" "}
            <span className="text-amber-400">Ou AxiSolver à 99 € HT/mois.</span>
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Pour chacune de ses 4 missions principales, voici ce que coûte
            la solution humaine ou logicielle équivalente sur le marché
            français. Cliquez sur l&apos;onglet qui vous intéresse.
          </p>
        </div>

        {/* Onglets */}
        <div className="mt-14 flex flex-wrap justify-center gap-3">
          {SECTIONS.map((s) => {
            const estActif = s.slug === actif;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => setActif(s.slug)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-widest transition-all md:px-6 md:text-base ${
                  estActif
                    ? "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/30"
                    : "border border-zinc-800 bg-zinc-900/40 text-zinc-300 hover:border-amber-400/40 hover:text-amber-300"
                }`}
                aria-pressed={estActif}
              >
                <s.Icon
                  className="h-4 w-4 md:h-5 md:w-5"
                  strokeWidth={2}
                />
                <span>{s.categorie}</span>
              </button>
            );
          })}
        </div>

        {/* Tableau actif */}
        <div
          key={section.slug}
          className="mt-10 animate-[fadeIn_300ms_ease-out] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
        >
          <div className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-5 md:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              {section.tarifsHeader}
            </p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
              {section.tarifsSubtitle}
            </h3>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-8">
                  Solution
                </th>
                <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-6">
                  Prix marché
                </th>
              </tr>
            </thead>
            <tbody>
              {section.tarifs.map((t, i) => (
                <tr
                  key={t.label}
                  className={
                    i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"
                  }
                >
                  <td className="px-6 py-5 text-zinc-200 md:px-8">
                    <p className="font-medium">{t.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">{t.detail}</p>
                  </td>
                  <td className="px-4 py-5 text-right font-mono font-semibold text-white md:px-6">
                    {t.prix}
                  </td>
                </tr>
              ))}
              <tr className="bg-amber-400/10">
                <td className="px-6 py-5 md:px-8">
                  <p className="font-semibold text-amber-300">
                    AxiSolver (toutes formules)
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {section.resumeAxisolver}
                  </p>
                </td>
                <td className="px-4 py-5 text-right font-mono text-lg font-bold text-amber-300 md:px-6">
                  à partir de 49 €/mois
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
