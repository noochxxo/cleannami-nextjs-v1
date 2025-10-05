import { Route } from "next";
import Link from "next/link";
import { CustomersResponse } from "@/lib/queries/customers";

// The component now accepts the list of owners (customers) as a prop
interface OwnersTableProps {
  owners: CustomersResponse['customers'];
}

export const OwnersTable = ({ owners = [] }: OwnersTableProps) => {
  return (
    <tbody className="divide-y">
      {/* FIX: Explicitly type the 'owner' parameter to resolve the implicit 'any' error. */}
      {owners.map((owner: CustomersResponse['customers'][number]) => (
        <tr key={owner.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="font-medium text-gray-900">{owner.name}</div>
            <div className="text-sm text-gray-500 font-mono">{owner.id.substring(0,8)}...</div>
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

