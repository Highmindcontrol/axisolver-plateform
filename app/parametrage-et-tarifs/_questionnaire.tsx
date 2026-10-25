"use client";

import { useMemo, useState } from "react";
import { BoutonLancerAxiSolver } from "@/components/chat/bouton-lancer";
import { SECTEURS, type SlugSecteur } from "@/lib/axi-solver/secteurs";
import {
  FORMULES,
  LIBELLES_EQUIPE,
  LIBELLES_USAGE,
  RANGES_VISITEURS,
  calculerPrix,
  conversationsEstimees,
  formaterEuros,
  formaterVisiteurs,
  getFormule,
  recommanderFormule,
  tauxEffectif,
  type ProfilProspect,
  type SlugFormule,
  type TailleEquipe,
  type UsagePrincipal,
} from "@/lib/axi-solver/tarification";

/**
 * Questionnaire guidé AxiSolver — 5 étapes puis résultat chiffré.
 *
 * Étapes :
 *   1. Avez-vous un site internet ?
 *   2. Combien de visiteurs mensuels ?
 *   3. Quel est votre secteur d'activité ?
 *   4. À quoi sert PRINCIPALEMENT votre site ?
 *   5. Avez-vous une équipe pour répondre aux visiteurs ?
 *   → Résultat : formule recommandée + prix + alternatives + CTA.
 *
 * Le composant est aussi la source de vérité pour le tool AXI
 * `estimer_tarif_axisolver` qui pose les mêmes questions en conversation.
 */

type Etape = 0 | 1 | 2 | 3 | 4 | 5;

type EtatBrouillon = {
  aSite: boolean | null;
  visiteursMois: number | null;
  rangeChoisie: string | null;
  secteurSlug: SlugSecteur | null;
  usagePrincipal: UsagePrincipal | null;
  tailleEquipe: TailleEquipe | null;
};

const ETAT_INITIAL: EtatBrouillon = {
  aSite: null,
  visiteursMois: null,
  rangeChoisie: null,
  secteurSlug: null,
  usagePrincipal: null,
  tailleEquipe: null,
};

