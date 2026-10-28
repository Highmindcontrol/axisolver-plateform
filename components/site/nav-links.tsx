"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Liens de navigation principale, client component pour détecter la
 * page active via usePathname et appliquer un liseré blanc. Reste
 * cohérent avec le header server qui lit la session Supabase.
 */

type NavItem = { href: string; label: string };

const ITEMS: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/presentation-detaillee", label: "Présentation détaillée" },
  { href: "/cas-usage", label: "Cas d'usage" },
  { href: "/comparatif", label: "Comparatif" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {ITEMS.map((item) => {
        const estActif =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`hidden rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-900 hover:text-amber-300 md:inline-block md:text-base ${
              estActif
                ? "border border-white text-white"
                : "text-zinc-300"
            }`}
            aria-current={estActif ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
