import { getCustomerJobHistory } from '@/lib/queries/customers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { customerId: string } }
) {
  const { customerId } = params;

  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
  }

  try {
    const jobs = await getCustomerJobHistory(customerId);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error(`Failed to fetch job history for customer ${customerId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch job history' },
      { status: 500 }
    );
  }
}
