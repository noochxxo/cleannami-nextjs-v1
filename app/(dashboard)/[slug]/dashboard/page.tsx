import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getJobsWithDetails } from '@/lib/queries/jobs';
import { RealTimeJobBoard } from "@/components/dashbboard/admin/RealTimeJobBoard";

export default async function Page() {
  const queryClient = new QueryClient();

  // 1. Prefetch the FIRST page of data on the server
  await queryClient.prefetchInfiniteQuery({
    queryKey: ['jobs'],
    queryFn: () => getJobsWithDetails({ page: 1 }),
    initialPageParam: 1,
  });

  // 2. Pass the dehydrated cache to the client
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <RealTimeJobBoard />    
    </HydrationBoundary>
  );
};

