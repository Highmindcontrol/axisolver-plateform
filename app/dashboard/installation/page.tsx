import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Rocket, Zap, Store, HelpCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { SnippetCopiable } from "./snippet-copiable";
import { GuidesInstallation, BoutonTelechargerHtml } from "./guides";

export const dynamic = "force-dynamic";

export default async function PageInstallation() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const mesSites = await db
    .select()
    .from(sites)
    .where(eq(sites.ownerUserId, user.id));

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://axisolver.app";

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10 max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Installation
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Posez AxiSolver sur votre site en 30 secondes
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Choisissez votre CMS ou votre framework. Les méthodes
          recommandées (WordPress plugin et Google Tag Manager) sont en
          3 clics sans toucher au code. Les autres sont des guides
          pas-à-pas pour n&apos;importe qui.
        </p>
      </header>

      {mesSites.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            Créez d&apos;abord un site pour obtenir votre identifiant
            d&apos;installation.
          </p>
          <Link
            href="/dashboard/sites/nouveau"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:brightness-110"
          >
            <Rocket className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Créer mon premier site
          </Link>
        </section>
      ) : (
        <div className="space-y-14">
          {mesSites.map((s) => (
            <section
              key={s.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
            >
              <header className="mb-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-700">
                  Site
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  {s.nomEntreprise}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {s.domainePrincipal} · identifiant{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[12px]">
                    {s.slug}
                  </code>
                </p>
              </header>

              <div className="mb-10 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-600">
                  Snippet HTML universel
                </p>
                <p className="mb-3 text-xs text-slate-600">
                  Si vous savez déjà où coller une balise {"<script>"} dans
                  votre site, voici le snippet universel. Pour les autres
                  cas, utilisez les guides ci-dessous.
                </p>
                <SnippetCopiable slug={s.slug} baseUrl={baseUrl} />
                <div className="mt-4">
                  <BoutonTelechargerHtml slug={s.slug} baseUrl={baseUrl} />
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
                  Guides pas-à-pas selon votre site
                </h3>
                <GuidesInstallation slug={s.slug} baseUrl={baseUrl} />
              </div>
            </section>
          ))}
        </div>
      )}

      <section className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        <CarteCanal
          icone={Zap}
          titre="Plugin WordPress officiel"
          corps="Installation en 3 clics depuis wordpress.org. Un seul champ à remplir, c'est en ligne. Publication en cours."
          lien="https://wordpress.org/plugins/axisolver/"
          libelleCta="Voir sur wordpress.org"
        />
        <CarteCanal
          icone={Rocket}
          titre="Template Google Tag Manager"
          corps="Pour les sites qui utilisent déjà GTM. Add → paste site_id → Submit, 30 secondes. Publication en cours sur la Gallery."
          lien="https://gallery.tagmanager.google.com/"
          libelleCta="Voir sur la Gallery"
        />
        <CarteCanal
          icone={Store}
          titre="Shopify, Wix, Webflow (apps)"
          corps="Les apps officielles arriveront en V1.1. En attendant, utilisez les guides ci-dessus (collage dans theme.liquid ou Custom Code)."
          lien="/dashboard/installation"
          libelleCta="Lire les guides"
        />
      </section>

      <aside className="mt-14 rounded-2xl border border-slate-200 bg-slate-900 p-8 text-slate-50">
        <div className="flex items-start gap-4">
          <span
            className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white"
            aria-hidden
          >
            <HelpCircle className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Vérifier que ça fonctionne</h2>
            <ol className="mt-4 space-y-2 text-sm text-slate-300">
              <li>
                1. Ouvrez votre site dans une fenêtre privée (Cmd+Shift+N
                / Ctrl+Shift+N)
              </li>
              <li>
                2. Vous devez voir le cercle rayonnant AxiSolver en bas à
                droite
              </li>
              <li>
                3. Cliquez — l&apos;iframe doit s&apos;ouvrir avec le
                message d&apos;accueil et les options d&apos;entrée en
                matière
              </li>
              <li>
                4. Posez une question — la réponse arrive en streaming,
                avec vos infos (base de connaissances) si vous l&apos;avez
                renseignée
              </li>
            </ol>
            <p className="mt-5 text-xs text-slate-400">
              Si le cercle ne s&apos;affiche pas, vérifiez (a) que le
              domaine de votre site est bien dans la liste des{" "}
              <strong className="text-white">domaines autorisés</strong>{" "}
              (dashboard → configuration), (b) qu&apos;aucune Content
              Security Policy (CSP) ne bloque les scripts externes de{" "}
              <code className="text-indigo-300">axisolver.app</code>.
            </p>
          </div>
        </div>
      </aside>

      <p className="mt-10 text-center text-xs text-slate-500">
        <Link
          href="/dashboard"
          className="font-medium text-indigo-700 hover:underline"
        >
          Retour au dashboard
        </Link>
      </p>
    </div>
  );
}

function CarteCanal({
  icone: Icone,
  titre,
  corps,
  lien,
  libelleCta,
}: {
  icone: typeof Zap;
  titre: string;
  corps: string;
  lien: string;
  libelleCta: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <span
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
        aria-hidden
      >
        <Icone className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{titre}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{corps}</p>
      <a
        href={lien}
        target="_blank"
        rel="noopener"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:underline"
      >
        {libelleCta} →
      </a>
    </article>
  );
}
