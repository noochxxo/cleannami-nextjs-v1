import { NextResponse } from 'next/server';
import { getJobsWithDetails } from '@/lib/queries/jobs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Read the page number from the URL query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const data = await getJobsWithDetails({ page });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json({ message: "Unable to fetch jobs" }, { status: 500 });
  }
}

