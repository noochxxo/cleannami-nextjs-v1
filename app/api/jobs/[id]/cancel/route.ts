import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, jobsToCleaners } from '@/db/schemas';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
     const { id } = await params;

    // Remove all cleaners
    await db
      .delete(jobsToCleaners)
      .where(eq(jobsToCleaners.jobId, id));

    // Update job status
    await db
      .update(jobs)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling job:', error);
    return NextResponse.json(
      { error: 'Failed to cancel job' },
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