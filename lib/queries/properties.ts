import 'server-only';
import { db } from '@/db';
import { desc } from 'drizzle-orm';
import { properties } from '@/db/schemas';

/**
 * Fetches a paginated list of properties and includes the customer's name.
 * @param page - The page number to fetch.
 * @param limit - The number of items per page.
 */
export async function getPropertiesWithOwner({ page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;

  const data = await db.query.properties.findMany({
    limit,
    offset,
    orderBy: desc(properties.createdAt),
    with: {
      customer: {
        columns: {
          name: true,
        },
      },
    },
  });
  
  // The next page exists if the number of items fetched equals the limit
  const nextPage = data.length === limit ? page + 1 : null;

  return { properties: data, nextPage };
}

// Export the inferred type for client-side use
export type PropertiesWithOwner = Awaited<ReturnType<typeof getPropertiesWithOwner>>;
