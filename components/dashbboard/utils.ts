import { JobStatus } from "@/data/adminMockData";

export const formatDateTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusBadge = (status: JobStatus) => {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Awaiting Capture":
      return "bg-yellow-100 text-yellow-800";
    case "Pending":
      return "bg-gray-100 text-gray-800";
    case "Assigned":
      return "bg-indigo-100 text-indigo-800";
    case "Paid Out":
      return "bg-green-100 text-green-800";
    case "Canceled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};