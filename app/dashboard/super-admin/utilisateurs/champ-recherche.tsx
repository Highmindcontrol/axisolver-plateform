"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ChampRecherche({
  valeurInitiale,
}: {
  valeurInitiale: string;
}) {
  const router = useRouter();
  const [valeur, setValeur] = useState(valeurInitiale);

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    const url = valeur
      ? `/dashboard/super-admin/utilisateurs?q=${encodeURIComponent(valeur)}`
      : "/dashboard/super-admin/utilisateurs";
    router.push(url);
  }

  return (
    <form onSubmit={soumettre} className="relative w-full max-w-sm">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        strokeWidth={2}
        aria-hidden
      />
      <input
        type="search"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        placeholder="Rechercher par email ou nom…"
        className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      />
    </form>
  );
}
