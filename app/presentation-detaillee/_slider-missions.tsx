"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Search,
  ShieldCheck,
  Target,
} from "lucide-react";

/**
 * Slider des missions AxiSolver pour la page /presentation-detaillee.
 *
 * Chaque slide empile : image bandeau + titre + sous-titre + 3 cards
 * missions + tableau tarifs marché. L'utilisateur navigue entre les
 * missions via flèches ou pastilles indicateurs.
 *
 * Nouvelles missions à ajouter : il suffit d'ajouter une entrée dans
 * MISSIONS_SLIDES ci-dessous (Interface immersive, Backend utilisateur,
 * etc.) — pas besoin de toucher au reste du composant.
 */

type Mission = {
  slug: string;
  categorie: string;
  titreMain: string;
  titreAccent: string;
  pitch: React.ReactNode;
  Icon: typeof MessageCircle;
  image: string;
  cards: Array<{ titre: string; description: string }>;
  tarifsHeader: string;
  tarifsSubtitle: string;
  tarifs: Array<{ label: string; detail: string; prix: string }>;
  resumeAxisolver: string;
  bulletsDetailles: string[];
};

const MISSIONS_SLIDES: Mission[] = [
  {
    slug: "accueil",
    categorie: "Accueil des utilisateurs",
    titreMain: "Chaque visiteur reçu, qualifié,",
    titreAccent: "transformé en résultat.",
    pitch: (
      <>
        AxiSolver prend la parole en voix ou à l&apos;écrit, dans toutes
        les langues européennes. Il comprend, résout, qualifie, et{" "}
        <span className="font-semibold text-white">
          transforme chaque conversation en action concrète
        </span>{" "}
        : réponse délivrée, prospect ajouté au CRM, commande passée,
        rendez-vous planifié.
      </>
    ),
    Icon: MessageCircle,
    image: "/presentation-accueil-axi-orchestre.png",
    cards: [
      {
        titre: "Comprend chaque visiteur, dans sa langue",
        description:
          "Voix ou écrit, français, anglais, espagnol, allemand, italien, portugais, néerlandais. AxiSolver reformule la vraie demande, pas juste des mots-clés. Jour, nuit, dimanche compris.",
      },
      {
        titre: "Résout seul ou qualifie proprement",
        description:
          "La majorité des demandes se résout sans intervention humaine. Pour les autres, un dossier qualifié part vers votre équipe : prénom, email, téléphone, résumé, niveau d'urgence.",
      },
      {
        titre: "Transforme chaque conversation en action",
        description:
          "Prospect chaud ajouté au CRM, commande passée, rendez-vous planifié, information délivrée. Pas de bulle qui meurt sans suite. Chaque visite devient un résultat traçable.",
      },
    ],
    tarifsHeader: "Combien coûte un vrai accueil 24/7",
    tarifsSubtitle:
      "AxiSolver est présent jour, nuit, dimanche, en toutes langues, sans arrêt maladie.",
    tarifs: [
      {
        label: "Standardiste / accueil téléphonique à temps plein",
        detail:
          "Poste à mi-carrière en France, salaire brut + charges employeur, 8 h / jour, 5 j / 7",
        prix: "2 800 à 3 800 €/mois",
      },
      {
        label: "Chargé de clientèle digital interne",
        detail:
          "Répond au chat, aux emails, qualifie les demandes. Poste junior-confirmé.",
        prix: "3 200 à 4 500 €/mois",
      },
      {
        label: "Service client externalisé (agence)",
        detail:
          "Facturation à la conversation ou au forfait mensuel, horaires limités",
        prix: "1 500 à 5 000 €/mois",
      },
      {
        label: "Permanence téléphonique partagée",
        detail: "Services type Pretik, Preachat, avec forfait appels/mois",
        prix: "300 à 1 500 €/mois",
      },
      {
        label: "Chatbot classique (Intercom, Zendesk, Hubspot)",
        detail:
          "Abonnement SaaS + nécessite une configuration humaine et un modérateur",
        prix: "50 à 500 €/mois + main-d'œuvre",
      },
    ],
    resumeAxisolver:
      "Accueil 24/7 · voix et écrit · toutes langues européennes · qualification + routage CRM",
    bulletsDetailles: [
      "Reconnaît un visiteur qui revient — sans profil psychologique durable, juste de quoi reprendre le fil.",
      "Chaque ticket est clôturé avec une référence AXI-XXXX copiable, utilisable comme identifiant de dossier côté équipe.",
      "Jamais de prix ferme ni de date confirmée annoncés par AxiSolver — il propose, votre équipe arbitre.",
      "Hors scope (climat, politique, question médicale ou juridique personnalisée) : il recadre poliment et revient à votre métier.",
    ],
  },
  {
    slug: "seo",
    categorie: "Référencement",
    titreMain: "Fini le chaos SEO.",
    titreAccent: "AxiSolver orchestre tout.",
    pitch: (
      <>
        Mots-clés, contenu, netlinking, indexation, performance, suivi des
        positions… Faire du SEO sérieusement, c&apos;est{" "}
        <span className="font-semibold text-white">
          un métier à temps plein
        </span>{" "}
        ou une agence spécialisée. AxiSolver automatise la veille,
        détecte les failles, et vous présente chaque mois un rapport
        clair pour décider.
      </>
    ),
    Icon: Search,
    image: "/comparatif-seo-chaos-vs-axi.png",
    cards: [
      {
        titre: "Audit initial + re-check hebdomadaire",
        description:
          "AxiSolver scanne votre site à l'installation, puis chaque semaine. Mots-clés, structure, balises, maillage interne, performance Core Web Vitals. Tout est documenté.",
      },
      {
        titre: "Pages de fuite et parcours brisés",
        description:
          "Détection des pages qui perdent les visiteurs, des 404 silencieuses, des redirections cassées, des liens morts. Chaque fuite identifiée est une opportunité de revenu récupérée.",
      },
      {
        titre: "Rapport mensuel narratif",
        description:
          "Pas un dashboard de métriques indigeste : un rapport mensuel en français qui raconte votre progression, les actions prioritaires, et le travail déjà fait par AxiSolver.",
      },
    ],
    tarifsHeader: "Combien coûte un vrai SEO suivi",
    tarifsSubtitle:
      "AxiSolver automatise la veille et vous présente les priorités chaque mois.",
    tarifs: [
      {
        label: "Agence SEO (full service)",
        detail:
          "Mission mensuelle avec audits, contenu, netlinking, suivi positions",
        prix: "1 500 à 5 000 €/mois",
      },
      {
        label: "Consultant SEO freelance senior",
        detail: "Mission continue 2-3 jours/mois, marché français",
        prix: "800 à 2 500 €/mois",
      },
      {
        label: "Audit SEO ponctuel",
        detail: "Audit technique + stratégique one-shot par un consultant",
        prix: "1 500 à 5 000 €",
      },
      {
        label: "Logiciels dédiés (Semrush, Ahrefs, Moz Pro)",
        detail:
          "Abonnement SaaS pour recherche de mots-clés, backlinks, suivi positions",
        prix: "100 à 400 €/mois",
      },
      {
        label: "Salarié SEO Manager interne",
        detail:
          "Poste junior à mi-carrière, salaire brut + charges employeur",
        prix: "3 000 à 5 000 €/mois",
      },
      {
        label: "Rédacteur SEO freelance",
        detail: "Contenu optimisé publié mensuellement sur votre blog",
        prix: "500 à 2 000 €/mois",
      },
    ],
    resumeAxisolver:
      "Audit SEO initial · re-check hebdomadaire · détection pages de fuite · rapport mensuel narratif",
    bulletsDetailles: [
      "Audit on-page initial complet : balises, structure, maillage interne, images, Core Web Vitals.",
      "Suit les mots-clés les plus tapés par vos vrais visiteurs — pas une liste théorique issue d'un outil.",
      "Repère les requêtes à faible concurrence (longue traîne) et vous propose du contenu à produire.",
      "Chaque faille vient avec trois solutions : agence partenaire, voie dev interne, méthode pas-à-pas en 15 minutes.",
      "Analytics narratif : moments de bascule mois après mois en langage humain, pas un dashboard cryptique à décoder.",
    ],
  },
  {
    slug: "securite",
    categorie: "Sécurité",
    titreMain: "Partenaire supplémentaire de la",
    titreAccent: "sécurité de votre site.",
    pitch: (
      <>
        AxiSolver ne remplace pas vos antivirus de site, votre firewall ou
        votre hébergeur sécurisé. Il vient en{" "}
        <span className="font-semibold text-white">renfort permanent</span>{" "}
        — avec une veille continue que personne d&apos;autre ne fait au
        prix d&apos;un abonnement mensuel. Comme un second rempart,
        discret et actif en arrière-plan.
      </>
    ),
    Icon: ShieldCheck,
    image: "/comparatif-securite-axi-bouclier.png",
    cards: [
      {
        titre: "Audit continu de votre site",
        description:
          "Détection des failles connues, CVE actives sur vos plugins et dépendances, versions obsolètes, certificats expirés. Vous êtes alerté avant que ça devienne un problème.",
      },
      {
        titre: "Headers manquants, scripts tiers",
        description:
          "Vérification des headers de sécurité (CSP, HSTS, X-Frame-Options), audit des scripts tiers chargés par votre site, détection de fuites de données silencieuses.",
      },
      {
        titre: "Shield widget temps réel",
        description:
          "Rate limiting + anti-prompt-injection côté widget. Blocage automatique des bots qui tentent d'abuser de votre AxiSolver. Zéro intervention requise.",
      },
    ],
    tarifsHeader: "Combien coûte une sécurité de site professionnelle",
    tarifsSubtitle:
      "AxiSolver ajoute sa couche de veille pour une fraction de ces budgets.",
    tarifs: [
      {
        label: "Sucuri Website Security Platform",
        detail: "Scan + firewall + nettoyage malware, offres Basic à Business",
        prix: "20 à 50 €/mois",
      },
      {
        label: "Wordfence Premium (WordPress)",
        detail: "Firewall WAF + scan + alerte temps réel + support premium",
        prix: "10 à 25 €/mois",
      },
      {
        label: "Pentest ponctuel (annuel)",
        detail: "Audit complet par un cabinet spécialisé, périmètre PME",
        prix: "3 000 à 15 000 €",
      },
      {
        label: "Consultant sécurité externe",
        detail: "Mission ponctuelle, tarif journalier marché français",
        prix: "500 à 1 200 €/jour",
      },
      {
        label: "Audit RGPD complet",
        detail: "Vérification conformité données personnelles + registre",
        prix: "2 500 à 8 000 €",
      },
    ],
    resumeAxisolver:
      "Audit sécurité initial · surveillance 24/7 · rapport mensuel · blocage temps réel",
    bulletsDetailles: [
      "Scan initial complet : failles, CVE actives, plugins obsolètes, headers manquants, certificats expirés.",
      "Alerte immédiate si régression détectée, avec procédure de correction à chaque alerte.",
      "Côté widget : détection temps réel des prompt injections, bots agressifs, scraping, comportements anormaux.",
      "Côté serveur (si vous donnez accès à vos logs) : détection des tentatives d'intrusion — bruteforce, SQL injection, path traversal.",
      "Alerte en langage humain : « Hier à 3h47, 847 tentatives de login sur /admin depuis 12 IPs — voulez-vous que je les bloque ? ».",
      "Après validation, règles de blocage exécutées en autonomie. Preuve de propriété DNS requise avant toute action côté serveur.",
    ],
  },
  {
    slug: "ads",
    categorie: "Publicité en ligne",
    titreMain: "Agence Ads ? Freelance traffic manager ?",
    titreAccent: "AxiSolver s'en charge.",
    pitch: (
      <>
        Piloter sérieusement des campagnes Google Ads, Facebook Ads ou
        AdSense demande une{" "}
        <span className="font-semibold text-white">
          personne dédiée à temps plein
        </span>{" "}
        ou une agence spécialisée. Les tarifs du marché sont prohibitifs
        pour la plupart des PME. AxiSolver monte, teste et optimise vos
        campagnes en continu, et vous validez d&apos;un clic.
      </>
    ),
    Icon: Target,
    image: "/comparatif-ads-axi-agence.png",
    cards: [
      {
        titre: "Montage complet de vos campagnes",
        description:
          "Audience, mots-clés, créatives, budget, enchères. AxiSolver prépare tout. Vous validez d'un clic depuis votre tableau de bord.",
      },
      {
        titre: "Split testing permanent",
        description:
          "Rotation A/B/n sur les variantes qui marchent, pause automatique des campagnes qui gaspillent. Chaque euro travaille mieux que le précédent.",
      },
      {
        titre: "Rebalance budget quotidien",
        description:
          "AxiSolver bascule le budget quotidiennement entre vos campagnes selon le ROAS observé. Les meilleures reçoivent plus, les mauvaises moins.",
      },
    ],
    tarifsHeader: "Combien coûte une gestion Ads professionnelle",
    tarifsSubtitle:
      "AxiSolver inclut la préparation complète de vos campagnes, à valider d'un clic.",
    tarifs: [
      {
        label: "Agence SEA (Google Ads certifiée)",
        detail: "Fee gestion mensuel + commission 10-20 % du budget médias",
        prix: "1 500 à 5 000 €/mois",
      },
      {
        label: "Traffic manager freelance senior",
        detail: "Mission continue 2-3 jours/semaine, marché français",
        prix: "1 500 à 3 000 €/mois",
      },
      {
        label: "Traffic manager freelance junior",
        detail: "Mission continue 1-2 jours/semaine, marché français",
        prix: "800 à 1 500 €/mois",
      },
      {
        label: "Logiciels dédiés de gestion (AdEspresso, Smartly, Marin)",
        detail: "Abonnement SaaS sans la main humaine qui pilote",
        prix: "49 à 1 500 €/mois",
      },
      {
        label: "Salarié traffic manager interne",
        detail:
          "Poste junior à mi-carrière, salaire brut + charges employeur",
        prix: "3 500 à 5 500 €/mois",
      },
    ],
    resumeAxisolver:
      "Audience · mots-clés · créatives · budget · split testing permanent · validation d'un clic",
    bulletsDetailles: [
      "Prépare les groupes d'annonces Google Ads : mots-clés, enchères suggérées, textes d'annonce.",
      "Prépare les emplacements AdSense pour optimiser vos revenus publicitaires.",
      "Garde-fou absolu : aucune dépense déclenchée sans validation humaine depuis votre tableau de bord.",
      "Après 90 jours de validation réussie, option « carte blanche » dans un budget que vous plafonnez vous-même.",
      "Rotation A/B/n automatique sur les variantes qui performent, pause immédiate des campagnes qui gaspillent.",
    ],
  },
];

