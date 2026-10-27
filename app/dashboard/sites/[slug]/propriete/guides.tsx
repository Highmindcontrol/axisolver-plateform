"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accordéons de guides pas-à-pas par CMS/plateforme pour chaque
 * méthode de vérification. Évite la friction utilisateur de
 * « déposer un fichier à la racine » qui ne veut rien dire sans
 * contexte.
 */

type Guide = {
  titre: string;
  etapes: string[];
};

export function GuidesBalise({
  balise,
  domaine,
}: {
  balise: string;
  domaine: string;
}) {
  const guides: Guide[] = [
    {
      titre: "WordPress",
      etapes: [
        "Ouvrez l'admin WordPress → Apparence → Éditeur de thème → sélectionnez le fichier header.php",
        "Trouvez la balise <head> en haut du fichier",
        "Collez la ligne meta ci-dessus juste après <head>",
        "Cliquez sur « Mettre à jour le fichier »",
        "Alternative plus propre : installez le plugin « Insert Headers and Footers », collez la balise dans « Scripts in Header » et enregistrez.",
      ],
    },
    {
      titre: "Shopify",
      etapes: [
        "Admin Shopify → Online Store → Themes → bouton « Actions » du thème actif → « Edit code »",
        "Dans la liste de gauche, ouvrez le fichier theme.liquid (section Layout)",
        "Trouvez la balise <head> en haut du fichier",
        "Collez la ligne meta ci-dessus juste après <head>",
        "Cliquez « Save » en haut à droite",
      ],
    },
    {
      titre: "Webflow",
      etapes: [
        "Dashboard Webflow → votre projet → bouton Settings (en haut à droite)",
        "Onglet « Custom Code »",
        "Dans la section « Head Code », collez la ligne meta ci-dessus",
        "Enregistrez puis publiez votre site",
      ],
    },
    {
      titre: "Wix",
      etapes: [
        "Admin Wix → Settings → Marketing Tools → Tracking & Analytics",
        "Cliquez « New Tool » → sélectionnez « Custom »",
        "Collez la ligne meta ci-dessus dans le champ code",
        "Choisissez « Head » comme emplacement",
        "Appliquez à « All Pages » puis enregistrez",
      ],
    },
    {
      titre: "Squarespace",
      etapes: [
        "Admin Squarespace → Settings → Advanced → Code Injection",
        "Collez la ligne meta ci-dessus dans la zone « Header »",
        "Cliquez « Save » en haut à gauche",
      ],
    },
    {
      titre: "HTML pur / autre",
      etapes: [
        "Ouvrez le fichier HTML principal de votre site (souvent index.html)",
        "Trouvez la balise <head> en haut du fichier",
        "Collez la ligne meta ci-dessus à l'intérieur du <head>",
        "Sauvegardez le fichier et redéployez votre site sur votre hébergeur",
      ],
    },
  ];

  return <Accordeons titre="Comment coller la balise selon mon site" guides={guides} />;
}

export function GuidesFichier({
  slug,
  token,
  domaine,
}: {
  slug: string;
  token: string;
  domaine: string;
}) {
  const nomFichier = `axisolver-verification-${token}.txt`;
  const guides: Guide[] = [
    {
      titre: "WordPress",
      etapes: [
        `Téléchargez le fichier ${nomFichier} depuis le bouton ci-dessus`,
        "Admin WordPress → Media → Add New (si vous avez un plugin de media manager avancé) OU connectez-vous à votre hébergeur par FTP/File Manager (cPanel, Plesk)",
        "Dans le File Manager de l'hébergeur, naviguez dans le dossier /public_html/ (c'est la « racine »)",
        `Uploadez le fichier ${nomFichier} dans ce dossier`,
        `Vérifiez en ouvrant https://${domaine}/${nomFichier} dans un onglet — vous devez voir le token s'afficher`,
      ],
    },
    {
      titre: "Shopify",
      etapes: [
        "Shopify ne permet pas d'uploader des fichiers libres à la racine du site. Utilisez plutôt la méthode « Balise meta » (plus simple) ou « DNS TXT ».",
      ],
    },
    {
      titre: "Webflow / Wix / Squarespace",
      etapes: [
        "Ces plateformes ne permettent pas d'uploader de fichier libre à la racine. Utilisez la méthode « Balise meta » (recommandée) ou « DNS TXT ».",
      ],
    },
    {
      titre: "Vercel / Netlify",
      etapes: [
        `Téléchargez le fichier ${nomFichier} depuis le bouton ci-dessus`,
        `Placez-le dans le dossier public/ (Vercel + Next.js) ou public/ (Netlify) de votre repo`,
        "Commitez et pushez vers votre branche de production",
        `Après le re-déploiement, vérifiez https://${domaine}/${nomFichier}`,
      ],
    },
    {
      titre: "HTML pur / hébergement classique (OVH, Infomaniak, O2switch…)",
      etapes: [
        `Téléchargez le fichier ${nomFichier} depuis le bouton ci-dessus`,
        "Connectez-vous à votre hébergeur via FTP (FileZilla, Cyberduck) ou via le File Manager de votre panel",
        "Naviguez dans le dossier racine (souvent public_html, htdocs, www ou site)",
        `Uploadez le fichier ${nomFichier} à cet endroit`,
        `Vérifiez via https://${domaine}/${nomFichier}`,
      ],
    },
  ];

  return <Accordeons titre="Comment déposer le fichier selon mon site" guides={guides} />;
}

