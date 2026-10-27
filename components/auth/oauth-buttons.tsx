"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * <OAuthButtons> — connexion rapide via providers externes.
 *
 * Doctrine (verbatim François, 18 oct 2026) : modernité + sérieux.
 * Les 4 providers activés sont Google, LinkedIn (OIDC), Facebook,
 * Apple. Configuration des client_id/secrets côté dashboard Supabase
 * (Authentication → Providers), pas dans le code.
 *
 * Au clic, Supabase redirige vers le provider, puis back vers
 * /api/auth/callback?code=XXX qui échange le code contre la session.
 */

const PROVIDERS = [
  {
    id: "google",
    label: "Continuer avec Google",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 5c1.6 0 3 .5 4.1 1.5l3-3C17.3 1.8 14.8 1 12 1 7.5 1 3.6 3.6 1.7 7.4l3.5 2.7C6.2 7 8.9 5 12 5z"
        />
        <path
          fill="#4285F4"
          d="M23 12c0-.8-.1-1.6-.2-2.4H12v4.5h6.2c-.3 1.4-1.1 2.7-2.3 3.5l3.6 2.8c2.1-2 3.5-5 3.5-8.4z"
        />
        <path
          fill="#FBBC04"
          d="M5.2 14.2c-.3-.8-.4-1.6-.4-2.4s.1-1.6.4-2.4L1.7 6.7C.6 8.3 0 10.1 0 12s.6 3.7 1.7 5.3l3.5-2.8z"
        />
        <path
          fill="#34A853"
          d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1-3.7 1-3.1 0-5.8-2-6.8-4.8l-3.5 2.7C3.6 20.4 7.5 23 12 23z"
        />
      </svg>
    ),
  },
  {
    id: "linkedin_oidc",
    label: "Continuer avec LinkedIn",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path
          fill="#fff"
          d="M7.6 9.5h-2.5v8h2.5v-8zm-1.25-3.1c-.8 0-1.45.65-1.45 1.45 0 .8.65 1.45 1.45 1.45.8 0 1.45-.65 1.45-1.45 0-.8-.65-1.45-1.45-1.45zm12.65 11.1v-4.4c0-2.1-1.15-3.1-2.7-3.1-1.25 0-1.8.7-2.1 1.2v-1h-2.5v8h2.5v-4.3c0-1.1.2-2.2 1.6-2.2 1.4 0 1.4 1.3 1.4 2.3v4.2h2.8z"
        />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Continuer avec Facebook",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <rect width="24" height="24" rx="4" fill="#1877F2" />
        <path
          fill="#fff"
          d="M14 8h2V5h-2.5C11.6 5 10 6.6 10 8.5V10H8v3h2v6h3v-6h2.3l.7-3H13V9c0-.5.4-1 1-1z"
        />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Continuer avec Apple",
    svg: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="#000">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
  },
] as const;

export function OAuthButtons() {
  const [chargement, setChargement] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function lancerOAuth(provider: string) {
    setChargement(provider);
    setErreur(null);
    const supabase = createSupabaseBrowserClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "linkedin_oidc" | "facebook" | "apple",
      options: {
        redirectTo: `${siteUrl}/api/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      console.error("[oauth]", provider, error.message);
      setErreur("Connexion impossible pour l'instant. Réessayez.");
      setChargement(null);
    }
  }

  return (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => lancerOAuth(p.id)}
          disabled={chargement !== null}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {p.svg}
          <span>{chargement === p.id ? "Redirection…" : p.label}</span>
        </button>
      ))}
      {erreur && (
        <p className="text-xs font-medium text-rose-600" role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}
