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

    // Update job to unassigned with urgent bonus flag
    await db
      .update(jobs)
      .set({
        status: 'unassigned',
        isUrgentBonus: true,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));

    // TODO: Trigger notification to available cleaners

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering urgent replacement:', error);
    return NextResponse.json(
      { error: 'Failed to trigger urgent replacement' },
      { status: 500 }
    );
  }
}