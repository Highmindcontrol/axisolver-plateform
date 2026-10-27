"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  ajouterSourceUrlAction,
  ajouterSourceSitemapAction,
  uploadPdfAction,
  supprimerSourceAction,
  type EtatSource,
} from "./actions";

const ETAT_INITIAL: EtatSource = { erreur: null };

export function FormulaireAjouterUrl({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    ajouterSourceUrlAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input
        type="url"
        name="url"
        required
        placeholder="https://monsite.com/une-page"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <BoutonAjouter pending={pending} label="Ingérer cette URL" />
      <Feedback etat={etat} />
    </form>
  );
}

export function FormulaireAjouterSitemap({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(
    ajouterSourceSitemapAction,
    ETAT_INITIAL,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input
        type="url"
        name="urlSitemap"
        required
        placeholder="https://monsite.com/sitemap.xml"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
      />
      <p className="text-xs text-slate-500">
        Crawl 100 pages max, 1 req/s. Peut prendre plusieurs minutes.
      </p>
      <BoutonAjouter pending={pending} label="Ingérer le sitemap" />
      <Feedback etat={etat} />
    </form>
  );
}

export function FormulaireUploadPdf({ slug }: { slug: string }) {
  const [etat, action, pending] = useActionState(uploadPdfAction, ETAT_INITIAL);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="slug" value={slug} />
      <input
        type="file"
        name="pdf"
        accept="application/pdf,.pdf"
        required
        className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-slate-700"
      />
      <p className="text-xs text-slate-500">
        20 MB max. OCR non supporté (pas de PDF scannés).
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Upload et ingestion…
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Uploader et ingérer
          </>
        )}
      </button>
      <Feedback etat={etat} />
    </form>
  );
}

function BoutonAjouter({
  pending,
  label,
}: {
  pending: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Ingestion en cours…
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}

function Feedback({ etat }: { etat: EtatSource }) {
  if (etat.ok) {
    return (
      <div className="flex items-start gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-900">
        <CheckCircle2
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
          strokeWidth={2.2}
        />
        <span>
          Ingéré{etat.nbChunks !== undefined ? ` (${etat.nbChunks} chunks).` : "."}
        </span>
      </div>
    );
  }
  if (etat.erreur) {
    return (
      <div className="flex items-start gap-1.5 rounded-md border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">
        <AlertCircle
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0"
          strokeWidth={2.2}
        />
        <span>{etat.erreur}</span>
      </div>
    );
  }
  return null;
}

export function BoutonSupprimer({
  slug,
  sourceId,
}: {
  slug: string;
  sourceId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function supprimer() {
    if (!confirm("Supprimer cette source et tous ses chunks ?")) return;
    start(async () => {
      await supprimerSourceAction(slug, sourceId);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={supprimer}
      disabled={pending}
      aria-label="Supprimer la source"
      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-700 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Trash2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      )}
    </button>
  );
}
