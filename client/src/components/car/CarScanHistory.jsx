import { useState } from "react";
import { Calendar, MapPin, User } from "lucide-react";

export default function CarScanHistory({ scanHistory }) {

    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    // State for toggling location display per scan row
    const [toggledIds, setToggledIds] = useState({});

    function toggleLocation(id) {
      setToggledIds(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }

    function getSortedHistory(history) {
      return history
        ?.slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

  return (
    <div className="rounded-t-2xl overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2235] mt-6">
      <div className="h-1 w-[97%] md:w-[99%] mx-auto bg-gradient-to-r from-indigo-800 to-cyan-400 rounded-t-2xl"></div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-auto min-w-full">
          <thead className="bg-slate-300/70 dark:bg-slate-800">
            <tr>
              <th
                scope="col"
                className="border-b border-slate-300 dark:border-slate-700 bg-slate-100/10 dark:bg-slate-800 px-3 py-3 text-left text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-50 sm:pl-6"
              >
                Date
              </th>
              <th
                scope="col"
                className="border-b border-slate-300 dark:border-slate-700 bg-slate-100/10 dark:bg-slate-800 px-3 py-3 text-left text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-50"
              >
                Location
              </th>
              <th
                scope="col"
                className="border-b border-slate-300 dark:border-slate-700 bg-slate-100/10 dark:bg-slate-800 px-3 py-3 text-left text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-50"
              >
                User
              </th>
            </tr>
          </thead>
          <tbody>
            {getSortedHistory(scanHistory)?.map((scan) => (
              <tr key={scan.id} className="even:bg-slate-200 dark:even:bg-slate-800">
                <td className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-4 text-xs sm:text-sm text-slate-950 dark:text-slate-50 sm:pl-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    <time dateTime={scan.created_at}>{formatDateTime(scan.created_at)}</time>
                  </div>
                </td>
                <td className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-4 text-xs sm:text-sm text-slate-950 dark:text-slate-50">
                  <div className="flex items-center gap-1">
                    <MapPin
                      onClick={() => toggleLocation(scan.id)}
                      className={`h-4 w-4 flex-shrink-0 cursor-pointer mr-1 ${
                        toggledIds[scan.id] || !scan.designated_location
                          ? "text-yellow-300 dark:text-yellow-600"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    />
                    {toggledIds[scan.id]
                      ? scan.location
                      : scan.designated_location || scan.location}
                  </div>
                </td>
                <td className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-4 text-xs sm:text-sm text-slate-950 dark:text-slate-50">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    {scan.first_name} {scan.last_name}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}