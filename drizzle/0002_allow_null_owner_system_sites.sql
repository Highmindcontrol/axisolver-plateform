ALTER TABLE "sites" DROP CONSTRAINT "sites_owner_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "sites" ALTER COLUMN "owner_user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD CONSTRAINT "sites_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;