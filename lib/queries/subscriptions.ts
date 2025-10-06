// lib/queries/subscriptions.ts
import 'server-only';
import { db } from '@/db';
import { subscriptions, properties, customers, jobs } from '@/db/schemas';
import { eq, sql, and } from 'drizzle-orm';
import {
  PaginationParams,
  SearchParams,
  buildPaginatedResponse,
  buildSearchCondition,
  getPaginationOffset,
  ordering,
  filters,
} from './utils/queryBuilder';

type SubscriptionStatus = 'active' | 'expired' | 'canceled' | 'pending';

interface GetSubscriptionsParams extends PaginationParams, SearchParams {
  status?: SubscriptionStatus | 'all';
}

/**
 * Fetches paginated subscriptions with property, customer, and job data
 */
export async function getSubscriptionsWithDetails({
  page = 1,
  limit = 10,
  status = 'all',
  query = '',
}: GetSubscriptionsParams) {
  const offset = getPaginationOffset(page, limit);

  const data = await db
    .select({
      // Subscription fields
      id: subscriptions.id,
      customerId: subscriptions.customerId,
      propertyId: subscriptions.propertyId,
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      durationMonths: subscriptions.durationMonths,
      status: subscriptions.status,
      firstCleanPaymentId: subscriptions.firstCleanPaymentId,
      isFirstCleanPrepaid: subscriptions.isFirstCleanPrepaid,
      startDate: subscriptions.startDate,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,

      // Property info
      property: {
        id: properties.id,
        address: properties.address,
        bedCount: properties.bedCount,
        bathCount: properties.bathCount,
        hasHotTub: properties.hasHotTub,
        laundryType: properties.laundryType,
      },

      // Customer info
      customer: {
        id: customers.id,
        name: customers.name,
        email: customers.email,
      },

      // Job statistics
      totalJobs: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${jobs}
        WHERE ${jobs.subscriptionId} = ${subscriptions.id}
      )`.as('total_jobs'),

      completedJobs: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${jobs}
        WHERE ${jobs.subscriptionId} = ${subscriptions.id}
        AND ${jobs.status} = 'completed'
      )`.as('completed_jobs'),

      upcomingJobs: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${jobs}
        WHERE ${jobs.subscriptionId} = ${subscriptions.id}
        AND ${jobs.status} IN ('unassigned', 'assigned')
        AND ${jobs.checkInTime} > NOW()
      )`.as('upcoming_jobs'),

      // Next scheduled job
      nextJobDate: sql<string | null>`(
        SELECT ${jobs.checkInTime}
        FROM ${jobs}
        WHERE ${jobs.subscriptionId} = ${subscriptions.id}
        AND ${jobs.status} IN ('unassigned', 'assigned')
        AND ${jobs.checkInTime} > NOW()
        ORDER BY ${jobs.checkInTime} ASC
        LIMIT 1
      )`.as('next_job_date'),
    })
    .from(subscriptions)
    .innerJoin(properties, eq(subscriptions.propertyId, properties.id))
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .where(
      and(
        filters.byStatus(subscriptions.status, status),
        buildSearchCondition(query, [properties.address, customers.name, customers.email])
      )
    )
    .orderBy(ordering.createdAtDesc(subscriptions))
    .limit(limit)
    .offset(offset);

  return buildPaginatedResponse(data, page, limit);
}

export type SubscriptionsWithDetails = Awaited<ReturnType<typeof getSubscriptionsWithDetails>>;

/**
 * Get detailed subscription information
 */
export async function getSubscriptionDetails(subscriptionId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.id, subscriptionId),
    with: {
      property: {
        with: {
          checklistFiles: {
            orderBy: (files, { desc }) => [desc(files.createdAt)],
            limit: 1, // Get the most recent checklist
          },
        },
      },
      customer: true,
      jobs: {
        orderBy: (jobs, { desc }) => [desc(jobs.checkInTime)],
        with: {
          cleaners: {
            with: {
              cleaner: {
                columns: {
                  id: true,
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
          payouts: {
            columns: {
              id: true,
              amount: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Calculate subscription metrics by status
  const now = new Date();
  
  // Categorize jobs by status
  const upcomingJobs = subscription.jobs.filter(
    (j) => j.checkInTime && 
           new Date(j.checkInTime) > now && 
           j.status !== null &&
           ['unassigned', 'assigned'].includes(j.status)
  ).sort((a, b) => new Date(a.checkInTime!).getTime() - new Date(b.checkInTime!).getTime());

  const inProgressJobs = subscription.jobs.filter((j) => j.status === 'in-progress');
  
  const completedJobs = subscription.jobs.filter((j) => j.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const canceledJobs = subscription.jobs.filter((j) => j.status === 'canceled');
  
  const unassignedJobs = subscription.jobs.filter((j) => j.status === 'unassigned');

  return {
    ...subscription,
    // Next upcoming job
    nextJob: upcomingJobs[0] || null,
    
    // Job lists by category
    upcomingJobs: upcomingJobs.slice(0, 10),
    inProgressJobs,
    completedJobs: completedJobs.slice(0, 20),
    canceledJobs: canceledJobs.slice(0, 10),
    unassignedJobs,
    
    // Counts
    totalJobs: subscription.jobs.length,
    upcomingJobCount: upcomingJobs.length,
    inProgressJobCount: inProgressJobs.length,
    completedJobCount: completedJobs.length,
    canceledJobCount: canceledJobs.length,
    unassignedJobCount: unassignedJobs.length,
  };
}

export type SubscriptionDetails = Awaited<ReturnType<typeof getSubscriptionDetails>>;