import { getCustomersWithPropertyCount } from '@/lib/queries/customers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  try {
    const data = await getCustomersWithPropertyCount({ page });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
