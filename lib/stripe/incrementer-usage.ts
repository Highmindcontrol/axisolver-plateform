import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bucketMoisCourant } from "./verifier-quotas";

/**
 * Incrémente le compteur d'usage pour un (site, user) sur le mois
 * courant. Upsert idempotent via UNIQUE (site_id, bucket_mois).
 *
 * `nouvelleConversation` = true quand c'est le premier message d'une
 * conversation, false quand c'est un message supplémentaire sur une
 * conversation déjà comptée.
 */
export async function incrementerUsage(params: {
  siteId: string;
  userId: string;
  nouvelleConversation: boolean;
}): Promise<void> {
  const bucketMois = bucketMoisCourant();
  const incConv = params.nouvelleConversation ? 1 : 0;

  await db.execute(sql`
    INSERT INTO usage_conversations
      (site_id, user_id, bucket_mois, nb_conversations, nb_messages)
    VALUES
      (${params.siteId}, ${params.userId}, ${bucketMois}, ${incConv}, 1)
    ON CONFLICT (site_id, bucket_mois) DO UPDATE SET
      nb_conversations = usage_conversations.nb_conversations + ${incConv},
      nb_messages = usage_conversations.nb_messages + 1,
      maj_le = now()
  `);
}
