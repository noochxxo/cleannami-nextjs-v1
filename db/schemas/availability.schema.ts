import { pgTable, uuid, timestamp, date, boolean, pgEnum, index } from 'drizzle-orm/pg-core';
import { cleaners } from './cleaners.schema';

// Enums for availability status
export const availabilityStatusEnum = pgEnum('availability_status', ['yes', 'no']);
export const onCallAvailabilityEnum = pgEnum('on_call_availability', ['yes', 'no']);

export const availability = pgTable('availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  cleanerId: uuid('cleaner_id').references(() => cleaners.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  availabilityStatus: availabilityStatusEnum('availability_status').notNull(),
  onCallStatus: onCallAvailabilityEnum('on_call_status').notNull(),
  isGracePeriod: boolean('is_grace_period').default(false),
  submittedTimestamp: timestamp('submitted_timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Index for fast availability lookups
  availabilityDateIdx: index("availability_date_cleaner_idx").on(table.date, table.cleanerId),
}));
