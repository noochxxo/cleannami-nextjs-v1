import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";

export const cleaners = pgTable("cleaners", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
