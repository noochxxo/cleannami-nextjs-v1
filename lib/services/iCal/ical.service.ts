import { schema } from "@/db";
import { jobs } from "@/db/schemas";
import { and, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as webcal from 'node-ical';
import { VEvent } from 'node-ical';

type NewJob = typeof jobs.$inferInsert;
type DrizzleDb = NodePgDatabase<typeof schema>;

const BATCH_SIZE = 100;

// Type for the flexible input arguments
type SyncInput = {
  subscriptionId?: string;
  propertyId?: string;
};

// Type for the context needed by the processing methods
type SyncContext = {
  subscriptionId: string;
  propertyId: string;
  iCalUrl: string;
};

export class ICalService {
  private db: DrizzleDb;

  constructor(db: DrizzleDb) {
    this.db = db;
  }

  /**
   * Main public method to sync a calendar. It can be initiated
   * with either a subscriptionId or a propertyId.
   * @param args An object containing either a subscriptionId or a propertyId.
   * @returns A summary object of the sync operation.
   */
  public async syncCalendar(args: SyncInput) {
    console.log(`Starting calendar sync with args:`, args);

    // 1. Resolve the provided ID into the context we need to proceed.
    const contextResult = await this._getContext(args);
    if (!contextResult.success || !contextResult.data) {
      return { success: false, message: contextResult.message };
    }

    const { subscriptionId, propertyId, iCalUrl } = contextResult.data;

    // 2. Fetch and parse the calendar data
    const events = await this._fetchAndParseCalendar(iCalUrl);
    if (!events) {
      return { success: false, message: "Failed to fetch or parse calendar." };
    }

    console.log(`Found ${events.length} events in the calendar.`);
    if (events.length === 0) {
      return { success: true, message: "Calendar is empty, nothing to sync.", totalSynced: 0 };
    }

    // 3. Process the events in batches
    const result = await this._processAndSaveEventsInBatches(events, {
      subscriptionId,
      propertyId,
    });
    
    console.log(`Sync complete. Total jobs synced: ${result.totalSynced}`);
    return { success: true, ...result };
  }

  /**
   * Resolves either a subscriptionId or propertyId into the full context
   * (subscriptionId, propertyId, iCalUrl) needed for the sync.
   */
  private async _getContext(args: SyncInput): Promise<{ success: boolean; data?: SyncContext; message?: string }> {
    const { subscriptionId, propertyId } = args;

    if (subscriptionId) {
      const subscription = await this.db.query.subscriptions.findFirst({
        where: eq(schema.subscriptions.id, subscriptionId),
        with: { property: true },
      });
      if (!subscription) return { success: false, message: "Subscription not found." };
      if (!subscription.property?.iCalUrl) return { success: false, message: "No iCal URL found for the subscription's property." };
      
      return {
        success: true,
        data: {
          subscriptionId: subscription.id,
          propertyId: subscription.propertyId,
          iCalUrl: subscription.property.iCalUrl,
        }
      };
    }

    if (propertyId) {
      const property = await this.db.query.properties.findFirst({
        where: eq(schema.properties.id, propertyId),
      });
      if (!property) return { success: false, message: "Property not found." };
      if (!property.iCalUrl) return { success: false, message: "No iCal URL found for this property." };
      
      // Since jobs must be linked to a subscription, we find an active one for this property.
      const activeSubscription = await this.db.query.subscriptions.findFirst({
          where: and(
              eq(schema.subscriptions.propertyId, propertyId),
              eq(schema.subscriptions.status, 'active')
          )
      });
      
      if (!activeSubscription) return { success: false, message: "No active subscription found for this property." };

      return {
        success: true,
        data: {
          subscriptionId: activeSubscription.id,
          propertyId: property.id,
          iCalUrl: property.iCalUrl,
        }
      };
    }

    return { success: false, message: "Either subscriptionId or propertyId must be provided." };
  }

  private async _fetchAndParseCalendar(url: string): Promise<VEvent[] | null> {
    try {
      const icsData = await fetch(url).then(res => res.text());
      const calendarData = await webcal.async.parseICS(icsData);
      return Object.values(calendarData).filter(e => e.type === 'VEVENT') as VEvent[];
    } catch (error) {
      console.error("Error fetching or parsing calendar:", error);
      return null;
    }
  }

  private async _processAndSaveEventsInBatches(
    events: VEvent[],
    context: { subscriptionId: string; propertyId: string }
  ) {
    const allJobsToInsert: NewJob[] = events.map(event => ({
      ...context,
      checkInTime: event.start,
      checkOutTime: event.end,
      calendarEventUid: event.uid,
      status: 'unassigned',
      isUrgentBonus: false,
    }));

    let totalSynced = 0;

    for (let i = 0; i < allJobsToInsert.length; i += BATCH_SIZE) {
      const batch = allJobsToInsert.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
      
      try {
        const result = await this.db.insert(jobs)
          .values(batch)
          .onConflictDoUpdate({
            target: jobs.calendarEventUid,
            set: {
              checkInTime: jobs.checkInTime,
              checkOutTime: jobs.checkOutTime,
            },
          })
          .returning({ id: jobs.id });

        totalSynced += result.length;
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
      }
    }

    return {
      message: `Successfully synced ${totalSynced} of ${allJobsToInsert.length} total events.`,
      totalSynced,
    };
  }
}