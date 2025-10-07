import { db } from "@/db";
import { subscriptions } from "@/db/schemas/subscriptions.schema";
import { eq } from "drizzle-orm";
import { ICalService } from "@/lib/services/iCal/ical.service";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401 
    });
  }

  console.log('Starting automated calendar sync for all active subscriptions');

  try {
    // Get all active subscriptions with their properties
    const activeSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'active'),
      with: {
        property: true,
      },
    });

    console.log(`Found ${activeSubscriptions.length} active subscriptions to sync`);

    const icalService = new ICalService(db);
    const results = {
      total: activeSubscriptions.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as Array<{ subscriptionId: string; error: string }>,
    };

    // Process each subscription
    for (const subscription of activeSubscriptions) {
      try {
        // Skip if no iCal URL
        if (!subscription.property?.iCalUrl) {
          console.log(`Skipping subscription ${subscription.id} - no iCal URL`);
          results.skipped++;
          continue;
        }

        console.log(`Syncing calendar for subscription ${subscription.id}`);
        
        const result = await icalService.syncCalendar({ 
          subscriptionId: subscription.id 
        });

        if (result.success) {
          results.successful++;
          console.log(`✓ Synced subscription ${subscription.id}: ${result.totalSynced} jobs`);
          
          // Clear error flag and update last sync attempt
          await db.update(subscriptions)
            .set({ 
              iCalSyncFailed: false,
              lastSyncAttempt: new Date(),
            })
            .where(eq(subscriptions.id, subscription.id));
        } else {
          results.failed++;
          results.errors.push({
            subscriptionId: subscription.id,
            error: result.message || 'Unknown error',
          });
          console.error(`✗ Failed to sync subscription ${subscription.id}: ${result.message}`);

          // Flag subscription with sync error
          await db.update(subscriptions)
            .set({ 
              iCalSyncFailed: true,
              lastSyncAttempt: new Date(),
            })
            .where(eq(subscriptions.id, subscription.id));
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          subscriptionId: subscription.id,
          error: errorMessage,
        });
        console.error(`✗ Exception syncing subscription ${subscription.id}:`, error);

        // Flag subscription with sync error
        await db.update(subscriptions)
          .set({ 
            iCalSyncFailed: true,
            lastSyncAttempt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id));
      }
    }

    console.log('Sync completed:', results);

    return new Response(JSON.stringify({
      success: true,
      message: `Synced ${results.successful} of ${results.total} calendars (${results.skipped} skipped)`,
      results,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fatal error in cron job:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Fatal error during sync',
      message: error instanceof Error ? error.message : 'Unknown error',
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}