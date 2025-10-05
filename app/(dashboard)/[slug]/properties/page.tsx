import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { getPropertiesWithOwner, PropertiesWithOwner } from '@/lib/queries/properties'; 
import { SearchBar } from "@/components/dashbboard/admin/ui/SearchBar";
import { PlusIcon } from "lucide-react";
import { PropertiesPageClient } from '@/components/dashbboard/admin/properties/PropertiesPageClient';

export default async function Page() {
  const queryClient = new QueryClient();

  // Pre-fetch the first page of data
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['properties'],
    queryFn: () => getPropertiesWithOwner({ page: 1, limit: 10 }),
    initialPageParam: 1,
    // FIX: Add the explicit type for the 'lastPage' parameter
    getNextPageParam: (lastPage: PropertiesWithOwner) => lastPage.nextPage,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="space-y-6">
        {/* Header and Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <SearchBar />
          <button className="w-full md:w-auto flex items-center justify-center bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all duration-300">
            <PlusIcon className="mr-2 h-5 w-5" />
            Add Property
          </button>
        </div>

        {/* Client component handles the table and all interactions */}
        <PropertiesPageClient />
      </div>
    </HydrationBoundary>
  );
};

