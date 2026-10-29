import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Building2,
  CreditCard,
  Download,
  LogOut,
  Mail,
  Shield,
  Trash2,
  UserCircle,
} from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { BoutonResetMdp } from "./bouton-reset-mdp";
import { FormulaireProfil } from "./formulaire-profil";
import {
  FormulaireSociete,
  type SocieteInitial,
} from "./formulaire-societe";
import { SectionAdministrateurs } from "./section-admins";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Votre compte · AxiSolver",
};

export default async function PageVotreCompte() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const email = user.email ?? "";
  const dateCreation = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const meta =
    (user.user_metadata as Record<string, unknown> | undefined) ?? {};
  const prenomInitial = typeof meta.prenom === "string" ? meta.prenom : "";
  const nomInitial = typeof meta.nom === "string" ? meta.nom : "";
  const telephoneInitial =
    typeof meta.telephone === "string" ? meta.telephone : "";

  const societeMeta = (meta.societe as Record<string, unknown> | undefined) ?? {};
  const societeInitial: SocieteInitial = {
    raisonSociale: lireChamp(societeMeta.raisonSociale),
    numeroTva: lireChamp(societeMeta.numeroTva),
    siret: lireChamp(societeMeta.siret),
    adresseLigne1: lireChamp(societeMeta.adresseLigne1),
    adresseLigne2: lireChamp(societeMeta.adresseLigne2),
    codePostal: lireChamp(societeMeta.codePostal),
    ville: lireChamp(societeMeta.ville),
    pays: lireChamp(societeMeta.pays),
    emailFacturation: lireChamp(societeMeta.emailFacturation),
  };

  return (
    <div className="flex-1 px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10 flex items-start gap-4">
        <span
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white"
          aria-hidden
        >
          <UserCircle className="h-6 w-6" strokeWidth={2.2} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Votre compte
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Gérez vos informations personnelles, vos notifications et vos
            données.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        <SectionProfil
          email={email}
          dateCreation={dateCreation}
          prenomInitial={prenomInitial}
          nomInitial={nomInitial}
          telephoneInitial={telephoneInitial}
        />
        <SectionSociete societeInitial={societeInitial} />
        <SectionAdministrateurs
          prenom={prenomInitial}
          nom={nomInitial}
          email={email}
        />
        <SectionNotifications />
        <SectionFacturation />
        <SectionRGPD />
        <SectionDeconnexion />
      </div>
    </div>
  );
}

/* ─── Profil ───────────────────────────────────────────────────── */

function SectionProfil({
  email,
  dateCreation,
  prenomInitial,
  nomInitial,
  telephoneInitial,
}: {
  email: string;
  dateCreation: string;
  prenomInitial: string;
  nomInitial: string;
  telephoneInitial: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
        <UserCircle
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Profil
      </h2>

      <FormulaireProfil
        prenomInitial={prenomInitial}
        nomInitial={nomInitial}
        telephoneInitial={telephoneInitial}
      />

      <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 md:grid-cols-2">
        <ChampLecture label="Adresse email" valeur={email} icone={Mail} />
        <ChampLecture
          label="Compte créé le"
          valeur={dateCreation}
          icone={UserCircle}
        />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="mb-2 text-sm font-medium text-slate-900">
          Changer le mot de passe
        </p>
        <p className="mb-3 text-xs text-slate-500">
          Pour votre sécurité, nous vous envoyons un lien à usage unique
          par email pour définir un nouveau mot de passe.
        </p>
        <BoutonResetMdp email={email} />
      </div>
    </section>
  );
}

function lireChamp(valeur: unknown): string {
  return typeof valeur === "string" ? valeur : "";
}

function ChampLecture({
  label,
  valeur,
  icone: Icone,
}: {
  label: string;
  valeur: string;
  icone: typeof Mail;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <Icone
          className="h-4 w-4 flex-shrink-0 text-slate-400"
          strokeWidth={2.2}
          aria-hidden
        />
        <span className="truncate text-sm text-slate-900">{valeur}</span>
      </div>
    </div>
  );
}

/* ─── Société ──────────────────────────────────────────────────── */

function SectionSociete({ societeInitial }: { societeInitial: SocieteInitial }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Building2
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Entreprise & facturation
      </h2>
      <p className="mb-5 text-sm text-slate-600">
        Raison sociale, numéro de TVA et adresse. Utilisés par Stripe
        pour émettre vos factures d&apos;abonnement.
      </p>
      <FormulaireSociete initial={societeInitial} />
    </section>
  );
}

