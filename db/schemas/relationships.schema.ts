import { relations } from "drizzle-orm";
import { customers } from "./customers.schema";
import { properties } from "./properties.schema";
import { subscriptions } from "./subscriptions.schema";
import { checklistFiles } from "./checklistFiles.schema";
import { jobs, jobsToCleaners } from "./jobs.schema"; // Import jobsToCleaners
import { evidencePackets } from "./evidencePackets.schema";
import { payouts } from "./payouts.schema";
import { cleaners } from "./cleaners.schema";
import { availability } from "./availability.schema";

// --- No changes needed for customer, property, checklist, or subscription relations ---
export const customerRelations = relations(customers, ({ many }) => ({
  properties: many(properties),
  subscriptions: many(subscriptions),
}));

export const propertyRelations = relations(properties, ({ one, many }) => ({
  customer: one(customers, { fields: [properties.customerId], references: [customers.id] }),
  checklistFiles: many(checklistFiles),
  subscriptions: many(subscriptions),
}));

export const checklistFileRelations = relations(checklistFiles, ({ one }) => ({
  property: one(properties, { fields: [checklistFiles.propertyId], references: [properties.id] }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one, many }) => ({
  customer: one(customers, { fields: [subscriptions.customerId], references: [customers.id] }),
  property: one(properties, { fields: [subscriptions.propertyId], references: [properties.id] }),
  jobs: many(jobs),
}));

// --- UPDATED RELATIONS START HERE ---

export const jobRelations = relations(jobs, ({ one, many }) => ({
  subscription: one(subscriptions, { fields: [jobs.subscriptionId], references: [subscriptions.id] }),
  property: one(properties, { fields: [jobs.propertyId], references: [properties.id] }),
  // A job has ONE evidence packet
  evidencePacket: one(evidencePackets, { fields: [jobs.id], references: [evidencePackets.jobId] }),
  payouts: many(payouts),
  // A job has MANY cleaners, through the join table
  cleaners: many(jobsToCleaners),
}));

export const cleanerRelations = relations(cleaners, ({ many }) => ({
  availabilities: many(availability),
  payouts: many(payouts),
  // A cleaner has MANY jobs, through the join table
  jobs: many(jobsToCleaners),
}));

// New relation definition for the join table
export const jobsToCleanersRelations = relations(jobsToCleaners, ({ one }) => ({
  job: one(jobs, { fields: [jobsToCleaners.jobId], references: [jobs.id] }),
  cleaner: one(cleaners, { fields: [jobsToCleaners.cleanerId], references: [cleaners.id] }),
}));


export const availabilityRelations = relations(availability, ({ one }) => ({
  cleaner: one(cleaners, { fields: [availability.cleanerId], references: [cleaners.id] }),
}));

export const evidencePacketRelations = relations(evidencePackets, ({ one }) => ({
  job: one(jobs, { fields: [evidencePackets.jobId], references: [jobs.id] }),
}));

export const payoutRelations = relations(payouts, ({ one }) => ({
  cleaner: one(cleaners, { fields: [payouts.cleanerId], references: [cleaners.id] }),
  job: one(jobs, { fields: [payouts.jobId], references: [jobs.id] }),
}));
