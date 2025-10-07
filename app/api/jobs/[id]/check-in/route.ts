import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cleaners, evidencePackets, jobs, jobsToCleaners } from '@/db/schemas';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Changed syntax to use destructuring, which may resolve the stale error message.
   const { id: jobId } = await params;

  if (!jobId) {
    return new NextResponse('Job ID is required', { status: 400 });
  }

  console.log(`[Check-In] Starting for job: ${jobId}`);

  try {
    // Use a transaction to ensure all database operations succeed or fail together.
    await db.transaction(async (tx) => {
      // Step 1: Find the primary cleaner assigned to this job.
      console.log(`[Check-In] Step 1: Finding primary cleaner for job ${jobId}...`);
      const assignments = await tx
        .select({ cleanerId: jobsToCleaners.cleanerId })
        .from(jobsToCleaners)
        .where(eq(jobsToCleaners.jobId, jobId) && eq(jobsToCleaners.role, 'primary'));

      const primaryCleanerId = assignments[0]?.cleanerId;

      if (!primaryCleanerId) {
        console.error(`[Check-In] ERROR: No primary cleaner found for job ${jobId}. Rolling back transaction.`);
        throw new Error('No primary cleaner found for this job.');
      }
      
      console.log(`[Check-In] Found primary cleaner ID: ${primaryCleanerId}`);

      const now = new Date();

      // Step 2: Update the job's status and check-in time.
      console.log(`[Check-In] Step 2: Updating job status to 'in-progress'.`);
      await tx
        .update(jobs)
        .set({
          status: 'in-progress',
          checkInTime: now,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId));

      // Step 3: Update the corresponding evidence packet.
      console.log(`[Check-In] Step 3: Updating evidence packet timestamp.`);
      await tx
        .update(evidencePackets)
        .set({
          gpsCheckInTimestamp: now,
          updatedAt: now,
        })
        .where(eq(evidencePackets.jobId, jobId));
      
      // Step 4: Update the cleaner's on-call status.
      console.log(`[Check-In] Step 4: Updating cleaner ${primaryCleanerId} status to 'on_job'.`);
      await tx
        .update(cleaners)
        .set({ onCallStatus: 'on_job' })
        .where(eq(cleaners.id, primaryCleanerId));
      
      console.log(`[Check-In] Transaction for job ${jobId} completed successfully.`);
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Check-In] Critical error for job ${jobId}:`, errorMessage);
    return NextResponse.json(
      { error: `Failed to check in: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(
//   request: NextRequest,
// ) {
//   return NextResponse.json(
//       { error: 'Placeholder route' },
//       { status: 500 }
//     );
// }