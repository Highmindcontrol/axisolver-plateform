import Link from "next/link";
import { AlertTriangle, CheckCircle2, Download, Package } from "lucide-react";

/**
 * Bandeau d'état d'AXI Security Shield pour ce site :
 * - accès GitHub actif → vert "AXI prêt à commiter dans le repo"
 * - accès WordPress + plugin installé → vert avec version
 * - accès WordPress sans plugin → orange avec lien téléchargement
 * - aucun accès → bleu discret avec lien vers Accès au site
 */
export function BandeauPlugin({
  statutPlugin,
  aAcces,
  typeAcces,
  slug,
}: {
  statutPlugin: {
    installe: boolean;
    version: string | null;
  } | null;
  aAcces: boolean;
  typeAcces: "wordpress_rest" | "github_repo" | null;
  slug: string;
}) {
  if (!aAcces) {
    return (
      <section className="mb-10 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-700">
        <Package
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500"
          strokeWidth={2.2}
          aria-hidden
        />
        <p>
          <strong>AXI Security Shield fonctionne en mode audit seul.</strong>{" "}
          Pour qu&apos;AXI puisse appliquer les corrections à ta place,
          configure un accès WordPress et installe le plugin compagnon.{" "}
          <Link
            href={`/dashboard/sites/${slug}/securite/acces`}
            className="font-semibold text-indigo-700 hover:underline"
          >
            Configurer un accès →
          </Link>
        </p>
      </section>
    );
  }

  // Cas GitHub : pas de plugin requis, l'accès suffit
  if (typeAcces === "github_repo") {
    return (
      <section className="mb-10 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
        <CheckCircle2
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700"
          strokeWidth={2.2}
          aria-hidden
        />
        <p>
          <strong>AXI Security Shield prêt via GitHub.</strong>{" "}
          AXI commitera les corrections (en-têtes HTTP, robots.txt,
          security.txt) directement dans ton repo. Vercel redéploie
          automatiquement après chaque push. Clique sur « Déclencher
          la remédiation » sur n&apos;importe quelle recommandation
          prise en charge.
        </p>
      </section>
    );
  }

  if (!statutPlugin || !statutPlugin.installe) {
    return (
      <section className="mb-10 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700"
            strokeWidth={2.2}
            aria-hidden
          />
          <p>
            <strong>
              Plugin AXI Security Shield pas encore installé sur ton site.
            </strong>{" "}
            Télécharge le zip, installe-le dans WordPress (Extensions →
            Ajouter → Téléverser) et active-le. AXI pourra alors appliquer
            les remédiations automatiquement.
          </p>
        </div>
        <a
          href="/plugins/axi-security-shield-1.0.0.zip"
          download
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-amber-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-amber-800"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.4} />
          Télécharger le plugin
        </a>
      </section>
    );
  }

  return (
    <section className="mb-10 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900">
      <CheckCircle2
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700"
        strokeWidth={2.2}
        aria-hidden
      />
      <p>
        <strong>
          AXI Security Shield v{statutPlugin.version} actif sur le site.
        </strong>{" "}
        AXI peut déclencher les remédiations directement. Clique sur
        « Déclencher la remédiation » sur n&apos;importe quelle
        recommandation prise en charge.
      </p>
    </section>
  );
}
