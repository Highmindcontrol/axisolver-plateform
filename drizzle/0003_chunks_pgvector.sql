CREATE TABLE "base_connaissance_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"texte" text NOT NULL,
	"tokens" integer DEFAULT 0 NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "base_connaissance_chunks" ADD CONSTRAINT "base_connaissance_chunks_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "base_connaissance_chunks" ADD CONSTRAINT "base_connaissance_chunks_source_id_site_connaissance_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."site_connaissance_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chunks_embedding_hnsw" ON "base_connaissance_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_chunks_site_id" ON "base_connaissance_chunks" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "idx_chunks_source_id" ON "base_connaissance_chunks" USING btree ("source_id");