'use client';
import { CustomerDetails } from '@/lib/queries/customerQueries';
import { useEffect, useState } from 'react';

// A small, dedicated component to safely render dates on the client
const SafeClientDate = ({ date }: { date: Date | null | undefined }) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (date) {
            setFormattedDate(new Date(date).toLocaleDateString());
        }
    }, [date]);

    return <>{formattedDate}</>;
}

// The component now accepts jobs as a prop
interface JobHistoryProps {
  jobs: CustomerDetails['jobs'];
}

export const JobHistory = ({ jobs = [] }: JobHistoryProps) => {
  return (
    <tbody className="divide-y">
      {jobs.length > 0 ? (
        jobs.map((job) => (
          <tr key={job.id}>
            <td className="px-4 py-2 font-mono text-xs">{job.id.substring(0,8)}...</td>
            <td className="px-4 py-2">{job.property?.address ?? 'N/A'}</td>
            <td className="px-4 py-2">
              <SafeClientDate date={job.checkInTime} />
            </td>
            <td className="px-4 py-2">{job.status}</td>
          </tr>
        ))
      ) : (
         <tr>
            <td colSpan={4} className="text-center p-4 text-gray-500">No job history found.</td>
        </tr>
      )}
    </tbody>
  );
};

