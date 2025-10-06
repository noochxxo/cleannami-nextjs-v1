// app/api/cleaners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCleaners } from '@/lib/queries/cleaners';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const query = searchParams.get('query') || '';

    const result = await getCleaners({ page, limit, query });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching cleaners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaners' },
      { status: 500 }
    );
  }
}