export function GuidesDns({
  valeur,
  domaine,
}: {
  valeur: string;
  domaine: string;
}) {
  const guides: Guide[] = [
    {
      titre: "OVHcloud",
      etapes: [
        "Manager OVH → Domaines → sélectionnez votre domaine",
        "Onglet « Zone DNS » → « Ajouter une entrée »",
        "Type d'entrée : TXT",
        "Sous-domaine : laisser VIDE (correspond au domaine racine)",
        `Cible / Valeur : collez exactement ${valeur}`,
        "TTL : laisser par défaut (3600)",
        "Validez et attendez quelques minutes la propagation",
      ],
    },
    {
      titre: "Cloudflare",
      etapes: [
        "Dashboard Cloudflare → sélectionnez votre domaine",
        "Onglet DNS → bouton « Add record »",
        "Type : TXT",
        "Name : @ (ou votre domaine racine)",
        `Content : ${valeur}`,
        "Proxy status : DNS only (nuage gris)",
        "Save",
      ],
    },
    {
      titre: "Squarespace Domains",
      etapes: [
        "Admin Squarespace → Settings → Domains → sélectionnez votre domaine",
        "Onglet DNS Settings → bouton « Add Record »",
        "Type : TXT",
        "Host : @ (ou laisser vide)",
        `Data : ${valeur}`,
        "Save",
      ],
    },
    {
      titre: "GoDaddy",
      etapes: [
        "My Products → Domains → sélectionnez votre domaine → DNS",
        "Bouton « Add » → Type « TXT »",
        "Host : @",
        `TXT Value : ${valeur}`,
        "TTL : 1 Hour",
        "Save",
      ],
    },
    {
      titre: "Namecheap",
      etapes: [
        "Domain List → Manage → onglet « Advanced DNS »",
        "Bouton « Add New Record » → Type « TXT Record »",
        "Host : @",
        `Value : ${valeur}`,
        "TTL : Automatic",
        "Sauvegardez (petite coche verte)",
      ],
    },
    {
      titre: "Google Domains / Google Workspace",
      etapes: [
        "Admin Google Domains → votre domaine → DNS",
        "Section « Resource records » → « Create new record »",
        "Host name : laisser vide (ou @)",
        "Type : TXT",
        `Data : ${valeur}`,
        "Save",
      ],
    },
  ];

  return <Accordeons titre="Comment ajouter l'enregistrement TXT selon mon registrar" guides={guides} />;
}

function Accordeons({ titre, guides }: { titre: string; guides: Guide[] }) {
  const [ouvert, setOuvert] = useState<string | null>(null);

  return (
    <div className="mt-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-600">
        {titre}
      </p>
      <div className="space-y-2">
        {guides.map((g) => {
          const estOuvert = ouvert === g.titre;
          return (
            <div
              key={g.titre}
              className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              <button
                type="button"
                onClick={() => setOuvert(estOuvert ? null : g.titre)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-slate-900 hover:bg-slate-100"
                aria-expanded={estOuvert}
              >
                <span>{g.titre}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${estOuvert ? "rotate-180" : ""}`}
                  strokeWidth={2.2}
                  aria-hidden
                />
              </button>
              {estOuvert && (
                <ol className="space-y-1.5 border-t border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-700">
                  {g.etapes.map((etape, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-semibold text-indigo-700">{i + 1}.</span>
                      <span>{etape}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
