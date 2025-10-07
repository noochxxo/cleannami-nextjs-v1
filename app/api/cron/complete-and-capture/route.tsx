
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, evidencePackets, reserveTransactions, payouts, jobsToCleaners } from "@/db/schemas";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const job = await db.query.jobs.findFirst({
      where: eq(jobs.id, jobId),
      with: {
        subscription: {
          with: {
            customer: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (!job.paymentIntentId) {
      return NextResponse.json(
        { error: "No payment intent found for this job" },
        { status: 400 }
      );
    }

    if (job.paymentStatus === "captured") {
      return NextResponse.json(
        { message: "Payment already captured for this job" },
        { status: 200 }
      );
    }

    const evidence = await db.query.evidencePackets.findFirst({
      where: eq(evidencePackets.jobId, jobId),
    });

    if (!evidence) {
      return NextResponse.json(
        { error: "Evidence packet not found. Job cannot be completed." },
        { status: 400 }
      );
    }

    const isEvidenceComplete =
      evidence.status === "complete" &&
      evidence.gpsCheckInTimestamp &&
      evidence.gpsCheckOutTimestamp &&
      evidence.isChecklistComplete &&
      evidence.photoUrls &&
      evidence.photoUrls.length > 0;

    if (!isEvidenceComplete) {
      return NextResponse.json(
        {
          error: "Evidence packet incomplete",
          details: {
            hasCheckIn: !!evidence.gpsCheckInTimestamp,
            hasCheckOut: !!evidence.gpsCheckOutTimestamp,
            checklistComplete: evidence.isChecklistComplete,
            photoCount: evidence.photoUrls?.length || 0,
            status: evidence.status,
          },
        },
        { status: 400 }
      );
    }

    let paymentIntent: Stripe.PaymentIntent;
    
    try {
      paymentIntent = await stripe.paymentIntents.capture(job.paymentIntentId);
    } catch (stripeError: any) {
      console.error("Stripe capture failed:", stripeError);
      
      await db
        .update(jobs)
        .set({
          paymentStatus: "capture_failed",
          notes: `Capture failed: ${stripeError.message}`,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));

      return NextResponse.json(
        { error: "Payment capture failed", details: stripeError.message },
        { status: 500 }
      );
    }

    // Calculate 2% reserve
    const capturedAmount = paymentIntent.amount;
    const reserveAmount = Math.round(capturedAmount * 0.02); // 2% reserve
    const netAmount = capturedAmount - reserveAmount;

    // Record reserve transaction
    await db.insert(reserveTransactions).values({
      jobId: jobId,
      paymentIntentId: job.paymentIntentId,
      totalAmountCents: capturedAmount,
      reserveAmountCents: reserveAmount,
      netAmountCents: netAmount,
    });

    await db
      .update(jobs)
      .set({
        paymentStatus: "captured",
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

     // Create payout records for each cleaner on the job
    const assignedCleaners = await db.query.jobsToCleaners.findMany({
      where: eq(jobsToCleaners.jobId, jobId),
      with: {
        cleaner: true,
      },
    });

    if (assignedCleaners.length === 0) {
      return NextResponse.json(
        { error: "No cleaners assigned to this job" },
        { status: 400 }
      );
    }

    const expectedHours = parseFloat(job.expectedHours || "0");
    const basePay = 17 * expectedHours;

    const payoutPromises = assignedCleaners.map(async (assignment) => {
      let laundryBonus = null;
      let urgentBonus = null;

      // Laundry bonus only for laundry_lead role
      if (assignment.role === "laundry_lead" && job.addonsSnapshot?.laundryLoads) {
        laundryBonus = job.addonsSnapshot.laundryLoads * 5;
      }

      // Urgent bonus (you may want to split this or only give to primary)
      if (job.isUrgentBonus) {
        // Option A: Give to all cleaners
        urgentBonus = 10;
        
        // Option B: Only primary gets it (uncomment if preferred)
        // if (assignment.role === "primary") {
        //   urgentBonus = 10;
        // }
      }

      return db.insert(payouts).values({
        jobId: jobId,
        cleanerId: assignment.cleanerId,
        amount: basePay.toFixed(2),
        urgentBonusAmount: urgentBonus?.toFixed(2) || null,
        laundryBonusAmount: laundryBonus?.toFixed(2) || null,
        status: "pending",
      });
    });

    await Promise.all(payoutPromises);

    return NextResponse.json({
      success: true,
      message: "Payment captured and payouts created",
      jobId: jobId,
      capturedAmount: capturedAmount,
      reserveAmount: reserveAmount,
      netAmount: netAmount,
      paymentIntentId: paymentIntent.id,
      payoutsCreated: assignedCleaners.length,
    });


    return NextResponse.json({
      success: true,
      message: "Payment captured successfully",
      jobId: jobId,
      capturedAmount: capturedAmount,
      reserveAmount: reserveAmount,
      netAmount: netAmount,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    console.error("Job completion capture failed:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// HOW TO TRIGGER THIS ENDPOINT
/*
In your cleaner app, when a job is completed:

1. Cleaner uploads photos → stored in evidencePackets.photoUrls
2. Cleaner completes checklist → evidencePackets.isChecklistComplete = true
3. Cleaner GPS checks out → evidencePackets.gpsCheckOutTimestamp set
4. App updates evidencePackets.status = 'complete'
5. App calls: POST /api/jobs/complete-and-capture
   Body: { "jobId": "uuid-here" }

This endpoint will:
 - Verify all evidence is complete
 - Capture the pre-authorized payment from customer
 - Calculate and track 2% reserve
 - Mark job as captured
 - Job is now ready for cleaner payout processing
*/