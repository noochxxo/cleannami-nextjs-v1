// lib/queries/jobs.ts
import { db } from "@/db";
import "server-only";


// Define a constant for the number of items per page
const PAGE_SIZE = 10;

/**
 * Fetches a paginated list of jobs with their details.
 * @param page - The page number to fetch.
 */
export async function getJobsWithDetails({ page = 1 }: { page: number }) {
  const data = await db.query.jobs.findMany({
    orderBy: (jobs, { desc }) => [desc(jobs.createdAt)],
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE, // Calculate the offset
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
    },
  });

  // Return the data along with the next page number, if there might be more data
  return {
    jobs: data,
    nextPage: data.length === PAGE_SIZE ? page + 1 : undefined,
  };
}

// We still use the same type, but now it represents a single page of data
export type JobsWithDetails = Awaited<ReturnType<typeof getJobsWithDetails>>['jobs'];

