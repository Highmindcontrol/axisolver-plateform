"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconeSite } from "@/lib/ui/sites-apparence";

type SiteSwitcher = {
  slug: string;
  nomEntreprise: string;
  couleur: string;
  picto: string;
};

/**
 * Header switcher sites — reproduction du <HeaderEcosystemes> AxiHub.
 *
 * « Bonjour François · vous gérez X site(s) · [Site 1] [Site 2] [+ Nouveau
 * site] ». Chaque site a sa couleur signature (branding.couleurPrincipale).
 * Onglet actif = fond plein de la couleur, inactifs = texte dans la couleur
 * sur fond blanc.
 *
 * Pas d'onglet « Général » — chaque action AxiSolver est intrinsèquement
 * scopée à un site. À l'arrivée sur /dashboard, l'utilisateur est
 * automatiquement redirigé vers son premier site.
 */
export function HeaderSites({
  prenom,
  sites,
}: {
  prenom: string | null;
  sites: ReadonlyArray<SiteSwitcher>;
}) {
  const pathname = usePathname();
  const slugActif = extraireSlugSite(pathname);
  const nbSites = sites.length;
  const peutAjouterSite = nbSites < 3;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-slate-200 bg-white px-6 py-4 md:px-14 lg:px-16">
      <div className="shrink-0 text-sm text-slate-600">
        Bonjour{" "}
        <span className="font-semibold text-slate-900">
          {prenom ?? "à vous"}
        </span>
        {nbSites > 0 && (
          <>
            {" "}
            · vous gérez{" "}
            <span className="font-semibold text-slate-900">
              {nbSites} site{nbSites > 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-stretch gap-2">
        <nav className="flex items-stretch divide-x divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          {sites.map((s) => (
            <OngletSite
              key={s.slug}
              href={`/dashboard/sites/${s.slug}`}
              actif={slugActif === s.slug}
              couleur={s.couleur}
              icone={<IconeSite valeur={s.picto} tailleClass="h-4 w-4" />}
              label={s.nomEntreprise}
            />
          ))}
        </nav>

        <Link
          href={peutAjouterSite ? "/dashboard/sites/nouveau" : "#"}
          aria-disabled={!peutAjouterSite}
          title={
            peutAjouterSite
              ? "Ajouter un site (jusqu'à 3 avec votre formule)"
              : "Limite de 3 sites atteinte — passez à l'offre Agence pour en gérer plus"
          }
          className={`inline-flex items-center gap-1 rounded-md border border-dashed px-3 py-2 text-xs font-medium transition ${
            peutAjouterSite
              ? "border-slate-300 bg-white text-slate-500 hover:border-indigo-500 hover:text-indigo-700"
              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
          }`}
          onClick={(e) => {
            if (!peutAjouterSite) e.preventDefault();
          }}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.6} aria-hidden />
          {nbSites === 0 ? "Créer mon premier site" : "Nouveau site"}
        </Link>
      </div>
    </div>
  );
}

function OngletSite({
  href,
  actif,
  couleur,
  icone,
  label,
}: {
  href: string;
  actif: boolean;
  couleur: string;
  icone: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition"
      style={
        actif
          ? { backgroundColor: couleur, color: "#ffffff" }
          : { color: couleur, backgroundColor: "#ffffff" }
      }
    >
      {icone}
      <span className="max-w-[18ch] truncate">{label}</span>
    </Link>
  );
}

function extraireSlugSite(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = /\/dashboard\/sites\/([^/]+)/.exec(pathname);
  if (!match || match[1] === "nouveau") return null;
  return match[1];
}