/* ─── Notifications ────────────────────────────────────────────── */

function SectionNotifications() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Bell
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Notifications
      </h2>

      <ul className="space-y-4">
        <LigneNotification
          titre="Rapport quotidien par email"
          description="Reçu chaque matin à 7h, par site : conversations de la veille, incidents, actions AXI."
          statut="Actif"
          actif
        />
        <LigneNotification
          titre="Alertes incidents en temps réel"
          description="Pour les incidents de sécurité critiques (fuite, défaillance SSL, injection détectée)."
          statut="Actif"
          actif
        />
        <LigneNotification
          titre="Résumé hebdomadaire"
          description="Un bilan de la semaine chaque dimanche soir."
          statut="Bientôt"
          actif={false}
        />
      </ul>
      <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
        Les préférences fines (heure d&apos;envoi, canal SMS/Slack,
        notifications par site) arrivent dans un prochain lot.
      </p>
    </section>
  );
}

function LigneNotification({
  titre,
  description,
  statut,
  actif,
}: {
  titre: string;
  description: string;
  statut: string;
  actif: boolean;
}) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">{titre}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          {description}
        </p>
      </div>
      <span
        className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
          actif
            ? "bg-emerald-100 text-emerald-800"
            : "bg-slate-200 text-slate-600"
        }`}
      >
        {statut}
      </span>
    </li>
  );
}

/* ─── Facturation ──────────────────────────────────────────────── */

function SectionFacturation() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
        <CreditCard
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Facturation et abonnement
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Consultez votre formule, vos factures et modifiez votre moyen
        de paiement.
      </p>
      <Link
        href="/dashboard/abonnement"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-110"
      >
        Ouvrir mon abonnement
      </Link>
    </section>
  );
}

/* ─── RGPD / Données ───────────────────────────────────────────── */

function SectionRGPD() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Shield
          className="h-5 w-5 text-indigo-700"
          strokeWidth={2.2}
          aria-hidden
        />
        Vos données (RGPD)
      </h2>
      <p className="mb-5 text-sm text-slate-600">
        AxiSolver héberge vos données dans l&apos;Union européenne. Vous
        pouvez à tout moment les exporter ou les supprimer.
      </p>

      <ul className="space-y-3">
        <li className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex items-start gap-3">
            <Download
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500"
              strokeWidth={2.2}
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium text-slate-900">
                Exporter mes données
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Vous recevez un fichier JSON contenant tout ce que nous
                stockons à votre sujet et sur vos sites.
              </p>
            </div>
          </div>
          <a
            href="mailto:contact@axisolver.app?subject=Demande%20d%27export%20de%20mes%20donn%C3%A9es"
            className="flex-shrink-0 rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-indigo-500 hover:text-indigo-700"
          >
            Demander l&apos;export
          </a>
        </li>

        <li className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <div className="flex items-start gap-3">
            <Trash2
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600"
              strokeWidth={2.2}
              aria-hidden
            />
            <div>
              <p className="text-sm font-medium text-rose-900">
                Supprimer mon compte
              </p>
              <p className="mt-1 text-xs leading-relaxed text-rose-700/80">
                Supprime définitivement votre compte, vos sites, vos
                bases de connaissances et vos conversations. Action
                irréversible.
              </p>
            </div>
          </div>
          <a
            href="mailto:contact@axisolver.app?subject=Demande%20de%20suppression%20de%20mon%20compte"
            className="flex-shrink-0 rounded-full border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-medium text-rose-700 shadow-sm hover:border-rose-500 hover:bg-rose-50"
          >
            Contacter le support
          </a>
        </li>
      </ul>

      <p className="mt-4 flex items-start gap-1.5 text-[11px] text-slate-500">
        <AlertTriangle
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
          strokeWidth={2.2}
          aria-hidden
        />
        Export et suppression automatiques en self-service arrivent
        bientôt. En attendant, nous traitons chaque demande sous 48h
        ouvrées.
      </p>
    </section>
  );
}

/* ─── Déconnexion ──────────────────────────────────────────────── */

function SectionDeconnexion() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
        <LogOut
          className="h-5 w-5 text-slate-500"
          strokeWidth={2.2}
          aria-hidden
        />
        Session
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Vous pouvez fermer votre session sur cet appareil à tout
        moment.
      </p>
      <form action="/api/auth/deconnexion" method="post">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-500 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Se déconnecter
        </button>
      </form>
    </section>
  );
}
