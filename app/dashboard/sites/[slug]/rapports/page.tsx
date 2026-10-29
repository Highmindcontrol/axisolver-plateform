import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import {
  ChevronLeft,
  Mail,
  Clock,
  UserPlus,
  FileText,
  ArrowRight,
  CalendarRange,
  Search,
  Megaphone,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  siteConfigs,
  siteRapportDestinataires,
  rapportsQuotidiens,
} from "@/lib/db/schema";
import { agregerStatsQuotidiennes } from "@/lib/axi-solver/rapport/agreger";
import { agregerStatsMensuelles } from "@/lib/axi-solver/rapport/agreger-mensuel";
import { detecterOpportuniteUpsell } from "@/lib/axi-solver/rapport/upsell";
import { BoutonRenvoyerRapport } from "./bouton-renvoyer";
import {
  BoutonRetirerDestinataire,
  FormulaireAjoutDestinataire,
} from "./formulaire-destinataire";

export const dynamic = "force-dynamic";

export default async function PageRapportsSite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  let site:
    | {
        id: string;
        slug: string;
        nomEntreprise: string;
        nomSite: string | null;
        domainePrincipal: string;
      }
    | undefined;
  try {
    const rows = await db
      .select({
        id: sites.id,
        slug: sites.slug,
        nomEntreprise: sites.nomEntreprise,
        nomSite: sites.nomSite,
        domainePrincipal: sites.domainePrincipal,
      })
      .from(sites)
      .where(
        and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)),
      )
      .limit(1);
    site = rows[0];
  } catch (e) {
    console.error("[rapports] lookup site échec:", e);
  }
  if (!site) notFound();

  let config:
    | { nomAssistant: string; emailNotification: string | null }
    | undefined;
  try {
    const rows = await db
      .select({
        nomAssistant: siteConfigs.nomAssistant,
        emailNotification: siteConfigs.emailNotification,
      })
      .from(siteConfigs)
      .where(eq(siteConfigs.siteId, site.id))
      .limit(1);
    config = rows[0];
  } catch (e) {
    console.error("[rapports] lookup config échec:", e);
  }

  // Destinataires supplémentaires du rapport. Lecture tolérante
  // tant que la table n'est pas appliquée en prod.
  let destinatairesSupp: Array<{
    id: string;
    email: string;
    prenom: string | null;
    creeLe: Date;
  }> = [];
  try {
    destinatairesSupp = await db
      .select({
        id: siteRapportDestinataires.id,
        email: siteRapportDestinataires.email,
        prenom: siteRapportDestinataires.prenom,
        creeLe: siteRapportDestinataires.creeLe,
      })
      .from(siteRapportDestinataires)
      .where(eq(siteRapportDestinataires.siteId, site.id))
      .orderBy(siteRapportDestinataires.creeLe);
  } catch (e) {
    console.error("[rapports] lookup destinataires échec:", e);
  }

  // Historique des rapports persistés. Tolère l'absence de la table
  // (migration 0019 pas encore appliquée en prod).
  let historique: Array<{
    id: string;
    creeLe: Date;
    periodeDebut: Date;
    mode: string;
    nbDestinatairesSupp: number;
  }> = [];
  try {
    historique = await db
      .select({
        id: rapportsQuotidiens.id,
        creeLe: rapportsQuotidiens.creeLe,
        periodeDebut: rapportsQuotidiens.periodeDebut,
        mode: rapportsQuotidiens.mode,
        nbDestinatairesSupp: rapportsQuotidiens.nbDestinatairesSupp,
      })
      .from(rapportsQuotidiens)
      .where(eq(rapportsQuotidiens.siteId, site.id))
      .orderBy(desc(rapportsQuotidiens.creeLe))
      .limit(30);
  } catch (e) {
    console.error("[rapports] historique échec:", e);
  }

  // Preview du rapport de la veille (si des données existent).
  // Tolère un échec (données partielles / timeout DB) pour éviter 500.
  let stats: Awaited<ReturnType<typeof agregerStatsQuotidiennes>> | null = null;
  let opportunite: ReturnType<typeof detecterOpportuniteUpsell> | null = null;
  let erreurAgregation: string | null = null;
  try {
    stats = await agregerStatsQuotidiennes({ siteId: site.id });
    opportunite = detecterOpportuniteUpsell(stats);
  } catch (e) {
    erreurAgregation = e instanceof Error ? e.message : String(e);
    console.error("[rapports] agregerStatsQuotidiennes échec:", e);
  }

  // Stats cumulées mois en cours. Tolère un échec.
  let statsMois: Awaited<ReturnType<typeof agregerStatsMensuelles>> | null = null;
  try {
    statsMois = await agregerStatsMensuelles({ siteId: site.id });
  } catch (e) {
    console.error("[rapports] agregerStatsMensuelles échec:", e);
  }

  const nomMois = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10">
        <Link
          href={`/dashboard/sites/${slug}`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour à {site.nomSite ?? site.nomEntreprise}
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Rapports
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Activité de {site.nomSite ?? site.nomEntreprise}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Vue consolidée du mois en cours, aperçu du rapport quotidien
          et historique des envois.
        </p>
      </header>

      {/* ────── 1. Depuis le début du mois ────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"
            aria-hidden
          >
            <CalendarRange className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Depuis le début du mois
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 first-letter:uppercase">
              {nomMois}
            </p>
          </div>
        </header>

        {!statsMois ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Pas encore de données d&apos;activité pour générer la vue mensuelle.
          </div>
        ) : (
          <>
            {/* Grille des 4 cartes principales conversations/visiteurs/tickets/taux */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <CarteStat
                label="Visiteurs cumulés"
                valeur={statsMois.nbVisiteursUniques.toLocaleString("fr-FR")}
                detail={`${statsMois.nbConversations.toLocaleString("fr-FR")} conv.`}
              />
              <CarteStat
                label="Taux résolution"
                valeur={
                  statsMois.nbConversations > 0
                    ? `${statsMois.tauxResolutionPct}%`
                    : "—"
                }
                detail={`${statsMois.nbConversationsResolues} résolues`}
              />
              <CarteStat
                label="Tickets AXI"
                valeur={(
                  statsMois.nbTicketsOuverts + statsMois.nbTicketsResolus
                ).toLocaleString("fr-FR")}
                detail={`${statsMois.nbTicketsChauds} chaud·s · ${statsMois.nbTicketsUrgents} urgent·s`}
              />
              <CarteStat
                label="Satisfaction moy."
                valeur={
                  statsMois.scoreSatisfactionMoyen !== null
                    ? `${statsMois.scoreSatisfactionMoyen}/100`
                    : "—"
                }
                detail="Score heuristique"
              />
            </div>

            {/* Mini-cartes piliers Ads / SEO / Sécurité */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <MiniCartePilier
                titre="Publicité"
                icone={Megaphone}
                score={statsMois.ads.scoreGlobal}
                disponible={statsMois.ads.disponible}
                detail={
                  statsMois.ads.disponible
                    ? `Dernier audit : ${formatDate(statsMois.ads.dateAudit)}`
                    : "Aucun audit"
                }
                href={`/dashboard/sites/${slug}/ads`}
              />
              <MiniCartePilier
                titre="SEO"
                icone={Search}
                score={statsMois.seo.scoreGlobal}
                disponible={statsMois.seo.disponible}
                detail={
                  statsMois.seo.disponible
                    ? `Dernier audit : ${formatDate(statsMois.seo.dateAudit)}`
                    : "Aucun audit"
                }
                href={`/dashboard/sites/${slug}/seo`}
              />
              <MiniCartePilier
                titre="Sécurité"
                icone={ShieldCheck}
                score={statsMois.securite.scoreGlobal}
                disponible={statsMois.securite.disponible}
                detail={
                  statsMois.securite.nbIncidentsCritiquesMois > 0
                    ? `${statsMois.securite.nbIncidentsCritiquesMois} incident·s critique·s ce mois`
                    : statsMois.securite.nbIncidentsMois > 0
                      ? `${statsMois.securite.nbIncidentsMois} incident·s ce mois`
                      : "Aucun incident ce mois"
                }
                href={`/dashboard/sites/${slug}/securite`}
              />
            </div>

            {/* 3 colonnes contenu détaillé mois */}
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* Top questions */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Top questions
                </p>
                {statsMois.topQuestionsMois.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Aucune question récurrente ce mois.
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {statsMois.topQuestionsMois.map((q, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-slate-400">·</span>
                        <span className="line-clamp-2">{q}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Mots-clés SEO */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Mots-clés positionnés
                </p>
                {statsMois.seo.motsClesTestes.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Aucun audit SEO disponible.{" "}
                    <Link
                      href={`/dashboard/sites/${slug}/seo`}
                      className="text-indigo-700 hover:underline"
                    >
                      Lancer un audit
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {statsMois.seo.motsClesTestes.slice(0, 10).map((mc, i) => (
                      <span
                        key={i}
                        className="inline-flex rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200"
                      >
                        {mc}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Concurrents SERP */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-600">
                  <Megaphone className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Concurrents SERP
                </p>
                {statsMois.ads.concurrentsTop.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Aucun audit publicité disponible.{" "}
                    <Link
                      href={`/dashboard/sites/${slug}/ads`}
                      className="text-indigo-700 hover:underline"
                    >
                      Lancer un audit
                    </Link>
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs text-slate-700">
                    {statsMois.ads.concurrentsTop.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate font-medium">{c.nom}</span>
                        <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                          #{c.position}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Intentions cumulées */}
            {statsMois.nbDemandesRdv +
              statsMois.nbDemandesTarif +
              statsMois.nbDemandesRappel >
              0 && (
              <div className="mt-6 grid grid-cols-3 gap-3">
                <IntentionCarte
                  label="Demandes RDV"
                  valeur={statsMois.nbDemandesRdv}
                />
                <IntentionCarte
                  label="Demandes tarifs"
                  valeur={statsMois.nbDemandesTarif}
                />
                <IntentionCarte
                  label="Demandes rappel"
                  valeur={statsMois.nbDemandesRappel}
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* ────── 2. Aperçu rapport 24h ────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Aperçu du rapport des 24 dernières heures
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Voici ce que vous recevrez demain matin si l&apos;activité
              reste la même.
            </p>
          </div>
          <BoutonRenvoyerRapport slug={slug} />
        </header>

        {!stats && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            {erreurAgregation
              ? `Impossible d'afficher la preview : ${erreurAgregation}.`
              : "Pas encore de données d'activité pour générer la preview."}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <CarteStat
                label="Visiteurs"
                valeur={stats.nbVisiteursUniques.toString()}
                detail={`${stats.nbConversations} conv.`}
              />
              <CarteStat
                label="Tours moy."
                valeur={stats.nbToursMoyen.toFixed(1)}
                detail={`${stats.nbToursTotal} au total`}
              />
              <CarteStat
                label="Tickets"
                valeur={(
                  stats.nbTicketsOuverts + stats.nbTicketsResolus
                ).toString()}
                detail={`${stats.nbTicketsChauds} chaud·s`}
              />
              <CarteStat
                label="Taux résolution"
                valeur={
                  stats.nbConversations > 0
                    ? `${Math.round(((stats.nbConversations - stats.conversationsSansResolution) / stats.nbConversations) * 100)}%`
                    : "—"
                }
                detail={`${stats.conversationsSansResolution} non résolu·es`}
              />
            </div>

            {opportunite?.nature && (
              <div className="mt-6 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-700">
                  💡 Opportunité détectée (section upsell du rapport)
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">
                  {opportunite.message}
                </p>
                {opportunite.gainEstimé && (
                  <p className="mt-2 text-xs text-indigo-800">
                    <strong>Gain estimé :</strong> {opportunite.gainEstimé}
                  </p>
                )}
              </div>
            )}

            {stats.topQuestions.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-semibold text-slate-900">
                  Top questions
                </p>
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
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <Clock className="h-5 w-5 text-slate-600" strokeWidth={2} aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900">
            Historique des rapports envoyés
          </h2>
        </header>

        {historique.length === 0 ? (
          <p className="text-sm text-slate-600">
            Aucun rapport archivé pour l&apos;instant. Les rapports envoyés
            apparaîtront ici une fois disponibles (clique sur
            <strong> Envoyer un test maintenant </strong>pour générer le premier).
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-slate-200 bg-slate-100 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 md:grid">
              <span>Rapport</span>
              <span>Envoyé le</span>
              <span>Mode</span>
              <span className="w-4" aria-hidden />
            </div>
            <ul>
              {historique.map((h) => (
                <li
                  key={h.id}
                  className="odd:bg-white even:bg-slate-50 hover:bg-indigo-50/40"
                >
                  <Link
                    href={`/dashboard/sites/${slug}/rapports/${h.id}`}
                    className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <FileText
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500"
                        strokeWidth={2.2}
                        aria-hidden
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Rapport du{" "}
                          {h.periodeDebut.toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                        {h.nbDestinatairesSupp > 0 && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            +{h.nbDestinatairesSupp} destinataire
                            {h.nbDestinatairesSupp > 1 ? "s" : ""} supp.
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="hidden text-xs text-slate-600 md:block">
                      {h.creeLe.toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <span
                      className={`inline-flex justify-self-end rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:justify-self-start ${
                        h.mode === "manuel"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {h.mode === "manuel" ? "Manuel" : "Auto"}
                    </span>
                    <ArrowRight
                      className="hidden h-4 w-4 text-slate-400 md:block"
                      strokeWidth={2}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ────── 4. Destinataires + info email (section secondaire) ────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Mail className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Destinataires du rapport quotidien
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Un email est envoyé tous les matins à 7h avec le résumé
              des 24 dernières heures.
            </p>
          </div>
        </header>

        {/* Destinataire par défaut (admin du compte) */}
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-start gap-3">
            <Mail
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-700"
              strokeWidth={2.2}
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium text-slate-900">
                {config?.emailNotification ?? user.email}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {config?.emailNotification
                  ? "Email de notification configuré pour ce site."
                  : "Email de l'administrateur du compte AxiSolver."}
              </p>
            </div>
          </div>
          <span className="flex-shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
            Par défaut
          </span>
        </div>

        {/* Liste des destinataires supplémentaires */}
        {destinatairesSupp.length > 0 && (
          <ul className="mb-5 space-y-2">
            {destinatairesSupp.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <UserPlus
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {d.prenom ? `${d.prenom} — ` : ""}
                      {d.email}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Ajouté le{" "}
                      {d.creeLe.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <BoutonRetirerDestinataire slug={slug} destinataireId={d.id} />
              </li>
            ))}
          </ul>
        )}

        {/* Formulaire d'ajout */}
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
          <p className="mb-1 text-sm font-medium text-slate-900">
            Ajouter un destinataire
          </p>
          <p className="mb-4 text-xs leading-relaxed text-slate-600">
            La personne recevra chaque matin le rapport du site avec une
            mention claire indiquant que vous l&apos;avez ajoutée comme
            destinataire.
          </p>
          <FormulaireAjoutDestinataire slug={slug} />
        </div>
      </section>
    </div>
  );
}

function MiniCartePilier({
  titre,
  icone: Icone,
  score,
  disponible,
  detail,
  href,
}: {
  titre: string;
  icone: typeof Mail;
  score: number | null;
  disponible: boolean;
  detail: string;
  href: string;
}) {
  const couleur =
    !disponible || score === null
      ? "#64748b"
      : score >= 75
        ? "#059669"
        : score >= 50
          ? "#d97706"
          : "#dc2626";
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:bg-indigo-50/30"
    >
      <div className="mb-2 flex items-center gap-2">
        <Icone className="h-4 w-4 text-slate-600" strokeWidth={2.2} aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
          {titre}
        </span>
        <ArrowRight
          className="ml-auto h-3.5 w-3.5 text-slate-300 transition group-hover:text-indigo-500"
          strokeWidth={2.2}
        />
      </div>
      <p className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: couleur }}>
          {score !== null ? score : "—"}
        </span>
        {score !== null && (
          <span className="text-xs text-slate-400">/100</span>
        )}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
    </Link>
  );
}

function IntentionCarte({
  label,
  valeur,
}: {
  label: string;
  valeur: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">{valeur}</p>
    </div>
  );
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function CarteStat({
  label,
  valeur,
  detail,
}: {
  label: string;
  valeur: string;
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