export function Questionnaire() {
  const [etape, setEtape] = useState<Etape>(0);
  const [etat, setEtat] = useState<EtatBrouillon>(ETAT_INITIAL);
  const [modeManuel, setModeManuel] = useState(false);

  // Profil complet seulement si toutes les réponses sont là
  const profil: ProfilProspect | null = useMemo(() => {
    if (
      etat.aSite === true &&
      etat.visiteursMois !== null &&
      etat.secteurSlug !== null &&
      etat.usagePrincipal !== null &&
      etat.tailleEquipe !== null
    ) {
      return {
        aSite: true,
        visiteursMois: etat.visiteursMois,
        secteurSlug: etat.secteurSlug,
        usagePrincipal: etat.usagePrincipal,
        tailleEquipe: etat.tailleEquipe,
      };
    }
    return null;
  }, [etat]);

  function reinitialiser() {
    setEtat(ETAT_INITIAL);
    setEtape(0);
    setModeManuel(false);
  }

  return (
    <section
      id="questionnaire"
      className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Paramétrage guidé
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            Cinq questions,{" "}
            <span className="text-amber-400">votre tarif.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            On vous pose les mêmes questions qu&apos;AxiSolver poserait
            à l&apos;oral. En moins d&apos;une minute, vous obtenez la
            formule recommandée et son prix exact.
          </p>
        </div>

        {/* Stepper visuel */}
        <StepperVisuel etape={etape} />

        <div className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          {etape === 0 && (
            <EtapeSite
              onReponse={(aSite) => {
                setEtat((e) => ({ ...e, aSite }));
                if (aSite) setEtape(1);
              }}
              aSite={etat.aSite}
            />
          )}

          {etape === 1 && (
            <EtapeVisiteurs
              modeManuel={modeManuel}
              valeurManuelle={etat.visiteursMois ?? 5000}
              rangeChoisie={etat.rangeChoisie}
              onChoixRange={(slug, valeur) => {
                setEtat((e) => ({
                  ...e,
                  rangeChoisie: slug,
                  visiteursMois: valeur,
                }));
                setModeManuel(false);
              }}
              onChangementManuel={(v) => {
                setEtat((e) => ({
                  ...e,
                  visiteursMois: v,
                  rangeChoisie: "manuel",
                }));
                setModeManuel(true);
              }}
              onActiverManuel={() => setModeManuel(true)}
            />
          )}

          {etape === 2 && (
            <EtapeSecteur
              secteurSlug={etat.secteurSlug}
              onChoix={(slug) =>
                setEtat((e) => ({ ...e, secteurSlug: slug }))
              }
            />
          )}

          {etape === 3 && (
            <EtapeUsage
              usage={etat.usagePrincipal}
              onChoix={(u) =>
                setEtat((e) => ({ ...e, usagePrincipal: u }))
              }
            />
          )}

          {etape === 4 && (
            <EtapeEquipe
              taille={etat.tailleEquipe}
              onChoix={(t) =>
                setEtat((e) => ({ ...e, tailleEquipe: t }))
              }
            />
          )}

          {etape === 5 && profil && (
            <EtapeResultat
              profil={profil}
              onRecommencer={reinitialiser}
            />
          )}

          {/* Navigation inter-étapes */}
          {etape > 0 && etape < 5 && (
            <div className="mt-10 flex items-center justify-between border-t border-zinc-800 pt-6">
              <button
                type="button"
                onClick={() => setEtape((e) => (e - 1) as Etape)}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-amber-300"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => setEtape((e) => (e + 1) as Etape)}
                disabled={!peutAvancer(etat, etape)}
                className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
              >
                {etape === 4 ? "Voir mon tarif →" : "Continuer →"}
              </button>
            </div>
          )}
        </div>

        {/* Alternative : parler à AXI directement */}
        {etape < 5 && (
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <span>Vous préférez répondre à AXI à l&apos;oral ?</span>
            <BoutonLancerAxiSolver libelle="Parler à AxiSolver" />
          </div>
        )}
      </div>
    </section>
  );
}

/** Peut-on avancer à l'étape suivante ? Dépend des réponses données. */
function peutAvancer(etat: EtatBrouillon, etape: Etape): boolean {
  if (etape === 0) return etat.aSite === true;
  if (etape === 1) return etat.visiteursMois !== null && etat.visiteursMois > 0;
  if (etape === 2) return etat.secteurSlug !== null;
  if (etape === 3) return etat.usagePrincipal !== null;
  if (etape === 4) return etat.tailleEquipe !== null;
  return false;
}

// ─────── Stepper ─────── //

