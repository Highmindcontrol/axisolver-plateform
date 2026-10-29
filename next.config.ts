import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pdf-parse a un entrypoint CJS qui exécute du code au require
  // (test PDF embedded). On le laisse en module Node natif, hors du
  // bundle Turbopack/webpack côté serveur.
  serverExternalPackages: ["pdf-parse", "ssh2"],
};

export default nextConfig;
