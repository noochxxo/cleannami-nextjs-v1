"use client";

import { useMemo, useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { OwnersTable } from "@/components/dashbboard/admin/customer-management/OwnersTable";
import { CustomersResponse } from "@/lib/queries/customers";
import { createClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/dashbboard/admin/ui/SearchBar"; 

// Client-safe fetcher
async function fetchCustomers({ pageParam = 1 }: { pageParam: number }) {
  const res = await fetch(`/api/customers?page=${pageParam}`);
  if (!res.ok) {
    throw new Error("Network response was not ok");
  }
  return res.json() as Promise<CustomersResponse>;
}

export function CustomerPageClient() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime-customers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          // Invalidate customers if a property is added/removed to update the count
          queryClient.invalidateQueries({ queryKey: ["customers"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const allCustomers = useMemo(
    () => data?.pages.flatMap((page) => page.customers) ?? [],
    [data]
  );

  const filteredCustomers = useMemo(
    () =>
      allCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allCustomers, searchTerm]
  );

  if (status === "pending") return <p>Loading customers...</p>;
  if (status === "error") return <p>Error: {error.message}</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Customer Management
        </h1>
        {/* <SearchBar onSearch={setSearchTerm} /> */}
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
            <OwnersTable owners={filteredCustomers} />
          </table>
        </div>
        <div className="p-4 flex justify-center">
          <button
            onClick={() => fetchNextPage()}
            disabled={!hasNextPage || isFetchingNextPage}
            className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400"
          >
            {isFetchingNextPage
              ? "Loading..."
              : hasNextPage
              ? "Load More"
              : "No more customers"}
          </button>
        </div>
      </div>
    </div>
  );
}
