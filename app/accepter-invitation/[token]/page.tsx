import { AlertTriangle, Clock3, Shield, Sparkles } from "lucide-react";

import { lireInvitation } from "./actions";
import { FormulaireAcceptation } from "./formulaire";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Accepter l'invitation · AxiSolver",
};

export default async function PageAccepterInvitation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await lireInvitation(token);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50" />
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-violet-300/25 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {!invitation && <CarteInvalide />}

        {invitation && invitation.statut !== "en_attente" && (
          <CarteNonActive statut={invitation.statut} />
        )}

        {invitation &&
          invitation.statut === "en_attente" &&
          invitation.expireLe < new Date() && <CarteExpiree />}

        {invitation &&
          invitation.statut === "en_attente" &&
          invitation.expireLe >= new Date() && (
            <CarteBienvenue
              token={token}
              email={invitation.email}
              prenom={invitation.prenom ?? ""}
              nom={invitation.nom ?? ""}
              workspaceNom={invitation.workspaceNom}
              expireLe={invitation.expireLe}
            />
          )}
      </div>
    </main>
  );
}

function CarteBienvenue({
  token,
  email,
  prenom,
  nom,
  workspaceNom,
  expireLe,
}: {
  token: string;
  email: string;
  prenom: string;
  nom: string;
  workspaceNom: string;
  expireLe: Date;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
      <header className="mb-6 text-center">
        <span
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-white shadow-md shadow-indigo-500/30"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
          Vous êtes invité(e)
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Rejoignez le compte AxiSolver{" "}
          <strong className="text-slate-900">
            «&nbsp;{workspaceNom}&nbsp;»
          </strong>{" "}
          en tant que co-administrateur. Vous aurez exactement les
          mêmes droits que l&apos;administrateur principal.
        </p>
      </header>

      <div className="mb-6 flex items-start gap-2 rounded-xl bg-indigo-50 p-3 text-xs leading-relaxed text-indigo-900">
        <Shield
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
          strokeWidth={2.2}
          aria-hidden
        />
        <span>
          Création d&apos;un compte AxiSolver associé à{" "}
          <strong>{email}</strong>. Si vous avez déjà un compte avec
          cette adresse, saisissez votre mot de passe habituel ci-dessous.
        </span>
      </div>

      <FormulaireAcceptation
        token={token}
        email={email}
        prenomInitial={prenom}
        nomInitial={nom}
      />

      <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
        <Clock3 className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        Invitation valable jusqu&apos;au{" "}
        {expireLe.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>
    </section>
  );
}

function CarteInvalide() {
  return (
    <section className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-lg">
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700"
        aria-hidden
      >
        <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
        Lien invalide
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Ce lien d&apos;invitation est incorrect ou a été supprimé.
        Demandez à l&apos;administrateur de vous renvoyer une nouvelle
        invitation.
      </p>
    </section>
  );
}

function CarteExpiree() {
  return (
    <section className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-lg">
      <span
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"
        aria-hidden
      >
        <Clock3 className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
        Invitation expirée
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Les invitations sont valables 7 jours. Demandez à
        l&apos;administrateur de vous en envoyer une nouvelle.
      </p>
    </section>
  );
}

function CarteNonActive({ statut }: { statut: string }) {
  const message =
    statut === "acceptee"
      ? "Cette invitation a déjà été acceptée. Connectez-vous normalement à votre compte."
      : "Cette invitation a été révoquée par l'administrateur.";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900">
        Invitation non active
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>
      <a
        href="/connexion"
        className="mt-6 inline-flex rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110"
      >
        Se connecter
      </a>
    </section>
  );
}
