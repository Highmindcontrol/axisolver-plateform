"use client";

/**
 * Panneau de Travail — colonne de droite du widget AxiSolver.
 *
 * Affiche en temps réel ce qu'AxiSolver est en train de faire :
 *   - Fiche visiteur qui se remplit au fur et à mesure
 *   - Champs email / téléphone à saisir
 *   - Boutons de choix cliquables
 *   - Liens de téléchargement
 *   - Pages web embarquées
 *   - Référence AXI-XXXX de clôture
 *   - Jeu de morpion (easter egg final)
 *
 * Les événements sont déclenchés par les tool_use de Claude via le
 * stream SSE de /api/chat.
 */

import { useState } from "react";
import type {
  ChaleurTicket,
  ChampFiche,
  EtatPanneauTravail,
} from "@/lib/axi-solver/tools";

type Props = {
  etat: EtatPanneauTravail;
  onEmailValide: (email: string) => void;
  onTelephoneValide: (telephone: string) => void;
  onChoixClique: (valeur: string) => void;
  onEnvoiFicheConfirme: (email: string) => void;
};

export function PanneauTravail({
  etat,
  onEmailValide,
  onTelephoneValide,
  onChoixClique,
  onEnvoiFicheConfirme,
}: Props) {
  const ficheVide = Object.keys(etat.fiche).length === 0;
  const aucunElementActif = etat.elementActif.kind === "aucun";

  if (ficheVide && aucunElementActif && !etat.reference) {
    return <PanneauEnAttente />;
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-slate-50 p-5">
      {/* Fiche visiteur (toujours affichée dès qu'il y a au moins un champ) */}
      {!ficheVide && (
        <FicheVisiteur
          fiche={etat.fiche}
          emailValide={etat.emailValide}
          telephoneValide={etat.telephoneValide}
        />
      )}

      {/* Élément actif courant (demande email, choix, téléchargement, etc.) */}
      {etat.elementActif.kind === "demande_email" && (
        <ChampEmail
          raison={etat.elementActif.raison}
          onValide={onEmailValide}
        />
      )}

      {etat.elementActif.kind === "demande_telephone" && (
        <ChampTelephone
          raison={etat.elementActif.raison}
          onValide={onTelephoneValide}
        />
      )}

      {etat.elementActif.kind === "choix" && (
        <BoutonsChoix
          question={etat.elementActif.question}
          options={etat.elementActif.options}
          onClique={onChoixClique}
        />
      )}

      {etat.elementActif.kind === "telechargement" && (
        <LienTelechargement
          libelle={etat.elementActif.libelle}
          url={etat.elementActif.url}
        />
      )}

      {etat.elementActif.kind === "page_web" && (
        <PageWebEmbarquee
          url={etat.elementActif.url}
          titre={etat.elementActif.titre}
        />
      )}

      {etat.elementActif.kind === "envoi_fiche_email" && (
        <EnvoiFicheEmail
          emailDejaConnu={etat.elementActif.email}
          onConfirme={onEnvoiFicheConfirme}
        />
      )}

      {etat.elementActif.kind === "morpion" && <JeuMorpion />}

      {/* Référence AXI de clôture (épinglée en bas) */}
      {etat.reference && (
        <ReferenceAxi
          reference={etat.reference.reference}
          chaleur={etat.reference.chaleur}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------ //
// Panneau en attente                                                 //
// ------------------------------------------------------------------ //

function PanneauEnAttente() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7 text-blue-600"
          aria-hidden
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      </div>
      <div className="mt-4 text-sm font-medium text-slate-700">
        Panneau de travail
      </div>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-500">
        AxiSolver notera ici vos informations au fur et à mesure de la
        conversation. Vous pourrez les voir, les corriger, et interagir
        directement.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ //
// Fiche Visiteur                                                     //
// ------------------------------------------------------------------ //

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

function FicheVisiteur({
  fiche,
  emailValide,
  telephoneValide,
}: {
  fiche: Partial<Record<ChampFiche, string>>;
  emailValide?: string;
  telephoneValide?: string;
}) {
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

  const champsRemplis = champsOrdonnes.filter((c) => fiche[c]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
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
            valeur={fiche[champ] as string}
          />
        ))}
        {emailValide && (
          <ChampLigne libelle="Email" valeur={emailValide} valide />
        )}
        {telephoneValide && (
          <ChampLigne libelle="Téléphone" valeur={telephoneValide} valide />
        )}
      </dl>
    </section>
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
    <div className="animate-fadeIn flex items-start justify-between gap-3 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
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

// ------------------------------------------------------------------ //
// Champ Email                                                        //
// ------------------------------------------------------------------ //

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
      setErreur("Format email invalide (ex: nom@domaine.fr).");
      return;
    }
    setErreur(null);
    onValide(v);
  }

  return (
    <form
      onSubmit={soumettre}
      className="animate-fadeIn rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm"
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
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="nom@entreprise.fr"
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
  );
}

