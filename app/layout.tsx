import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
