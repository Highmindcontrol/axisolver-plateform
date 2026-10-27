import { notFound } from "next/navigation";
import { chargerConfigSite } from "@/lib/axi-solver/charger-config-site";
import { WidgetChat } from "@/components/embed/widget-chat";

export const dynamic = "force-dynamic";

/**
 * Route embed d'AxiSolver — servie dans l'iframe injectée par le
 * loader public/v1.js sur les sites tiers.
 *
 * URL : https://axisolver.app/embed/{slug}
 *
 * Vérifie que le slug existe dans la base, charge la config
 * complète (branding, options d'accueil, nom assistant, langues),
 * et rend le WidgetChat plein écran. Pas de header site Ataraxis,
 * fond transparent pour que le site hôte voie à travers.
 */
export default async function PageEmbed({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await chargerConfigSite(slug).catch(() => null);
  if (!config) notFound();

  return (
    <WidgetChat
      slug={slug}
      nomAssistant={config.config.nomAssistant}
      nomEntreprise={config.nomEntreprise}
      optionsAccueil={config.optionsAccueil}
      branding={config.config.branding}
      langueDefaut={config.config.langueDefaut}
      afficherPropulsePar={config.config.branding.afficherPropulsePar}
    />
  );
}
