import "server-only";
import { db } from "@/db"; // Adjust this to your db instance path
import { desc } from "drizzle-orm";
import { cleaners } from "@/db/schema";

/**
 * Fetches a paginated list of all cleaners.
 * This is a server-side function.
 */
export async function getCleaners({ page = 1, limit = 15 }: { page: number, limit: number }) {
  const offset = (page - 1) * limit;

  const data = await db.query.cleaners.findMany({
    orderBy: [desc(cleaners.createdAt)], // Assuming you have a createdAt field
    limit,
    offset,
  });

  // Check if there is a next page
  const nextPage = data.length === limit ? page + 1 : null;

  return { cleaners: data, nextPage };
}

// Export the inferred type for client-side type safety
export type CleanersResponse = Awaited<ReturnType<typeof getCleaners>>;
