"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Rafraîchit la page toutes les N secondes jusqu'à ce que `actif`
 * passe à false. Utilisé pour que l'UI reflète la fin d'un audit
 * asynchrone sans que l'utilisateur ait à recharger manuellement.
 */
export function AutoRefresh({
  actif,
  intervalleMs = 4000,
}: {
  actif: boolean;
  intervalleMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!actif) return;
    const id = setInterval(() => {
      router.refresh();
    }, intervalleMs);
    return () => clearInterval(id);
  }, [actif, intervalleMs, router]);

  return null;
}
