/**
 * Encadré sources — chiffres d'engagement par secteur.
 * Composant server (pas d'état client).
 */

type Source = {
  nom: string;
  url: string;
  description: string;
};

const SOURCES_SECTORIELLES: Source[] = [
  {
    nom: "Smartsupp",
    url: "https://www.smartsupp.com/blog/analysing-5-billion-website-visits-how-ecommerce-customers-use-chat/",
    description:
      "« Analysing 5 billion website visits : how ecommerce customers use chat » (2024). Baseline mondiale : 0,84 % des visiteurs engagent une conversation avec un widget réactif typique. Plancher servant à calibrer les sites éditoriaux et vitrines.",
  },
  {
    nom: "Wisepops",
    url: "https://wisepops.com/blog/state-of-visitor-engagement-on-shopify-stores",
    description:
      "« The State of Visitor Engagement on Shopify Stores » (2026). 54 % des boutiques Shopify sont équipées en 2026 (vs 24 % en 2018). Fourchette e-commerce 1,5 % à 5 % d'engagement selon le panier moyen.",
  },
  {
    nom: "Tidio",
    url: "https://www.tidio.com/blog/live-chat-statistics/",
    description:
      "« Live Chat Statistics » (2024-2025). Les visiteurs qui engagent une conversation sont 2,8 × plus susceptibles de convertir et dépensent 60 % de plus. Lift de conversion moyen : +20 %.",
  },
  {
    nom: "chatbot.com",
    url: "https://www.chatbot.com/blog/chatbot-statistics/",
    description:
      "« Key Chatbot Statistics » (2026). Widgets réactifs classiques 2-5 % d'engagement, widgets proactifs triggered 8-15 %, pics à 35-40 % sur B2B SaaS avec prompt pertinent (données Drift).",
  },
  {
    nom: "Zoom",
    url: "https://www.zoom.com/en/blog/chatbot-statistics/",
    description:
      "« 65+ chatbot statistics » (2025). Scénarios post-achat et support client : 15 % à 30 % des visiteurs engagent une conversation car ils arrivent avec un besoin concret.",
  },
  {
    nom: "Which-50 / Stealth Agents",
    url: "https://which-50.com/live-chat-engagement-rate-benchmarks/",
    description:
      "« Live Chat Engagement Rate Benchmarks » et « Live Chat Support Statistics 2026 ». Fourchette générale 5-15 % de visiteurs qui chattent ; < 3 % = widget invisible ; 6,6 % = taux d'acceptation moyen d'une invitation proactive.",
  },
  {
    nom: "Realty-AI",
    url: "https://www.realty-ai.com/blog/real-estate-ai-chatbot-statistics",
    description:
      "« Real Estate Chatbot Statistics » (2026). Agence solo 8-12 %, petites agences 10-15 %, grandes 12-18 %. Case study : 12 % de chat vs 2,5 % de formulaire (+380 % lead capture).",
  },
  {
    nom: "Pareto Legal",
    url: "https://pareto.legal/legal-client-intake-statistics/",
    description:
      "« Legal Client Intake Statistics 2026 ». Cabinets juridiques : chat-to-conversion 10-20 % vs formulaires 2-3 %. Rapport LawSEO 2025 : +40 % de prises de RDV avec un chatbot (deux tiers des interactions en soirée et week-end).",
  },
  {
    nom: "Rock Health",
    url: "https://www.fiercehealthcare.com/ai-and-machine-learning/ai-chatbot-use-health-information-16-2024-rock-health-survey",
    description:
      "« 2025 Consumer Adoption of Digital Health Survey ». 32 % des consommateurs utilisent un chatbot IA pour trouver de l'info santé (vs 16 % en 2024). MGMA Stat avril 2025 : 19 % des cabinets médicaux ont déployé un chatbot ; pas de chiffre direct « % visiteurs qui chattent sur site médical » → notre taux médical reste extrapolé entre la baseline réactive et la fourchette juridique.",
  },
];

export function AsideSources() {
  return (
    <section className="bg-zinc-950 px-6 py-20 md:px-10 md:py-24">
      <div className="mx-auto max-w-5xl">
        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
            D&apos;où viennent nos chiffres ?
          </p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Tous les taux par secteur sont{" "}
            <span className="text-amber-400">sourcés publiquement.</span>
          </h3>
          <p className="mt-5 text-base leading-relaxed text-zinc-300 md:text-lg">
            Les taux d&apos;utilisation proposés dans le questionnaire
            sont calibrés à partir de neuf études publiques et rapports
            de benchmark 2024-2026 sur l&apos;usage réel des chatbots
            et widgets de chat.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Transparence : nous distinguons les secteurs{" "}
            <span className="font-semibold text-emerald-400">
              ● sourcés directement
            </span>{" "}
            (une étude donne le chiffre pour ce secteur) des secteurs{" "}
            <span className="font-semibold text-zinc-300">
              ○ estimés par extrapolation
            </span>{" "}
            entre les ancres sourcées (c&apos;est votre cas si aucune
            étude ne donne de taux spécifique pour votre activité).
          </p>

          <ul className="mt-8 space-y-5 text-sm leading-relaxed text-zinc-300 md:text-base">
            {SOURCES_SECTORIELLES.map((s) => (
              <li key={s.nom} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                <span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-amber-300 hover:text-amber-200"
                  >
                    {s.nom}
                  </a>{" "}
                  — {s.description}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-xs leading-relaxed text-zinc-500">
            AxiSolver, par son modèle d&apos;ouverture modale plein
            écran et sa promesse « AXI qui résout vraiment », se
            positionne en haut de fourchette vs un chatbot classique.
            Les taux par défaut représentent une estimation prudente —
            l&apos;usage réel se mesure avec les premiers mois de
            production et nous recalibrons le modèle avec les
            premiers clients équipés.
          </p>
        </aside>
      </div>
    </section>
  );
}
