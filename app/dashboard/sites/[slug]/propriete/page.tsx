import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ShieldCheck, FileText, Globe } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { genererTokensAction } from "./actions";
import { BoutonVerifier } from "./bouton-verifier";
import { BlocCopiable } from "./bloc-copiable";

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

  // Génère les tokens si manquants (idempotent)
  if (!site.tokenVerificationFichier || !site.tokenVerificationDns) {
    await genererTokensAction(slug);
    // Recharge
    const [recharge] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, site.id))
      .limit(1);
    if (recharge) Object.assign(site, recharge);
  }

  const estVerifie = site.proprieteVerifieeLe !== null;
  const domaine = site.domainePrincipal;

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10 max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Vérification de propriété
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Prouvez que <span className="font-mono text-indigo-700">{domaine}</span> vous appartient.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Prérequis obligatoire avant qu&apos;AxiSolver puisse agir sur
          vos systèmes externes (Google Ads, Google Analytics, Cloudflare,
          Vercel Firewall…). Modèle Google Search Console : deux méthodes
          au choix, une seule suffit.
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
            Choisissez une des deux méthodes ci-dessous, suivez les
            instructions, puis cliquez sur « Vérifier maintenant ».
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Méthode 1 — Fichier */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <header className="mb-5 flex items-start gap-3">
            <span
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
              aria-hidden
            >
              <FileText className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Méthode 1 — recommandée
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Fichier texte à la racine
              </h3>
            </div>
          </header>
          <ol className="space-y-4 text-sm text-slate-700">
            <li>
              <p>
                <strong>1.</strong> Créez un fichier texte nommé exactement :
              </p>
              <BlocCopiable
                contenu={`axisolver-verification-${site.tokenVerificationFichier}.txt`}
              />
            </li>
            <li>
              <p>
                <strong>2.</strong> Mettez-y uniquement cette valeur (une
                seule ligne, pas d&apos;espace) :
              </p>
              <BlocCopiable contenu={site.tokenVerificationFichier ?? ""} />
            </li>
            <li>
              <p>
                <strong>3.</strong> Déposez-le à la racine de votre site
                afin qu&apos;il soit accessible à :
              </p>
              <BlocCopiable
                contenu={`https://${domaine}/axisolver-verification-${site.tokenVerificationFichier}.txt`}
              />
            </li>
          </ol>
        </article>

        {/* Méthode 2 — DNS */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <header className="mb-5 flex items-start gap-3">
            <span
              className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
              aria-hidden
            >
              <Globe className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Méthode 2 — alternative
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Enregistrement DNS TXT
              </h3>
            </div>
          </header>
          <ol className="space-y-4 text-sm text-slate-700">
            <li>
              <p>
                <strong>1.</strong> Chez votre registrar (OVH, Cloudflare,
                Gandi…), ajoutez un enregistrement <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">TXT</code> sur le domaine racine :
              </p>
            </li>
            <li>
              <p>
                <strong>Nom (Host)</strong> : <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">@</code> ou laisser vide selon le registrar
              </p>
            </li>
            <li>
              <p>
                <strong>Valeur</strong> :
              </p>
              <BlocCopiable
                contenu={`axisolver-verify=${site.tokenVerificationDns}`}
              />
            </li>
            <li>
              <p className="text-xs text-slate-500">
                La propagation DNS peut prendre jusqu&apos;à 1 heure, parfois
                plus. Si la vérification échoue, retentez après quelques
                minutes.
              </p>
            </li>
          </ol>
        </article>
      </div>

      <div className="mt-10">
        <BoutonVerifier slug={slug} />
      </div>
    </div>
  );
}
