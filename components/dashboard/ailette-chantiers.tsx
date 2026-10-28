import { ArrowUpRight, Globe, ShieldCheck } from "lucide-react";
import Link from "next/link";

type SiteChantier = {
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
  verifie: boolean;
  conversationsMois: number;
};

export function AiletteChantiers({
  sites,
}: {
  sites: ReadonlyArray<SiteChantier>;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/30 bg-white/60 p-5 shadow-sm backdrop-blur">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-700"
          aria-hidden
        >
          <Globe className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        Vos sites
      </h2>

      {sites.length === 0 ? (
        <div className="mt-5 flex-1 rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">
          Aucun site enregistré pour l&apos;instant.{" "}
          <Link
            href="/dashboard/sites/nouveau"
            className="font-semibold text-indigo-700 underline-offset-2 hover:underline"
          >
            En créer un
          </Link>
          .
        </div>
      ) : (
        <ul className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
          {sites.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/dashboard/sites/${s.slug}`}
                className="group block rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-indigo-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {s.nomEntreprise}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">
                      {s.domainePrincipal}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 flex-shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                      s.verifie
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3" strokeWidth={2.2} />
                    {s.verifie ? "Vérifié" : "Propriété à vérifier"}
                  </span>
                  <span className="text-slate-500">
                    {s.conversationsMois} conv.
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
