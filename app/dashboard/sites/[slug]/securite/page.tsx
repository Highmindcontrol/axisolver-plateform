import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import {
  ChevronLeft,
  Shield,
  AlertCircle,
  AlertTriangle,
  Clock,
  Radar,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  ArrowRight,
  Eye,
  Lock,
  Wifi,
  Cookie,
  Globe,
  FolderLock,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  securityAudits,
  securityIncidents,
  siteConfigs,
  type FindingSecurity,
  type RecommandationSecurity,
} from "@/lib/db/schema";
import {
  listerInterventions,
  verifierPluginPourSite,
  verifierRemediationDisponible,
} from "@/lib/packs/security-shield";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { FormulaireAuditSecurity } from "./formulaire-audit";
import { BoutonResoudreIncident } from "./bouton-resoudre";
import { RecosInteractives } from "./recos-interactives";
import { SelecteurModeRemediation } from "./selecteur-mode-remediation";
import { BandeauPlugin } from "./bandeau-plugin";
import { SectionInterventions } from "./section-interventions";

export const dynamic = "force-dynamic";
// Les audits sécurité peuvent prendre 20-30s (fetch 15s + TLS/expo/reputation).
// On relève le timeout Vercel (default 15s) pour éviter le 500 côté client.
export const maxDuration = 60;

