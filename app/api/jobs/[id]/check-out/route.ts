import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobs, evidencePackets } from '@/db/schemas';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
     const { id } = await params;

    // Update job status and check-out time
    await db
      .update(jobs)
      .set({
        status: 'completed',
        checkOutTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));

    // Update GPS check-out timestamp in evidence packet if it exists
    await db
      .update(evidencePackets)
      .set({
        gpsCheckOutTimestamp: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(evidencePackets.jobId, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error checking out:', error);
    return NextResponse.json(
      { error: 'Failed to check out' },
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