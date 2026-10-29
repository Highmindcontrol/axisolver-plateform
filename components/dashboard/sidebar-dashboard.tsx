"use client";

import {
  Compass,
  CreditCard,
  Home,
  LayoutGrid,
  Sparkles,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconeSite, hexVersRgba } from "@/lib/ui/sites-apparence";

type Site = {
  slug: string;
  nomEntreprise: string;
  domainePrincipal: string;
  couleur: string;
  picto: string;
};

type Plan =
  | "text-s"
  | "text-l"
  | "premium-s"
  | "premium-l"
  | "pack-web-s"
  | "pack-web-l"
  | null;

export type SidebarDashboardProps = {
  sites: ReadonlyArray<Site>;
  plan: Plan;
  userEmail: string;
};

/**
 * Sidebar gauche du dashboard AxiSolver.
 *
 * Structure : logo + Accueil + Guide d'AXI + liste des sites (chacun
 * coloré avec sa teinte signature quand actif) + Pack Web Marketing
 * (si souscrit) + Mon compte.
 *
 * Pas de section « Intelligence du site » — ces capacités (base de
 * connaissances, options d'accueil, SEO, Ads, Sécurité) sont dans
 * le bandeau d'actions contextuel et dans la page Paramétrages.
 */
export function SidebarDashboard({
  sites,
  plan,
  userEmail,
}: SidebarDashboardProps) {
  const pathname = usePathname();
  const siteActif = extraireSlugSite(pathname);
  const aPackWeb = plan === "pack-web-s" || plan === "pack-web-l";

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-slate-300/60 bg-slate-100/70 md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-slate-300/60 bg-white px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-sm font-semibold text-slate-900"
          aria-label="AxiSolver Admin — accueil dashboard"
        >
          <Image
            src="/axisolver-icon.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8"
          />
          <span className="leading-tight">
            AxiSolver
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Admin
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          <SidebarItem
            href="/dashboard"
            icon={Home}
            label="Accueil"
            active={pathname === "/dashboard"}
          />
          <SidebarItem
            href="/dashboard/guide"
            icon={Compass}
            label="Guide d'AXI"
            active={pathname?.startsWith("/dashboard/guide") ?? false}
          />
        </ul>

        {sites.length > 0 && (
          <SectionSidebar titre="Mes sites">
            {sites.map((s) => (
              <SidebarItemSite
                key={s.slug}
                href={`/dashboard/sites/${s.slug}`}
                picto={s.picto}
                couleur={s.couleur}
                label={s.nomEntreprise}
                active={siteActif === s.slug}
              />
            ))}
            <SidebarItem
              href="/dashboard/sites/nouveau"
              icon={LayoutGrid}
              label="Ajouter un site"
              active={pathname === "/dashboard/sites/nouveau"}
              muted
            />
          </SectionSidebar>
        )}

        {aPackWeb && (
          <SectionSidebar titre="Pack Web Marketing">
            <SidebarItem
              href="/dashboard/pack-web"
              icon={Sparkles}
              label="Landing & templates"
              active={pathname?.includes("/pack-web")}
            />
          </SectionSidebar>
        )}

        <SectionSidebar titre="Mon compte">
          <SidebarItem
            href="/dashboard/abonnement"
            icon={CreditCard}
            label="Formules & packs"
            active={pathname?.includes("/dashboard/abonnement")}
          />
          <SidebarItem
            href="/dashboard/votre-compte"
            icon={UserCircle}
            label="Votre compte"
            active={pathname?.includes("/dashboard/votre-compte")}
          />
        </SectionSidebar>
      </nav>

      <div className="border-t border-slate-300/60 p-3">
        <div className="mb-2 truncate px-3 py-2 text-xs text-slate-600">
          Connecté comme{" "}
          <span className="font-medium text-slate-900">{userEmail}</span>
        </div>
        <form action="/api/auth/deconnexion" method="post">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-900"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}

function SectionSidebar({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <p className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {titre}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </>
  );
}

function SidebarItem({
  href,
  icon: Icon,
  label,
  active,
  muted,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cx(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-indigo-600/10 text-indigo-700"
            : muted
              ? "text-slate-500 hover:bg-white/70 hover:text-slate-900"
              : "text-slate-700 hover:bg-white/70 hover:text-slate-900",
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={2.2} aria-hidden />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

/**
 * SidebarItem spécifique « site » : utilise le picto + colore le
 * fond avec la couleur signature du site quand il est actif.
 */
function SidebarItemSite({
  href,
  picto,
  couleur,
  label,
  active,
}: {
  href: string;
  picto: string;
  couleur: string;
  label: string;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        style={
          active
            ? {
                backgroundColor: couleur,
                color: "#ffffff",
              }
            : {
                backgroundColor: "transparent",
                color: couleur,
              }
        }
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = hexVersRgba(couleur, 0.12);
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <IconeSite valeur={picto} tailleClass="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

function cx(...tokens: Array<string | false | null | undefined>): string {
  return tokens.filter(Boolean).join(" ");
}

function extraireSlugSite(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = /\/dashboard\/sites\/([^/]+)/.exec(pathname);
  if (!match) return null;
  if (match[1] === "nouveau") return null;
  return match[1];
}
