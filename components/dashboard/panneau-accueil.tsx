import { MessagesSquare } from "lucide-react";

/**
 * Panneau d'accueil affiché en dessous du bandeau d'actions, avant la
 * suite du dashboard. Rappel discret de l'utilisateur et du nombre de
 * sites — remplacé plus tard par la liste prioritaire d'activité de
 * chaque site.
 */
export function PanneauAccueil({
  prenom,
  nbSites,
}: {
  prenom: string | null;
  nbSites: number;
}) {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-5 md:px-14 lg:px-16">
      <div className="flex items-start gap-3">
        <MessagesSquare
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-700"
          strokeWidth={2}
          aria-hidden
        />
        <div className="text-sm">
          <p className="font-medium text-slate-900">
            {prenom ? `Bonjour ${prenom}.` : "Bonjour."} Votre tableau
            de bord est prêt.
          </p>
          <p className="mt-1 leading-relaxed text-slate-600">
            Vous gérez{" "}
            <strong className="font-semibold text-slate-900">
              {nbSites} site{nbSites > 1 ? "s" : ""}
            </strong>
            . Utilisez les onglets ci-dessus pour naviguer, ou lancez
            une conversation avec AXI quand vous en avez besoin.
          </p>
        </div>
      </div>
    </div>
  );
}