function StepperVisuel({ etape }: { etape: Etape }) {
  const labels = ["Site", "Visiteurs", "Secteur", "Usage", "Équipe", "Tarif"];
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {labels.map((label, i) => {
        const estActive = i === etape;
        const estPassee = i < etape;
        return (
          <div
            key={label}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span
              className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                estActive
                  ? "bg-amber-400 text-zinc-950"
                  : estPassee
                    ? "bg-amber-400/20 text-amber-300"
                    : "bg-zinc-800 text-zinc-500"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`text-xs font-medium uppercase tracking-widest ${
                estActive
                  ? "text-amber-300"
                  : estPassee
                    ? "text-zinc-400"
                    : "text-zinc-600"
              }`}
            >
              {label}
            </span>
            {i < labels.length - 1 && (
              <span
                className={`h-px w-6 flex-shrink-0 md:w-10 ${
                  estPassee ? "bg-amber-400/40" : "bg-zinc-800"
                }`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────── Étape 0 : Site ou pas ─────── //

function EtapeSite({
  onReponse,
  aSite,
}: {
  onReponse: (aSite: boolean) => void;
  aSite: boolean | null;
}) {
  const estSansSite: boolean = aSite === false;
  if (estSansSite) {
    return (
      <div>
        <TitreEtape numero={1} libelle="Avez-vous déjà un site internet ?" />
        <div className="mt-8 rounded-2xl border border-amber-400/40 bg-amber-400/5 p-6 md:p-8">
          <p className="text-base leading-relaxed text-zinc-200 md:text-lg">
            AxiSolver se greffe sur un{" "}
            <span className="font-semibold text-white">site existant</span>.
            Deux options s&apos;offrent à vous :
          </p>
          <ul className="mt-5 space-y-4 text-sm leading-relaxed text-zinc-300 md:text-base">
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                <span className="font-semibold text-white">
                  Confiez-nous votre site clé en main
                </span>{" "}
                via le pack{" "}
                <a
                  href="https://axihub.live"
                  className="text-amber-300 underline hover:text-amber-200"
                >
                  AXI Vitrine Complète
                </a>{" "}
                sur AxiHub (service Bridge). AxiSolver est alors
                installé nativement.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              <span>
                <span className="font-semibold text-white">
                  Revenez quand votre site est prêt
                </span>{" "}
                — un plombier, un développeur freelance, un ami tech.
                AxiSolver s&apos;installe en moins de 5 minutes avec
                un simple script.
              </span>
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BoutonLancerAxiSolver libelle="Parler à AxiSolver" />
            <button
              type="button"
              onClick={() => onReponse(true)}
              className="text-sm font-medium text-amber-300 hover:text-amber-200"
            >
              Finalement j&apos;ai un site →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TitreEtape numero={1} libelle="Avez-vous déjà un site internet ?" />
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        AxiSolver s&apos;installe sur votre site existant via un bout
        de code à coller.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CarteChoix
          titre="Oui, j'ai un site"
          onClick={() => onReponse(true)}
          selectionnee={aSite === true}
        />
        <CarteChoix
          titre="Non, pas encore"
          onClick={() => onReponse(false)}
          selectionnee={aSite === false}
        />
      </div>
    </div>
  );
}

// ─────── Étape 1 : Visiteurs ─────── //

function EtapeVisiteurs({
  modeManuel,
  valeurManuelle,
  rangeChoisie,
  onChoixRange,
  onChangementManuel,
  onActiverManuel,
}: {
  modeManuel: boolean;
  valeurManuelle: number;
  rangeChoisie: string | null;
  onChoixRange: (slug: string, valeur: number) => void;
  onChangementManuel: (v: number) => void;
  onActiverManuel: () => void;
}) {
  return (
    <div>
      <TitreEtape
        numero={2}
        libelle="Combien de visiteurs mensuels sur votre site ?"
      />
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Si vous connaissez le chiffre exact (Google Analytics,
        tableau de bord d&apos;hébergement, etc.), saisissez-le.
        Sinon, choisissez la fourchette qui vous paraît la plus
        probable au feeling — c&apos;est amplement suffisant pour
        calculer votre tarif.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {RANGES_VISITEURS.map((r) => {
          const estSelectionnee = !modeManuel && rangeChoisie === r.slug;
          return (
            <button
              key={r.slug}
              type="button"
              onClick={() => onChoixRange(r.slug, r.valeur)}
              className={`rounded-xl border px-5 py-4 text-left transition-all ${
                estSelectionnee
                  ? "border-amber-400 bg-amber-400/10 text-white"
                  : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-amber-400/40 hover:bg-zinc-900"
              }`}
              aria-pressed={estSelectionnee}
            >
              <div className="font-medium">{r.libelle}</div>
              <div
                className={`mt-1 font-mono text-xs ${
                  estSelectionnee ? "text-amber-300" : "text-zinc-500"
                }`}
              >
                visiteurs / mois
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-6">
        {!modeManuel ? (
          <button
            type="button"
            onClick={onActiverManuel}
            className="text-sm font-medium text-amber-300 hover:text-amber-200"
          >
            Je préfère saisir un chiffre précis →
          </button>
        ) : (
          <div>
            <label
              htmlFor="visiteurs-precis"
              className="text-xs font-semibold uppercase tracking-widest text-amber-300"
            >
              Nombre précis de visiteurs mensuels
            </label>
            <input
              id="visiteurs-precis"
              type="number"
              min={1}
              step={100}
              value={valeurManuelle}
              onChange={(e) =>
                onChangementManuel(Math.max(1, Number(e.target.value) || 0))
              }
              className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-xl text-white focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────── Étape 2 : Secteur ─────── //

function EtapeSecteur({
  secteurSlug,
  onChoix,
}: {
  secteurSlug: SlugSecteur | null;
  onChoix: (slug: SlugSecteur) => void;
}) {
  return (
    <div>
      <TitreEtape
        numero={3}
        libelle="Quel est votre secteur d'activité ?"
      />
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Choisissez le secteur qui colle le mieux. Chaque secteur a son
        propre taux d&apos;utilisation observé — sourcé dans les
        études publiques en bas de page.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTEURS.map((s) => {
          const estSelectionne = secteurSlug === s.slug;
          const estSource = s.sourcage === "source-directe";
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => onChoix(s.slug)}
              className={`rounded-xl border p-4 text-left transition-all ${
                estSelectionne
                  ? "border-amber-400 bg-amber-400/10 text-white"
                  : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-amber-400/40 hover:bg-zinc-900"
              }`}
              aria-pressed={estSelectionne}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{s.nom}</span>
                <span
                  className={`font-mono text-xs ${
                    estSelectionne ? "text-amber-300" : "text-zinc-500"
                  }`}
                >
                  ~{s.tauxUtilisation}%
                </span>
              </div>
              <p
                className={`mt-2 text-xs leading-relaxed ${
                  estSelectionne ? "text-zinc-200" : "text-zinc-500"
                }`}
              >
                {s.description}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest">
                <span
                  className={
                    estSource ? "text-emerald-400" : "text-zinc-500"
                  }
                >
                  {estSource ? "● Sourcé" : "○ Estimé"}
                </span>
                <span className="text-zinc-600">
                  {s.fourchette[0]}%–{s.fourchette[1]}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────── Étape 3 : Usage principal ─────── //

const OPTIONS_USAGE: Array<{
  slug: UsagePrincipal;
  description: string;
}> = [
  {
    slug: "support",
    description:
      "Vos visiteurs sont des clients qui cherchent de l'aide, un suivi de commande, un dépannage.",
  },
  {
    slug: "vente",
    description:
      "Vous vendez en ligne (Shopify, WooCommerce, boutique propre). Objectif : convertir.",
  },
  {
    slug: "leads",
    description:
      "Vous vendez un service, un logiciel, de la prestation. Objectif : qualifier et prendre contact.",
  },
  {
    slug: "vitrine",
    description:
      "Votre site présente votre activité sans transaction directe. Objectif : visibilité et crédibilité.",
  },
  {
    slug: "mixte",
    description:
      "Plusieurs usages se superposent (support + vente, vitrine + leads, etc.).",
  },
];

function EtapeUsage({
  usage,
  onChoix,
}: {
  usage: UsagePrincipal | null;
  onChoix: (u: UsagePrincipal) => void;
}) {
  return (
    <div>
      <TitreEtape
        numero={4}
        libelle="À quoi sert principalement votre site ?"
      />
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        L&apos;usage principal influence combien de visiteurs vont
        réellement engager une conversation avec AXI.
      </p>

      <div className="mt-8 space-y-3">
        {OPTIONS_USAGE.map((opt) => {
          const estSelectionne = usage === opt.slug;
          return (
            <button
              key={opt.slug}
              type="button"
              onClick={() => onChoix(opt.slug)}
              className={`block w-full rounded-xl border p-5 text-left transition-all ${
                estSelectionne
                  ? "border-amber-400 bg-amber-400/10"
                  : "border-zinc-800 bg-zinc-950/40 hover:border-amber-400/40 hover:bg-zinc-900"
              }`}
              aria-pressed={estSelectionne}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    estSelectionne
                      ? "border-amber-400 bg-amber-400"
                      : "border-zinc-700"
                  }`}
                  aria-hidden
                >
                  {estSelectionne && (
                    <span className="h-2 w-2 rounded-full bg-zinc-950" />
                  )}
                </span>
                <div>
                  <div
                    className={`font-medium ${
                      estSelectionne ? "text-white" : "text-zinc-200"
                    }`}
                  >
                    {LIBELLES_USAGE[opt.slug]}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {opt.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────── Étape 4 : Équipe ─────── //

const OPTIONS_EQUIPE: Array<{
  slug: TailleEquipe;
  description: string;
}> = [
  {
    slug: "aucune",
    description:
      "Je gère tout, ou presque. Les demandes des visiteurs tombent souvent dans le vide.",
  },
  {
    slug: "une",
    description:
      "Soit moi-même, soit un.e assistant.e qui répond aux demandes quand il/elle peut.",
  },
  {
    slug: "petite",
    description:
      "On est 2 à 5 à se partager l'accueil des visiteurs, parfois avec des trous.",
  },
  {
    slug: "grande",
    description:
      "Une vraie équipe support ou commerciale organisée, de plus de 5 personnes.",
  },
];

function EtapeEquipe({
  taille,
  onChoix,
}: {
  taille: TailleEquipe | null;
  onChoix: (t: TailleEquipe) => void;
}) {
  return (
    <div>
      <TitreEtape
        numero={5}
        libelle="Qui répond aujourd'hui aux visiteurs de votre site ?"
      />
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Cette dernière question nous aide à savoir si vous avez
        besoin de la voix synthétique (quand il n&apos;y a personne
        au bout du fil) ou si l&apos;écrit peut suffire.
      </p>

      <div className="mt-8 space-y-3">
        {OPTIONS_EQUIPE.map((opt) => {
          const estSelectionnee = taille === opt.slug;
          return (
            <button
              key={opt.slug}
              type="button"
              onClick={() => onChoix(opt.slug)}
              className={`block w-full rounded-xl border p-5 text-left transition-all ${
                estSelectionnee
                  ? "border-amber-400 bg-amber-400/10"
                  : "border-zinc-800 bg-zinc-950/40 hover:border-amber-400/40 hover:bg-zinc-900"
              }`}
              aria-pressed={estSelectionnee}
            >
              <div className="flex items-start gap-4">
                <span
                  className={`mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    estSelectionnee
                      ? "border-amber-400 bg-amber-400"
                      : "border-zinc-700"
                  }`}
                  aria-hidden
                >
                  {estSelectionnee && (
                    <span className="h-2 w-2 rounded-full bg-zinc-950" />
                  )}
                </span>
                <div>
                  <div
                    className={`font-medium ${
                      estSelectionnee ? "text-white" : "text-zinc-200"
                    }`}
                  >
                    {LIBELLES_EQUIPE[opt.slug]}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    {opt.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────── Étape 5 : Résultat ─────── //

function EtapeResultat({
  profil,
  onRecommencer,
}: {
  profil: ProfilProspect;
  onRecommencer: () => void;
}) {
  const taux = tauxEffectif(profil.secteurSlug, profil.usagePrincipal);
  const conv = conversationsEstimees(profil.visiteursMois, taux);
  const recommandeeSlug = recommanderFormule(profil);
  const recommandee = getFormule(recommandeeSlug);

  const prix = useMemo(
    () =>
      Object.fromEntries(
        FORMULES.map((f) => [
          f.slug,
          calculerPrix(f, profil.visiteursMois, taux),
        ]),
      ) as Record<SlugFormule, number>,
    [profil.visiteursMois, taux],
  );

  return (
    <div>
      <TitreEtape numero={6} libelle="Votre tarif AxiSolver" />
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Estimation basée sur vos réponses. Chiffres indicatifs, HT —
        devis définitif à la signature.
      </p>

      {/* Récap profil */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
        <RecapCase
          label="Visiteurs / mois"
          valeur={formaterVisiteurs(profil.visiteursMois)}
        />
        <RecapCase
          label="Secteur"
          valeur={SECTEURS.find((s) => s.slug === profil.secteurSlug)?.nom ?? "—"}
        />
        <RecapCase
          label="Taux retenu"
          valeur={`${taux}%`}
          detail={`soit ~${conv.toLocaleString("fr-FR")} conv/mois`}
        />
        <RecapCase label="Usage principal" valeur={LIBELLES_USAGE[profil.usagePrincipal]} />
      </div>

      {/* Formule recommandée */}
      <div className="mt-10 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-400/10 to-zinc-900 p-6 md:p-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex rounded-full bg-amber-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-950">
            Recommandée
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            {recommandee.voix}
          </p>
        </div>
        <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">
          {recommandee.nom}
        </h3>
        <p className="mt-2 text-sm text-zinc-300 md:text-base">
          {recommandee.sousTitre}
        </p>
        <div className="mt-6 flex items-baseline gap-3">
          <span className="font-mono text-5xl font-semibold tracking-tight text-white md:text-6xl">
            {formaterEuros(prix[recommandeeSlug])}
          </span>
          <span className="text-sm text-zinc-400">HT / mois</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          pour {formaterVisiteurs(profil.visiteursMois)} visiteurs,
          soit ~{conv.toLocaleString("fr-FR")} conversations /
          mois incluses dans la formule
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <BoutonLancerAxiSolver libelle="Souscrire via AxiSolver" />
          <button
            type="button"
            onClick={onRecommencer}
            className="text-sm font-medium text-amber-300 hover:text-amber-200"
          >
            ↺ Refaire le questionnaire
          </button>
        </div>
      </div>

      {/* Les 2 autres formules en comparatif */}
      <div className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
          Les autres formules
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FORMULES.filter((f) => f.slug !== recommandeeSlug).map((f) => (
            <div
              key={f.slug}
              className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {f.voix}
              </p>
              <h4 className="mt-2 text-xl font-semibold tracking-tight text-white">
                {f.nom}
              </h4>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-semibold text-zinc-200">
                  {formaterEuros(prix[f.slug])}
                </span>
                <span className="text-xs text-zinc-500">HT / mois</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                base {formaterEuros(f.abonnementBase)} ·{" "}
                {f.conversationsIncluses} conversations incluses
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────── Primitives UI ─────── //

function TitreEtape({
  numero,
  libelle,
}: {
  numero: number;
  libelle: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
        Question {numero} sur 5
      </p>
      <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white md:text-3xl">
        {libelle}
      </h3>
    </div>
  );
}

function CarteChoix({
  titre,
  onClick,
  selectionnee,
}: {
  titre: string;
  onClick: () => void;
  selectionnee: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-6 text-left text-lg font-medium transition-all ${
        selectionnee
          ? "border-amber-400 bg-amber-400/10 text-white"
          : "border-zinc-800 bg-zinc-950/40 text-zinc-200 hover:border-amber-400/40 hover:bg-zinc-900"
      }`}
      aria-pressed={selectionnee}
    >
      {titre}
    </button>
  );
}

function RecapCase({
  label,
  valeur,
  detail,
}: {
  label: string;
  valeur: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <p className="mt-1.5 font-medium text-white">{valeur}</p>
      {detail && (
        <p className="mt-0.5 text-[11px] text-zinc-400">{detail}</p>
      )}
    </div>
  );
}
