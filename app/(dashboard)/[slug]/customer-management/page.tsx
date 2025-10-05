import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getCustomersWithPropertyCount, CustomersResponse } from '@/lib/queries/customers';
import { SearchBar } from "@/components/dashbboard/admin/ui/SearchBar";
import { CustomerPageClient } from '@/components/dashbboard/admin/customer-management/CustomerPageClient';

export default async function Page() {
  const queryClient = new QueryClient();

  // Pre-fetch the first page of customer data on the server
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomersWithPropertyCount({ page: 1, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: CustomersResponse) => lastPage.nextPage,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Customer Management
          </h1>
          <SearchBar />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Properties
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              {/* This client component will manage the table and its data */}
              <CustomerPageClient />
            </table>
          </div>
        </div>
      </div>
    </HydrationBoundary>
  );
}
