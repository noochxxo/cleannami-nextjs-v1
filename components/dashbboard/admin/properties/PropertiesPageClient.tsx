'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PropertiesTable } from '@/components/dashbboard/admin/properties/PropertiesTable';
import { PropertiesWithOwner } from '@/lib/queries/properties';
import { createClient } from '@/lib/supabase/client';
import { ConfirmationModal } from '@/components/dashbboard/admin/ui/ConfirmationModal';
import { TriangleAlertIcon } from 'lucide-react';

// Client-safe fetcher for infinite scrolling
async function fetchProperties({ pageParam = 1 }: { pageParam?: number }) {
  const res = await fetch(`/api/properties?page=${pageParam}`);
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json() as Promise<PropertiesWithOwner>;
}

export const PropertiesPageClient = () => {
  const queryClient = useQueryClient();
  const [propertyToDelete, setPropertyToDelete] = useState<PropertiesWithOwner['properties'][number] | null>(null);


  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-properties')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['properties'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  
  const handleDeleteProperty = async () => {
      if (!propertyToDelete) return;
      // Here you would add your API call to delete the property
      console.log("Deleting property:", propertyToDelete.id);
      // Example: await fetch(`/api/properties/${propertyToDelete.id}`, { method: 'DELETE' });
      
      // After deletion, invalidate the query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setPropertyToDelete(null); // Close modal
  }

  const allProperties = data?.pages.flatMap(page => page.properties) ?? [];
  const uniqueProperties = Array.from(new Map(allProperties.map(prop => [prop.id, prop])).values());


  return (
    <div>
        <PropertiesTable properties={uniqueProperties} onDelete={setPropertyToDelete} />

        {/* Pagination Button */}
        <div className="p-4 flex justify-center">
            <button
                onClick={() => fetchNextPage()}
                disabled={!hasNextPage || isFetchingNextPage}
                className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load More' : 'Nothing more to load'}
            </button>
        </div>

        {/* Deletion Confirmation Modal */}
        {propertyToDelete && (
            <ConfirmationModal
                isOpen={!!propertyToDelete}
                onClose={() => setPropertyToDelete(null)}
                onConfirm={handleDeleteProperty}
                title="Delete Property"
                confirmButtonText="Delete"
                confirmButtonClassName="bg-red-600 hover:bg-red-500"
                icon={
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TriangleAlertIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                }
            >
                Are you sure you want to delete the property at <strong>{propertyToDelete.address}</strong>? This action cannot be undone.
            </ConfirmationModal>
        )}
    </div>
  );
};
