import { CustomerDetails } from "@/lib/queries/customerQueries";

// The component now accepts the list of properties as a prop
interface CustomerPropertiesProps {
  properties: CustomerDetails['properties'];
}

// FIX: Provide a default empty array to handle the case where 'properties' is undefined.
interface CustomerPropertiesProps {
  properties: CustomerDetails['properties'];
}

export const CustomerProperties = ({ properties = [] }: CustomerPropertiesProps) => {
  return (
    <ul className="space-y-2">
      {properties.length > 0 ? (
        properties.map((p) => (
          <li key={p.id} className="text-sm text-gray-700">
            {p.address}
          </li>
        ))
      ) : (
        <p className="text-sm text-gray-500">No properties found.</p>
      )}
    </ul>
  );
};