// ------------------------------------------------------------------ //
// Champ Téléphone                                                    //
// ------------------------------------------------------------------ //

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
        chiffres.slice(2).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
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
    <form
      onSubmit={soumettre}
      className="animate-fadeIn rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm"
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
        <h3 className="text-sm font-semibold text-slate-900">Votre téléphone</h3>
      </div>
      {raison && <p className="mt-1 text-xs text-slate-600">{raison}</p>}
      <div className="mt-3 flex gap-2">
        <input
          type="tel"
          value={val}
          onChange={(e) => setVal(format(e.target.value))}
          placeholder="+33 6 12 34 56 78"
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
  );
}

// ------------------------------------------------------------------ //
// Boutons Choix                                                      //
// ------------------------------------------------------------------ //

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
    <section className="animate-fadeIn rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
      <h3 className="text-sm font-medium text-slate-900">{question}</h3>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {options.map((opt) => (
          <button
            key={opt.valeur}
            onClick={() => onClique(opt.valeur)}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-left text-sm font-medium text-slate-900 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            {opt.libelle}
          </button>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ //
// Lien Téléchargement                                                //
// ------------------------------------------------------------------ //

function LienTelechargement({
  libelle,
  url,
}: {
  libelle: string;
  url: string;
}) {
  return (
    <section className="animate-fadeIn rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        À télécharger
      </h3>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        download
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
  );
}

// ------------------------------------------------------------------ //
// Page Web Embarquée                                                 //
// ------------------------------------------------------------------ //

function PageWebEmbarquee({ url, titre }: { url: string; titre?: string }) {
  return (
    <section className="animate-fadeIn flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 text-slate-400"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="text-xs font-medium text-slate-700">
            {titre ?? "Page web"}
          </span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-blue-600 hover:underline"
        >
          Ouvrir dans un onglet ↗
        </a>
      </div>
      <iframe
        src={url}
        title={titre ?? "Page web"}
        className="min-h-[240px] w-full flex-1 bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups"
      />
    </section>
  );
}

// ------------------------------------------------------------------ //
// Envoi Fiche Email                                                  //
// ------------------------------------------------------------------ //

function EnvoiFicheEmail({
  emailDejaConnu,
  onConfirme,
}: {
  emailDejaConnu?: string;
  onConfirme: (email: string) => void;
}) {
  const [email, setEmail] = useState(emailDejaConnu ?? "");

  return (
    <section className="animate-fadeIn rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">
        Recevoir cette fiche par email ?
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Je vous l&apos;envoie dans les deux minutes qui suivent.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nom@entreprise.fr"
          className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        <button
          onClick={() => email && onConfirme(email)}
          disabled={!email}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ //
// Référence AXI-XXXX                                                 //
// ------------------------------------------------------------------ //

const COULEUR_CHALEUR: Record<ChaleurTicket, string> = {
  froid: "bg-slate-100 text-slate-700 border-slate-200",
  tiede: "bg-amber-50 text-amber-800 border-amber-200",
  chaud: "bg-orange-50 text-orange-800 border-orange-200",
  urgent: "bg-red-50 text-red-800 border-red-200",
};

function ReferenceAxi({
  reference,
  chaleur,
}: {
  reference: string;
  chaleur: ChaleurTicket;
}) {
  const [copie, setCopie] = useState(false);

  function copier() {
    navigator.clipboard.writeText(reference).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    });
  }

  return (
    <section className="animate-fadeIn rounded-xl border border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-100">
          Votre référence
        </h3>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${COULEUR_CHALEUR[chaleur].replace("bg-", "bg-white/15 ").replace("border-", "border-white/30 text-white ")}`}
        >
          {chaleur}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="font-mono text-2xl font-bold tracking-wider">
          {reference}
        </div>
        <button
          onClick={copier}
          className="rounded-md bg-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
        >
          {copie ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-blue-100">
        Conservez cette référence. Notre équipe vous recontactera avec elle.
      </p>
    </section>
  );
}

// ------------------------------------------------------------------ //
// Jeu Morpion                                                        //
// ------------------------------------------------------------------ //

type CaseM = "X" | "O" | null;

function JeuMorpion() {
  const [cases, setCases] = useState<CaseM[]>(Array(9).fill(null));
  const [tourJoueur, setTourJoueur] = useState(true);
  const gagnant = detecterGagnant(cases);
  const nul = !gagnant && cases.every((c) => c !== null);

  function jouerJoueur(index: number) {
    if (cases[index] || gagnant || !tourJoueur) return;
    const nouv = [...cases];
    nouv[index] = "X";
    setCases(nouv);
    setTourJoueur(false);

    setTimeout(() => {
      const indexAxi = coupAxiSolver(nouv);
      if (indexAxi !== -1 && !detecterGagnant(nouv)) {
        const apres = [...nouv];
        apres[indexAxi] = "O";
        setCases(apres);
      }
      setTourJoueur(true);
    }, 500);
  }

  function reset() {
    setCases(Array(9).fill(null));
    setTourJoueur(true);
  }

  return (
    <section className="animate-fadeIn rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-slate-50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          🎯 Petite partie ?
        </h3>
        <button
          onClick={reset}
          className="text-[11px] text-blue-600 hover:underline"
        >
          Nouvelle partie
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {cases.map((c, i) => (
          <button
            key={i}
            onClick={() => jouerJoueur(i)}
            disabled={!!c || !!gagnant || !tourJoueur}
            className="flex aspect-square items-center justify-center rounded-md border border-slate-200 bg-white text-2xl font-bold transition-all hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed"
            aria-label={`Case ${i + 1}`}
          >
            <span
              className={c === "X" ? "text-blue-600" : c === "O" ? "text-slate-500" : ""}
            >
              {c}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 text-center text-xs">
        {gagnant === "X" && (
          <span className="font-medium text-blue-600">
            🏆 Vous me battez. Bien joué.
          </span>
        )}
        {gagnant === "O" && (
          <span className="font-medium text-slate-700">
            Un petit point pour moi ! Rematch ?
          </span>
        )}
        {nul && (
          <span className="font-medium text-slate-500">
            Match nul. Honneurs partagés.
          </span>
        )}
        {!gagnant && !nul && (
          <span className="text-slate-500">
            {tourJoueur ? "À vous (X)" : "À moi…"}
          </span>
        )}
      </div>
    </section>
  );
}

/** Détecte un gagnant parmi les 8 combinaisons possibles. */
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

/** IA d'AxiSolver au morpion. Imparfaite : perd ~25%, nul ~50%, gagne ~25%.
 *  Stratégie : 1. gagne si peut, 2. bloque joueur, 3. prend centre, 4. prend coin, 5. aléatoire. */
function coupAxiSolver(cases: CaseM[]): number {
  const vides = cases
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i !== -1);
  if (vides.length === 0) return -1;

  // 60 % du temps joue optimalement, 40 % du temps aléatoirement
  if (Math.random() < 0.4) {
    return vides[Math.floor(Math.random() * vides.length)];
  }

  // 1. Peut-il gagner ?
  for (const i of vides) {
    const essai = [...cases];
    essai[i] = "O";
    if (detecterGagnant(essai) === "O") return i;
  }
  // 2. Doit-il bloquer ?
  for (const i of vides) {
    const essai = [...cases];
    essai[i] = "X";
    if (detecterGagnant(essai) === "X") return i;
  }
  // 3. Centre
  if (vides.includes(4)) return 4;
  // 4. Coins
  const coins = [0, 2, 6, 8].filter((i) => vides.includes(i));
  if (coins.length > 0) return coins[Math.floor(Math.random() * coins.length)];
  // 5. Aléatoire
  return vides[Math.floor(Math.random() * vides.length)];
}
