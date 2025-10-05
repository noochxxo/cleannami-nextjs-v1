import { pgTable, uuid, timestamp, text, integer, boolean, numeric, jsonb, index, pgEnum } from "drizzle-orm/pg-core";

// Enum for on-call status as requested
export const onCallStatusEnum = pgEnum('on_call_status', ['available', 'unavailable', 'on_job']);

export const cleaners = pgTable("cleaners", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone_number"),
  address: text("address"),
  profilePhotoUrl: text("profile_photo_url"), // This already correctly stores a link
  experienceYears: integer("experience_years"),
  hasHotTubCert: boolean("has_hot_tub_cert").default(false),
  reliabilityScore: numeric("reliability_score", { precision: 5, scale: 2 }), // e.g., 99.50
  onCallStatus: onCallStatusEnum("on_call_status").default('unavailable'),
  stripeAccountId: text("stripe_account_id").unique(),

  // --- UPDATED FIELD ---
  // This JSON object now stores the path/URL to the signed documents in your storage bucket.
  legalDocsSigned: jsonb("legal_docs_signed").$type<{
    w9Url: string | null;
    liabilityWaiverUrl: string | null;
    gpsConsentUrl: string | null;
  }>().default({ w9Url: null, liabilityWaiverUrl: null, gpsConsentUrl: null }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Index for job assignment engine ranking
  reliabilityIdx: index("cleaners_reliability_idx").on(table.reliabilityScore),
}));

