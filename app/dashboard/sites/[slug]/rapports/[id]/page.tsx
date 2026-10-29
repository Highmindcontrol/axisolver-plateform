import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, Mail, Calendar } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { rapportsQuotidiens, sites } from "@/lib/db/schema";
import type { StatsQuotidiennes } from "@/lib/axi-solver/rapport/agreger";
import type { OpportuniteUpsell } from "@/lib/axi-solver/rapport/upsell";
import { OngletsRapport } from "./onglets-rapport";

export const dynamic = "force-dynamic";

export default async function PageRapportConsultation({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [site] = await db
    .select({
      id: sites.id,
      slug: sites.slug,
      nomEntreprise: sites.nomEntreprise,
      nomSite: sites.nomSite,
      domainePrincipal: sites.domainePrincipal,
    })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) notFound();

  let rapport:
    | {
        id: string;
        creeLe: Date;
        periodeDebut: Date;
        periodeFin: Date;
        stats: unknown;
        opportunite: unknown;
        destinatairePrincipal: string | null;
        nbDestinatairesSupp: number;
        mode: string;
      }
    | undefined;
  try {
    const rows = await db
      .select({
        id: rapportsQuotidiens.id,
        creeLe: rapportsQuotidiens.creeLe,
        periodeDebut: rapportsQuotidiens.periodeDebut,
        periodeFin: rapportsQuotidiens.periodeFin,
        stats: rapportsQuotidiens.stats,
        opportunite: rapportsQuotidiens.opportunite,
        destinatairePrincipal: rapportsQuotidiens.destinatairePrincipal,
        nbDestinatairesSupp: rapportsQuotidiens.nbDestinatairesSupp,
        mode: rapportsQuotidiens.mode,
      })
      .from(rapportsQuotidiens)
      .where(
        and(
          eq(rapportsQuotidiens.id, id),
          eq(rapportsQuotidiens.siteId, site.id),
        ),
      )
      .limit(1);
    rapport = rows[0];
  } catch (e) {
    console.error("[rapport-consultation] lookup échec:", e);
  }
  if (!rapport) notFound();

  const stats = rapport.stats as StatsQuotidiennes;
  const opportunite = rapport.opportunite as OpportuniteUpsell | null;
  const nomSite = site.nomSite ?? site.nomEntreprise;

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-8">
        <Link
          href={`/dashboard/sites/${slug}/rapports`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour aux rapports de {nomSite}
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Rapport quotidien
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          {new Date(rapport.periodeDebut).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Généré le{" "}
            {new Date(rapport.creeLe).toLocaleString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {rapport.destinatairePrincipal && (
            <span className="inline-flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Envoyé à {rapport.destinatairePrincipal}
              {rapport.nbDestinatairesSupp > 0
                ? ` (+${rapport.nbDestinatairesSupp} destinataire${rapport.nbDestinatairesSupp > 1 ? "s" : ""})`
                : ""}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
              rapport.mode === "manuel"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {rapport.mode === "manuel" ? "Envoi manuel" : "Envoi auto"}
          </span>
        </div>
      </header>

      <OngletsRapport
        stats={stats}
        opportunite={opportunite}
        slug={slug}
      />
    </div>
  );
}
