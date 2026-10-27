import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AxiSolver",
  robots: { index: false, follow: false },
};

/**
 * Layout embed : plein écran, fond transparent côté hôte, pas de
 * SiteHeader. Les CSS globales (globals.css) sont tout de même
 * chargées via le layout racine.
 */
export default function LayoutEmbed({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-transparent">
      {children}
    </div>
  );
}
