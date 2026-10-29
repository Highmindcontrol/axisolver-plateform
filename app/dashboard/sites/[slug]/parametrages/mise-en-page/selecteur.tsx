"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";

import {
  CATALOGUE_ARCHETYPES,
  type ArchetypeLayout,
  type ArchetypeLayoutSlug,
} from "@/lib/axi-solver/archetypes-layout";
import {
  modifierMiseEnPageAction,
  type EtatMiseEnPage,
} from "./actions";

const ETAT_INITIAL: EtatMiseEnPage = { erreur: null, succes: false };

export function SelecteurArchetype({
  slug,
  archetypeActuel,
  couleurSite,
}: {
  slug: string;
  archetypeActuel: ArchetypeLayoutSlug;
  couleurSite: string;
}) {
  const [choix, setChoix] = useState<ArchetypeLayoutSlug>(archetypeActuel);
  const [etat, action, pending] = useActionState(
    modifierMiseEnPageAction,
    ETAT_INITIAL,
  );
  const change = choix !== archetypeActuel;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="archetype" value={choix} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATALOGUE_ARCHETYPES.map((a) => (
          <CarteArchetype
            key={a.slug}
            archetype={a}
            actuel={a.slug === archetypeActuel}
            selectionne={a.slug === choix}
            couleurSite={couleurSite}
            onClick={() => setChoix(a.slug)}
          />
        ))}
      </div>

      {etat.erreur && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"
        >
          <AlertCircle
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            strokeWidth={2}
            aria-hidden
          />
          <span>{etat.erreur}</span>
        </div>
      )}

      {etat.succes && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          Mise en page enregistrée. Le widget utilisera ce layout à sa
          prochaine recharge.
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <button
          type="submit"
          disabled={!change || pending}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : (
            "Enregistrer la mise en page"
          )}
        </button>
      </div>
    </form>
  );
}

function CarteArchetype({
  archetype,
  actuel,
  selectionne,
  couleurSite,
  onClick,
}: {
  archetype: ArchetypeLayout;
  actuel: boolean;
  selectionne: boolean;
  couleurSite: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selectionne}
      className={`group flex flex-col gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
        selectionne
          ? "shadow-md"
          : "border-slate-200 hover:border-slate-300"
      }`}
      style={
        selectionne ? { borderColor: couleurSite } : undefined
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {archetype.nom}
          </h3>
          {actuel && (
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Actuel
            </p>
          )}
        </div>
        {selectionne && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: couleurSite }}
            aria-hidden
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </div>

      <MiniAperçu couleurSite={couleurSite} slug={archetype.slug} />

      <p className="text-xs leading-relaxed text-slate-600">
        {archetype.description}
      </p>

      <dl className="mt-1 space-y-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <div className="flex gap-2">
          <dt className="w-14 flex-shrink-0 font-semibold text-slate-700">
            Gauche
          </dt>
          <dd className="flex-1 leading-relaxed">{archetype.ailetteGauche}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-14 flex-shrink-0 font-semibold text-slate-700">
            Droite
          </dt>
          <dd className="flex-1 leading-relaxed">{archetype.ailetteDroite}</dd>
        </div>
      </dl>
    </button>
  );
}

/**
 * Aperçu schématique en 3 colonnes. Chaque archétype a sa propre
 * représentation des deux ailettes autour du chat central.
 */
function MiniAperçu({
  couleurSite,
  slug,
}: {
  couleurSite: string;
  slug: ArchetypeLayoutSlug;
}) {
  return (
    <div className="flex h-24 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <ColonneGauche couleur={couleurSite} slug={slug} />
      <div className="flex-1 rounded-md bg-white p-1.5">
        <div className="h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="mt-1 h-1.5 w-14 rounded-full bg-slate-200" />
        <div className="mt-1 h-1.5 w-8 rounded-full bg-slate-200" />
        <div
          className="mt-auto h-3 rounded-md"
          style={{ backgroundColor: couleurSite, opacity: 0.9 }}
        />
      </div>
      <ColonneDroite couleur={couleurSite} slug={slug} />
    </div>
  );
}

