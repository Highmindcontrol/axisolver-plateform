"use client";

import {
  BookOpen,
  BookOpenCheck,
  LineChart,
  Megaphone,
  MessageSquareText,
  Search,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = {
  cle: string;
  label: string;
  icone: LucideIcon;
  href: string;
};

/**
 * Bandeau d'actions AXI sur le site actif.
 *
 * Chaque bouton pointe vers une capability d'AXI pour ce site : base
 * de connaissances, options d'accueil, SEO, publicité, sécurité,
 * rapports, conversations visiteurs, guide. Aligné à gauche, boutons
 * taille confortable, actif surligné.
 *
 * Si aucun site n'est actif (vue bienvenue 0 site), le bandeau n'est
 * pas affiché — c'est inutile sans site de référence.
 */
export function BandeauActions({ siteSlug }: { siteSlug: string | null }) {
  const pathname = usePathname();

  if (!siteSlug) return null;

  const items: Item[] = [
    {
      cle: "base-connaissances",
      label: "Base de connaissances",
      icone: BookOpen,
      href: `/dashboard/sites/${siteSlug}/base-connaissances`,
    },
    {
      cle: "options-accueil",
      label: "Options d'accueil",
      icone: Megaphone,
      href: `/dashboard/sites/${siteSlug}/options-accueil`,
    },
    {
      cle: "seo",
      label: "SEO",
      icone: Search,
      href: `/dashboard/sites/${siteSlug}/seo`,
    },
    {
      cle: "ads",
      label: "Publicité",
      icone: Target,
      href: `/dashboard/sites/${siteSlug}/ads`,
    },
    {
      cle: "securite",
      label: "Sécurité",
      icone: ShieldCheck,
      href: `/dashboard/sites/${siteSlug}/securite`,
    },
    {
      cle: "rapports",
      label: "Rapports",
      icone: LineChart,
      href: `/dashboard/sites/${siteSlug}/rapports`,
    },
    {
      cle: "tickets",
      label: "Conversations visiteurs",
      icone: MessageSquareText,
      href: `/dashboard/sites/${siteSlug}/tickets`,
    },
    {
      cle: "guide",
      label: "Guide d'AXI",
      icone: BookOpenCheck,
      href: `/dashboard/sites/${siteSlug}`,
    },
  ];

  return (
    <div className="border-t border-slate-300/60 bg-slate-100/80 px-6 py-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.06)] md:px-14 lg:px-16">
      <div className="flex flex-wrap items-center justify-start gap-2.5">
        {items.map(({ cle, label, icone: Icone, href }) => {
          const actif = pathname?.startsWith(href) && href !== `/dashboard/sites/${siteSlug}`;
          return (
            <Link
              key={cle}
              href={href}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                actif
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icone className="h-4 w-4" strokeWidth={2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
