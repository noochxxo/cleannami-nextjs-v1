import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { cleaners } from './cleaners.schema';

export const availability = pgTable('availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  cleanerId: uuid('cleaner_id').references(() => cleaners.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
