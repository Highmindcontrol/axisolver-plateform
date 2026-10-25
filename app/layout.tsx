import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import "./globals.css";

// Test de police globale AxiSolver — Bricolage Grotesque (sans-serif
// variable moderne, Google Fonts). Exposée via la variable CSS
// `--font-bricolage` et branchée sur le body dans globals.css.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Police manuscrite Caveat pour les touches ludiques (fléchettes
// « cliquez ici » autour du bouton pastille, légendes marginales).
// Exposée via `--font-manuscrit`.
const caveat = Caveat({
  variable: "--font-manuscrit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AxiSolver — Chatbots talk. AxiSolver solves.",
  description:
    "Le remplaçant des chatbots pour les entreprises qui veulent un accueil qui résout vraiment. 24h/24, en voix et à l'écrit, directement dans votre site.",
  metadataBase: new URL("https://axisolver.app"),
  openGraph: {
    title: "AxiSolver — Chatbots talk. AxiSolver solves.",
    description:
      "Le remplaçant des chatbots pour les entreprises qui veulent un accueil qui résout vraiment.",
    url: "https://axisolver.app",
    siteName: "AxiSolver",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${caveat.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
