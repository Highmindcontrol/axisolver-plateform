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
          Rapports quotidiens
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Vous recevez un email tous les matins à 7h
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          AxiSolver envoie chaque jour un rapport des 24 dernières heures
          à l&apos;adresse configurée pour ce site. Résumé des conversations,
          tickets AXI, et opportunités détectées.
        </p>
      </header>

      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Mail className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Destinataires du rapport
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Par défaut, les emails sont envoyés à l&apos;adresse de
              l&apos;administrateur du compte.
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
            <strong> Envoyer maintenant </strong>pour générer le premier).
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {historique.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/dashboard/sites/${slug}/rapports/${h.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
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
                      <p className="mt-0.5 text-xs text-slate-500">
                        Envoyé le{" "}
                        {h.creeLe.toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {h.nbDestinatairesSupp > 0 &&
                          ` · +${h.nbDestinatairesSupp} destinataire${h.nbDestinatairesSupp > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        h.mode === "manuel"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {h.mode === "manuel" ? "Manuel" : "Auto"}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 text-slate-400"
                      strokeWidth={2}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
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
