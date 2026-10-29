import { ArrowLeft, Code2, Key, Shield } from "lucide-react";
import Link from "next/link";

import {
  construireSnapshot,
  listerTokens,
} from "@/lib/services/forteresse";
import { estSuperAdmin } from "@/lib/services/super-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { PanneauTokens } from "./panneau-tokens";

export const dynamic = "force-dynamic";

export default async function PageForteresse() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const peutModifier = await estSuperAdmin(user.id);
  const [tokens, snapshot] = await Promise.all([
    listerTokens(),
    construireSnapshot(),
  ]);

  const urlEndpoint = "https://axisolver.app/api/forteresse/snapshot";

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <Link
        href="/dashboard/super-admin"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
        Retour au back-office
      </Link>

      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-700">
            Super-admin / Export Forteresse
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Export Forteresse Ataraxis
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            La Forteresse Ataraxis consomme ce endpoint JSON pour
            centraliser l&apos;état d&apos;AxiSolver (clients,
            abonnements, revenus, coûts, consommation) à l&apos;échelle du
            groupe. L&apos;authentification se fait via un Bearer token
            généré ci-dessous — à poser côté Forteresse comme variable
            d&apos;environnement.
          </p>
        </div>
        <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Shield className="h-5 w-5" strokeWidth={2.2} />
        </span>
      </header>

      {/* ─── Endpoint technique ──────────────────────── */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-4 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"
            aria-hidden
          >
            <Code2 className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Endpoint
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              GET avec Bearer token — réponse JSON
            </p>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800">
          <p>
            <span className="font-semibold text-emerald-700">GET</span>{" "}
            {urlEndpoint}
          </p>
          <p className="mt-2 text-slate-500">
            Authorization: Bearer fort_••••••••••••••••••••••••••••••••
          </p>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900">
            Exemple curl
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-[11px] text-slate-100">
            <code>{`curl -H "Authorization: Bearer fort_votre_token" \\
  ${urlEndpoint}`}</code>
          </pre>
        </details>
      </section>

      {/* ─── Tokens ──────────────────────────────────── */}
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-5 flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"
            aria-hidden
          >
            <Key className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Tokens API
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Les tokens sont stockés hashés (SHA-256). Le token clair
              n&apos;est affiché qu&apos;une fois à la création — note-le
              immédiatement.
            </p>
          </div>
        </header>
        <PanneauTokens tokens={tokens} peutModifier={peutModifier} />
      </section>

      {/* ─── Aperçu snapshot ─────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Aperçu du snapshot JSON
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Exactement ce que la Forteresse recevra en appelant le
            endpoint maintenant. Mis à jour à chaque chargement de cette
            page.
          </p>
        </header>
        <pre className="max-h-[600px] overflow-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-[11px] leading-relaxed text-slate-100">
          <code>{JSON.stringify(snapshot, null, 2)}</code>
        </pre>
      </section>
    </div>
  );
}
