import {
  GitBranch,
  KeyRound,
  Settings,
  Shield,
  Copy,
  CheckCircle2,
} from "lucide-react";

/**
 * Pas-à-pas détaillé pour créer un fine-grained Personal Access Token
 * GitHub avec les permissions nécessaires à AXI Security Shield.
 */
export function PasAPasGithub() {
  return (
    <details className="mb-6 rounded-xl border border-slate-200 bg-white open:bg-slate-50/30">
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white"
              aria-hidden
            >
              <GitBranch className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Comment créer un Personal Access Token GitHub pour AXI
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Pas-à-pas en 7 étapes — fine-grained token restreint au repo
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-indigo-700">
            Afficher le guide ↓
          </span>
        </div>
      </summary>

      <div className="border-t border-slate-200 px-5 py-5">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm leading-relaxed text-slate-800">
          <p>
            <strong>Pourquoi un fine-grained token ?</strong> C&apos;est
            un token GitHub de nouvelle génération que tu peux restreindre
            à <strong>UN seul repo</strong> (celui de ton site), avec des
            permissions précises. AXI n&apos;aura jamais accès à tes
            autres repos. Tu peux le révoquer en un clic depuis GitHub
            sans affecter ton compte.
          </p>
        </div>

        <ol className="mt-6 space-y-6">
          <Etape
            numero={1}
            icone={Settings}
            titre="Ouvre les settings GitHub des fine-grained tokens"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Va directement sur l&apos;URL&nbsp;:
                </p>
                <a
                  href="https://github.com/settings/personal-access-tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  <GitBranch className="h-3 w-3" strokeWidth={2.4} />
                  Ouvrir GitHub → Fine-grained token (nouvel onglet)
                </a>
                <p className="mt-2 text-xs text-slate-600">
                  Alternative via l&apos;UI : Avatar en haut à droite →{" "}
                  <strong>Settings</strong> → <strong>Developer settings</strong>{" "}
                  → <strong>Personal access tokens</strong> →{" "}
                  <strong>Fine-grained tokens</strong> →{" "}
                  <strong>Generate new token</strong>.
                </p>
              </>
            }
          />

          <Etape
            numero={2}
            icone={KeyRound}
            titre="Nomme le token « AXI Security Shield »"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Dans le champ <strong>Token name</strong>, tape&nbsp;:
                </p>
                <code className="mt-2 inline-block rounded bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-100">
                  AXI Security Shield
                </code>
                <p className="mt-3 text-sm text-slate-700">
                  <strong>Expiration</strong> : choisis entre 30 jours
                  (plus sûr) et <strong>No expiration</strong> (plus
                  pratique). AXI s&apos;adapte dans les deux cas.
                </p>
              </>
            }
          />

          <Etape
            numero={3}
            icone={Shield}
            titre="Resource owner → ton compte ou ton organisation"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Dans <strong>Resource owner</strong>, sélectionne le
                  compte ou l&apos;organisation qui possède le repo du
                  site (ex. ton compte perso ou{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                    Highmindcontrol
                  </code>
                  ).
                </p>
              </>
            }
          />

          <Etape
            numero={4}
            icone={Settings}
            titre="Repository access → Only select repositories"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Coche <strong>« Only select repositories »</strong> et
                  dans le menu, sélectionne UNIQUEMENT le repo du site
                  (ex.{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                    coryphea
                  </code>
                  ).
                </p>
                <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                  <strong>⚠ Ne choisis pas « All repositories »</strong>{" "}
                  — tu donnerais à AXI accès à TOUS tes repos. Reste strict
                  sur le repo du site concerné.
                </p>
              </>
            }
          />

          <Etape
            numero={5}
            icone={CheckCircle2}
            titre="Repository permissions → Contents : Read and write"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Dans la section <strong>Repository permissions</strong>,
                  trouve la ligne <strong>Contents</strong> et bascule-la
                  sur <strong>Read and write</strong>. C&apos;est la seule
                  permission obligatoire — AXI lira et écrira{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                    vercel.json
                  </code>{" "}
                  ou{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                    public/robots.txt
                  </code>
                  .
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  <strong>Optionnel</strong> : si tu as choisi « Pull
                  Request » comme mode de commit à l&apos;étape 2,
                  bascule aussi <strong>Pull requests</strong> sur{" "}
                  <strong>Read and write</strong>.
                </p>
              </>
            }
          />

          <Etape
            numero={6}
            icone={Copy}
            titre="Clique Generate token → copie-le IMMÉDIATEMENT"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  En bas de la page, clique{" "}
                  <strong>« Generate token »</strong>. GitHub affiche le
                  token sous la forme&nbsp;:
                </p>
                <code className="mt-2 inline-block rounded bg-amber-100 px-2.5 py-1 font-mono text-[11px] text-amber-900">
                  github_pat_11AXXXXXXX_YYYYYYYYYYYYYYYYYYYYYYYY…
                </code>
                <p className="mt-3 text-sm text-rose-700">
                  <strong>⚠ Ce token ne s&apos;affichera plus jamais.</strong>{" "}
                  Copie-le avant de quitter la page.
                </p>
              </>
            }
          />

          <Etape
            numero={7}
            icone={CheckCircle2}
            titre="Colle le token dans le formulaire ci-dessous"
            corps={
              <>
                <ul className="ml-5 list-disc space-y-1 text-sm text-slate-700">
                  <li>
                    <strong>Propriétaire GitHub</strong> : ton pseudo ou
                    nom d&apos;organisation (ex.{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                      Highmindcontrol
                    </code>
                    )
                  </li>
                  <li>
                    <strong>Nom du repo</strong> : le nom exact du repo
                    sans le propriétaire (ex.{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                      coryphea
                    </code>
                    )
                  </li>
                  <li>
                    <strong>Branche cible</strong> :{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                      main
                    </code>{" "}
                    (ou la branche de prod si différente)
                  </li>
                  <li>
                    <strong>Personal Access Token</strong> : le token
                    copié à l&apos;étape 6
                  </li>
                </ul>
                <p className="mt-3 text-sm text-slate-700">
                  Clique sur <strong>« Vérifier et enregistrer »</strong>.
                  AXI testera la connexion sur le repo avant de sauvegarder.
                </p>
              </>
            }
          />
        </ol>

        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            Comment révoquer l&apos;accès AXI plus tard ?
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Va sur{" "}
            <a
              href="https://github.com/settings/tokens?type=beta"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-700 hover:underline"
            >
              github.com/settings/tokens
            </a>
            , trouve la ligne « AXI Security Shield » et clique sur{" "}
            <strong>Revoke</strong>. L&apos;accès est coupé immédiatement.
          </p>
        </div>
      </div>
    </details>
  );
}

function Etape({
  numero,
  icone: Icone,
  titre,
  corps,
}: {
  numero: number;
  icone: typeof Shield;
  titre: string;
  corps: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <div className="flex flex-shrink-0 flex-col items-center">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
          {numero}
        </span>
        <span
          className="mt-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
          aria-hidden
        >
          <Icone className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
      </div>
      <div className="flex-1 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">{titre}</h3>
        <div className="mt-2">{corps}</div>
      </div>
    </li>
  );
}
