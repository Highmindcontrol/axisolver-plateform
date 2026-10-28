import { MessagesSquare, PlusCircle } from "lucide-react";
import Link from "next/link";

/**
 * Bande blanche fine au-dessus du triptyque — titre de la conversation
 * en cours + bouton « Nouvelle conversation ». Pendant au-dessus du
 * fond coloré du dashboard, offre un rappel permanent de l'état.
 */
export function BandePouls({
  titreConversation,
  siteFocus,
}: {
  titreConversation?: string | null;
  siteFocus?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/40 bg-white/70 px-6 py-3 backdrop-blur md:px-14 lg:px-16">
      <div className="flex items-center gap-2 text-sm">
        <MessagesSquare
          className="h-4 w-4 text-slate-500"
          strokeWidth={2}
          aria-hidden
        />
        <span className="font-medium text-slate-900">
          {titreConversation ?? "Nouvelle conversation"}
        </span>
        {siteFocus && (
          <>
            <span className="text-slate-400">·</span>
            <span className="text-slate-600">{siteFocus}</span>
          </>
        )}
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white"
      >
        <PlusCircle className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        Nouvelle conversation
      </Link>
    </div>
  );
}
