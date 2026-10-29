"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import {
  COULEUR_DEFAUT,
  ICONES_PAR_CATEGORIE,
  IconeSite,
  PALETTE_COULEURS,
  PICTO_DEFAUT,
  estHexValide,
} from "@/lib/ui/sites-apparence";

/**
 * Picker apparence site : couleur + picto.
 *
 * Expose deux inputs hidden `couleur` et `picto` dans le FormData
 * parent pour que l'action puisse les lire. L'aperçu en haut rend
 * la pastille telle qu'elle apparaîtra dans le switcher sites.
 */
export function PickerApparence({
  defaultCouleur = COULEUR_DEFAUT,
  defaultPicto = PICTO_DEFAUT,
}: {
  defaultCouleur?: string;
  defaultPicto?: string;
}) {
  const [couleur, setCouleur] = useState(defaultCouleur);
  const [picto, setPicto] = useState(defaultPicto);
  const [hexLibre, setHexLibre] = useState("");

  function appliquerHexLibre() {
    const h = hexLibre.trim();
    const prefixe = h.startsWith("#") ? h : `#${h}`;
    if (estHexValide(prefixe)) {
      setCouleur(prefixe);
    }
  }

  return (
    <div className="space-y-5">
      <input type="hidden" name="couleur" value={couleur} />
      <input type="hidden" name="picto" value={picto} />

      {/* Aperçu */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: couleur }}
        >
          <IconeSite valeur={picto} tailleClass="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">Aperçu</p>
          <p className="truncate text-sm font-semibold text-slate-900">
            Ainsi apparaîtra votre site dans la barre du haut
          </p>
        </div>
      </div>

      {/* Palette couleur */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-900">
          Couleur signature
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE_COULEURS.map((c) => {
            const actif = c.hex.toLowerCase() === couleur.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => setCouleur(c.hex)}
                title={c.nom}
                aria-label={`Choisir ${c.nom}`}
                aria-pressed={actif}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                  actif ? "ring-2 ring-offset-2 ring-slate-900" : ""
                }`}
                style={{ backgroundColor: c.hex }}
              >
                {actif && (
                  <Check
                    className="h-4 w-4 text-white"
                    strokeWidth={2.6}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={hexLibre}
              onChange={(e) => setHexLibre(e.target.value)}
              onBlur={appliquerHexLibre}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  appliquerHexLibre();
                }
              }}
              placeholder="#RRGGBB"
              maxLength={7}
              className="h-9 w-24 rounded-md border border-slate-300 bg-white px-2 text-xs font-mono text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Grille picto */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-900">Picto</p>
        <div className="space-y-3">
          {Object.entries(ICONES_PAR_CATEGORIE).map(([categorie, icones]) => (
            <div key={categorie}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {categorie}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {icones.map((nom) => {
                  const actif = nom === picto;
                  return (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setPicto(nom)}
                      aria-label={`Choisir le picto ${nom}`}
                      aria-pressed={actif}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                        actif
                          ? "border-transparent text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900"
                      }`}
                      style={
                        actif ? { backgroundColor: couleur } : undefined
                      }
                    >
                      <IconeSite valeur={nom} tailleClass="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
