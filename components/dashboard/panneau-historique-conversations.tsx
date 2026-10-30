"use client";

import { Loader2, Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Fil = {
  id: string;
  titre: string;
  siteSlug: string | null;
  creeLe: string;
  derniereActiviteLe: string;
  nbMessages: number;
  premierMessage: string | null;
};

/**
 * Panneau historique des conversations d'un site. S'ouvre en-dessous
 * du bandeau d'actions (toggle contrôlé par le parent). Liste les
 * fils du site, permet d'y basculer et de les renommer.
 *
 * Communication avec le reste du dashboard via :
 *   - `axichat::fil-courant::<slug ou GLOBAL>` dans localStorage
 *   - CustomEvent `axichat-fil-change` sur `window` (detail = filId)
 */
export function PanneauHistoriqueConversations({
  siteSlug,
}: {
  siteSlug: string | null;
}) {
  const [fils, setFils] = useState<Fil[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filCourant, setFilCourant] = useState<string | null>(null);
  const [renommageEnCours, setRenommageEnCours] = useState<string | null>(null);
  const inputRenommageRef = useRef<HTMLInputElement | null>(null);

  const cleStorage = `axichat::fil-courant::${siteSlug ?? "GLOBAL"}`;

  const chargerFils = useCallback(async () => {
    setChargement(true);
    try {
      const url = siteSlug
        ? `/api/dashboard/chat/fils?siteSlug=${encodeURIComponent(siteSlug)}`
        : "/api/dashboard/chat/fils";
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { fils?: Fil[] };
      setFils(data.fils ?? []);
    } catch (e) {
      console.warn("[historique] chargement fils échoué", e);
      setFils([]);
    } finally {
      setChargement(false);
    }
  }, [siteSlug]);

  useEffect(() => {
    chargerFils();
    if (typeof window !== "undefined") {
      setFilCourant(window.localStorage.getItem(cleStorage));
    }
  }, [chargerFils, cleStorage]);

  // Rafraîchit la liste quand un nouveau fil est créé ou qu'un fil est
  // renommé ailleurs dans l'app (notamment via le bouton « Nouvelle »
  // de l'entête chat).
  useEffect(() => {
    function surChange() {
      chargerFils();
      if (typeof window !== "undefined") {
        setFilCourant(window.localStorage.getItem(cleStorage));
      }
    }
    window.addEventListener("axichat-fil-change", surChange);
    return () => window.removeEventListener("axichat-fil-change", surChange);
  }, [chargerFils, cleStorage]);

  function basculer(fil: Fil) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(cleStorage, fil.id);
    setFilCourant(fil.id);
    window.dispatchEvent(
      new CustomEvent("axichat-fil-change", { detail: fil.id }),
    );
  }

  async function sauvegarderRenommage(filId: string, nouveauTitre: string) {
    const titre = nouveauTitre.trim();
    if (!titre) {
      setRenommageEnCours(null);
      return;
    }
    try {
      const resp = await fetch(`/api/dashboard/chat/fil/${filId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titre }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setFils((prev) =>
        prev.map((f) => (f.id === filId ? { ...f, titre } : f)),
      );
    } catch (e) {
      console.warn("[historique] renommage échoué", e);
    } finally {
      setRenommageEnCours(null);
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center gap-2 border-t bg-white px-6 py-4 text-sm text-slate-500 md:px-14 lg:px-16">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Chargement de l&apos;historique…
      </div>
    );
  }

  if (fils.length === 0) {
    return (
      <div className="border-t bg-white px-6 py-4 text-sm text-slate-500 md:px-14 lg:px-16">
        Aucune conversation enregistrée pour ce site. Démarrez-en une
        depuis le chat ci-dessus.
      </div>
    );
  }

  return (
    <div className="border-t bg-white px-6 py-3 md:px-14 lg:px-16">
      <ul className="space-y-1.5">
        {fils.map((f) => {
          const actif = f.id === filCourant;
          const enRenommage = renommageEnCours === f.id;
          return (
            <li
              key={f.id}
              className={`group flex items-center gap-3 rounded-lg border px-3 py-2 transition ${
                actif
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <button
                type="button"
                onClick={() => basculer(f)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  {enRenommage ? (
                    <input
                      ref={inputRenommageRef}
                      type="text"
                      defaultValue={f.titre}
                      autoFocus
                      onBlur={(e) =>
                        sauvegarderRenommage(f.id, e.currentTarget.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sauvegarderRenommage(f.id, e.currentTarget.value);
                        } else if (e.key === "Escape") {
                          setRenommageEnCours(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-slate-500"
                    />
                  ) : (
                    <p className="truncate text-sm font-medium">{f.titre}</p>
                  )}
                  <p
                    className={`truncate text-[11px] ${
                      actif ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {f.nbMessages} message{f.nbMessages > 1 ? "s" : ""} ·{" "}
                    {formaterDate(f.derniereActiviteLe)}
                  </p>
                </div>
              </button>
              {!enRenommage && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenommageEnCours(f.id);
                  }}
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition ${
                    actif
                      ? "text-slate-300 hover:bg-white/10 hover:text-white"
                      : "text-slate-400 opacity-0 hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100"
                  }`}
                  aria-label="Renommer cette conversation"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formaterDate(iso: string): string {
  try {
    const d = new Date(iso);
    const auj = new Date();
    const diffJ = Math.floor(
      (auj.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffJ === 0) {
      return `aujourd'hui ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffJ === 1) return "hier";
    if (diffJ < 7) return `il y a ${diffJ} j`;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
