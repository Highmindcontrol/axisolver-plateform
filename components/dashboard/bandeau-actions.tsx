"use client";

import {
  History,
  LineChart,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { hexVersRgba } from "@/lib/ui/sites-apparence";

import { PanneauHistoriqueConversations } from "./panneau-historique-conversations";

type Item = {
  cle: string;
  label: string;
  icone: LucideIcon;
  href: string;
};

/**
 * Bandeau d'actions AXI sur le site actif.
 *
 * Chaque bouton pointe vers une capability d'AXI pour ce site :
 * rapports quotidiens, sécurité, SEO, publicité, paramétrages.
 * Un bouton « Historique » isolé à droite ouvre un panneau avec les
 * conversations passées (toggle), classé par site.
 */
export function BandeauActions({
  siteSlug,
  couleurSite,
}: {
  siteSlug: string | null;
  couleurSite?: string;
}) {
  const pathname = usePathname();
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);

  if (!siteSlug) return null;

  const fondTeinte = couleurSite ? hexVersRgba(couleurSite, 0.12) : undefined;
  const bordureTeinte = couleurSite
    ? hexVersRgba(couleurSite, 0.35)
    : undefined;

  const items: Item[] = [
    {
      cle: "rapports",
      label: "Rapports quotidiens",
      icone: LineChart,
      href: `/dashboard/sites/${siteSlug}/rapports`,
    },
    {
      cle: "securite",
      label: "Sécurité",
      icone: ShieldCheck,
      href: `/dashboard/sites/${siteSlug}/securite`,
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
      cle: "connecteurs",
      label: "Connecteurs",
      icone: Plug,
      href: `/dashboard/sites/${siteSlug}/connecteurs`,
    },
    {
      cle: "parametrages",
      label: "Paramétrages",
      icone: Settings,
      href: `/dashboard/sites/${siteSlug}/parametrages`,
    },
  ];

  return (
    <>
      <div
        className="border-t px-6 py-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.06)] md:px-14 lg:px-16"
        style={{
          backgroundColor: fondTeinte ?? "rgba(241,245,249,0.8)",
          borderTopColor: bordureTeinte ?? "rgba(203,213,225,0.6)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {items.map(({ cle, label, icone: Icone, href }) => {
              const actif =
                pathname?.startsWith(href) &&
                href !== `/dashboard/sites/${siteSlug}`;
              return (
                <Link
                  key={cle}
                  href={href}
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
                  style={
                    actif
                      ? {
                          backgroundColor: couleurSite ?? "#0f172a",
                          borderColor: couleurSite ?? "#0f172a",
                          color: "#ffffff",
                        }
                      : {
                          backgroundColor: "#ffffff",
                          borderColor: "rgba(226,232,240,1)",
                          color: "#334155",
                        }
                  }
                >
                  <Icone className="h-4 w-4" strokeWidth={2} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setHistoriqueOuvert((v) => !v)}
            aria-expanded={historiqueOuvert}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition"
            style={
              historiqueOuvert
                ? {
                    backgroundColor: couleurSite ?? "#0f172a",
                    borderColor: couleurSite ?? "#0f172a",
                    color: "#ffffff",
                  }
                : {
                    backgroundColor: "#ffffff",
                    borderColor: "rgba(226,232,240,1)",
                    color: "#334155",
                  }
            }
          >
            <History className="h-4 w-4" strokeWidth={2} aria-hidden />
            Historique des conversations
          </button>
        </div>
      </div>

      {historiqueOuvert && (
        <PanneauHistoriqueConversations siteSlug={siteSlug} />
      )}
    </>
  );
}
