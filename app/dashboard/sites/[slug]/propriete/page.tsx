import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ShieldCheck, FileText, Globe, Code, Download } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { genererTokensAction } from "./actions";
import { BoutonVerifier } from "./bouton-verifier";
import { BlocCopiable } from "./bloc-copiable";
import { GuidesBalise, GuidesFichier, GuidesDns } from "./guides";

export const dynamic = "force-dynamic";

export default async function PageProprieteSite({
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

  if (
    !site.tokenVerificationFichier ||
    !site.tokenVerificationDns ||
    !site.tokenVerificationBalise
  ) {
    await genererTokensAction(slug);
    const [recharge] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, site.id))
      .limit(1);
    if (recharge) Object.assign(site, recharge);
  }

  const estVerifie = site.proprieteVerifieeLe !== null;
  const domaine = site.domainePrincipal;
  const baliseMeta = `<meta name="axisolver-verification" content="${site.tokenVerificationBalise}" />`;
  const valeurTxt = `axisolver-verify=${site.tokenVerificationDns}`;

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10 max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Vérification de propriété
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Prouvez que{" "}
          <span className="font-mono text-indigo-700">{domaine}</span>{" "}
          vous appartient
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Trois méthodes au choix, une seule suffit. Classées de la plus
          simple à la plus technique. Chaque méthode a son guide
          pas-à-pas par plateforme — pas besoin d&apos;être développeur.
        </p>
      </header>

      {estVerifie ? (
        <section className="mb-10 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-start gap-4">
            <span
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"
              aria-hidden
            >
              <ShieldCheck className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-emerald-900">
                Domaine vérifié
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Vérification réussie le{" "}
                <strong>
                  {new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(site.proprieteVerifieeLe!))}
                </strong>{" "}
                via la méthode <strong>{site.proprieteMethode}</strong>.
                Les actions externes sont débloquées.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-base font-semibold text-amber-900">
            En attente de vérification
          </h2>
          <p className="mt-1 text-sm text-amber-800">
            Choisissez la méthode qui correspond à votre plateforme,
            suivez les instructions, puis cliquez sur « Vérifier
            maintenant ».
          </p>
        </section>
      )}

      <div className="space-y-6">
        {/* Méthode 1 — Balise meta (recommandée) */}
        <article className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-start gap-3">
            <span
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm"
              aria-hidden
            >
              <Code className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-indigo-700">
                Méthode 1 — Recommandée pour tous
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Balise meta dans le &lt;head&gt;
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                1 ligne à coller dans les réglages de votre site. Marche
                sur WordPress, Shopify, Webflow, Wix, Squarespace, Vercel,
                HTML pur…
              </p>
            </div>
          </header>
          <p className="mb-2 text-xs font-medium text-slate-700">
            Collez cette ligne dans le &lt;head&gt; de votre site :
          </p>
          <BlocCopiable contenu={baliseMeta} />
          <GuidesBalise balise={baliseMeta} domaine={domaine} />
        </article>

        {/* Méthode 2 — Fichier */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-start gap-3">
            <span
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
              aria-hidden
            >
              <FileText className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Méthode 2 — Pour les sites avec accès FTP ou Git
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Fichier texte à la racine
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Idéal si vous êtes sur Vercel, Netlify, OVH avec FTP, ou
                hébergement classique avec File Manager.
              </p>
            </div>
          </header>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <a
              href={`/dashboard/sites/${slug}/propriete/telechargement/${site.tokenVerificationFichier}`}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              download
            >
              <Download className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              Télécharger le fichier prêt à uploader
            </a>
            <span className="text-xs text-slate-500">
              Nom du fichier :{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">
                axisolver-verification-{site.tokenVerificationFichier}.txt
              </code>
            </span>
          </div>
          <p className="mb-1 text-xs text-slate-600">
            Une fois posé, il doit être accessible à cette URL :
          </p>
          <BlocCopiable
            contenu={`https://${domaine}/axisolver-verification-${site.tokenVerificationFichier}.txt`}
          />
          <GuidesFichier
            slug={slug}
            token={site.tokenVerificationFichier ?? ""}
            domaine={domaine}
          />
        </article>

        {/* Méthode 3 — DNS */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="mb-4 flex items-start gap-3">
            <span
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
              aria-hidden
            >
              <Globe className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Méthode 3 — Pour les administrateurs réseau
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Enregistrement DNS TXT
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Nécessite l&apos;accès au registrar du domaine (OVH,
                Cloudflare, Squarespace, GoDaddy…). Peut mettre quelques
                minutes à se propager.
              </p>
            </div>
          </header>
          <p className="mb-2 text-xs font-medium text-slate-700">
            Enregistrement à ajouter sur votre domaine racine (host « @ »
            ou vide) :
          </p>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Type : TXT · Valeur :
          </p>
          <BlocCopiable contenu={valeurTxt} />
          <GuidesDns valeur={valeurTxt} domaine={domaine} />
        </article>
      </div>

      <div className="mt-10 flex items-center gap-4 border-t border-slate-200 pt-8">
        <BoutonVerifier slug={slug} />
        <Link
          href={`/dashboard/sites/${slug}`}
          className="text-sm text-slate-600 hover:text-indigo-700"
        >
          ← Retour à la vue d&apos;ensemble
        </Link>
      </div>
    </div>
  );
}
