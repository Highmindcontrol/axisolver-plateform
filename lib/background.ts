import "server-only";

/**
 * Lance une tâche en arrière-plan après avoir répondu à la requête.
 * Utilise waitUntil de Vercel en prod, et fire-and-forget en dev.
 *
 * Garantit que le travail long (audits sécurité/SEO/Ads prenant 20-60s)
 * continue après que l'utilisateur a reçu sa réponse HTTP, évitant les
 * 500 par timeout de server action.
 */
export function enArrierePlan(tache: Promise<unknown>): void {
  // En prod Vercel, waitUntil garantit l'exécution après response.
  // En dev local, on laisse juste la Promise s'exécuter — Node ne tue
  // pas le process au return d'une action.
  try {
    // Import dynamique pour éviter de charger en dev
    import("@vercel/functions")
      .then(({ waitUntil }) => {
        try {
          waitUntil(tache);
        } catch {
          // Hors contexte Vercel (dev local, test) — laisse courir
          tache.catch((e) =>
            console.error("[background] tâche échouée:", e),
          );
        }
      })
      .catch(() => {
        // @vercel/functions non disponible — fallback dev
        tache.catch((e) =>
          console.error("[background] tâche échouée:", e),
        );
      });
  } catch (e) {
    console.error("[background] impossible de lancer la tâche:", e);
  }
}
