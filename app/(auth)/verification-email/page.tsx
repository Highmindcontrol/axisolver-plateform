import Link from "next/link";
import { MailCheck } from "lucide-react";

export default async function PageVerificationEmail({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const emailAffiche = email || "votre adresse";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex justify-center">
        <span
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-white shadow-md shadow-indigo-500/30"
          aria-hidden
        >
          <MailCheck className="h-6 w-6" strokeWidth={2} />
        </span>
      </div>

      <header className="mb-5 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          Vérifiez votre boîte email
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Nous venons d&apos;envoyer un lien de confirmation à{" "}
          <strong className="font-semibold text-slate-900">
            {emailAffiche}
          </strong>
          . Cliquez sur le bouton dans l&apos;email pour activer votre
          compte.
        </p>
      </header>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-900">
          Vous ne recevez rien ?
        </p>
        <ul className="mt-2 space-y-1 leading-relaxed">
          <li>· Vérifiez votre dossier spam / promotions</li>
          <li>· Le lien est valable 24 heures</li>
          <li>
            · L&apos;expéditeur est{" "}
            <code className="text-indigo-700">noreply@axisolver.app</code>
          </li>
        </ul>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        <Link
          href="/connexion"
          className="font-medium text-indigo-700 hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </section>
  );
}
