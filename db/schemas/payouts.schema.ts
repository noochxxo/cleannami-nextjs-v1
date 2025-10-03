import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { jobs } from './jobs.schema';
import { cleaners } from './cleaners.schema';

export const payouts = pgTable('payouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => jobs.id),
  cleanerId: uuid('cleaner_id').references(() => cleaners.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
