import { Calendar, MapPin, User } from "lucide-react";

export default function CarScanHistory({ scanHistory }) {


    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }

  return (
    <div className="overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2235] mt-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-auto min-w-full">
          <thead className="bg-slate-400 dark:bg-slate-800">
            <tr>
              <th
                scope="col"
                className="border-b border-slate-300 dark:border-slate-700 bg-slate-400 dark:bg-slate-800 px-3 py-3 text-left text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-50 sm:pl-6"
              >
                Date
              </th>
              <th
                scope="col"
                className="border-b border-slate-300 dark:border-slate-700 bg-slate-400 dark:bg-slate-800 px-3 py-3 text-left text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-50"
              >
                Location
              </th>
              <th
                scope="col"
                className="border-b border-slate-300 dark:border-slate-700 bg-slate-400 dark:bg-slate-800 px-3 py-3 text-left text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-50"
              >
                User
              </th>
              {/* <th
                scope="col"
                className="border-b border-slate-300 dark:border-slate-700 bg-slate-400 dark:bg-slate-800 px-3 py-3 text-left text-xs sm:text-sm font-semibold text-slate-950 dark:text-slate-50"
              >
                Notes
              </th> */}
            </tr>
          </thead>
          <tbody>
            {scanHistory?.map((scan) => (
              <tr key={scan.id} className="even:bg-slate-200 dark:even:bg-slate-800">
                <td className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-4 text-xs sm:text-sm text-slate-950 dark:text-slate-50 sm:pl-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    <time dateTime={scan.created_at}>{formatDateTime(scan.created_at)}</time>
                  </div>
                </td>
                <td className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-4 text-xs sm:text-sm text-slate-950 dark:text-slate-50">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    {scan.location}
                  </div>
                </td>
                <td className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-4 text-xs sm:text-sm text-slate-950 dark:text-slate-50">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    {scan.user}
                  </div>
                </td>
                {/* <td className="whitespace-nowrap border-b border-slate-300 dark:border-slate-700 px-3 py-4 text-xs sm:text-sm text-slate-950 dark:text-slate-50">
                  {scan.notes}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}