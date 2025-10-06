// app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPropertiesWithOwner } from '@/lib/queries/properties';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const query = searchParams.get('query') || '';

    const result = await getPropertiesWithOwner({ page, limit, query });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}