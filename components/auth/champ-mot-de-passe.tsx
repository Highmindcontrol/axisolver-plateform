"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * <ChampMotDePasse> — champ password avec bouton toggle visible.
 * Minimum 8 caractères (contrôlé côté serveur aussi).
 */

export function ChampMotDePasse({
  id = "motDePasse",
  name = "motDePasse",
  label = "Mot de passe",
  autoComplete = "current-password",
  minLength = 8,
}: {
  id?: string;
  name?: string;
  label?: string;
  autoComplete?: "current-password" | "new-password";
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-900">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
          tabIndex={-1}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>
    </div>
  );
}