export default async function PageSecuriteSite({
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

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) notFound();

  const audits = await db
    .select()
    .from(securityAudits)
    .where(eq(securityAudits.siteId, site.id))
    .orderBy(desc(securityAudits.creeLe))
    .limit(10);

  // Mode AXI Security Shield (depuis site_configs). Tolère l'absence
  // de la colonne tant que la migration 0020 n'est pas appliquée.
  let modeRemediation: "desactive" | "validation" | "automatique" = "desactive";
  try {
    const [config] = await db
      .select({ mode: siteConfigs.modeRemediationSecurite })
      .from(siteConfigs)
      .where(eq(siteConfigs.siteId, site.id))
      .limit(1);
    if (config?.mode) modeRemediation = config.mode;
  } catch {
    // Migration 0020 non appliquée — reste sur 'desactive'
  }

  // Vérifie si un accès est configuré + si le plugin WP est installé
  const statutPlugin = await verifierPluginPourSite(site.id);
  const remediationDispo = await verifierRemediationDisponible(site.id);
  const aAccesConfigure = remediationDispo.disponible;
  // Remédiation possible si plugin WP OK OU accès GitHub actif
  const remediationActive =
    !!statutPlugin?.installe ||
    remediationDispo.typeAcces === "github_repo";

  // Interventions AXI récentes + en attente de validation
  const interventions = await listerInterventions(site.id, 30);

  const dernier = audits[0] ?? null;
  const auditsTermines = audits.filter((a) => a.statut === "termine");
  const precedent = auditsTermines[1] ?? null;

  const incidentsOuverts = await db
    .select()
    .from(securityIncidents)
    .where(
      and(
        eq(securityIncidents.siteId, site.id),
        eq(securityIncidents.statut, "ouvert"),
      ),
    )
    .orderBy(desc(securityIncidents.detecteLe))
    .limit(20);

  const recos = (dernier?.recommandations as RecommandationSecurity[]) ?? [];
  const findings = (dernier?.findings as FindingSecurity[]) ?? [];
  const compteurRecos = {
    critique: recos.filter((r) => r.priorite === "critique").length,
    haute: recos.filter((r) => r.priorite === "haute").length,
    moyenne: recos.filter((r) => r.priorite === "moyenne").length,
    basse: recos.filter((r) => r.priorite === "basse").length,
  };

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <AutoRefresh actif={dernier?.statut === "en_cours"} />
      <header className="mb-10">
        <div className="mb-5 flex items-start justify-between gap-6">
          <Link
            href={`/dashboard/sites/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Retour à {site.nomSite ?? site.nomEntreprise}
          </Link>
          <p className="hidden items-center gap-2 text-right text-xl font-semibold uppercase tracking-[0.22em] text-slate-900 sm:inline-flex md:text-2xl lg:text-3xl">
            <Shield
              className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7"
              strokeWidth={2}
              aria-hidden
            />
            AxiSolver Security Shield
          </p>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Sécurité de {site.domainePrincipal}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Audit complet sur 6 piliers : headers HTTP, TLS, exposition de
          fichiers, cookies, contenu, réputation.
        </p>
      </header>

      {/* ────── Bandeau plugin AXI Security Shield ────── */}
      <BandeauPlugin
        statutPlugin={statutPlugin}
        aAcces={aAccesConfigure}
        typeAcces={remediationDispo.typeAcces}
        slug={slug}
      />

      {/* ────── Bandeau monitoring automatique ────── */}
      <section className="mb-10 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Radar className="h-4 w-4 flex-shrink-0" strokeWidth={2.2} aria-hidden />
          <p>
            <strong>Monitoring automatique :</strong> contrôle toutes les 6h
            (status, SSL, hash HTML) · Audit complet le 1er de chaque mois à 8h UTC.
          </p>
        </div>
        <CalendarClock
          className="hidden h-4 w-4 flex-shrink-0 text-blue-500 md:block"
          strokeWidth={2.2}
          aria-hidden
        />
      </section>

      {/* ────── Incidents ouverts (si existants) ────── */}
      {incidentsOuverts.length > 0 && (
        <section className="mb-10 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <header className="mb-5 flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700"
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-rose-900">
                {incidentsOuverts.length} incident
                {incidentsOuverts.length > 1 ? "s" : ""} ouvert
                {incidentsOuverts.length > 1 ? "s" : ""}
              </h2>
              <p className="mt-0.5 text-xs text-rose-700">
                Détecté·s par le monitoring périodique
              </p>
            </div>
          </header>
          <ul className="space-y-3">
            {incidentsOuverts.map((inc) => (
              <li
                key={inc.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-white p-4"
              >
                <div className="flex-1">
                  <p className="flex items-center gap-2">
                    <BadgeSeverite severite={inc.severite} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {inc.type.replace(/_/g, " ")}
                    </span>
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-slate-900">
                    {inc.message}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Détecté le{" "}
                    {new Date(inc.detecteLe).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <BoutonResoudreIncident incidentId={inc.id} slug={slug} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ────── Score global enrichi + bouton relancer ────── */}
      {dernier && dernier.statut === "termine" && (
        <section className="mb-6">
          <ScoreGlobalCarte
            score={dernier.scoreGlobal ?? 0}
            date={dernier.creeLe}
            certificatExpireeLe={dernier.certificatSslExpireeLe}
            compteurRecos={compteurRecos}
            scorePrecedent={precedent?.scoreGlobal ?? null}
            slug={slug}
            modeRemediation={modeRemediation}
          />

          {/* Mini-cartes piliers cliquables (filtre les recos en bas) */}
          <PiliersGrille
            scores={{
              headers: dernier.scoreHeaders,
              tls: dernier.scoreTls,
              exposition: dernier.scoreExposition,
              cookies: dernier.scoreCookies,
              contenu: dernier.scoreContenu,
              reputation: dernier.scoreReputation,
            }}
            compteurRecosParPilier={compteurRecosParPilier(recos)}
          />
        </section>
      )}

      {/* ────── Recos interactives + filtres + findings ────── */}
      {dernier && dernier.statut === "termine" && recos.length > 0 && (
        <section className="mb-10">
          <RecosInteractives
            recommandations={recos}
            findings={findings}
            slug={slug}
            auditId={dernier.id}
            pluginInstalle={remediationActive}
          />
        </section>
      )}

      {/* ────── Statuts transitoires (en_cours / echec / aucun) ────── */}
      {dernier && dernier.statut === "en_cours" && (
        <section className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" strokeWidth={2} />
            Audit en cours… rechargez la page dans quelques secondes.
          </p>
        </section>
      )}

      {dernier && dernier.statut === "echec" && (
        <section className="mb-10 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" strokeWidth={2} />
            L&apos;audit a échoué : {dernier.erreur}
          </p>
          <div className="mt-4">
            <FormulaireAuditSecurity slug={slug} />
          </div>
        </section>
      )}

      {!dernier && (
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Shield
            className="mx-auto h-10 w-10 text-slate-400"
            strokeWidth={1.5}
          />
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            Aucun audit encore réalisé
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Lance le premier audit pour découvrir le niveau de sécurité
            de ton site sur 6 piliers.
          </p>
          <div className="mt-5 flex justify-center">
            <FormulaireAuditSecurity slug={slug} />
          </div>
        </section>
      )}

      {/* ────── Bandeau mode actif AXI ────── */}
      {modeRemediation !== "desactive" && (
        <section className="mb-10 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700"
            strokeWidth={2.2}
            aria-hidden
          />
          <p>
            {modeRemediation === "automatique" ? (
              <>
                <strong>Mode automatique actif.</strong> AXI Security Shield
                corrigera automatiquement tous les problèmes qu&apos;il est
                capable de traiter dès qu&apos;il les détecte, sans
                validation préalable. Le journal des interventions reste
                consultable à tout moment.
              </>
            ) : (
              <>
                <strong>Mode « avec validation » actif.</strong> AXI
                Security Shield proposera chaque intervention et attendra
                ton approbation avant d&apos;agir. Les propositions en
                attente apparaîtront dans le journal des interventions.
              </>
            )}
          </p>
        </section>
      )}

      {/* ────── Interventions AXI (en attente + journal) ────── */}
      <SectionInterventions interventions={interventions} slug={slug} />

      {/* ────── Catalogue capacités AxiSolver Security Shield ────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm">
        <header className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
            Ce que surveille AxiSolver Security Shield
          </p>
          <h2 className="mt-2 text-base font-semibold text-slate-900">
            6 piliers audités, surveillés en continu, traités automatiquement
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Catalogue complet pour savoir ce que tu peux déléguer à AXI.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CapacitePilier
            icone={Lock}
            titre="Headers HTTP"
            audits={[
              "HSTS (Strict-Transport-Security)",
              "Content-Security-Policy",
              "X-Frame-Options (clickjacking)",
              "X-Content-Type-Options (nosniff)",
              "Referrer-Policy & Permissions-Policy",
              "Masquage versions serveur / X-Powered-By",
            ]}
          />
          <CapacitePilier
            icone={Shield}
            titre="TLS / HTTPS"
            audits={[
              "Validité connexion port 443",
              "Expiration certificat SSL",
              "Subject Alternative Name (SAN)",
              "Protocoles autorisés (TLS 1.2 / 1.3)",
              "Alerte renouvellement certificat",
            ]}
          />
          <CapacitePilier
            icone={FolderLock}
            titre="Exposition fichiers"
            audits={[
              ".env, .git/config, backups SQL",
              "wp-admin, phpmyadmin, administrator",
              "robots.txt & security.txt",
              "Fichiers config PHP exposés",
            ]}
          />
          <CapacitePilier
            icone={Cookie}
            titre="Cookies"
            audits={[
              "Attribut Secure sur les cookies",
              "Attribut HttpOnly (protection XSS)",
              "Attribut SameSite (protection CSRF)",
              "Cohérence SameSite=None + Secure",
            ]}
          />
          <CapacitePilier
            icone={Eye}
            titre="Contenu de la page"
            audits={[
              "Mixed content (http dans page https)",
              "Iframes tiers sans sandbox",
              "Formulaires avec action HTTP",
              "Version CMS visible (meta generator)",
              "Liens target=_blank sans noopener",
            ]}
          />
          <CapacitePilier
            icone={Globe}
            titre="Réputation / monitoring"
            audits={[
              "Redirection HTTP → HTTPS forcée",
              "Détection changement HTML",
              "Hash HTML surveillé toutes les 6h",
              "Alerte si noindex apparaît",
              "Alerte si cert devient invalide",
            ]}
          />
        </div>
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900">
          <p>
            <strong>AXI Security Shield est inclus dans ton abonnement
            AxiSolver.</strong> Pour chaque recommandation, AXI peut
            exécuter l&apos;intervention directement — il te suffit de
            l&apos;autoriser.
          </p>
        </div>
      </section>

      {/* ────── Historique en tableau alterné ────── */}
      {audits.length > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-5 flex items-center gap-3">
            <Clock
              className="h-5 w-5 text-slate-600"
              strokeWidth={2}
              aria-hidden
            />
            <h2 className="text-sm font-semibold text-slate-900">
              Historique des audits
            </h2>
          </header>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="hidden grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-slate-200 bg-slate-100 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 md:grid">
              <span>Date</span>
              <span>Déclencheur</span>
              <span>Score</span>
            </div>
            <ul>
              {audits.slice(1).map((a) => (
                <li
                  key={a.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 odd:bg-white even:bg-slate-50 md:grid-cols-[1fr_auto_auto]"
                >
                  <p className="text-sm font-medium text-slate-900">
                    {new Date(a.creeLe).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700 md:inline-flex">
                    {a.declencheur === "auto_mensuel"
                      ? "cron mensuel"
                      : a.declencheur === "monitoring"
                        ? "monitoring"
                        : "manuel"}
                  </span>
                  <span className="justify-self-end">
                    {a.statut === "termine" ? (
                      <ScoreMini score={a.scoreGlobal ?? 0} />
                    ) : a.statut === "en_cours" ? (
                      <span className="text-xs text-amber-700">en cours</span>
                    ) : (
                      <span className="text-xs text-rose-700">échec</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

/* ───────────────── Composants internes ───────────────── */

function ScoreGlobalCarte({
  score,
  date,
  certificatExpireeLe,
  compteurRecos,
  scorePrecedent,
  slug,
  modeRemediation,
}: {
  score: number;
  date: Date;
  certificatExpireeLe: Date | null;
  compteurRecos: Record<"critique" | "haute" | "moyenne" | "basse", number>;
  scorePrecedent: number | null;
  slug: string;
  modeRemediation: "desactive" | "validation" | "automatique";
}) {
  const couleur =
    score >= 80
      ? "from-emerald-700 to-teal-700"
      : score >= 60
        ? "from-amber-700 to-orange-700"
        : "from-rose-700 to-pink-700";
  const label =
    score >= 80 ? "Protégé" : score >= 60 ? "Correct" : "À renforcer";

  const joursSsl = certificatExpireeLe
    ? Math.round(
        (new Date(certificatExpireeLe).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const delta =
    scorePrecedent !== null && scorePrecedent !== undefined
      ? score - scorePrecedent
      : null;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${couleur} p-6 text-white shadow-lg md:p-8`}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_auto_minmax(260px,320px)] md:items-stretch">
        {/* ─── Colonne gauche : stats du score ─── */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] opacity-90">
            Score sécurité global
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="text-5xl font-bold">{score}</p>
            <p className="text-xl opacity-80">/100</p>
            {delta !== null && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                {delta > 0 ? (
                  <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                ) : delta < 0 ? (
                  <TrendingDown className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  <Minus className="h-3 w-3" strokeWidth={2.5} />
                )}
                {delta > 0 ? `+${delta}` : delta}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm opacity-90">
            {label} ·{" "}
            {new Date(date).toLocaleString("fr-FR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>

          {/* Compteurs par priorité */}
          <div className="mt-4 flex flex-wrap gap-2">
            <PastilleRecos
              label="Critique"
              count={compteurRecos.critique}
              fallback="aucun"
            />
            <PastilleRecos label="Haute" count={compteurRecos.haute} />
            <PastilleRecos label="Moyenne" count={compteurRecos.moyenne} />
            <PastilleRecos label="Basse" count={compteurRecos.basse} />
          </div>

          {/* Certificat SSL en bas de la colonne gauche */}
          {joursSsl !== null && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-xl bg-white/15 px-4 py-2 backdrop-blur-sm">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-90">
                  Certificat SSL
                </p>
                <p className="text-xs opacity-80">
                  {certificatExpireeLe &&
                    new Date(certificatExpireeLe).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <p className="text-xl font-bold">
                {joursSsl > 0 ? `J-${joursSsl}` : "expiré"}
              </p>
            </div>
          )}
        </div>

        {/* ─── Séparateur vertical ─── */}
        <div
          className="hidden w-px bg-white/30 md:block"
          aria-hidden
        />

        {/* ─── Colonne droite : panneau actions ─── */}
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] opacity-90">
            Actions AXI
          </p>

          {/* Bouton 1 : Lancer un audit */}
          <FormulaireAuditSecurity slug={slug} />

          {/* Bouton 2 : Rapport pour webmaster */}
          <Link
            href={`/dashboard/sites/${slug}/securite/rapport-webmaster`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <FileText className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            Rapport pour le webmaster
          </Link>

          {/* Bouton 3 : Accès au site pour AXI */}
          <Link
            href={`/dashboard/sites/${slug}/securite/acces`}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
          >
            <KeyRound className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            Accès au site pour AXI
          </Link>

          {/* Toggle mode AXI Security Shield */}
          <SelecteurModeRemediation
            slug={slug}
            modeActuel={modeRemediation}
          />
        </div>
      </div>
    </div>
  );
}

function PastilleRecos({
  label,
  count,
  fallback,
}: {
  label: string;
  count: number;
  fallback?: string;
}) {
  if (count === 0 && !fallback) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur-sm">
      <span className="font-bold">{count === 0 ? "0" : count}</span>
      <span className="opacity-80">{label.toLowerCase()}</span>
    </span>
  );
}

