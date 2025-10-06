// lib/queries/properties.ts
import 'server-only';
import { db } from '@/db';
import { properties, customers, subscriptions, jobs } from '@/db/schemas';
import { eq, sql, and, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import {
  PaginationParams,
  SearchParams,
  buildPaginatedResponse,
  buildSearchCondition,
  getPaginationOffset,
  ordering,
} from './utils/queryBuilder';

interface GetPropertiesParams extends PaginationParams, SearchParams {}

/**
 * Fetches paginated properties with owner info and aggregated data
 */
export async function getPropertiesWithOwner({
  page = 1,
  limit = 10,
  query = '',
}: GetPropertiesParams) {
  const offset = getPaginationOffset(page, limit);

  const data = await db
    .select({
      // Property fields
      id: properties.id,
      customerId: properties.customerId,
      address: properties.address,
      sqFt: properties.sqFt,
      bedCount: properties.bedCount,
      bathCount: properties.bathCount,
      hasHotTub: properties.hasHotTub,
      laundryType: properties.laundryType,
      laundryLoads: properties.laundryLoads,
      iCalUrl: properties.iCalUrl,
      createdAt: properties.createdAt,
      updatedAt: properties.updatedAt,

      // Customer info
      customer: {
        id: customers.id,
        name: customers.name,
        email: customers.email,
      },

      // Active subscription info
      activeSubscription: sql<{
        id: string;
        status: string;
        durationMonths: number;
        startDate: string;
      } | null>`(
        SELECT json_build_object(
          'id', ${subscriptions.id},
          'status', ${subscriptions.status},
          'durationMonths', ${subscriptions.durationMonths},
          'startDate', ${subscriptions.startDate}
        )
        FROM ${subscriptions}
        WHERE ${subscriptions.propertyId} = ${properties.id}
        AND ${subscriptions.status} = 'active'
        ORDER BY ${subscriptions.createdAt} DESC
        LIMIT 1
      )`.as('active_subscription'),

      // Next scheduled job
      nextJob: sql<{
        id: string;
        checkInTime: string;
        status: string;
      } | null>`(
        SELECT json_build_object(
          'id', ${jobs.id},
          'checkInTime', ${jobs.checkInTime},
          'status', ${jobs.status}
        )
        FROM ${jobs}
        WHERE ${jobs.propertyId} = ${properties.id}
        AND ${jobs.status} IN ('unassigned', 'assigned')
        AND ${jobs.checkInTime} > NOW()
        ORDER BY ${jobs.checkInTime} ASC
        LIMIT 1
      )`.as('next_job'),

      // Job counts
      totalJobs: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${jobs}
        WHERE ${jobs.propertyId} = ${properties.id}
      )`.as('total_jobs'),

      completedJobs: sql<number>`(
        SELECT CAST(COUNT(*) AS INTEGER)
        FROM ${jobs}
        WHERE ${jobs.propertyId} = ${properties.id}
        AND ${jobs.status} = 'completed'
      )`.as('completed_jobs'),
    })
    .from(properties)
    .leftJoin(customers, eq(properties.customerId, customers.id))
    .where(
      and(
        buildSearchCondition(query, [properties.address, customers.name])
      )
    )
    .orderBy(ordering.createdAtDesc(properties))
    .limit(limit)
    .offset(offset);

  return buildPaginatedResponse(data, page, limit);
}

export type PropertiesWithOwner = Awaited<ReturnType<typeof getPropertiesWithOwner>>;

/**
 * Get comprehensive property details
 */
export async function getPropertyDetails(propertyId: string) {
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, propertyId),
    with: {
      // Owner info
      customer: true,

      // All subscriptions
      subscriptions: {
        orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
        with: {
          jobs: {
            orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
            limit: 5, // Last 5 jobs per subscription
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
                  isChecklistComplete: true,
                },
              },
            },
          },
        },
      },

      // Checklist files
      checklistFiles: {
        orderBy: (files, { desc }) => [desc(files.createdAt)],
      },
    },
  });

  if (!property) {
    notFound();
  }

  // Find the active subscription
  const activeSubscription = property.subscriptions.find((s) => s.status === 'active');

  // Get all jobs across all subscriptions
  const allJobs = property.subscriptions.flatMap((sub) => sub.jobs);

  // Find next scheduled job
  const now = new Date();
  const upcomingJobs = allJobs
    .filter((j) => j.checkInTime && new Date(j.checkInTime) > now)
    .sort((a, b) => 
      new Date(a.checkInTime!).getTime() - new Date(b.checkInTime!).getTime()
    );

  return {
    ...property,
    activeSubscription: activeSubscription || null,
    nextJob: upcomingJobs[0] || null,
    upcomingJobs: upcomingJobs.slice(0, 5),
    recentJobs: allJobs
      .filter((j) => j.status === 'completed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    totalJobs: allJobs.length,
    completedJobs: allJobs.filter((j) => j.status === 'completed').length,
  };
}

export type PropertyDetails = Awaited<ReturnType<typeof getPropertyDetails>>;