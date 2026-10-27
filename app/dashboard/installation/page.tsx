import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { Copy, FileCode, Globe, ShoppingBag } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { SnippetCopiable } from "./snippet-copiable";

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
    <div className="mx-auto max-w-[1180px] px-6 py-14">
      <header className="mb-10 max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Installation
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Posez votre AxiSolver sur votre site en 2 minutes.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Un seul snippet à copier-coller, aucune dépendance, aucun build.
          Fonctionne sur WordPress, Shopify, Webflow, Wix, HTML pur et
          tout framework moderne.
        </p>
      </header>

      {mesSites.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            Vous n&apos;avez pas encore de site enregistré. La création
            de sites arrivera au LOT E — pour l&apos;instant, un seul
            site est disponible pour tester.
          </p>
          <SnippetCopiable
            slug="axisolver"
            baseUrl={baseUrl}
            isSystemSite
          />
        </div>
      ) : (
        <div className="space-y-10">
          {mesSites.map((s) => (
            <section
              key={s.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8"
            >
              <header className="mb-5">
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-indigo-700">
                  Site
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {s.nomEntreprise}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {s.domainePrincipal} · slug <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">{s.slug}</code>
                </p>
              </header>
              <SnippetCopiable slug={s.slug} baseUrl={baseUrl} />
            </section>
          ))}
        </div>
      )}

      <section className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
        <CarteCms
          icone={Globe}
          nom="WordPress"
          corps="Ouvrez Apparence → Éditeur de thème → footer.php, collez le snippet juste avant la balise </body>. Un plugin officiel arrive au LOT F pour installer en 1 clic depuis wordpress.org."
        />
        <CarteCms
          icone={ShoppingBag}
          nom="Shopify"
          corps="Admin → Online Store → Themes → Edit code → theme.liquid, collez le snippet avant </body>. Fonctionne sur tous les thèmes gratuits et payants."
        />
        <CarteCms
          icone={FileCode}
          nom="Webflow / Wix / HTML"
          corps="Dans les paramètres Custom Code → End of &lt;body&gt;, collez le snippet. Pour un site HTML pur, insérez-le avant la fermeture de la balise </body> de chaque page où vous voulez afficher AxiSolver."
        />
      </section>

      <aside className="mt-14 rounded-2xl border border-slate-200 bg-slate-900 p-8 text-slate-50">
        <h2 className="text-lg font-semibold">Vérifier que ça fonctionne</h2>
        <ol className="mt-4 space-y-2 text-sm text-slate-300">
          <li>
            1. Visitez votre site dans un onglet privé — vous devez voir
            le cercle rayonnant AxiSolver en bas à droite.
          </li>
          <li>
            2. Cliquez dessus — l&apos;iframe doit s&apos;ouvrir avec le
            message d&apos;accueil et les options d&apos;entrée en matière.
          </li>
          <li>
            3. Posez une question — la réponse doit arriver en streaming,
            avec vos infos (base de connaissances) si vous l&apos;avez
            renseignée.
          </li>
        </ol>
        <p className="mt-5 text-xs text-slate-400">
          Si le cercle ne s&apos;affiche pas, vérifiez (a) que le domaine
          de votre site est bien dans la liste des domaines autorisés
          (dashboard → configuration), (b) qu&apos;aucune Content Security
          Policy ne bloque les scripts externes.
        </p>
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

function CarteCms({
  icone: Icone,
  nom,
  corps,
}: {
  icone: typeof Globe;
  nom: string;
  corps: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"
          aria-hidden
        >
          <Icone className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{nom}</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            {corps}
          </p>
        </div>
      </div>
    </article>
  );
}
