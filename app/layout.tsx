import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AxiSolver — Chatbots talk. AxiSolver solves.",
  description:
    "Le remplaçant des chatbots pour les entreprises qui veulent un accueil qui résout vraiment. 24h/24, en voix et à l'écrit.",
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
