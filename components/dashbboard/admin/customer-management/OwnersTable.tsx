import { Route } from "next";
import Link from "next/link";
import React from "react";
import { CustomersResponse } from "@/lib/queries/customers"; // Import the response type

// Define the props for the component
interface OwnersTableProps {
  owners: CustomersResponse['customers'];
}

export const OwnersTable = ({ owners }: OwnersTableProps) => {
  return (
    <tbody className="divide-y">
      {owners.map((owner) => (
        <tr key={owner.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="font-medium text-gray-900">{owner.name}</div>
            <div className="text-sm text-gray-500">{owner.id}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
            {owner.propertyCount}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <Link
              href={`/admin/customer-management/${owner.id}` as Route}
              className="text-teal-600 hover:text-teal-900"
            >
              View Details
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  );
};
