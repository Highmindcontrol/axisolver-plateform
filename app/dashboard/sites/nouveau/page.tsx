import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormulaireNouveauSite } from "./formulaire";

export const dynamic = "force-dynamic";

export default async function PageNouveauSite() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  return (
    <div className="mx-auto max-w-[720px] px-6 py-14">
      <header className="mb-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Nouveau site
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Enregistrez votre site AxiSolver.
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Quelques infos pour démarrer. Vous pourrez affiner la
          configuration (branding, langues, options d&apos;accueil,
          base de connaissances) juste après.
        </p>
      </header>

      <FormulaireNouveauSite />

      <p className="mt-10 text-center text-xs text-slate-600">
        <Link
          href="/dashboard"
          className="font-medium text-indigo-700 hover:underline"
        >
          Retour au dashboard
        </Link>
      </p>
    </div>
  );
}
