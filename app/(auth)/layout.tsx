import Link from "next/link";

export default function LayoutAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 px-4 py-10">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-indigo-700"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-700 text-xs font-bold text-white shadow-sm">
          A
        </span>
        AxiSolver
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
