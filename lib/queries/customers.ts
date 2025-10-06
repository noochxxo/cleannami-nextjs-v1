// lib/queries/customers.ts
import 'server-only';
import { db } from '@/db';
import { customers, properties, subscriptions, jobs } from '@/db/schemas';
import { eq, sql, inArray, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import {
  PaginationParams,
  SearchParams,
  buildPaginatedResponse,
  buildSearchCondition,
  getPaginationOffset,
  ordering,
} from './utils/queryBuilder';

interface GetCustomersParams extends PaginationParams, SearchParams {}

/**
 * Fetches paginated customers with aggregated counts
 * Uses SQL subqueries for efficient counting
 */
export async function getCustomersWithPropertyCount({
  page = 1,
  limit = 10,
  query = '',
}: GetCustomersParams) {
  const offset = getPaginationOffset(page, limit);

  const data = await db
    .select({
      // Customer fields
      id: customers.id,
      name: customers.name,
      email: customers.email,
      phone: customers.phone,
      stripeCustomerId: customers.stripeCustomerId,
      createdAt: customers.createdAt,
      updatedAt: customers.updatedAt,

      // Aggregated counts using SQL subqueries
      propertyCount: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${properties}
        WHERE ${properties.customerId} = ${customers.id}
      )`.as('property_count'),

      activeSubscriptionCount: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${subscriptions}
        WHERE ${subscriptions.customerId} = ${customers.id}
        AND ${subscriptions.status} = 'active'
      )`.as('active_subscription_count'),

      totalSubscriptions: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${subscriptions}
        WHERE ${subscriptions.customerId} = ${customers.id}
      )`.as('total_subscriptions'),

      completedJobs: sql<number>`(
        SELECT CAST(COUNT(DISTINCT ${jobs.id}) AS INTEGER)
        FROM ${jobs}
        INNER JOIN ${properties} ON ${jobs.propertyId} = ${properties.id}
        WHERE ${properties.customerId} = ${customers.id}
        AND ${jobs.status} = 'completed'
      )`.as('completed_jobs'),
    })
    .from(customers)
    .where(buildSearchCondition(query, [customers.name, customers.email, customers.phone]))
    .orderBy(ordering.createdAtDesc(customers))
    .limit(limit)
    .offset(offset);

  return buildPaginatedResponse(data, page, limit);
}




export type CustomersResponse = Awaited<ReturnType<typeof getCustomersWithPropertyCount>>;

/**
 * Get comprehensive customer details with all related data
 */
export async function getCustomerDetails(customerId: string) {
  // Fetch the customer with all relations in ONE query
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, customerId),
    with: {
      // Get all properties with their subscriptions
      properties: {
        with: {
          subscriptions: {
            orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
          },
          checklistFiles: true,
        },
      },
      // Get all subscriptions with property details
      subscriptions: {
        with: {
          property: {
            columns: {
              address: true,
              bedCount: true,
              bathCount: true,
              hasHotTub: true,
            },
          },
          jobs: {
            orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
            limit: 10, // Most recent 10 jobs per subscription
            with: {
              cleaners: {
                with: {
                  cleaner: {
                    columns: {
                      fullName: true,
                    },
                  },
                },
              },
              evidencePacket: {
                columns: {
                  status: true,
                },
              },
            },
          },
        },
        orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
      },
    },
  });

  if (!customer) {
    notFound();
  }

  // Aggregate job history across all properties
  const allJobs = customer.subscriptions.flatMap((sub) => sub.jobs);

  return {
    ...customer,
    // Add computed fields
    totalProperties: customer.properties.length,
    activeSubscriptions: customer.subscriptions.filter((s) => s.status === 'active').length,
    totalJobs: allJobs.length,
    completedJobs: allJobs.filter((j) => j.status === 'completed').length,
    // Flatten job history for easy display
    recentJobs: allJobs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20),
  };
}

export type CustomerDetails = Awaited<ReturnType<typeof getCustomerDetails>>;

/**
 * Get just the job history for a customer
 * (Can be used for infinite scroll pagination)
 */
export async function getCustomerJobHistory({
  customerId,
  page = 1,
  limit = 20,
}: { customerId: string } & PaginationParams) {
  const offset = getPaginationOffset(page, limit);

  // First get all property IDs for this customer
  const customerProperties = await db
    .select({ id: properties.id })
    .from(properties)
    .where(eq(properties.customerId, customerId));

  if (customerProperties.length === 0) {
    return buildPaginatedResponse([], page, limit);
  }

  const propertyIds = customerProperties.map((p) => p.id);

  // --- NEW CODE: EFFICIENTLY COUNT JOBS ---
  let totalJobsCount = 0;
  let completedJobsCount = 0;

  if (propertyIds.length > 0) {
    const jobCounts = await db
      .select({
        total: count(),
        completed: count(sql`case when ${jobs.status} = 'completed' then 1 end`),
      })
      .from(jobs)
      .where(inArray(jobs.propertyId, propertyIds));
      
    totalJobsCount = jobCounts[0].total;
    completedJobsCount = jobCounts[0].completed;
  }
  // --- END NEW CODE ---

  // Get jobs for those properties
  const jobData = await db.query.jobs.findMany({
    where: inArray(jobs.propertyId, propertyIds),
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    limit,
    offset,
    with: {
      property: {
        columns: {
          address: true,
        },
      },
      cleaners: {
        with: {
          cleaner: {
            columns: {
              fullName: true,
            },
          },
        },
      },
      evidencePacket: {
        columns: {
          status: true,
          isChecklistComplete: true,
        },
      },
    },
  });

  return buildPaginatedResponse(jobData, page, limit);
}

export type CustomerJobHistoryResponse = Awaited<ReturnType<typeof getCustomerJobHistory>>;