function PiliersGrille({
  scores,
  compteurRecosParPilier,
}: {
  scores: {
    headers: number | null;
    tls: number | null;
    exposition: number | null;
    cookies: number | null;
    contenu: number | null;
    reputation: number | null;
  };
  compteurRecosParPilier: Record<string, number>;
}) {
  const piliers: Array<{ id: keyof typeof scores; label: string }> = [
    { id: "headers", label: "Headers" },
    { id: "tls", label: "TLS" },
    { id: "exposition", label: "Exposition" },
    { id: "cookies", label: "Cookies" },
    { id: "contenu", label: "Contenu" },
    { id: "reputation", label: "Réputation" },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
      {piliers.map((p) => {
        const val = scores[p.id] ?? 0;
        const nbRecos = compteurRecosParPilier[p.id] ?? 0;
        const couleur =
          val >= 80
            ? "text-emerald-700"
            : val >= 60
              ? "text-amber-700"
              : "text-rose-700";
        return (
          <a
            key={p.id}
            href={`#recos-${p.id}`}
            className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:bg-indigo-50/30"
          >
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                {p.label}
              </p>
              {nbRecos > 0 && (
                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700">
                  {nbRecos}
                </span>
              )}
            </div>
            <p className={`mt-1 text-2xl font-bold ${couleur}`}>{val}</p>
            <p className="text-[11px] text-slate-400">/ 100</p>
          </a>
        );
      })}
    </div>
  );
}

