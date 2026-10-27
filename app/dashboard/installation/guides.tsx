"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Download } from "lucide-react";

type Guide = {
  titre: string;
  etapes: string[];
  liens?: Array<{ libelle: string; url: string }>;
  recommandation?: boolean;
};

export function GuidesInstallation({
  slug,
  baseUrl,
}: {
  slug: string;
  baseUrl: string;
}) {
  const guides: Guide[] = [
    {
      titre: "WordPress — plugin officiel (3 clics)",
      recommandation: true,
      etapes: [
        "Admin WordPress → Extensions → Ajouter → cherchez « AxiSolver »",
        "Cliquez « Installer », puis « Activer »",
        "Allez dans Réglages → AxiSolver",
        `Collez votre site_id : ${slug}`,
        "Cliquez « Enregistrer » — c'est en ligne",
      ],
      liens: [
        {
          libelle: "Voir le plugin sur wordpress.org (bientôt publié)",
          url: "https://wordpress.org/plugins/axisolver/",
        },
      ],
    },
    {
      titre: "Google Tag Manager — template officiel",
      recommandation: true,
      etapes: [
        "Dans votre conteneur GTM → Tags → New",
        "Choose a tag type → Discover more tag types in the Community Template Gallery",
        "Cherchez « AxiSolver » → Add to workspace",
        `Dans le champ « site_id », collez : ${slug}`,
        "Triggering → All Pages → Save → Submit pour publier le conteneur",
      ],
      liens: [
        {
          libelle: "Voir le template sur la Gallery (bientôt publié)",
          url: "https://gallery.tagmanager.google.com/",
        },
      ],
    },
    {
      titre: "Shopify",
      etapes: [
        "Admin Shopify → Online Store → Themes → bouton « Actions » du thème actif → « Edit code »",
        "Dans la colonne de gauche, ouvrez le fichier theme.liquid (section Layout)",
        "Trouvez la balise </body> en bas du fichier",
        `Collez juste avant </body> : <script src="${baseUrl}/v1.js" data-site-id="${slug}" async></script>`,
        "Cliquez « Save » en haut à droite — c'est en ligne",
      ],
    },
    {
      titre: "Webflow",
      etapes: [
        "Dashboard Webflow → votre projet → bouton Settings (en haut à droite)",
        "Onglet « Custom Code »",
        `Dans la section « Footer Code », collez : <script src="${baseUrl}/v1.js" data-site-id="${slug}" async></script>`,
        "Enregistrez, puis publiez votre site",
      ],
    },
    {
      titre: "Wix",
      etapes: [
        "Admin Wix → Settings → Marketing Tools → Tracking & Analytics",
        "Cliquez « New Tool » → sélectionnez « Custom »",
        `Collez : <script src="${baseUrl}/v1.js" data-site-id="${slug}" async></script>`,
        "Choisissez « Body - end » comme emplacement",
        "Appliquez à « All Pages » puis enregistrez",
      ],
    },
    {
      titre: "Squarespace",
      etapes: [
        "Admin Squarespace → Settings → Advanced → Code Injection",
        `Dans la zone « Footer », collez : <script src="${baseUrl}/v1.js" data-site-id="${slug}" async></script>`,
        "Cliquez « Save » en haut à gauche",
      ],
    },
    {
      titre: "Vercel / Netlify (Next.js, Remix, Astro…)",
      etapes: [
        "Ouvrez votre fichier de layout racine (ex. app/layout.tsx en Next 13+, src/root.tsx en Remix)",
        "Importez le composant Script : import Script from 'next/script'",
        `Juste avant la fermeture de </body>, ajoutez : <Script src="${baseUrl}/v1.js" data-site-id="${slug}" strategy="afterInteractive" />`,
        "Commitez et poussez — Vercel/Netlify redéploie automatiquement",
      ],
    },
    {
      titre: "HTML pur / autre hébergement",
      etapes: [
        "Ouvrez chaque fichier HTML où vous voulez afficher AxiSolver",
        "Trouvez la balise </body> en bas du fichier",
        `Collez juste avant : <script src="${baseUrl}/v1.js" data-site-id="${slug}" async></script>`,
        "Enregistrez les fichiers",
        "Uploadez via FTP ou votre File Manager vers votre hébergeur",
      ],
    },
  ];

  const [ouvert, setOuvert] = useState<string | null>(guides[0].titre);

  return (
    <div className="space-y-3">
      {guides.map((g) => {
        const estOuvert = ouvert === g.titre;
        return (
          <div
            key={g.titre}
            className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${
              g.recommandation
                ? "border-indigo-200"
                : "border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setOuvert(estOuvert ? null : g.titre)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
              aria-expanded={estOuvert}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-900">
                  {g.titre}
                </span>
                {g.recommandation && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-indigo-700">
                    Recommandé
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${
                  estOuvert ? "rotate-180" : ""
                }`}
                strokeWidth={2.2}
                aria-hidden
              />
            </button>

            {estOuvert && (
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                <ol className="space-y-2 text-sm leading-relaxed text-slate-800">
                  {g.etapes.map((etape, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="flex-shrink-0 font-semibold text-indigo-700">
                        {i + 1}.
                      </span>
                      <span>{etape}</span>
                    </li>
                  ))}
                </ol>
                {g.liens && (
                  <div className="mt-4 space-y-1.5">
                    {g.liens.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-700 hover:underline"
                      >
                        {l.libelle}
                        <ExternalLink className="h-3 w-3" strokeWidth={2.2} aria-hidden />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function BoutonTelechargerHtml({
  slug,
  baseUrl,
}: {
  slug: string;
  baseUrl: string;
}) {
  function telecharger() {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Mon site avec AxiSolver</title>
</head>
<body>
  <h1>Bienvenue sur mon site</h1>
  <p>AxiSolver est en bas à droite.</p>

  <!-- AxiSolver loader -->
  <script src="${baseUrl}/v1.js" data-site-id="${slug}" async></script>
</body>
</html>
`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `axisolver-exemple-${slug}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={telecharger}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-slate-50"
    >
      <Download className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      Télécharger un fichier HTML d&apos;exemple
    </button>
  );
}
