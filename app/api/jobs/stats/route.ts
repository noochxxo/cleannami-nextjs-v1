import { NextResponse } from 'next/server';
import { getJobStats } from '@/lib/queries/stats';

export async function GET() {
  try {
    const stats = await getJobStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching job stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job stats' },
      { status: 500 }
    );
  }
}

export type GetJobStatsResponse = Awaited<ReturnType<typeof getJobStats>>;