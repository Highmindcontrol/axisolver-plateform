"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Megaphone,
  Search,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import type { StatsQuotidiennes } from "@/lib/axi-solver/rapport/agreger";
import type { OpportuniteUpsell } from "@/lib/axi-solver/rapport/upsell";

type Onglet = "overview" | "ads" | "seo" | "securite";

export function OngletsRapport({
  stats,
  opportunite,
  slug,
}: {
  stats: StatsQuotidiennes;
  opportunite: OpportuniteUpsell | null;
  slug: string;
}) {
  const [actif, setActif] = useState<Onglet>("overview");

  const onglets: Array<{
    id: Onglet;
    label: string;
    icone: typeof BarChart3;
    pastille?: number;
  }> = [
    { id: "overview", label: "Vue d'ensemble", icone: BarChart3 },
    {
      id: "ads",
      label: "Publicité",
      icone: Megaphone,
      pastille: stats.resumeAds.nbRecosCritiques + stats.resumeAds.nbRecosHautes,
    },
    {
      id: "seo",
      label: "SEO",
      icone: Search,
      pastille: stats.resumeSeo.nbRecosCritiques + stats.resumeSeo.nbRecosHautes,
    },
    {
      id: "securite",
      label: "Sécurité",
      icone: ShieldCheck,
      pastille:
        stats.resumeSecurite.nbIncidentsCritiques +
        stats.resumeSecurite.nbIncidentsHauts,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex overflow-x-auto border-b border-slate-200">
        {onglets.map((o) => {
          const Icone = o.icone;
          const isActif = actif === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setActif(o.id)}
              className={`relative flex items-center gap-2 whitespace-nowrap px-5 py-4 text-sm font-medium transition ${
                isActif
                  ? "border-b-2 border-indigo-700 text-indigo-700"
                  : "border-b-2 border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icone className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              {o.label}
              {o.pastille !== undefined && o.pastille > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-100 px-1.5 text-[10px] font-bold text-rose-700">
                  {o.pastille}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {actif === "overview" && <OngletOverview stats={stats} opportunite={opportunite} slug={slug} />}
        {actif === "ads" && <OngletAds stats={stats} slug={slug} />}
        {actif === "seo" && <OngletSeo stats={stats} slug={slug} />}
        {actif === "securite" && <OngletSecurite stats={stats} slug={slug} />}
      </div>
    </div>
  );
}

/* ──────────── Vue d'ensemble ──────────── */

function OngletOverview({
  stats,
  opportunite,
  slug,
}: {
  stats: StatsQuotidiennes;
  opportunite: OpportuniteUpsell | null;
  slug: string;
}) {
  const tauxResolution =
    stats.nbConversations > 0
      ? Math.round(
          ((stats.nbConversations - stats.conversationsSansResolution) /
            stats.nbConversations) *
            100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Carte label="Visiteurs" valeur={stats.nbVisiteursUniques} detail={`${stats.nbConversations} conv.`} />
        <Carte label="Tours moy." valeur={stats.nbToursMoyen.toFixed(1)} detail={`${stats.nbToursTotal} total`} />
        <Carte
          label="Tickets AXI"
          valeur={stats.nbTicketsOuverts + stats.nbTicketsResolus}
          detail={`${stats.nbTicketsChauds} chaud·s · ${stats.nbTicketsUrgents} urgent·s`}
        />
        <Carte label="Taux résolution" valeur={`${tauxResolution}%`} detail={`${stats.conversationsSansResolution} non résolu·es`} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
        <p className="mb-3 text-sm font-semibold text-slate-900">
          Score de satisfaction visiteur
        </p>
        <div className="flex items-baseline gap-3">
          <span
            className="text-4xl font-bold"
            style={{
              color:
                stats.scoreSatisfaction >= 80
                  ? "#059669"
                  : stats.scoreSatisfaction >= 60
                    ? "#d97706"
                    : "#dc2626",
            }}
          >
            {stats.scoreSatisfaction}
          </span>
          <span className="text-sm text-slate-500">/100</span>
        </div>
      </div>

      {stats.comparaisonSemainePrec.nbConversations > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-slate-900">
            Comparaison avec la semaine précédente
          </p>
          <div className="space-y-2 text-sm text-slate-700">
            <LigneDelta
              label="Conversations"
              aujourdhui={stats.nbConversations}
              avant={stats.comparaisonSemainePrec.nbConversations}
              deltaPct={stats.comparaisonSemainePrec.deltaConversationsPct}
            />
            <LigneDelta
              label="Visiteurs uniques"
              aujourdhui={stats.nbVisiteursUniques}
              avant={stats.comparaisonSemainePrec.nbVisiteursUniques}
              deltaPct={stats.comparaisonSemainePrec.deltaVisiteursPct}
            />
          </div>
        </div>
      )}

      {stats.topQuestions.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">Top questions des visiteurs</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {stats.topQuestions.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-slate-400">·</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {opportunite?.nature && (
        <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-700">
            Opportunité détectée
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-800">{opportunite.message}</p>
          {opportunite.gainEstimé && (
            <p className="mt-2 text-xs text-indigo-800">
              <strong>Gain estimé :</strong> {opportunite.gainEstimé}
            </p>
          )}
          <Link
            href={`/dashboard/sites/${slug}`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
          >
            {opportunite.cta.libelle}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ──────────── Onglet Ads ──────────── */

function OngletAds({ stats, slug }: { stats: StatsQuotidiennes; slug: string }) {
  const r = stats.resumeAds;
  return (
    <OngletPilier
      resume={r}
      slug={slug}
      cheminSection="ads"
      titre="Publicité"
      libelleOk="Pas d'alerte majeure. Trackers correctement installés et visibilité SERP conforme."
      libelleAbsent="Aucun audit publicité effectué pour ce site. Lance un premier audit pour voir le détail."
      libelleCta="Ouvrir le dashboard Publicité"
    />
  );
}

/* ──────────── Onglet SEO ──────────── */

function OngletSeo({ stats, slug }: { stats: StatsQuotidiennes; slug: string }) {
  const r = stats.resumeSeo;
  return (
    <OngletPilier
      resume={r}
      slug={slug}
      cheminSection="seo"
      titre="SEO"
      libelleOk="Fondations SEO en place. Pas de point bloquant détecté sur le dernier audit."
      libelleAbsent="Aucun audit SEO effectué pour ce site. Lance un premier audit pour voir le détail."
      libelleCta="Ouvrir le dashboard SEO"
    />
  );
}

function OngletPilier({
  resume,
  slug,
  cheminSection,
  titre,
  libelleOk,
  libelleAbsent,
  libelleCta,
}: {
  resume: StatsQuotidiennes["resumeAds"];
  slug: string;
  cheminSection: "ads" | "seo";
  titre: string;
  libelleOk: string;
  libelleAbsent: string;
  libelleCta: string;
}) {
  if (!resume.disponible) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <p className="mb-3">{libelleAbsent}</p>
        <Link
          href={`/dashboard/sites/${slug}/${cheminSection}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
        >
          {libelleCta}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </Link>
      </div>
    );
  }

  const couleur =
    resume.statut === "ok"
      ? "#059669"
      : resume.statut === "attention"
        ? "#d97706"
        : "#dc2626";

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Score {titre.toLowerCase()}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: couleur }}>
              {resume.scoreGlobal ?? "—"}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Dernier audit : {resume.dateAudit ? new Date(resume.dateAudit).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "—"}
          </p>
        </div>
        <Link
          href={`/dashboard/sites/${slug}/${cheminSection}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
        >
          {libelleCta}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      {resume.nbRecosCritiques + resume.nbRecosHautes === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {libelleOk}
        </div>
      ) : (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Actions prioritaires ({resume.nbRecosCritiques} critique·s, {resume.nbRecosHautes} haute·s)
          </p>
          <ul className="space-y-2">
            {resume.topRecos.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <span
                  className={`mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-bold uppercase ${
                    r.priorite === "critique"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {r.priorite}
                </span>
                <span className="text-sm text-slate-700">{r.titre}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ──────────── Onglet Sécurité ──────────── */

function OngletSecurite({
  stats,
  slug,
}: {
  stats: StatsQuotidiennes;
  slug: string;
}) {
  const r = stats.resumeSecurite;

  const couleur =
    r.statut === "ok"
      ? "#059669"
      : r.statut === "attention"
        ? "#d97706"
        : r.statut === "critique"
          ? "#dc2626"
          : "#64748b";

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Score sécurité
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold" style={{ color: couleur }}>
              {r.scoreGlobal ?? "—"}
            </span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Dernier audit : {r.dateAudit ? new Date(r.dateAudit).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) : "jamais"}
          </p>
        </div>
        <Link
          href={`/dashboard/sites/${slug}/securite`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
        >
          Ouvrir le dashboard Sécurité
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Incidents ouverts
          </p>
          {r.nbIncidentsOuverts === 0 ? (
            <p className="mt-1 text-sm text-emerald-700">Aucun incident ouvert.</p>
          ) : (
            <p className="mt-1 text-sm text-slate-800">
              <strong>{r.nbIncidentsOuverts}</strong> ouvert·s · {r.nbIncidentsCritiques} critique·s · {r.nbIncidentsHauts} haut·s
            </p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Certificat SSL
          </p>
          {r.sslExpirationJours === null ? (
            <p className="mt-1 text-sm text-slate-500">Non évalué.</p>
          ) : r.sslExpirationJours < 15 ? (
            <p className="mt-1 text-sm text-rose-700">
              Expire dans {r.sslExpirationJours} jour·s
            </p>
          ) : (
            <p className="mt-1 text-sm text-emerald-700">
              Valide ({r.sslExpirationJours} j restants)
            </p>
          )}
        </div>
      </div>

      {r.topRecos.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Actions prioritaires
          </p>
          <ul className="space-y-2">
            {r.topRecos.map((reco, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <span
                  className={`mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[10px] font-bold uppercase ${
                    reco.priorite === "critique"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {reco.priorite}
                </span>
                <span className="text-sm text-slate-700">{reco.titre}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.nbIncidentsOuverts === 0 &&
        r.topRecos.length === 0 &&
        r.statut === "ok" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Sécurité en place. Aucun problème détecté sur le dernier audit.
          </div>
        )}
    </div>
  );
}

/* ──────────── Primitives ──────────── */

function Carte({
  label,
  valeur,
  detail,
}: {
  label: string;
  valeur: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valeur}</p>
      <p className="text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}

function LigneDelta({
  label,
  aujourdhui,
  avant,
  deltaPct,
}: {
  label: string;
  aujourdhui: number;
  avant: number;
  deltaPct: number | null;
}) {
  const Icone =
    deltaPct === null || deltaPct === 0
      ? Minus
      : deltaPct > 0
        ? TrendingUp
        : TrendingDown;
  const couleur =
    deltaPct === null
      ? "text-slate-500"
      : deltaPct > 0
        ? "text-emerald-700"
        : deltaPct < 0
          ? "text-rose-700"
          : "text-slate-500";
  return (
    <div className="flex items-center justify-between">
      <span>
        <strong>{label} :</strong> {aujourdhui} aujourd&apos;hui vs {avant} il y a 7 j
      </span>
      <span className={`inline-flex items-center gap-1 text-sm font-semibold ${couleur}`}>
        <Icone className="h-4 w-4" strokeWidth={2.2} />
        {deltaPct === null ? "—" : deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
      </span>
    </div>
  );
}
