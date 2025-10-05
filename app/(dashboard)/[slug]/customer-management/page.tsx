import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCustomersWithPropertyCount } from '@/lib/queries/customers';
import { CustomerPageClient } from '@/components/dashbboard/admin/customer-management/CustomerPageClient';
export default async function CustomerManagementPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomersWithPropertyCount({ page: 1 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    pages: 1,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CustomerPageClient />
    </HydrationBoundary>
  );
}

