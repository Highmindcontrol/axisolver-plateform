"use client";

/**
 * Composants des deux ailettes du triptyque AxiSolver.
 *
 *   ┌────────────┬────────────┬────────────┐
 *   │ PANNEAU    │   CHAT     │ PANNEAU    │
 *   │ ACTIONS    │  (centre)  │ FICHE      │
 *   │ (gauche)   │            │ (droite)   │
 *   └────────────┴────────────┴────────────┘
 *
 * - PanneauActions = zone de jeu contextuelle (changeante) :
 *     accueil visuel au repos → formulaires, choix, iframe site hôte,
 *     aperçu produit, référence AXI, morpion
 * - PanneauFiche = récap pur de la conversation, jamais pollué par
 *     des actions, lisible du début à la fin
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import type { ChampFiche, EtatPanneauTravail } from "@/lib/axi-solver/tools";

// ================================================================== //
// PANNEAU FICHE (DROITE) — pur récap conversation                    //
// ================================================================== //

const LIBELLES_CHAMPS: Record<ChampFiche, string> = {
  prenom: "Prénom",
  nom: "Nom",
  entreprise: "Entreprise",
  secteur: "Secteur",
  site_web: "Site web",
  demande: "Demande",
  contexte: "Contexte",
  urgence: "Urgence",
};

export function PanneauFiche({ etat }: { etat: EtatPanneauTravail }) {
  const ficheVide = Object.keys(etat.fiche).length === 0;
  // La notion d'urgence reste visible (le visiteur comprend sa propre urgence),
  // mais pas la chaleur commerciale (froid/tiede/chaud) qui est pour l'équipe.
  const champsOrdonnes: ChampFiche[] = [
    "prenom",
    "nom",
    "entreprise",
    "secteur",
    "site_web",
    "demande",
    "contexte",
    "urgence",
  ];
  const champsRemplis = champsOrdonnes.filter((c) => etat.fiche[c]);

  if (ficheVide && !etat.emailValide && !etat.telephoneValide && !etat.reference) {
    return <FicheEnAttente />;
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Fiche visiteur
        </h3>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-blue-700">
          en direct
        </span>
      </div>

      <dl className="space-y-2">
        {champsRemplis.map((champ) => (
          <ChampLigne
            key={champ}
            libelle={LIBELLES_CHAMPS[champ]}
            valeur={etat.fiche[champ] as string}
          />
        ))}
        {etat.emailValide && (
          <ChampLigne libelle="Email" valeur={etat.emailValide} valide />
        )}
        {etat.telephoneValide && (
          <ChampLigne libelle="Téléphone" valeur={etat.telephoneValide} valide />
        )}
      </dl>

      {etat.reference && (
        <div className="mt-auto">
          <ReferenceAxi reference={etat.reference.reference} />
        </div>
      )}
    </div>
  );
}

function FicheEnAttente() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-slate-400"
          aria-hidden
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
        </svg>
      </div>
      <div className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        Fiche visiteur
      </div>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">
        Vos informations apparaîtront ici au fil de la conversation.
      </p>
    </div>
  );
}

function ChampLigne({
  libelle,
  valeur,
  valide,
}: {
  libelle: string;
  valeur: string;
  valide?: boolean;
}) {
  return (
    <div className="animate-fadeIn flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs font-medium text-slate-500">{libelle}</dt>
      <dd className="flex items-center gap-1.5 text-right text-sm text-slate-900">
        {valide && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-emerald-500"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
        {valeur}
      </dd>
    </div>
  );
}

function ReferenceAxi({ reference }: { reference: string }) {
  const [copie, setCopie] = useState(false);

  function copier() {
    navigator.clipboard.writeText(reference).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    });
  }

  return (
    <section className="animate-fadeIn rounded-xl border border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white shadow-md">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">
        Votre référence
      </h3>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="font-mono text-xl font-bold tracking-wider">
          {reference}
        </div>
        <button
          onClick={copier}
          className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
        >
          {copie ? "Copié ✓" : "Copier"}
        </button>
      </div>
    </section>
  );
}

// ================================================================== //
// PANNEAU ACTIONS (GAUCHE) — zone contextuelle qui change            //
// ================================================================== //

type PropsActions = {
  etat: EtatPanneauTravail;
  onEmailValide: (email: string) => void;
  onTelephoneValide: (telephone: string) => void;
  onChoixClique: (valeur: string) => void;
  onChoixMultipleValide: (valeurs: string[]) => void;
  onEnvoiFicheConfirme: (email: string) => void;
  onMorpionMessage: (message: string) => void;
  onMorpionTermine: () => void;
  onClotureConfirmee: (optInRecontact: boolean) => void;
};

export function PanneauActions({
  etat,
  onEmailValide,
  onTelephoneValide,
  onChoixClique,
  onChoixMultipleValide,
  onEnvoiFicheConfirme,
  onMorpionMessage,
  onMorpionTermine,
  onClotureConfirmee,
}: PropsActions) {
  switch (etat.elementActif.kind) {
    case "demande_email":
      return (
        <ChampEmail
          raison={etat.elementActif.raison}
          onValide={onEmailValide}
        />
      );
    case "demande_telephone":
      return (
        <ChampTelephone
          raison={etat.elementActif.raison}
          onValide={onTelephoneValide}
        />
      );
    case "choix":
      return (
        <BoutonsChoix
          question={etat.elementActif.question}
          options={etat.elementActif.options}
          onClique={onChoixClique}
        />
      );
    case "choix_multiple":
      return (
        <CasesACocher
          question={etat.elementActif.question}
          options={etat.elementActif.options}
          onValide={onChoixMultipleValide}
        />
      );
    case "telechargement":
      return (
        <LienTelechargement
          libelle={etat.elementActif.libelle}
          url={etat.elementActif.url}
        />
      );
    case "page_web":
      return (
        <PageWebEmbarquee
          url={etat.elementActif.url}
          titre={etat.elementActif.titre}
        />
      );
    case "site_hote":
      return <SiteHoteApercu url={etat.elementActif.url} />;
    case "analyse_site":
      if (etat.elementActif.etat === "terminee") {
        return (
          <CompteRenduAudit
            url={etat.elementActif.url}
            volet={etat.elementActif.volet}
            findings={etat.elementActif.findings ?? []}
            technologies={etat.elementActif.technologies ?? []}
          />
        );
      }
      return (
        <AnalyseSiteEnCours
          url={etat.elementActif.url}
          volet={etat.elementActif.volet}
        />
      );
    case "envoi_fiche_email":
      return (
        <EnvoiFicheEmail
          emailDejaConnu={etat.elementActif.email}
          onConfirme={onEnvoiFicheConfirme}
        />
      );
    case "morpion":
      return (
        <JeuMorpion
          onMessageChat={onMorpionMessage}
          onPartiesTerminees={onMorpionTermine}
        />
      );
    case "cloture":
      return <ClotureConversation onConfirme={onClotureConfirmee} />;
    case "aucun":
    default:
      return <AccueilAxiSolver />;
  }
}

// --- Composants individuels ---------------------------------------- //

function AccueilAxiSolver() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 text-center">
      <Image
        src="/logo-axisolver.png"
        alt="AxiSolver"
        width={200}
        height={200}
        className="h-auto w-20 opacity-90 md:w-24"
      />
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">
        AxiSolver est à votre écoute
      </div>
      <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-500">
        Je vais afficher ici tout ce dont nous aurons besoin au fil de notre
        conversation — formulaires, aperçus, propositions.
      </p>
    </div>
  );
}

function ChampEmail({
  raison,
  onValide,
}: {
  raison?: string;
  onValide: (email: string) => void;
}) {
  const [val, setVal] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const v = val.trim();
    if (!regexEmail.test(v)) {
      setErreur("Format email invalide (ex : nom@domaine.fr).");
      return;
    }
    setErreur(null);
    onValide(v);
  }

  return (
    <div className="flex h-full flex-col justify-center p-5">
      <form
        onSubmit={soumettre}
        className="animate-fadeIn rounded-xl border border-blue-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-blue-600"
            aria-hidden
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-10 5L2 7" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-900">Votre email</h3>
        </div>
        {raison && <p className="mt-1 text-xs text-slate-600">{raison}</p>}
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="email"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="nom@entreprise.fr"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Valider
          </button>
        </div>
        {erreur && <p className="mt-2 text-xs text-red-600">{erreur}</p>}
      </form>
    </div>
  );
}

function ChampTelephone({
  raison,
  onValide,
}: {
  raison?: string;
  onValide: (tel: string) => void;
}) {
  const [val, setVal] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function format(input: string): string {
    const chiffres = input.replace(/\D/g, "");
    if (chiffres.startsWith("33")) {
      return (
        "+33 " +
        chiffres
          .slice(2)
          .replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
      );
    }
    return chiffres.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const chiffres = val.replace(/\D/g, "");
    if (chiffres.length < 9) {
      setErreur("Numéro trop court (au moins 9 chiffres).");
      return;
    }
    setErreur(null);
    onValide(format(val));
  }

  return (
    <div className="flex h-full flex-col justify-center p-5">
      <form
        onSubmit={soumettre}
        className="animate-fadeIn rounded-xl border border-blue-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-blue-600"
            aria-hidden
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-900">
            Votre téléphone
          </h3>
        </div>
        {raison && <p className="mt-1 text-xs text-slate-600">{raison}</p>}
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="tel"
            value={val}
            onChange={(e) => setVal(format(e.target.value))}
            placeholder="+33 6 12 34 56 78"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Valider
          </button>
        </div>
        {erreur && <p className="mt-2 text-xs text-red-600">{erreur}</p>}
      </form>
    </div>
  );
}

function BoutonsChoix({
  question,
  options,
  onClique,
}: {
  question: string;
  options: Array<{ libelle: string; valeur: string }>;
  onClique: (valeur: string) => void;
}) {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      <section className="animate-fadeIn rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-900">{question}</h3>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {options.map((opt) => (
            <button
              key={opt.valeur}
              onClick={() => onClique(opt.valeur)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-900 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
            >
              {opt.libelle}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function CasesACocher({
  question,
  options,
  onValide,
}: {
  question: string;
  options: Array<{ libelle: string; valeur: string }>;
  onValide: (valeurs: string[]) => void;
}) {
  const [selection, setSelection] = useState<Set<string>>(new Set());

  function toggle(valeur: string) {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(valeur)) next.delete(valeur);
      else next.add(valeur);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col justify-center p-5">
      <section className="animate-fadeIn rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-900">{question}</h3>
        <p className="mt-1 text-[11px] text-slate-500">
          Plusieurs choix possibles.
        </p>
        <div className="mt-4 space-y-2">
          {options.map((opt) => {
            const checked = selection.has(opt.valeur);
            return (
              <label
                key={opt.valeur}
                className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-all ${
                  checked
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:bg-blue-50/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.valeur)}
                  className="h-4 w-4 cursor-pointer accent-blue-600"
                />
                <span className="flex-1 font-medium">{opt.libelle}</span>
              </label>
            );
          })}
        </div>
        <button
          onClick={() => onValide(Array.from(selection))}
          disabled={selection.size === 0}
          className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Valider ({selection.size} sélectionné{selection.size > 1 ? "s" : ""})
        </button>
      </section>
    </div>
  );
}

function LienTelechargement({
  libelle,
  url,
}: {
  libelle: string;
  url: string;
}) {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      <section className="animate-fadeIn rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          À télécharger
        </h3>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          {libelle}
        </a>
      </section>
    </div>
  );
}

function PageWebEmbarquee({ url, titre }: { url: string; titre?: string }) {
  return (
    <section className="animate-fadeIn flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <span className="text-xs font-medium text-slate-700">
          {titre ?? "Page web"}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-blue-600 hover:underline"
        >
          Ouvrir ↗
        </a>
      </div>
      <iframe
        src={url}
        title={titre ?? "Page web"}
        className="min-h-[260px] w-full flex-1 bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </section>
  );
}

/** Normalise une URL de site : ajoute https:// si absent. */
function normaliserUrl(url: string): string {
  const nettoye = url.trim();
  if (/^https?:\/\//i.test(nettoye)) return nettoye;
  return `https://${nettoye}`;
}

function SiteHoteApercu({ url }: { url: string }) {
  const urlComplete = normaliserUrl(url);
  const screenshotUrl = `https://image.thum.io/get/width/900/${urlComplete}`;
  const hostname = (() => {
    try {
      return new URL(urlComplete).hostname.replace(/^www\./, "");
    } catch {
      return urlComplete;
    }
  })();

  return (
    <section className="animate-fadeIn flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
          <span className="text-xs font-medium text-slate-700">
            Je regarde {hostname}
          </span>
        </div>
        <a
          href={urlComplete}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-blue-600 hover:underline"
        >
          Ouvrir ↗
        </a>
      </div>
      <div className="relative flex-1 overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshotUrl}
          alt={`Aperçu de ${hostname}`}
          className="h-full w-full object-cover object-top"
          onError={(e) => {
            // Si thum.io échoue, fallback simple
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/70 to-transparent p-4">
          <p className="text-xs leading-relaxed text-slate-700">
            Je lance une analyse rapide — SEO, sécurité, performance.
          </p>
        </div>
      </div>
    </section>
  );
}

// --- Compte-rendu audit (persistant) ---------------------------- //

type Finding = {
  categorie: "seo" | "securite" | "performance" | "metier";
  severite: "info" | "amelioration" | "critique";
  titre: string;
  detail?: string;
};

const COULEUR_SEVERITE: Record<Finding["severite"], string> = {
  critique: "border-red-200 bg-red-50 text-red-900",
  amelioration: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-slate-200 bg-slate-50 text-slate-700",
};

const ICONE_SEVERITE: Record<Finding["severite"], string> = {
  critique: "⚠",
  amelioration: "⚡",
  info: "ⓘ",
};

const LIBELLE_CATEGORIE: Record<Finding["categorie"], string> = {
  seo: "SEO",
  securite: "Sécurité",
  performance: "Performance",
  metier: "Métier",
};

function CompteRenduAudit({
  url,
  volet,
  findings,
  technologies,
}: {
  url: string;
  volet?: "securite" | "seo";
  findings: Finding[];
  technologies: string[];
}) {
  const hostname = (() => {
    try {
      return new URL(normaliserUrl(url)).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  const critiques = findings.filter((f) => f.severite === "critique");
  const ameliorations = findings.filter((f) => f.severite === "amelioration");
  const infos = findings.filter((f) => f.severite === "info");

  const titreVolet =
    volet === "securite"
      ? "Audit sécurité terminé"
      : volet === "seo"
        ? "Audit SEO terminé"
        : "Audit terminé";

  return (
    <section className="animate-fadeIn flex h-full flex-col overflow-hidden bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-emerald-600"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
            {titreVolet} — {hostname}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Résumé compact */}
        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-red-200 bg-red-50 px-2 py-2">
            <div className="text-lg font-bold text-red-700">
              {critiques.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-red-700">
              Critique
            </div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
            <div className="text-lg font-bold text-amber-700">
              {ameliorations.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-amber-700">
              À améliorer
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2">
            <div className="text-lg font-bold text-slate-700">
              {infos.length}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Info
            </div>
          </div>
        </div>

        {technologies.length > 0 && (
          <div className="mb-4">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Technologies détectées
            </div>
            <div className="flex flex-wrap gap-1.5">
              {technologies.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Liste détaillée des findings */}
        <div className="space-y-2">
          {[...critiques, ...ameliorations, ...infos].map((f, i) => (
            <div
              key={i}
              className={`rounded-md border p-2.5 text-xs ${COULEUR_SEVERITE[f.severite]}`}
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 font-bold">
                  {ICONE_SEVERITE[f.severite]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold leading-tight">
                      {f.titre}
                    </span>
                    <span className="flex-shrink-0 text-[10px] font-medium uppercase tracking-wider opacity-70">
                      {LIBELLE_CATEGORIE[f.categorie]}
                    </span>
                  </div>
                  {f.detail && (
                    <p className="mt-1 text-[11px] leading-relaxed opacity-80">
                      {f.detail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {findings.length === 0 && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              Aucun point d&apos;attention immédiat détecté. Un audit complet
              à l&apos;installation ira plus loin.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --- Analyse en cours (animée) ---------------------------------- //

function AnalyseSiteEnCours({
  url,
  volet,
}: {
  url: string;
  volet?: "securite" | "seo";
}) {
  const urlComplete = normaliserUrl(url);
  const hostname = (() => {
    try {
      return new URL(urlComplete).hostname.replace(/^www\./, "");
    } catch {
      return urlComplete;
    }
  })();

  const etapesSecurite = [
    { label: "Chargement de la page" },
    { label: "Vérification du certificat SSL" },
    { label: "Inspection des entêtes HTTP" },
    { label: "Détection des technologies & CMS" },
    { label: "Analyse des failles connues (CVE)" },
    { label: "Recherche de fichiers sensibles exposés" },
    { label: "Compilation du diagnostic sécurité" },
  ];

  const etapesSeo = [
    { label: "Chargement de la page" },
    { label: "Analyse balises title et meta description" },
    { label: "Vérification de la structure Hn" },
    { label: "Audit Open Graph et balises sociales" },
    { label: "Inspection des images (alt, poids)" },
    { label: "Analyse du poids et du temps de chargement" },
    { label: "Compilation du diagnostic SEO" },
  ];

  const etapes = volet === "seo" ? etapesSeo : etapesSecurite;
  const titreVolet =
    volet === "seo"
      ? `Audit SEO de ${hostname}`
      : volet === "securite"
        ? `Audit sécurité de ${hostname}`
        : `Analyse de ${hostname}`;

  return (
    <section className="animate-fadeIn flex h-full flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/40">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
        </span>
        <span className="text-xs font-medium text-slate-700">
          {titreVolet} en cours
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 p-5">
        {etapes.map((etape, i) => (
          <div
            key={i}
            className="animate-fadeIn flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
            style={{
              animationDelay: `${i * 1000}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="relative h-3 w-3 flex-shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
            </div>
            <span className="text-xs font-medium text-slate-700">
              {etape.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EnvoiFicheEmail({
  emailDejaConnu,
  onConfirme,
}: {
  emailDejaConnu?: string;
  onConfirme: (email: string) => void;
}) {
  const [email, setEmail] = useState(emailDejaConnu ?? "");

  return (
    <div className="flex h-full flex-col justify-center p-5">
      <section className="animate-fadeIn rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Recevoir cette fiche par email
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Votre adresse sera enregistrée pour l&apos;envoi dès l&apos;activation
          du canal mail.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nom@entreprise.fr"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button
            onClick={() => email && onConfirme(email)}
            disabled={!email}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </section>
    </div>
  );
}

// --- Morpion (protocole 3 manches max) ------------------------------ //

type CaseM = "X" | "O" | null;

// --- Clôture de conversation (bouton final + opt-in) ------------- //

function ClotureConversation({
  onConfirme,
}: {
  onConfirme: (optInRecontact: boolean) => void;
}) {
  const [optIn, setOptIn] = useState(false);

  return (
    <div className="flex h-full flex-col items-center justify-center p-5">
      <section className="animate-fadeIn w-full rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-md">
        <div className="mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-600"
            aria-hidden
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </svg>
          <h3 className="text-base font-semibold text-slate-900">
            Clôturer notre échange
          </h3>
        </div>

        <p className="text-xs leading-relaxed text-slate-600">
          Avant de nous quitter, voici ce qui va suivre : vous allez recevoir
          par email le compte-rendu complet de notre conversation — audit
          sécurité, audit SEO, pistes d&apos;action. Une base solide pour
          avancer.
        </p>

        <label
          className={`mt-5 flex cursor-pointer items-start gap-3 rounded-md border p-3 text-xs transition-all ${
            optIn
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-white hover:border-blue-300"
          }`}
        >
          <input
            type="checkbox"
            checked={optIn}
            onChange={(e) => setOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-blue-600"
          />
          <span className="flex-1 leading-relaxed text-slate-700">
            J&apos;accepte d&apos;être recontacté par la société Ataraxis
            et de recevoir des informations utiles de leur part.
          </span>
        </label>

        <button
          onClick={() => onConfirme(optIn)}
          disabled={!optIn}
          className={`mt-5 w-full rounded-md px-4 py-3 text-sm font-semibold transition-all ${
            optIn
              ? "animate-pulseGlow bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-slate-100 text-slate-400"
          }`}
        >
          Clôturer et recevoir mon compte-rendu
        </button>

        {!optIn && (
          <p className="mt-3 text-center text-[11px] italic text-slate-400">
            Cochez la case ci-dessus pour activer le bouton.
          </p>
        )}
      </section>
    </div>
  );
}

function JeuMorpion({
  onMessageChat,
  onPartiesTerminees,
}: {
  onMessageChat: (message: string) => void;
  onPartiesTerminees: () => void;
}) {
  const [cases, setCases] = useState<CaseM[]>(Array(9).fill(null));
  const [tourJoueur, setTourJoueur] = useState(true);
  const [partiesJouees, setPartiesJouees] = useState(0);
  const [victoiresVisiteur, setVictoiresVisiteur] = useState(0);
  const [victoiresAxi, setVictoiresAxi] = useState(0);
  const [partieEnPause, setPartieEnPause] = useState(false);

  const gagnant = detecterGagnant(cases);
  const nul = !gagnant && cases.every((c) => c !== null);
  const partieFinie = !!gagnant || nul;

  // Détection de fin de partie — géré en useEffect pour éviter setState
  // pendant le rendu (ce qui causait un gel du composant)
  useEffect(() => {
    if (!partieFinie || partieEnPause) return;

    setPartieEnPause(true);
    const nouveauPartiesJouees = partiesJouees + 1;
    const nouveauVictoiresVisiteur =
      victoiresVisiteur + (gagnant === "X" ? 1 : 0);
    const nouveauVictoiresAxi = victoiresAxi + (gagnant === "O" ? 1 : 0);

    setPartiesJouees(nouveauPartiesJouees);
    setVictoiresVisiteur(nouveauVictoiresVisiteur);
    setVictoiresAxi(nouveauVictoiresAxi);

    let messageResultat = "";
    if (gagnant === "X") {
      messageResultat = `[Morpion partie ${nouveauPartiesJouees} : le visiteur gagne. Score ${nouveauVictoiresVisiteur}-${nouveauVictoiresAxi}.]`;
    } else if (gagnant === "O") {
      messageResultat = `[Morpion partie ${nouveauPartiesJouees} : AxiSolver gagne. Score ${nouveauVictoiresVisiteur}-${nouveauVictoiresAxi}.]`;
    } else {
      messageResultat = `[Morpion partie ${nouveauPartiesJouees} : match nul. Score ${nouveauVictoiresVisiteur}-${nouveauVictoiresAxi}.]`;
    }

    const serieTerminee =
      nouveauPartiesJouees >= 3 ||
      nouveauVictoiresVisiteur >= 2 ||
      nouveauVictoiresAxi >= 2;

    if (serieTerminee) {
      const champion =
        nouveauVictoiresVisiteur > nouveauVictoiresAxi
          ? "visiteur"
          : nouveauVictoiresAxi > nouveauVictoiresVisiteur
            ? "AxiSolver"
            : "égalité";
      messageResultat += ` [Morpion terminé. Champion : ${champion}.]`;
      const timeoutId = setTimeout(() => {
        onMessageChat(messageResultat);
        onPartiesTerminees();
      }, 1200);
      return () => clearTimeout(timeoutId);
    } else {
      const timeoutId = setTimeout(() => onMessageChat(messageResultat), 800);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partieFinie, gagnant]);

  function jouerJoueur(index: number) {
    if (cases[index] || gagnant || !tourJoueur || partieEnPause) return;
    const nouv = [...cases];
    nouv[index] = "X";
    setCases(nouv);
    setTourJoueur(false);

    setTimeout(() => {
      if (detecterGagnant(nouv)) {
        setTourJoueur(true);
        return;
      }
      const indexAxi = coupAxiSolver(nouv);
      if (indexAxi !== -1) {
        const apres = [...nouv];
        apres[indexAxi] = "O";
        setCases(apres);
      }
      setTourJoueur(true);
    }, 500);
  }

  function rejouer() {
    setCases(Array(9).fill(null));
    setTourJoueur(true);
    setPartieEnPause(false);
  }

  const partiesRestantes =
    partiesJouees < 3 && victoiresVisiteur < 2 && victoiresAxi < 2;

  return (
    <div className="flex h-full flex-col items-center justify-center p-5">
      <section className="animate-fadeIn w-full rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            🎯 Partie {partiesJouees + (partieEnPause ? 0 : 1)} / 3
          </h3>
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
            <span>Vous {victoiresVisiteur}</span>
            <span className="text-slate-300">·</span>
            <span>Moi {victoiresAxi}</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {cases.map((c, i) => (
            <button
              key={i}
              onClick={() => jouerJoueur(i)}
              disabled={!!c || partieFinie || !tourJoueur}
              className="flex aspect-square items-center justify-center rounded-md border border-slate-200 bg-white text-2xl font-bold transition-all hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed"
              aria-label={`Case ${i + 1}`}
            >
              <span
                className={
                  c === "X"
                    ? "text-blue-600"
                    : c === "O"
                      ? "text-slate-500"
                      : ""
                }
              >
                {c}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-3 text-center text-xs">
          {!partieFinie && (
            <span className="text-slate-500">
              {tourJoueur ? "À vous (X)" : "À moi…"}
            </span>
          )}
          {partieFinie && (
            <div className="flex flex-col items-center gap-2">
              <span className="font-medium text-slate-700">
                {gagnant === "X" && "🏆 Vous me battez. Bien joué."}
                {gagnant === "O" && "Un petit point pour moi."}
                {nul && "Match nul. Honneurs partagés."}
              </span>
              {partiesRestantes && (
                <button
                  onClick={rejouer}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {victoiresVisiteur === 1 && victoiresAxi === 1
                    ? "La belle !"
                    : "Revanche"}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function detecterGagnant(cases: CaseM[]): CaseM {
  const lignes = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lignes) {
    if (cases[a] && cases[a] === cases[b] && cases[a] === cases[c]) {
      return cases[a];
    }
  }
  return null;
}

function coupAxiSolver(cases: CaseM[]): number {
  const vides = cases
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i !== -1);
  if (vides.length === 0) return -1;

  if (Math.random() < 0.4) {
    return vides[Math.floor(Math.random() * vides.length)];
  }

  for (const i of vides) {
    const essai = [...cases];
    essai[i] = "O";
    if (detecterGagnant(essai) === "O") return i;
  }
  for (const i of vides) {
    const essai = [...cases];
    essai[i] = "X";
    if (detecterGagnant(essai) === "X") return i;
  }
  if (vides.includes(4)) return 4;
  const coins = [0, 2, 6, 8].filter((i) => vides.includes(i));
  if (coins.length > 0) return coins[Math.floor(Math.random() * coins.length)];
  return vides[Math.floor(Math.random() * vides.length)];
}