export function SliderMissions() {
  const [index, setIndex] = useState(0);
  const mission = MISSIONS_SLIDES[index];
  const total = MISSIONS_SLIDES.length;

  function precedent() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function suivant() {
    setIndex((i) => (i + 1) % total);
  }

  return (
    <section
      className="border-b border-zinc-900 bg-zinc-950"
      aria-label="Missions AxiSolver"
    >
      {/* Barre de navigation : pleine largeur, fond amber subtle, sticky */}
      <div className="sticky top-[65px] z-20 border-y border-amber-400/30 bg-gradient-to-b from-zinc-900 via-amber-400/5 to-zinc-900 shadow-lg shadow-amber-400/5 backdrop-blur-sm md:top-[73px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-6 md:px-10 md:py-8">
          <button
            type="button"
            onClick={precedent}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-950/60 text-amber-300 transition-all hover:border-amber-400 hover:bg-amber-400 hover:text-zinc-950 md:h-14 md:w-14"
            aria-label="Mission précédente"
          >
            <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.2} />
          </button>

          {/* Pastilles indicateurs — plus grosses, plus visibles */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {MISSIONS_SLIDES.map((m, i) => {
              const estActif = i === index;
              return (
                <button
                  key={m.slug}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all md:gap-2.5 md:px-6 md:py-3 md:text-sm ${
                    estActif
                      ? "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/30"
                      : "border border-amber-400/30 bg-zinc-950/50 text-zinc-200 hover:border-amber-400 hover:bg-amber-400/10 hover:text-amber-300"
                  }`}
                  aria-pressed={estActif}
                >
                  <m.Icon
                    className="h-4 w-4 md:h-5 md:w-5"
                    strokeWidth={2}
                  />
                  <span className="hidden sm:inline">{m.categorie}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={suivant}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-amber-400/40 bg-zinc-950/60 text-amber-300 transition-all hover:border-amber-400 hover:bg-amber-400 hover:text-zinc-950 md:h-14 md:w-14"
            aria-label="Mission suivante"
          >
            <ChevronRight className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Contenu du slide actif */}
      <div key={mission.slug} className="animate-[fadeIn_300ms_ease-out]">
        {/* Image agrandie avec titre superposé, collée directement sous la nav */}
        <div
          className="relative flex h-[320px] w-full items-end bg-cover bg-center bg-no-repeat md:h-[480px] lg:h-[560px]"
          style={{ backgroundImage: `url(${mission.image})` }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-zinc-950/10 to-zinc-950/90"
          />
          <div className="relative mx-auto w-full max-w-5xl px-6 pb-12 text-center md:px-10 md:pb-16">
            <h2 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.9)] md:text-5xl lg:text-6xl">
              {mission.titreMain}{" "}
              <span className="text-amber-400">{mission.titreAccent}</span>
            </h2>
          </div>
        </div>

        {/* Descriptif + 3 cards */}
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <p className="mx-auto mt-14 max-w-3xl text-center text-base leading-relaxed text-zinc-300 md:mt-16 md:text-lg">
            {mission.pitch}
          </p>

          <div className="mt-14 grid grid-cols-1 gap-6 md:mt-16 md:grid-cols-3">
            {mission.cards.map((c) => (
              <article
                key={c.titre}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-7 md:p-8"
              >
                <mission.Icon
                  className="h-9 w-9 text-amber-400"
                  strokeWidth={1.5}
                />
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-white md:text-2xl">
                  {c.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-300 md:text-base">
                  {c.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* Tableau tarifaire */}
        <div className="mx-auto max-w-6xl px-6 pb-24 md:px-10 md:pb-32">
          <div className="mt-14 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
            <div className="border-b border-zinc-800 bg-zinc-950/80 px-6 py-5 md:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                {mission.tarifsHeader}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-white md:text-2xl">
                {mission.tarifsSubtitle}
              </h3>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-8">
                    Solution
                  </th>
                  <th className="px-4 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400 md:px-6">
                    Prix marché
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {mission.tarifs.map((t, i) => (
                  <tr
                    key={t.label}
                    className={
                      i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"
                    }
                  >
                    <td className="px-6 py-5 text-zinc-200 md:px-8">
                      <p className="font-medium">{t.label}</p>
                      <p className="mt-1 text-xs text-zinc-500">{t.detail}</p>
                    </td>
                    <td className="px-4 py-5 text-right font-mono font-semibold text-white md:px-6">
                      {t.prix}
                    </td>
                  </tr>
                ))}
                <tr className="bg-amber-400/10">
                  <td className="px-6 py-5 md:px-8">
                    <p className="font-semibold text-amber-300">
                      AxiSolver (toutes formules)
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {mission.resumeAxisolver}
                    </p>
                  </td>
                  <td className="px-4 py-5 text-right font-mono text-lg font-bold text-amber-300 md:px-6">
                    inclus
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Dans le détail — bullets techniques */}
          <div className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-7 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              Dans le détail
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-300 md:text-base">
              {mission.bulletsDetailles.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Keyframes pour l'animation de fade-in */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
