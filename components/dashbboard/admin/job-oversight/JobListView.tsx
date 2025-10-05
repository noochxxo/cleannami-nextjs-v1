"use client";
import { cleaners, jobs, JobStatus, properties } from "@/data/adminMockData";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { formatDateTime, getStatusBadge } from "../../utils";
import { Route } from "next";
import Link from "next/link";

type SortDirection = "ascending" | "descending";
type SortableKey =
  | "id"
  | "propertyName"
  | "cleanerName"
  | "status"
  | "scheduledDateTime";

interface SortConfig {
  key: SortableKey;
  direction: SortDirection;
}

export const JobListView = () => {
  const [activeFilter, setActiveFilter] = useState<
    JobStatus | "All" | "Flagged"
  >("All");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const filters: (JobStatus | "All" | "Flagged")[] = [
    "All",
    "Pending",
    "Assigned",
    "In Progress",
    "Awaiting Capture",
    "Canceled",
    "Flagged",
  ];

  const enrichedJobs = useMemo(() => {
    return jobs.map((job) => {
      const property = properties.find((p) => p.id === job.propertyId);
      const cleaner = cleaners.find((c) => c.id === job.cleanerId);
      return {
        ...job,
        propertyName: property?.address || "N/A",
        cleanerName: cleaner?.name || "Unassigned",
      };
    });
  }, []);

  const filteredJobs = useMemo(
    () =>
      enrichedJobs.filter((job) => {
        if (activeFilter === "All") return true;
        if (activeFilter === "Flagged")
          return job.flags.some((f) => !f.resolved);
        return job.status === activeFilter;
      }),
    [enrichedJobs, activeFilter]
  );

  const sortedJobs = useMemo(() => {
    let sortableItems = [...filteredJobs];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredJobs, sortConfig]);

  const requestSort = (key: SortableKey) => {
    let direction: SortDirection = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const headers: { key: SortableKey; label: string }[] = [
    { key: "id", label: "Job ID" },
    { key: "propertyName", label: "Property" },
    { key: "cleanerName", label: "Cleaner" },
    { key: "status", label: "Status" },
    { key: "scheduledDateTime", label: "Scheduled For" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
              activeFilter === filter
                ? "bg-teal-500 text-white shadow"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header.key}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <button
                      onClick={() => requestSort(header.key)}
                      className="flex items-center group focus:outline-none"
                    >
                      {header.label}
                      <span className="ml-2">
                        {sortConfig?.key === header.key ? (
                          sortConfig.direction === "ascending" ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronDownIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedJobs.map((job) => (
                <Link
                  key={job.id} 
                  href={`/admin/job-oversight/${job.id}` as Route}
                  className="table-row hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {job.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.propertyName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.cleanerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                      {job.flags.some((f) => !f.resolved) && (
                        <div className="ml-2 group relative">
                          <TriangleAlertIcon className="h-5 w-5 text-red-500" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(job.scheduledDateTime)}
                  </td>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
        {sortedJobs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No jobs match the current filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