function ScoreMini({ score }: { score: number }) {
  const couleur =
    score >= 80
      ? "bg-emerald-100 text-emerald-800"
      : score >= 60
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${couleur}`}
    >
      {score}/100
    </span>
  );
}

function BadgeSeverite({
  severite,
}: {
  severite: "critique" | "haute" | "moyenne" | "basse";
}) {
  const styles: Record<string, string> = {
    critique: "bg-rose-200 text-rose-900 border-rose-300",
    haute: "bg-orange-200 text-orange-900 border-orange-300",
    moyenne: "bg-amber-100 text-amber-900 border-amber-200",
    basse: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[severite]}`}
    >
      <AlertCircle className="h-3 w-3" strokeWidth={2.4} />
      {severite}
    </span>
  );
}

function compteurRecosParPilier(
  recos: RecommandationSecurity[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of recos) {
    out[r.pilier] = (out[r.pilier] ?? 0) + 1;
  }
  return out;
}

function CapacitePilier({
  icone: Icone,
  titre,
  audits,
}: {
  icone: typeof Shield;
  titre: string;
  audits: string[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white"
          aria-hidden
        >
          <Icone className="h-4 w-4" strokeWidth={2} />
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{titre}</h3>
      </div>
      <ul className="space-y-1.5 text-xs text-slate-700">
        {audits.map((a, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-slate-400">·</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
