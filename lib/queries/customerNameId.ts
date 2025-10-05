import 'server-only';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { customers } from '@/db/schemas';

// --- (Your other customer query functions remain here) ---

/**
 * Fetches a single customer by their ID.
 * Throws a 404 error if the customer is not found.
 * @param customerId - The UUID of the customer.
 */
export async function getCustomerById(customerId: string) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
  });

  if (!customer) {
    notFound(); // Triggers a 404 page if no customer is found
  }

  return customer;
}

