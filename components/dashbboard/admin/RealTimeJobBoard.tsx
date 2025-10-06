"use client";

import { Fragment, useEffect, useState } from "react"; // Import useState
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { Route } from "next";

import { CalendarSyncButton } from "@/components/dashbboard/layout/ui/CalendarSyncButton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { JobsWithDetails } from "@/lib/queries/jobs"; // Only importing the TYPE
import { createClient } from "@/lib/supabase/client";
import { GetJobsResponse } from "@/app/api/jobs/route";
import { formatDate } from "date-fns";
import { GetJobStatsResponse } from "@/app/api/jobs/stats/route";

// --- (Your existing KPI components and data can remain unchanged) ---
interface Kpi {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
}
{
  /* <div>Showing {allJobs.length} of {data?.pages[0]?.total} jobs</div> */
}
const kpiData: Kpi[] = [
  { title: "Jobs Today", value: "42", change: "+12%", changeType: "increase" },
  {
    title: "Weekly Revenue",
    value: "$12,450",
    change: "+5.2%",
    changeType: "increase",
  },
  {
    title: "Disputes Rate",
    value: "1.2%",
    change: "-0.5%",
    changeType: "decrease",
  },
  {
    title: "Cleaner Reliability",
    value: "98.5%",
    change: "+0.2%",
    changeType: "increase",
  },
];

const KpiCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "assigned":
      return "bg-yellow-100 text-yellow-800";
    case "unassigned":
      return "bg-gray-100 text-gray-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

/**
 * A client-safe function to fetch a page of jobs from our API route.
 */
// For JobListView - Update to use real data
async function fetchJobs({ pageParam = 1 }: { pageParam: number }) {
  const res = await fetch(`/api/jobs?page=${pageParam}`);
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  const result: GetJobsResponse = await res.json();
  return {
    jobs: result.data,
    nextPage: result.nextPage,
  };
}

/**
 * FIX: New component to safely render time on the client, avoiding hydration mismatches.
 */
const ClientTime = ({
  dateString,
}: {
  dateString: string | null | undefined;
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !dateString) {
    return <span>N/A</span>; // Render a placeholder on the server and initial client render
  }

  // This will only run on the client after mounting
  const time = new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return <span>{time}</span>;
};

export const RealTimeJobBoard = () => {
  const { data: user } = useCurrentUser();
  const isAdmin =
    user?.user_metadata.role === "admin" ||
    user?.user_metadata.role === "super_admin";

  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["jobs", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/jobs/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json() as Promise<GetJobStatsResponse>;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Use the useInfiniteQuery hook for pagination
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Real-time subscription logic remains the same.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-jobs-board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
          queryClient.invalidateQueries({ queryKey: ["jobs", "stats"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs_to_cleaners" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["jobs"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Flatten all pages into a single array
  const allJobs = data?.pages.flatMap((page) => page.jobs) ?? [];
  // FIX: De-duplicate the array to prevent React key errors during real-time updates
  const uniqueJobs = Array.from(
    new Map(
      allJobs.filter((job) => job != null).map((job) => [job.id, job])
    ).values()
  );

  return (
    <>
      {isAdmin && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats && (
              <>
                <KpiCard title="Total Jobs" value={stats.totalJobs.toString()} /> 
                <KpiCard title="Active Jobs" value={stats.totalActive.toString()} /> 
                <KpiCard title="Today's check-in Schedule" value={stats.totalToday.toString()} /> 
                <KpiCard title="Completed" value={stats.totalCompleted.toString()} /> 
                <KpiCard title="Canceled" value={stats.totalCanceled.toString()} />
              </>
            )}
          </div>

          {/* Real-time Job Board */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Real-Time Job Board
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Job ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Property
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Cleaners
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Due By
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {status === "pending" ? (
                      <tr>
                        <td colSpan={6} className="text-center p-4">
                          Loading jobs...
                        </td>
                      </tr>
                    ) : status === "error" ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center p-4 text-red-500"
                        >
                          Error: {error.message}
                        </td>
                      </tr>
                    ) : (
                      <>
                        {uniqueJobs.map((job) => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                              {job.id.substring(0, 8)}...
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {job.property?.address ?? "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {job.assignedCleaners.length > 0
                                ? // FIX: Added an explicit type to the 'c' parameter to resolve the 'any' type error.
                                  job.assignedCleaners
                                    .map(
                                      (
                                        // c: JobsWithDetails[number]["cleaners"][number]
                                        c: JobsWithDetails["data"][number]["assignedCleaners"][number]
                                      ) => c.fullName
                                    )
                                    .join(", ")
                                : "Unassigned"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                                  job.status || ""
                                )}`}
                              >
                                {job.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {/* FIX: Use the client-safe component to render the time */}
                              {job.checkInTime ? (
                                <ClientTime
                                  dateString={formatDate(
                                    job.checkInTime,
                                    "yyyy-MM-dd"
                                  )}
                                />
                              ) : (
                                <span>N/A</span> // or null, or "—", etc.
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                href={`/admin/job-oversight/${job.id}` as Route}
                                className="text-teal-600 hover:text-teal-900"
                              >
                                Details
                              </Link>
                              <CalendarSyncButton />
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Button */}
              <div className="p-4 flex justify-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={!hasNextPage || isFetchingNextPage}
                  className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isFetchingNextPage
                    ? "Loading more..."
                    : hasNextPage
                    ? "Load More"
                    : "Nothing more to load"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
