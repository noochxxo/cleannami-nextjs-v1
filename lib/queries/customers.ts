import 'server-only';
import { db } from '@/db'; // Adjust this path to your Drizzle instance
// import { customers } from '@/drizzle/schema';
import { count, eq, inArray } from 'drizzle-orm';
import { jobs, properties } from '@/db/schemas';


export async function getCustomersWithPropertyCount({ page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const data = await db.query.customers.findMany({
    limit,
    offset,
    orderBy: (customers, { desc }) => [desc(customers.createdAt)],
    with: {
      properties: {
        columns: {
          id: true,
        },
      },
    },
  });

  const customersWithCount = data.map(customer => ({
    ...customer,
    propertyCount: customer.properties.length,
  }));

  const nextPage = data.length === limit ? page + 1 : null;
  
  return { customers: customersWithCount, nextPage };
}
export type CustomersResponse = Awaited<ReturnType<typeof getCustomersWithPropertyCount>>;
// ---

/**
 * Fetches all jobs associated with a single customer's properties.
 * This is a server-side function.
 * @param customerId - The UUID of the customer.
 */
export async function getCustomerJobHistory(customerId: string) {
  // 1. Find all properties belonging to the customer
  const customerProperties = await db.query.properties.findMany({
    where: eq(properties.customerId, customerId),
    columns: {
      id: true, // We only need the IDs
    },
  });

  if (customerProperties.length === 0) {
    return []; // No properties means no jobs
  }
  const propertyIds = customerProperties.map((p) => p.id);

  // 2. Find all jobs linked to those property IDs
  const customerJobs = await db.query.jobs.findMany({
    where: inArray(jobs.propertyId, propertyIds),
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    with: {
      // Include the related property to get its address
      property: {
        columns: {
          address: true,
        },
      },
    },
  });

  return customerJobs;
}

// FIX: Exporting the response type for use in client components
export type CustomerJobHistoryResponse = Awaited<ReturnType<typeof getCustomerJobHistory>>;

