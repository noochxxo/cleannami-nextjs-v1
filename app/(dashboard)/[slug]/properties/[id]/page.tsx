import { ArrowDown, ArrowLeftIcon, CheckCircleIcon, ClipboardListIcon, CogIcon, CreditCardIcon, HouseHeart, Pencil } from "lucide-react";
import Link from "next/link";

interface Props {
  propertyId: string;
  onBack: () => void;
}

const Card = ({ icon, title, children, contentPadding = "space-y-4" }: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  contentPadding?: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center mb-4 border-b pb-3">
      <div className="text-gray-500">{icon}</div>
      <h3 className="ml-3 text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className={contentPadding}>{children}</div>
  </div>
);

const PropertyDetails = () => {
 
  

 
  return (
    <div className="space-y-6">
      {/* Header and Back Button */}
      <div>
        <Link
          href='/'
          className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="mr-2 h-5 w-5" />
          Back to Properties List
        </Link>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-900">
            {property.address}
          </h1>
          <p className="text-gray-500 mt-1">Owned by: {owner.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card
            icon={<HouseHeart className="h-6 w-6" />}
            title="Property Vitals"
          >
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Beds</p>
                <p className="text-xl font-bold text-gray-800">
                  {property.beds}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Baths</p>
                <p className="text-xl font-bold text-gray-800">
                  {property.baths}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">SqFt</p>
                <p className="text-xl font-bold text-gray-800">
                  {property.sqft}
                </p>
              </div>
            </div>
          </Card>

          <Card
            icon={<CogIcon className="h-6 w-6" />}
            title="Service Settings"
          >
            <p className="text-sm">
              Hot Tub Service:{" "}
              <span className="font-semibold">
                {property.serviceSettings.hasHotTub ? "Yes" : "No"}
              </span>
            </p>
            <p className="text-sm">
              Laundry Type:{" "}
              <span className="font-semibold">
                {property.serviceSettings.laundryType === "in_unit"
                  ? "In-Unit"
                  : "Off-Site"}
              </span>
            </p>
          </Card>

          <Card icon={<CreditCardIcon />} title="Subscription">
            <p className="text-sm">
              Status:{" "}
              <span className="font-semibold">{subscription.status}</span>
            </p>
            <p className="text-sm">
              Plan:{" "}
              <span className="font-semibold">{subscription.planName}</span>
            </p>
            <p className="text-sm">
              Renews:{" "}
              <span className="font-semibold">{subscription.renewalDate}</span>
            </p>
            <div className="flex gap-2 pt-2">
              <button className="flex-1 text-sm py-2 px-4 rounded-md bg-yellow-500 text-white hover:bg-yellow-600">
                Pause
              </button>
              <button className="flex-1 text-sm py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700">
                Cancel
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card
            icon={<ClipboardListIcon />}
            title="Checklist Management"
            contentPadding="p-0"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">
                      Version
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">
                      Uploaded
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">
                      File
                    </th>
                    <th className="px-4 py-2 text-center font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checklistHistory.map((item) => (
                    <tr
                      key={item.version}
                      className={item.active ? "bg-teal-50" : ""}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="flex items-center">
                          v{item.version}
                          {item.active && (
                            <CheckCircleIcon
                              className="h-4 w-4 ml-2 text-green-600"
                              title="Active Version"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.uploadDate}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.fileName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center space-x-3">
                          <button
                            title="Download"
                            className="text-gray-400 hover:text-teal-600"
                          >
                            <ArrowDown />
                          </button>
                          {!item.active && (
                            <button
                              onClick={() =>
                                handleSetActiveVersion(item.version)
                              }
                              title="Set as Active"
                              className="text-gray-400 hover:text-teal-600"
                            >
                              <Pencil />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