function ColonneGauche({
  couleur,
  slug,
}: {
  couleur: string;
  slug: ArchetypeLayoutSlug;
}) {
  switch (slug) {
    case "boutique":
      // Grille de 2x3 cases produits
      return (
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-md bg-white p-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-sm bg-slate-200" />
          ))}
        </div>
      );
    case "prise-rdv":
      // Liste praticiens (3 lignes avec rond + barres)
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: couleur, opacity: 0.7 }}
              />
              <div className="h-1 flex-1 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      );
    case "fiche-bien":
      // Cards avec image + 2 lignes
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-5 w-6 flex-shrink-0 rounded-sm bg-slate-200" />
              <div className="flex flex-col gap-0.5">
                <div className="h-1 w-6 rounded-full bg-slate-200" />
                <div
                  className="h-1 w-4 rounded-full"
                  style={{ backgroundColor: couleur, opacity: 0.6 }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    case "reservation":
      // Carte / menu : 4 lignes
      return (
        <div className="flex flex-1 flex-col gap-0.5 rounded-md bg-white p-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-1"
            >
              <div className="h-1 flex-1 rounded-full bg-slate-200" />
              <div
                className="h-1 w-3 rounded-full"
                style={{ backgroundColor: couleur, opacity: 0.6 }}
              />
            </div>
          ))}
        </div>
      );
    case "catalogue":
      // Articles : image en haut, 2 lignes en bas
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          <div className="h-6 rounded-sm bg-slate-200" />
          <div className="h-1 w-4/5 rounded-full bg-slate-200" />
          <div className="h-1 w-2/3 rounded-full bg-slate-200" />
        </div>
      );
    case "classique":
    default:
      // Phrases d'accueil cliquables
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-2 rounded-full"
              style={{
                backgroundColor: couleur,
                opacity: 0.3 + i * 0.2,
              }}
            />
          ))}
        </div>
      );
  }
}

function ColonneDroite({
  couleur,
  slug,
}: {
  couleur: string;
  slug: ArchetypeLayoutSlug;
}) {
  switch (slug) {
    case "boutique":
      // Panier : lignes avec case + prix
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          <div
            className="h-2 rounded-sm"
            style={{ backgroundColor: couleur, opacity: 0.8 }}
          />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-2 w-2 flex-shrink-0 rounded-sm bg-slate-200" />
              <div className="h-1 flex-1 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      );
    case "prise-rdv":
      // Mini-calendrier 3x3
      return (
        <div className="grid flex-1 grid-cols-3 gap-0.5 rounded-md bg-white p-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="rounded-[2px]"
              style={{
                backgroundColor: i === 4 ? couleur : "#e2e8f0",
                opacity: i === 4 ? 0.9 : 1,
              }}
            />
          ))}
        </div>
      );
    case "fiche-bien":
      // Diaporama + lignes
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          <div className="h-6 rounded-sm bg-slate-200" />
          <div className="h-1 w-full rounded-full bg-slate-200" />
          <div
            className="mt-auto h-2 rounded-md"
            style={{ backgroundColor: couleur, opacity: 0.8 }}
          />
        </div>
      );
    case "reservation":
      // Récap réservation
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          <div
            className="h-2 rounded-sm"
            style={{ backgroundColor: couleur, opacity: 0.8 }}
          />
          <div className="h-1 w-full rounded-full bg-slate-200" />
          <div className="h-1 w-3/4 rounded-full bg-slate-200" />
          <div className="h-1 w-1/2 rounded-full bg-slate-200" />
        </div>
      );
    case "catalogue":
      // Bookmarks : liste
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: couleur, opacity: 0.7 }}
              />
              <div className="h-1 flex-1 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      );
    case "classique":
    default:
      // Carnet de session : check-list
      return (
        <div className="flex flex-1 flex-col gap-1 rounded-md bg-white p-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
              <div className="h-1 flex-1 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      );
  }
}
