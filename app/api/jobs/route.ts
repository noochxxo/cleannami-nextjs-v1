// app/api/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getJobsWithDetails } from '@/lib/queries/jobs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = (searchParams.get('status') || 'all') as any;
    const query = searchParams.get('query') || '';
    
    // Optional date filtering
    const startDate = searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : undefined;
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : undefined;

    const result = await getJobsWithDetails({ 
      page, 
      limit, 
      status, 
      query,
      startDate,
      endDate,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// app/api/jobs/types.ts
// export type GetJobsResponse = Awaited<ReturnType<typeof getJobsWithDetails>>;
// export type JobItem = GetJobsResponse['data'][number];
// export type AssignedCleaner = JobItem['assignedCleaners'][number];
export type GetJobsResponse = Awaited<ReturnType<typeof getJobsWithDetails>>;