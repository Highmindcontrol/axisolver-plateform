CREATE TYPE "public"."chaleur_ticket" AS ENUM('froid', 'tiede', 'chaud', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."statut_ticket" AS ENUM('resolu_par_axi', 'ouvert', 'en_cours', 'transfere', 'ferme');--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"visiteur_id" text,
	"user_agent" text,
	"url" text,
	"debut_le" timestamp with time zone DEFAULT now() NOT NULL,
	"fin_le" timestamp with time zone,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resume_axi" text,
	"nb_tours" integer DEFAULT 0 NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"site_id" uuid NOT NULL,
	"conversation_id" uuid,
	"statut" "statut_ticket" DEFAULT 'ouvert' NOT NULL,
	"chaleur" "chaleur_ticket" DEFAULT 'tiede' NOT NULL,
	"prenom" text,
	"email" text,
	"telephone" text,
	"resume" text,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	"maj_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conversations_site_id" ON "conversations" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_site_id" ON "tickets" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_tickets_statut" ON "tickets" USING btree ("statut");