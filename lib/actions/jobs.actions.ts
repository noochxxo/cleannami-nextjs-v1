"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobs } from "@/db/schemas";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function capturePaymentForJob(jobId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const supabase = await createClient();

  // --- Step 1: Authenticate the request ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized." };
  }

  // --- Step 2: Find the job and its payment details ---
  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  });

  if (!job) {
    return { success: false, message: `Job with ID ${jobId} not found.` };
  }

  if (!job.paymentIntentId) {
    return {
      success: false,
      message: "This job has no associated Payment Intent. Pre-authorization may have failed.",
    };
  }

  if (job.paymentStatus !== "authorized") {
    return {
      success: false,
      message: `Payment cannot be captured. Job status is '${job.paymentStatus}', not 'authorized'.`,
    };
  }

  try {
    // --- Step 3: Capture the payment with Stripe ---
    await stripe.paymentIntents.capture(job.paymentIntentId);

    // --- Step 4: Update the job status on success ---
    await db
      .update(jobs)
      .set({
        paymentStatus: "captured",
        status: "completed", // Also update the cleaning status
      })
      .where(eq(jobs.id, jobId));
      
    // NOTE: A 'payment_intent.succeeded' webhook is the most robust place
    // to trigger cleaner payouts.

    return { success: true, message: "Payment captured successfully." };
    
  } catch (error: any) {
    // --- Step 5: Handle capture failures ---
    console.error(`Failed to capture payment for job ${jobId}:`, error);
    const errorMessage = error.message || "An unknown error occurred during capture.";

    await db
      .update(jobs)
      .set({
        paymentStatus: "capture_failed",
        notes: `Capture Failed: ${errorMessage}`,
      })
      .where(eq(jobs.id, jobId));

    return { success: false, message: `Payment capture failed: ${errorMessage}` };
  }
}