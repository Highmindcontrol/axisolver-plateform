import {
  CheckCircle2,
  Shield,
  User,
  Settings,
  KeyRound,
  Copy,
} from "lucide-react";

/**
 * Pas-à-pas détaillé pour créer un mot de passe applicatif WordPress,
 * affiché au-dessus du formulaire d'ajout d'accès.
 */
export function PasAPasWordpress() {
  return (
    <details className="mb-6 rounded-xl border border-slate-200 bg-white open:bg-slate-50/30">
      <summary className="cursor-pointer list-none px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"
              aria-hidden
            >
              <KeyRound className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Comment créer un mot de passe applicatif WordPress
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Pas-à-pas en 6 étapes — clique pour déplier
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-indigo-700">
            Afficher le guide ↓
          </span>
        </div>
      </summary>

      <div className="border-t border-slate-200 px-5 py-5">
        <IntroExplication />
        <ol className="mt-6 space-y-6">
          <Etape
            numero={1}
            icone={User}
            titre="Connecte-toi à l'administration WordPress"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Ouvre l&apos;URL d&apos;administration de ton site, par
                  exemple&nbsp;:
                </p>
                <code className="mt-2 inline-block rounded bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-100">
                  https://ton-site.fr/wp-admin
                </code>
                <p className="mt-2 text-sm text-slate-700">
                  Connecte-toi avec un compte qui a le rôle{" "}
                  <strong>Administrateur</strong>. Un compte Éditeur ou
                  Auteur ne suffira pas — AXI a besoin des droits
                  d&apos;administration pour pouvoir modifier les
                  réglages de sécurité.
                </p>
              </>
            }
          />

          <Etape
            numero={2}
            icone={Settings}
            titre="Va sur ton profil utilisateur"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Dans le menu latéral gauche, clique sur{" "}
                  <strong>Utilisateurs</strong>, puis sur{" "}
                  <strong>Profil</strong>. Alternativement, en haut à
                  droite, survole ton avatar et clique sur{" "}
                  <strong>Modifier mon profil</strong>.
                </p>
                <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 font-mono text-[11px] text-slate-600">
                  Menu : Utilisateurs → Profil
                </p>
              </>
            }
          />

          <Etape
            numero={3}
            icone={KeyRound}
            titre="Scroll jusqu'à « Mots de passe d'application »"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  C&apos;est tout en bas de la page de profil, juste
                  avant le bouton « Mettre à jour le profil ». Si tu ne
                  vois pas cette section&nbsp;:
                </p>
                <ul className="mt-2 ml-5 list-disc space-y-1 text-sm text-slate-700">
                  <li>
                    Vérifie que tu es sur WordPress{" "}
                    <strong>5.6 ou supérieur</strong> (vérifier via{" "}
                    <em>Tableau de bord → Mises à jour</em>)
                  </li>
                  <li>
                    Vérifie que ton site tourne en{" "}
                    <strong>HTTPS</strong> (les mots de passe
                    applicatifs sont désactivés en HTTP par sécurité)
                  </li>
                  <li>
                    Vérifie qu&apos;aucun plugin de sécurité ne les a
                    désactivés (iThemes Security, Wordfence…)
                  </li>
                </ul>
              </>
            }
          />

          <Etape
            numero={4}
            icone={Shield}
            titre="Crée un mot de passe applicatif nommé « AXI Security Shield »"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  Dans le champ texte{" "}
                  <em>« Nom du nouveau mot de passe d&apos;application »</em>
                  , tape&nbsp;:
                </p>
                <code className="mt-2 inline-block rounded bg-slate-900 px-2.5 py-1 font-mono text-[11px] text-slate-100">
                  AXI Security Shield
                </code>
                <p className="mt-2 text-sm text-slate-700">
                  Puis clique sur le bouton{" "}
                  <strong>« Ajouter un nouveau mot de passe d&apos;application »</strong>
                  . WordPress affiche alors un cadre bleu avec le mot de
                  passe généré.
                </p>
              </>
            }
          />

          <Etape
            numero={5}
            icone={Copy}
            titre="Copie le mot de passe affiché IMMÉDIATEMENT"
            corps={
              <>
                <p className="text-sm text-slate-700">
                  WordPress affiche un mot de passe de la forme&nbsp;:
                </p>
                <code className="mt-2 inline-block rounded bg-amber-100 px-2.5 py-1 font-mono text-[11px] text-amber-900">
                  xxxx xxxx xxxx xxxx xxxx xxxx
                </code>
                <p className="mt-3 text-sm text-rose-700">
                  <strong>⚠ Ce mot de passe ne s&apos;affichera plus
                  jamais après cette page.</strong> Si tu la fermes sans
                  l&apos;avoir copié, il faudra en créer un nouveau.
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Les espaces entre les blocs sont volontaires et
                  acceptés — tu peux copier-coller tel quel.
                </p>
              </>
            }
          />

          <Etape
            numero={6}
            icone={CheckCircle2}
            titre="Colle les 3 infos dans le formulaire ci-dessous"
            corps={
              <>
                <ul className="ml-5 list-disc space-y-1 text-sm text-slate-700">
                  <li>
                    <strong>URL du site</strong> : adresse complète
                    (ex.{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                      https://ton-site.fr
                    </code>
                    )
                  </li>
                  <li>
                    <strong>Nom d&apos;utilisateur</strong> : ton
                    identifiant WordPress (ex.{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                      admin
                    </code>{" "}
                    ou{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
                      ton-prenom
                    </code>
                    )
                  </li>
                  <li>
                    <strong>Mot de passe applicatif</strong> : la chaîne
                    de 24 caractères copiée à l&apos;étape 5
                  </li>
                </ul>
                <p className="mt-3 text-sm text-slate-700">
                  Clique sur <strong>« Tester et enregistrer »</strong>.
                  AXI vérifiera la connexion avant de sauvegarder.
                </p>
              </>
            }
          />
        </ol>

        <RevoquerSection />
      </div>
    </details>
  );
}

function IntroExplication() {
  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm leading-relaxed text-slate-800">
      <p>
        <strong>Pourquoi un mot de passe applicatif ?</strong> C&apos;est
        un mot de passe séparé de ton mot de passe principal WordPress,
        créé spécifiquement pour qu&apos;une application externe (ici
        AXI) puisse se connecter à ton site via l&apos;API REST. Si tu
        veux retirer l&apos;accès d&apos;AXI, tu le supprimes en un
        clic depuis WordPress — ton compte principal reste intact.
      </p>
      <p className="mt-2">
        AXI utilise cet accès uniquement pour appliquer les corrections
        de sécurité détectées lors des audits. Aucune donnée utilisateur
        ou éditoriale n&apos;est lue ou modifiée.
      </p>
    </div>
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

function RevoquerSection() {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">
        Comment révoquer l&apos;accès AXI plus tard ?
      </p>
      <p className="mt-1 text-sm text-slate-700">
        Retourne sur <strong>Utilisateurs → Profil</strong>, scroll
        jusqu&apos;à la section <em>« Mots de passe d&apos;application »</em>
        , trouve la ligne « AXI Security Shield » et clique sur{" "}
        <strong>Révoquer</strong>. L&apos;accès est coupé immédiatement.
      </p>
    </div>
  );
}
