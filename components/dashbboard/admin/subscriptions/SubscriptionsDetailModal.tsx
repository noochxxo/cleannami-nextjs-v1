import { CalendarDaysIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { SubscriptionsWithDetails } from "@/lib/queries/subscriptions";
import { Subscription } from "@/db/schemas";

// Define the props for our component using the query response type
interface SubscriptionModalProps {
  subscription: SubscriptionsWithDetails['subscriptions'][number];
  onClose: () => void;
  onUpdate: (subscription: Subscription) => void;
}

// A simple, reusable toggle switch component
const ToggleSwitch = ({
  label,
  enabled,
  onChange,
}: {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      type="button"
      className={`${
        enabled ? "bg-teal-600" : "bg-gray-200"
      } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        className={`${
          enabled ? "translate-x-6" : "translate-x-1"
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
      />
    </button>
  </div>
);

export const SubscriptionDetailModal = ({
  subscription,
  onClose,
  onUpdate,
}: SubscriptionModalProps) => {
  // Use a more specific type for the local state, including UI-specific fields
  const [localSub, setLocalSub] = useState({ ...subscription, autoRenew: true });
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    // The parent's onUpdate function expects the core Subscription type
    onUpdate(localSub);
  };

  const handleStatusChange = (newStatus: 'active' | 'expired' | 'canceled' | 'pending') => {
    setLocalSub((prev) => ({ ...prev, status: newStatus }));
  };

  const handleCancelSubscription = () => {
    handleStatusChange("canceled");
    setLocalSub((prev) => ({ ...prev, autoRenew: false }));
    setIsConfirmingCancel(false);
  };

  const ActionButton = ({
    onClick, text, className, disabled,
  }: { onClick: () => void; text: string; className: string; disabled?: boolean; }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {text}
    </button>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        aria-modal="true" role="dialog"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Manage Subscription</h2>
              <p className="text-sm text-gray-500">{subscription.property?.address ?? 'N/A'}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon /></button>
          </div>

          <div className="p-8 overflow-y-auto flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <CreditCardIcon className="h-5 w-5 mr-3 text-gray-400" /> Plan:{" "}
                <span className="font-semibold ml-2">{localSub.durationMonths} Month Term</span>
              </div>
              <div className="flex items-center text-sm">
                <CalendarDaysIcon className="h-5 w-5 mr-3 text-gray-400" /> Renews on:{" "}
                <span className="font-semibold ml-2">{new Date(localSub.startDate).toLocaleDateString()}</span>
              </div>
              {localSub.isFirstCleanPrepaid && (
                <div className="flex items-center text-sm">
                  <CheckCircleIcon className="h-5 w-5 mr-3 text-green-500" />
                  <span className="font-semibold text-green-700">Prepaid Term</span>
                </div>
              )}
               {/* Assuming 'paused' is a possible status, otherwise this logic can be removed */}
              {localSub.status === "pending" && (
                <div className="flex items-center text-sm">
                  <ClockIcon className="h-5 w-5 mr-3 text-yellow-500" />
                  <span className="font-semibold text-yellow-700">Subscription is Paused</span>
                </div>
              )}
            </div>

            <ToggleSwitch
              label="Auto-renew at end of term"
              enabled={localSub.autoRenew}
              onChange={(enabled) => setLocalSub((prev) => ({ ...prev, autoRenew: enabled }))}
            />

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3">Actions</h3>
              <div className="space-y-3">
                 {/* This logic assumes 'paused' is a status. Adjust if needed based on your business logic. */}
                {localSub.status === "active" && (
                  <ActionButton onClick={() => handleStatusChange("pending")} text="Pause Subscription" className="bg-yellow-500 hover:bg-yellow-600" />
                )}
                {localSub.status === "pending" && (
                  <ActionButton onClick={() => handleStatusChange("active")} text="Resume Subscription" className="bg-green-600 hover:bg-green-700" />
                )}
                {localSub.status !== "canceled" && (
                  <ActionButton onClick={() => setIsConfirmingCancel(true)} text="Cancel Subscription" className="bg-red-600 hover:bg-red-700" />
                )}
                {localSub.status === "canceled" && (
                  <p className="text-sm text-center text-red-700 font-medium bg-red-50 p-3 rounded-md">This subscription is canceled.</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end items-center space-x-3">
            <button onClick={onClose} className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 text-white bg-teal-500 rounded-lg hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-300 text-sm font-medium">Save Changes</button>
          </div>
        </div>
      </div>

      {isConfirmingCancel && (
        <ConfirmationModal
          isOpen={isConfirmingCancel}
          onClose={() => setIsConfirmingCancel(false)}
          onConfirm={handleCancelSubscription}
          title="Cancel Subscription"
        >
          Are you sure you want to cancel the subscription for{" "}
          <strong>{subscription.property?.address}</strong>? This action will take
          effect at the end of the current term and cannot be undone.
        </ConfirmationModal>
      )}
    </>
  );
};

export default SubscriptionDetailModal;
