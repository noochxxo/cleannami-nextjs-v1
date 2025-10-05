import { db } from "@/db";
import { ICalService } from "@/lib/services/iCal/ical.service";

export async function POST(request: Request) {
  const body = await request.json();
  const { subscriptionId, propertyId } = body;

  // Check if at least one of the required IDs is present
  if (!subscriptionId && !propertyId) {
    return new Response(
      JSON.stringify({ message: "Either subscriptionId or propertyId is required" }),
      { status: 400 }
    );
  }

  try {
    const icalService = new ICalService(db);
    
    // Pass the entire body to the service method
    const result = await icalService.syncCalendar({ subscriptionId, propertyId });

    if (!result.success) {
      // Use a 500 status code for server-side errors during the sync process
      return new Response(JSON.stringify({ message: result.message || "Sync failed" }), {
        status: 500,
      });
    }

    // Return a successful response
    return new Response(JSON.stringify(result));

  } catch (error: any) {
    console.error("An unexpected error occurred in sync-calendar API:", error);
    return new Response(
      JSON.stringify({ message: "An unexpected server error occurred." }),
      { status: 500 }
    );
  }
}
