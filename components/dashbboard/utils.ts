import { JobStatus } from "@/data/adminMockData";

export const formatDateTime = (isoString: string) => {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  // getMonth() is 0-indexed, so we add 1. Pad with '0' if it's a single digit.
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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