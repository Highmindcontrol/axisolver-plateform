"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { SECTEURS, type SlugSecteur } from "@/lib/axi-solver/secteurs";
import {
  FORMULES,
  PALIER_TRAFIC,
  conversationsEstimees,
  getFormule,
  recommanderFormule,
  tauxEffectif,
  type PreferenceVoix,
  type SlugFormule,
} from "@/lib/axi-solver/tarification";

/**
 * Simulateur AxiSolver — Option B : questionnaire de recommandation.
 *
 * Les prix sont fixes (49/69/99/129 €) et affichés sur les 4 cartes
 * en bas. Ce composant aide juste le visiteur à choisir la bonne
 * formule parmi les 4 selon 3 signaux :
 *   1. Type de site (secteur)
 *   2. Volume de visiteurs mensuels (slider)
 *   3. Voix ou pas voix (toggle)
 *
 * À la fin, affiche la formule recommandée + une marge de confort
 * (conversations estimées vs quota inclus) + les 3 autres formules
 * en cartes secondaires.
 */

export function Simulateur() {
  const [secteurSlug, setSecteurSlug] = useState<SlugSecteur>("ecommerce");
  const [visiteurs, setVisiteurs] = useState(5000);
  const [preferenceVoix, setPreferenceVoix] = useState<PreferenceVoix>("voix");

  const secteur = useMemo(
    () => SECTEURS.find((s) => s.slug === secteurSlug) ?? SECTEURS[0],
    [secteurSlug],
  );

  const taux = useMemo(
    () => tauxEffectif(secteurSlug, "vente"),
    [secteurSlug],
  );
  const conv = useMemo(
    () => conversationsEstimees(visiteurs, taux),
    [visiteurs, taux],
  );

  const slugRecommande = useMemo<SlugFormule>(
    () =>
      recommanderFormule({
        aSite: true,
        visiteursMois: visiteurs,
        secteurSlug,
        usagePrincipal: "vente",
        tailleEquipe: "petite",
        preferenceVoix,
      }),
    [visiteurs, secteurSlug, preferenceVoix],
  );

  const formuleRecommandee = getFormule(slugRecommande);

  return (
    <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Simulateur
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl">
            Quelle formule{" "}
            <span className="text-amber-400">pour vous&nbsp;?</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Trois questions, pas une de plus. AxiSolver vous indique
            quelle formule des quatre vous correspond, et le volume de
            conversations auquel vous pouvez vous attendre.
          </p>
        </div>

        {/* Question 1 — Secteur */}
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            1. Quel type de site avez-vous&nbsp;?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:max-w-xl">
            Chaque activité a son propre taux d&apos;engagement typique.
            Nous nous basons sur des études publiques (voir l&apos;onglet
            Sources en bas de page).
          </p>

          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SECTEURS.map((s) => {
              const estSelectionne = secteurSlug === s.slug;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => setSecteurSlug(s.slug)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                    estSelectionne
                      ? "border-amber-400 bg-amber-400/10 text-white"
                      : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-amber-400/40 hover:bg-zinc-900"
                  }`}
                  aria-pressed={estSelectionne}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-medium">{s.nom}</span>
                    <span
                      className={`font-mono text-xs ${
                        estSelectionne ? "text-amber-300" : "text-zinc-500"
                      }`}
                    >
                      ~{s.tauxUtilisation}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs leading-relaxed text-zinc-400">
            {secteur.description}
          </p>
        </div>

        {/* Question 2 — Volume de visiteurs */}
        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                2. Combien de visiteurs par mois&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:max-w-md">
                Le palier qui fait basculer vers un plus gros forfait est
                à <span className="text-white">10 000 visiteurs</span>.
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="font-mono text-4xl font-semibold tracking-tight text-white md:text-5xl">
                {visiteurs.toLocaleString("fr-FR")}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest text-zinc-500">
                Visiteurs / mois
              </p>
            </div>
          </div>

          <input
            type="range"
            min={100}
            max={50000}
            step={100}
            value={visiteurs}
            onChange={(e) => setVisiteurs(Number(e.target.value))}
            className="mt-8 w-full accent-amber-400"
            aria-label="Nombre de visiteurs mensuels"
          />
          <div className="mt-2 flex justify-between text-[11px] uppercase tracking-widest text-zinc-500">
            <span>100</span>
            <span>10 000 ← palier</span>
            <span>50 000</span>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/5 px-4 py-1.5 text-xs text-amber-200">
            Soit environ{" "}
            <span className="font-semibold text-white">
              {conv.toLocaleString("fr-FR")}
            </span>{" "}
            conversations/mois sur votre type de site.
          </p>
        </div>

        {/* Question 3 — Préférence voix */}
        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            3. Préférez-vous la voix ou l&apos;écrit&nbsp;?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:max-w-xl">
            La voix d&apos;AxiSolver est produite par ElevenLabs,
            indiscernable d&apos;un humain. L&apos;écrit, moins
            immersif, est plus accessible financièrement.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPreferenceVoix("voix")}
              className={`rounded-xl border px-5 py-4 text-left text-sm transition-all ${
                preferenceVoix === "voix"
                  ? "border-amber-400 bg-amber-400/10 text-white"
                  : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-amber-400/40 hover:bg-zinc-900"
              }`}
              aria-pressed={preferenceVoix === "voix"}
            >
              <p className="font-semibold">Avec voix</p>
              <p className="mt-1 text-xs text-zinc-500">
                ElevenLabs ultra-réaliste. L&apos;expérience bluffante
                qui engage le plus.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setPreferenceVoix("ecrit")}
              className={`rounded-xl border px-5 py-4 text-left text-sm transition-all ${
                preferenceVoix === "ecrit"
                  ? "border-amber-400 bg-amber-400/10 text-white"
                  : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-amber-400/40 hover:bg-zinc-900"
              }`}
              aria-pressed={preferenceVoix === "ecrit"}
            >
              <p className="font-semibold">Écrit seul</p>
              <p className="mt-1 text-xs text-zinc-500">
                Toutes les missions, sans la voix synthétique. Plus
                accessible, parfait pour la plupart des sites.
              </p>
            </button>
          </div>
        </div>

        {/* Résultat — formule recommandée */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-amber-400/40 bg-gradient-to-br from-zinc-900 via-amber-400/5 to-zinc-900 p-8 shadow-xl shadow-amber-400/10 md:p-12">
          <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-5">
            <div className="md:col-span-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
                Notre recommandation
              </p>
              <h3 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {formuleRecommandee.nom}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-zinc-300 md:text-lg">
                {formuleRecommandee.sousTitre}
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-zinc-200 md:text-base">
                <li className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
                    strokeWidth={3}
                  />
                  <span>{formuleRecommandee.voix}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
                    strokeWidth={3}
                  />
                  <span>
                    {formuleRecommandee.conversationsIncluses} conversations
                    incluses chaque mois
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
                    strokeWidth={3}
                  />
                  <span>
                    Pack supp. de {formuleRecommandee.volumeConvPackSupp} conv à
                    la demande : {formuleRecommandee.prixPackSuppHt} € HT
                    (reportable jusqu&apos;à 3 mois)
                  </span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Votre tarif
              </p>
              <p className="mt-3 font-mono text-6xl font-semibold tracking-tight text-amber-400 md:text-7xl">
                {formuleRecommandee.prixMensuelHt} €
              </p>
              <p className="text-sm text-zinc-400">par mois HT · tout inclus</p>

              <div className="mt-8">
                <Link
                  href={`/inscription?plan=${formuleRecommandee.slug}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-950 shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 md:text-base"
                >
                  Souscrire maintenant
                </Link>
                <p className="mt-3 text-center text-[11px] uppercase tracking-widest text-zinc-500">
                  14 j d&apos;essai · sans carte bancaire
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Les 4 formules côte à côte */}
        <div className="mt-14">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Les quatre formules
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {FORMULES.map((f) => {
              const estRecommandee = f.slug === slugRecommande;
              return (
                <article
                  key={f.slug}
                  className={`relative overflow-hidden rounded-3xl border p-6 transition-all ${
                    estRecommandee
                      ? "border-amber-400 bg-zinc-900 shadow-xl shadow-amber-400/10"
                      : "border-zinc-800 bg-zinc-900/40"
                  }`}
                >
                  {estRecommandee && (
                    <span className="absolute right-4 top-4 inline-flex rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-950">
                      Recommandé
                    </span>
                  )}
                  {f.phare && !estRecommandee && (
                    <span className="absolute right-4 top-4 inline-flex rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-300">
                      Phare
                    </span>
                  )}
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                    {f.voix}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-white md:text-xl">
                    {f.nom}
                  </h3>
                  <p className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-mono text-4xl font-semibold tracking-tight text-white">
                      {f.prixMensuelHt} €
                    </span>
                    <span className="text-xs text-zinc-400">HT/mois</span>
                  </p>
                  <ul className="mt-5 space-y-2 text-xs text-zinc-300 md:text-sm">
                    <li className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400"
                        strokeWidth={3}
                      />
                      <span>
                        {f.conversationsIncluses} conv/mois incluses
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400"
                        strokeWidth={3}
                      />
                      <span>
                        Pack supp. {f.volumeConvPackSupp} conv à{" "}
                        {f.prixPackSuppHt} €
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400"
                        strokeWidth={3}
                      />
                      <span>{f.trafic}</span>
                    </li>
                  </ul>
                </article>
              );
            })}
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-zinc-500">
          Palier à {PALIER_TRAFIC.toLocaleString("fr-FR")} visiteurs : conseil
          du simulateur, pas une contrainte. Vous pouvez prendre S puis
          basculer vers L à tout moment. Les packs supplémentaires non
          utilisés se reportent sur 3 mois.
        </p>
      </div>
    </section>
  );
}
