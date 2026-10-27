import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, Mail, Clock } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites, siteConfigs } from "@/lib/db/schema";
import { agregerStatsQuotidiennes } from "@/lib/axi-solver/rapport/agreger";
import { detecterOpportuniteUpsell } from "@/lib/axi-solver/rapport/upsell";
import { BoutonRenvoyerRapport } from "./bouton-renvoyer";

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

  const [site] = await db
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
    .limit(1);
  if (!site) notFound();

  const [config] = await db
    .select()
    .from(siteConfigs)
    .where(eq(siteConfigs.siteId, site.id))
    .limit(1);

  // Preview du rapport de la veille (si des données existent)
  const stats = await agregerStatsQuotidiennes({ siteId: site.id });
  const opportunite = detecterOpportuniteUpsell(stats);

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10">
        <Link
          href={`/dashboard/sites/${slug}`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour à {site.nomEntreprise}
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
        <header className="mb-4 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Mail className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Destinataire du rapport
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Configurable dans Paramètres du site → Email de notification
            </p>
          </div>
        </header>
        <p className="text-sm text-slate-700">
          {config?.emailNotification ? (
            <>
              Rapport envoyé à{" "}
              <strong className="font-mono">{config.emailNotification}</strong>
            </>
          ) : (
            <>
              Pas d&apos;email de notification spécifique configuré — le
              rapport sera envoyé à l&apos;email de votre compte AxiSolver
              ({user.email}).
            </>
          )}
        </p>
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

        {opportunite.nature && (
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <header className="mb-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-slate-600" strokeWidth={2} aria-hidden />
          <h2 className="text-sm font-semibold text-slate-900">
            Historique des envois
          </h2>
        </header>
        <p className="text-xs text-slate-600">
          L&apos;historique détaillé des rapports envoyés (date, destinataire,
          statut Brevo) arrivera dans une mise à jour prochaine.
        </p>
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
