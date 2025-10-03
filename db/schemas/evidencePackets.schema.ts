import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { jobs } from "./jobs.schema";

export const evidencePackets = pgTable('evidence_packets', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});