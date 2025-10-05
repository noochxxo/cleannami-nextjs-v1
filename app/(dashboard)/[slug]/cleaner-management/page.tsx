import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCleaners } from '@/lib/queries/cleaners'; 
import { CleanersPageClient } from '@/components/dashbboard/admin/cleaner-management/CleanersPageClient';

// This is a React Server Component responsible for the initial data fetch.
export default async function CleanerManagementPage() {
  const queryClient = new QueryClient();

  // We prefetch the FIRST page of data on the server.
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['cleaners'],
    // FIX: Added the required 'limit' property to the getCleaners function call.
    queryFn: () => getCleaners({ page: 1, limit: 10 }),
    initialPageParam: 1,
    // This tells TanStack Query how to calculate the next page number.
    getNextPageParam: (lastPage) => lastPage.nextPage,
    pages: 1, // Only fetch one page initially
  });

  // We pass the prefetched data to the client component via the HydrationBoundary.
  // This avoids a loading spinner on the initial page load.
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CleanersPageClient />
    </HydrationBoundary>
  );
}

