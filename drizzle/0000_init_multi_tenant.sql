CREATE TYPE "public"."plan_site" AS ENUM('beta', 'starter', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."source_connaissance_statut" AS ENUM('en_attente', 'en_cours', 'ingere', 'echec');--> statement-breakpoint
CREATE TYPE "public"."source_connaissance_type" AS ENUM('url', 'sitemap', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."voix_mode" AS ENUM('texte_seul', 'navigateur', 'premium_elevenlabs');--> statement-breakpoint
CREATE TABLE "site_configs" (
	"site_id" uuid PRIMARY KEY NOT NULL,
	"nom_assistant" text DEFAULT 'AXI' NOT NULL,
	"secteur" text,
	"ton" text DEFAULT 'professionnel_chaleureux' NOT NULL,
	"mode_prompt" text DEFAULT 'au_service_du_site_hote' NOT NULL,
	"langues_actives" text[] DEFAULT '{"fr"}' NOT NULL,
	"langue_defaut" text DEFAULT 'fr' NOT NULL,
	"voix_mode" "voix_mode" DEFAULT 'texte_seul' NOT NULL,
	"voix_id" text,
	"branding" jsonb DEFAULT '{"couleurPrincipale":"#4f46e5","couleurSecondaire":"#8b5cf6","logoUrl":null,"position":"bas-droite","afficherPropulsePar":true}'::jsonb NOT NULL,
	"mentions_legales_url" text,
	"politique_conf_url" text,
	"email_notification" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_connaissance_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"type" "source_connaissance_type" NOT NULL,
	"source" text NOT NULL,
	"nom_affichage" text,
	"statut" "source_connaissance_statut" DEFAULT 'en_attente' NOT NULL,
	"derniere_ingestion_le" timestamp with time zone,
	"derniere_erreur" text,
	"nb_chunks" integer DEFAULT 0 NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_membres" (
	"site_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_membres_site_id_user_id_pk" PRIMARY KEY("site_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "site_options_accueil" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"ordre" integer DEFAULT 0 NOT NULL,
	"libelle" text NOT NULL,
	"actif" boolean DEFAULT true NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"nom_entreprise" text NOT NULL,
	"domaine_principal" text NOT NULL,
	"domaines_autorises" text[] DEFAULT '{}' NOT NULL,
	"plan" "plan_site" DEFAULT 'beta' NOT NULL,
	"api_key_hash" text,
	"propriete_verifiee_le" timestamp with time zone,
	"actif" boolean DEFAULT true NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"nom_affiche" text,
	"avatar_url" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "site_configs" ADD CONSTRAINT "site_configs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_connaissance_sources" ADD CONSTRAINT "site_connaissance_sources_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_membres" ADD CONSTRAINT "site_membres_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_membres" ADD CONSTRAINT "site_membres_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_options_accueil" ADD CONSTRAINT "site_options_accueil_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;