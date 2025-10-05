'use client'
import { CustomerDetails } from '@/lib/queries/customerQueries';
import { useEffect, useState } from 'react';

// A small, dedicated component to safely render dates on the client
const SafeClientDate = ({ date }: { date: string | null | undefined }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (date) {
            setFormattedDate(new Date(date).toLocaleDateString());
        }
    }, [date]);

    return <>{formattedDate}</>;
}


// The component now accepts payment history data as a prop
// interface PaymentHistoryProps {
//     payments: CustomerDetails['paymentHistory'];
// }
export const PaymentHistory = () => {
  return (
    <tbody className="divide-y">
      
        <tr>
            <td colSpan={4} className="text-center p-4 text-gray-500">No payment history found.</td>
        </tr>
      
    </tbody>
  );
};
