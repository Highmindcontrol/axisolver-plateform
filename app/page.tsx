import Image from "next/image";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <div className="flex max-w-xl flex-col items-center text-center">
        <Image
          src="/logo-axisolver.png"
          alt="AxiSolver"
          width={240}
          height={240}
          priority
          className="h-auto w-40 md:w-56"
        />

        <h1 className="mt-10 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
          Chatbots talk. AxiSolver solves.
        </h1>

        <p className="mt-6 text-base leading-relaxed text-slate-600 md:text-lg">
          Le remplaçant des chatbots pour les entreprises qui veulent un
          accueil qui résout vraiment. 24h/24, en voix et à l&apos;écrit,
          directement dans votre site.
        </p>

        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
          Site en construction
        </div>

        <p className="mt-10 text-sm text-slate-400">
          Édité par Ataraxis Studio — groupe{" "}
          <a
            href="https://ataraxis.group"
            className="underline hover:text-slate-600"
          >
            ataraxis.group
          </a>
        </p>
      </div>
    </main>
  );
}
