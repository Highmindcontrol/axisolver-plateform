import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { ChevronLeft, Shield } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  securityAudits,
  type RecommandationSecurity,
} from "@/lib/db/schema";
import { INSTRUCTIONS_WEBMASTER } from "@/lib/engines/security/instructions-webmaster";
import { CATALOGUE } from "@/lib/engines/security/recommandations";
import { BoutonImprimer } from "./bouton-imprimer";

export const dynamic = "force-dynamic";

/**
 * Rapport imprimable destiné au webmaster / dev du client. Reprend
 * chaque recommandation de l'audit sécurité le plus récent et détaille
 * les étapes concrètes de mise en œuvre (snippets Nginx / Apache /
 * WordPress / Express). Styles @media print friendly : ctrl+P → PDF.
 */
export default async function PageRapportWebmaster({
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

  const [dernier] = await db
    .select()
    .from(securityAudits)
    .where(
      and(
        eq(securityAudits.siteId, site.id),
        eq(securityAudits.statut, "termine"),
      ),
    )
    .orderBy(desc(securityAudits.creeLe))
    .limit(1);

  if (!dernier) notFound();

  const recos = (dernier.recommandations as RecommandationSecurity[]) ?? [];
  const nomSite = site.nomSite ?? site.nomEntreprise;

  // Pour chaque reco, retrouver son code en comparant son titre au
  // catalogue (chaque code produit un titre unique).
  const titreVersCode = new Map<string, string>();
  for (const [code, entry] of Object.entries(CATALOGUE)) {
    titreVersCode.set(entry.titre, code);
  }
  const recosAvecCode = recos.map((r) => ({
    ...r,
    code: titreVersCode.get(r.titre) ?? null,
  }));

  const compteurs = {
    critique: recos.filter((r) => r.priorite === "critique").length,
    haute: recos.filter((r) => r.priorite === "haute").length,
    moyenne: recos.filter((r) => r.priorite === "moyenne").length,
    basse: recos.filter((r) => r.priorite === "basse").length,
  };

  return (
    <>
      {/* ────── Barre d'actions (invisible à l'impression) ────── */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-3 shadow-sm print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link
            href={`/dashboard/sites/${slug}/securite`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
            Retour à l&apos;audit sécurité
          </Link>
          <BoutonImprimer />
        </div>
      </div>

      {/* ────── Document imprimable ────── */}
      <article className="mx-auto max-w-4xl bg-white px-10 py-12 print:px-6 print:py-6">
        {/* ─── Page de garde ─── */}
        <header className="mb-10 border-b-2 border-slate-900 pb-6">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
            <Shield className="h-3 w-3" strokeWidth={2.5} />
            AxiSolver Security Shield
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Rapport technique pour le webmaster
          </h1>
          <p className="mt-2 text-base text-slate-700">
            {nomSite} · {site.domainePrincipal}
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Audit du{" "}
            {new Date(dernier.creeLe).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · Score global{" "}
            <strong className="text-slate-900">
              {dernier.scoreGlobal}/100
            </strong>
          </p>
        </header>

        {/* ─── Message d'intro au webmaster ─── */}
        <section className="mb-10 rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 text-sm leading-relaxed text-slate-800 print:border-slate-300 print:bg-slate-50">
          <p className="mb-2 font-semibold text-slate-900">
            Note au webmaster
          </p>
          <p>
            Ce rapport liste les actions à mener pour renforcer la sécurité
            du site. Chaque recommandation est accompagnée des étapes
            concrètes et des extraits de configuration (Nginx, Apache,
            WordPress, Node/Express). Les points sont triés par priorité :
            commencer par les éléments critiques et de haute priorité.
          </p>
          <p className="mt-2">
            Les éléments marqués{" "}
            <strong>&ldquo;Pris en charge par AXI Shield&rdquo;</strong>{" "}
            peuvent être automatisés via l&apos;abonnement AxiSolver. Pour
            les autres, suivre les instructions ci-dessous.
          </p>
        </section>

        {/* ─── Résumé exécutif ─── */}
        <section className="mb-10">
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-900">
            Résumé exécutif
          </h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <LigneResume label="Score sécurité global" valeur={`${dernier.scoreGlobal} / 100`} />
              <LigneResume label="Recommandations critiques" valeur={String(compteurs.critique)} />
              <LigneResume label="Recommandations hautes" valeur={String(compteurs.haute)} />
              <LigneResume label="Recommandations moyennes" valeur={String(compteurs.moyenne)} />
              <LigneResume label="Recommandations basses" valeur={String(compteurs.basse)} />
              <LigneResume label="Headers HTTP" valeur={`${dernier.scoreHeaders ?? "—"} / 100`} />
              <LigneResume label="TLS" valeur={`${dernier.scoreTls ?? "—"} / 100`} />
              <LigneResume label="Exposition fichiers" valeur={`${dernier.scoreExposition ?? "—"} / 100`} />
              <LigneResume label="Cookies" valeur={`${dernier.scoreCookies ?? "—"} / 100`} />
              <LigneResume label="Contenu" valeur={`${dernier.scoreContenu ?? "—"} / 100`} />
              <LigneResume label="Réputation" valeur={`${dernier.scoreReputation ?? "—"} / 100`} />
              {dernier.certificatSslExpireeLe && (
                <LigneResume
                  label="Expiration certificat SSL"
                  valeur={new Date(
                    dernier.certificatSslExpireeLe,
                  ).toLocaleDateString("fr-FR")}
                />
              )}
            </tbody>
          </table>
        </section>

        {/* ─── Détail de chaque reco ─── */}
        <section>
          <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-bold text-slate-900">
            Actions détaillées à mener ({recos.length})
          </h2>

          <div className="space-y-10">
            {recosAvecCode.map((r, i) => (
              <RecoBloc
                key={i}
                index={i + 1}
                reco={r}
                code={r.code}
              />
            ))}
          </div>
        </section>

        {/* ─── Pied de rapport ─── */}
        <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          <p>
            Rapport généré automatiquement par AxiSolver Security Shield le{" "}
            {new Date().toLocaleString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="mt-1">
            axisolver.app · AxiSolver est édité par Ataraxis Holding Ltd
          </p>
        </footer>
      </article>
    </>
  );
}

/* ──────────────── Composants ──────────────── */

function LigneResume({ label, valeur }: { label: string; valeur: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 text-slate-600">{label}</td>
      <td className="py-2 text-right font-semibold text-slate-900">
        {valeur}
      </td>
    </tr>
  );
}

function RecoBloc({
  index,
  reco,
  code,
}: {
  index: number;
  reco: RecommandationSecurity;
  code: string | null;
}) {
  const instructions = code ? INSTRUCTIONS_WEBMASTER[code] : null;

  const palette: Record<string, { bg: string; txt: string; bord: string }> = {
    critique: { bg: "bg-rose-50", txt: "text-rose-800", bord: "border-rose-300" },
    haute: { bg: "bg-orange-50", txt: "text-orange-800", bord: "border-orange-300" },
    moyenne: { bg: "bg-amber-50", txt: "text-amber-800", bord: "border-amber-300" },
    basse: { bg: "bg-slate-50", txt: "text-slate-700", bord: "border-slate-300" },
  };
  const p = palette[reco.priorite];

  return (
    <div className="break-inside-avoid-page">
      <header className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {index}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${p.bg} ${p.txt} ${p.bord}`}
            >
              {reco.priorite}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
              {reco.pilier}
            </span>
            <span className="text-[11px] text-slate-500">
              Effort : <strong className="text-slate-700">{reco.effort}</strong> ·
              Impact : <strong className="text-slate-700">{reco.impact}</strong>
            </span>
          </div>
          <h3 className="mt-2 text-base font-bold text-slate-900">
            {reco.titre}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            {reco.description}
          </p>
          {reco.pris_en_charge_axi && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold text-white">
              <Shield className="h-3 w-3" strokeWidth={2.5} />
              Pris en charge par {reco.pris_en_charge_axi.pack}
            </p>
          )}
        </div>
      </header>

      {instructions ? (
        <div className="ml-9 space-y-4">
          {instructions.intro && (
            <p className="text-sm italic text-slate-600">
              {instructions.intro}
            </p>
          )}

          <ol className="space-y-4">
            {instructions.etapes.map((etape, i) => (
              <li key={i}>
                <p className="text-sm font-semibold text-slate-900">
                  {i + 1}. {etape.titre}
                </p>
                {etape.corps && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {etape.corps}
                  </p>
                )}
                {etape.snippet && (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 px-4 py-3 text-xs leading-relaxed text-slate-100 print:border-slate-400 print:bg-slate-100 print:text-slate-900">
                    <code>{etape.snippet.code}</code>
                  </pre>
                )}
              </li>
            ))}
          </ol>

          {instructions.verification && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              <strong>Vérification :</strong> {instructions.verification}
            </div>
          )}

          {instructions.references && instructions.references.length > 0 && (
            <div className="text-xs text-slate-600">
              <strong>Références :</strong>{" "}
              {instructions.references.map((ref, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  <a
                    href={ref.url}
                    className="text-indigo-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {ref.nom}
                  </a>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="ml-9 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Instructions techniques détaillées non disponibles pour ce code
          (<code className="font-mono text-xs">{code ?? "inconnu"}</code>).
          Se référer à la description ci-dessus.
        </div>
      )}
    </div>
  );
}

