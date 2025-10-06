import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

/**
 * Reusable server component wrapper for pages that use infinite queries.
 * Handles server-side prefetching and hydration boundary setup.
 * 
 * @example
 * ```tsx
 * export default async function Page() {
 *   return (
 *     <PrefetchedInfinitePage
 *       queryKey={['customers', { search: '' }]}
 *       queryFn={() => getCustomersWithPropertyCount({ page: 1, limit: 10 })}
 *     >
 *       <CustomerPageClient />
 *     </PrefetchedInfinitePage>
 *   );
 * }
 * ```
 */
export async function PrefetchedInfinitePage<TData = any>({
  queryKey,
  queryFn,
  getNextPageParam = (lastPage: any) => lastPage.nextPage,
  initialPageParam = 1,
  children,
}: {
  /** 
   * The query key for the infinite query.
   * Should match the key used in the client component.
   */
  queryKey: unknown[];
  
  /**
   * Function that fetches the first page of data.
   * Should call your query function with page: 1.
   */
  queryFn: () => Promise<TData>;
  
  /**
   * Function to determine the next page parameter.
   * Defaults to returning lastPage.nextPage.
   */
  getNextPageParam?: (lastPage: TData) => number | undefined | null;
  
  /**
   * The initial page parameter (defaults to 1).
   */
  initialPageParam?: number;
  
  /**
   * The client component(s) to render.
   */
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  // Prefetch the first page of data on the server
  await queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam,
    getNextPageParam,
  });

  // Pass the dehydrated cache to the client
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}