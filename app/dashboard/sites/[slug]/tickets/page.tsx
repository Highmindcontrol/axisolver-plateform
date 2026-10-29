import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { and, eq, desc, count } from "drizzle-orm";
import {
  ChevronLeft,
  MessageSquare,
  Clock,
  Flame,
  ChevronRight,
} from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import {
  sites,
  conversations,
  tickets,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PageTicketsSite({
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
    .select()
    .from(sites)
    .where(and(eq(sites.slug, slug), eq(sites.ownerUserId, user.id)))
    .limit(1);
  if (!site) notFound();

  const [compteConv] = await db
    .select({ nb: count() })
    .from(conversations)
    .where(eq(conversations.siteId, site.id));

  const [compteTickets] = await db
    .select({ nb: count() })
    .from(tickets)
    .where(eq(tickets.siteId, site.id));

  const dernieresConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.siteId, site.id))
    .orderBy(desc(conversations.creeLe))
    .limit(30);

  const derniersTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.siteId, site.id))
    .orderBy(desc(tickets.creeLe))
    .limit(30);

  return (
    <div className="px-6 py-10 md:px-14 lg:px-16">
      <header className="mb-10">
        <Link
          href={`/dashboard/sites/${slug}`}
          className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-700"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Retour à {site.nomEntreprise}
        </Link>
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-indigo-700">
          Tickets &amp; conversations
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          Journal des échanges
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Chaque conversation visiteur est archivée (texte intégral,
          navigateur, URL d&apos;origine). Les tickets AXI-XXXX sont
          créés par AxiSolver quand il collecte des coordonnées.
        </p>
      </header>

      <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"
              aria-hidden
            >
              <MessageSquare className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Conversations
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {compteConv.nb}
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800"
              aria-hidden
            >
              <Flame className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Tickets AXI
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {compteTickets.nb}
              </p>
            </div>
          </div>
        </article>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
          Derniers tickets ({derniersTickets.length})
        </h2>
        {derniersTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
            Aucun ticket pour l&apos;instant. Les tickets AXI-XXXX
            apparaîtront ici dès qu&apos;AxiSolver collectera des
            coordonnées.
          </div>
        ) : (
          <ul className="space-y-3">
            {derniersTickets.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {t.reference}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {t.prenom ?? "—"}
                    {t.email ? ` · ${t.email}` : ""}
                    {t.telephone ? ` · ${t.telephone}` : ""}
                  </p>
                  {t.resume && (
                    <p className="mt-1.5 truncate text-xs text-slate-700">
                      {t.resume}
                    </p>
                  )}
                </div>
                <span
                  className={`hidden rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider sm:inline-flex ${
                    t.statut === "resolu_par_axi"
                      ? "bg-emerald-100 text-emerald-800"
                      : t.statut === "ouvert"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {t.statut.replace("_", " ")}
                </span>
                <Clock
                  className="h-4 w-4 flex-shrink-0 text-slate-400"
                  strokeWidth={2}
                  aria-hidden
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-700">
          Dernières conversations ({dernieresConversations.length})
        </h2>
        {dernieresConversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
            Aucune conversation enregistrée. Posez votre snippet sur
            votre site, les premiers échanges apparaîtront ici.
          </div>
        ) : (
          <ul className="space-y-3">
            {dernieresConversations.map((c) => {
              const premierMsg =
                (c.messages as Array<{ role: string; content: string }>).find(
                  (m) => m.role === "user",
                )?.content ?? "—";
              return (
                <li
                  key={c.id}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-slate-900">
                      <span className="font-medium">Visiteur</span> ·{" "}
                      {new Intl.DateTimeFormat("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(c.creeLe))}
                      {" · "}
                      {c.nbTours} tour·s
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {premierMsg}
                    </p>
                    {c.url && (
                      <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
                        {c.url}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400"
                    strokeWidth={2}
                    aria-hidden
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
