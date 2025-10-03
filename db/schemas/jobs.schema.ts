import { pgTable, uuid, timestamp, text } from "drizzle-orm/pg-core";
import { subscriptions } from "./subscriptions.schema";
import { properties } from "./properties.schema";

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  propertyId: uuid('property_id').references(() => properties.id),
  status: text('status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});