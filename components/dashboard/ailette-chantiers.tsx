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
    <div className="flex h-full flex-col">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300"
          aria-hidden
        >
          <Globe className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        Vos sites
      </h2>

      {sites.length === 0 ? (
        <div className="mt-5 flex-1 rounded-xl border border-dashed border-slate-700 p-5 text-center text-xs text-slate-400">
          Aucun site enregistré pour l&apos;instant.{" "}
          <Link
            href="/dashboard/sites/nouveau"
            className="font-semibold text-indigo-300 underline-offset-2 hover:underline"
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
                className="group block rounded-xl border border-slate-700/60 bg-slate-800/40 p-3 transition-all hover:border-indigo-500/60 hover:bg-slate-800/70"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {s.nomEntreprise}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {s.domainePrincipal}
                    </p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 flex-shrink-0 text-slate-500 transition-colors group-hover:text-indigo-300"
                    strokeWidth={2}
                    aria-hidden
                  />
                </div>
                <div className="mt-2.5 flex items-center gap-3 text-[11px]">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                      s.verifie
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-amber-500/15 text-amber-300"
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3" strokeWidth={2.2} />
                    {s.verifie ? "Vérifié" : "Propriété à vérifier"}
                  </span>
                  <span className="text-slate-400">
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
