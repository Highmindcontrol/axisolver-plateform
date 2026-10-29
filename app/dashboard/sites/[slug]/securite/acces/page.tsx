import { filtreSitesAccessibles } from "@/lib/services/acces-site";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import {
  ChevronLeft,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Hammer,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { listerAcces, type AccesResume } from "@/lib/packs/security-shield";
import { FormulaireWordpress } from "./formulaire-wordpress";
import { PasAPasWordpress } from "./pas-a-pas-wordpress";
import {
  BoutonSupprimerAcces,
  BoutonTesterAcces,
} from "./boutons-ligne";

export const dynamic = "force-dynamic";

export default async function PageAccesSecurite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const [site] = await db
    .select({
      id: sites.id,
      slug: sites.slug,
      nomEntreprise: sites.nomEntreprise,
      nomSite: sites.nomSite,
      domainePrincipal: sites.domainePrincipal,
    })
    .from(sites)
    .where(and(eq(sites.slug, slug), await filtreSitesAccessibles(user.id)))
    .limit(1);
  if (!site) notFound();

  let acces: AccesResume[] = [];
  let erreurAcces: string | null = null;
  try {
    acces = await listerAcces(site.id);
  } catch (e) {
    erreurAcces = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10">
        <Link
          href={`/dashboard/sites/${slug}/securite`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour à la sécurité de {site.nomSite ?? site.nomEntreprise}
        </Link>
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700">
          <Shield className="h-3 w-3" strokeWidth={2.5} />
          AxiSolver Security Shield
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Accès au site pour AXI
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Pour qu&apos;AXI puisse corriger lui-même les problèmes de
          sécurité détectés, il doit pouvoir se connecter à ton site.
          Ces accès sont chiffrés en base (AES-256-GCM) et utilisés
          uniquement pour les interventions de remédiation.
        </p>
      </header>

      {/* ────── Liste des accès configurés ────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <KeyRound className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Accès configurés ({acces.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              AXI utilisera ces accès pour exécuter les remédiations.
            </p>
          </div>
        </header>

        {erreurAcces ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            Impossible de charger les accès : {erreurAcces}
          </div>
        ) : acces.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
            <KeyRound
              className="mx-auto h-8 w-8 text-slate-400"
              strokeWidth={1.5}
            />
            <p className="mt-3 text-sm text-slate-600">
              Aucun accès configuré. AXI pourra auditer et alerter, mais
              ne pourra pas intervenir pour corriger. Configure au moins
              un accès ci-dessous pour activer la remédiation.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {acces.map((a) => (
              <LigneAcces key={a.id} acces={a} slug={slug} />
            ))}
          </ul>
        )}
      </section>

      {/* ────── Formulaire d'ajout WordPress REST (V1) ────── */}
      <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"
            aria-hidden
          >
            <Hammer className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Ajouter un accès WordPress REST API
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Le plus simple si ton site est sous WordPress — AXI pourra
              modifier config, cookies, headers HTTP et scanner le contenu.
            </p>
          </div>
        </header>
        <PasAPasWordpress />
        <FormulaireWordpress slug={slug} />
      </section>

      {/* ────── Types d'accès à venir ────── */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Autres types d&apos;accès bientôt disponibles
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Pour les cas non-WordPress ou plus avancés :
        </p>
        <ul className="mt-3 grid gap-2 text-xs text-slate-700 md:grid-cols-2">
          <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <strong>SSH</strong> — serveur VPS/dédié avec clé privée ou
            mot de passe
          </li>
          <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <strong>FTP / SFTP</strong> — hébergement mutualisé
          </li>
          <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <strong>Cloudflare API</strong> — gestion en-têtes HTTP via
            Cloudflare
          </li>
          <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            <strong>cPanel / Plesk</strong> — panels d&apos;hébergement
          </li>
        </ul>
      </section>
    </div>
  );
}

function LigneAcces({
  acces,
  slug,
}: {
  acces: AccesResume;
  slug: string;
}) {
  const typesLisibles: Record<string, string> = {
    ssh: "SSH",
    ftp: "FTP",
    sftp: "SFTP",
    wordpress_rest: "WordPress REST API",
    cloudflare_api: "Cloudflare API",
    cpanel_api: "cPanel API",
    plesk_api: "Plesk API",
  };

  const resumeAcces = (() => {
    const p = acces.parametresPublics;
    switch (p.type) {
      case "wordpress_rest":
        return `${p.user}@${p.urlSite.replace(/^https?:\/\//, "")}`;
      case "ssh":
      case "sftp":
      case "ftp":
      case "cpanel_api":
      case "plesk_api":
        return `${p.user}@${p.host}:${p.port}`;
      case "cloudflare_api":
        return `zone ${p.zoneId}`;
      default:
        return "";
    }
  })();

  return (
    <li className="flex items-start justify-between gap-3 py-4">
      <div className="flex-1">
        <p className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {acces.libelle}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
            {typesLisibles[acces.type] ?? acces.type}
          </span>
          {acces.derniereConnexionOk === true && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
              Connexion OK
            </span>
          )}
          {acces.derniereConnexionOk === false && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
              <XCircle className="h-3 w-3" strokeWidth={2.5} />
              Erreur de connexion
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-600">{resumeAcces}</p>
        {acces.derniereConnexionLe && (
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" strokeWidth={2} />
            Dernier test :{" "}
            {new Date(acces.derniereConnexionLe).toLocaleString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {acces.derniereConnexionErreur && (
          <p className="mt-1 text-[11px] text-rose-700">
            {acces.derniereConnexionErreur}
          </p>
        )}
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-2">
        <BoutonTesterAcces slug={slug} accesId={acces.id} />
        <BoutonSupprimerAcces slug={slug} accesId={acces.id} />
      </div>
    </li>
  );
}
