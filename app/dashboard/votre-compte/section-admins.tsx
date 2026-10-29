import { Clock3, Shield, UserPlus, Users } from "lucide-react";

/**
 * Section Co-administrateurs — préparatoire.
 *
 * Affiche l'admin principal (créateur du compte) et un bouton
 * désactivé « Ajouter un administrateur ». Le partage effectif du
 * compte nécessite un modèle workspace multi-membres (table
 * workspaces + workspace_members + migration sites.ownerUserId →
 * workspaceId + invitations token Brevo + vérif permissions sur
 * toutes les actions). Ce chantier structurant est planifié après
 * l'activation Stripe.
 */
export function SectionAdministrateurs({
  prenom,
  nom,
  email,
}: {
  prenom: string;
  nom: string;
  email: string;
}) {
  const nomComplet = [prenom, nom].filter(Boolean).join(" ") || email;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Users
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Co-administrateurs
      </h2>

      <p className="mb-5 text-sm leading-relaxed text-slate-600">
        Vous êtes l&apos;administrateur principal de ce compte
        AxiSolver. Vous pouvez inviter un ou plusieurs
        co-administrateurs qui auront <strong>exactement les mêmes
        droits</strong> que vous : création et pilotage des sites,
        base de connaissances, audits, facturation, invitation
        d&apos;autres admins.
      </p>

      <ul className="mb-5 space-y-2">
        <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700"
              aria-hidden
            >
              <Shield className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">
                {nomComplet}
              </p>
              <p className="text-xs text-slate-500">{email}</p>
            </div>
          </div>
          <span className="flex-shrink-0 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-800">
            Administrateur principal
          </span>
        </li>
      </ul>

      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500"
              aria-hidden
            >
              <UserPlus className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Inviter un co-administrateur
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Nom, prénom et email de la personne à inviter. Elle
                recevra un email d&apos;activation lui donnant accès à
                votre compte avec les mêmes droits que vous.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="flex-shrink-0 cursor-not-allowed rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-400 opacity-70"
          >
            Ajouter un administrateur
          </button>
        </div>
        <p className="mt-4 inline-flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
          <Clock3
            className="mt-0.5 h-3 w-3 flex-shrink-0"
            strokeWidth={2.2}
            aria-hidden
          />
          Bientôt disponible. La co-administration nécessite une
          évolution du modèle de compte (workspace multi-membres),
          chantier planifié après l&apos;activation Stripe.
        </p>
      </div>
    </section>
  );
}
