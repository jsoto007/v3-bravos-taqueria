import { useMemo, useState } from "react";
import { Calendar, MapPin, User } from "lucide-react";

export default function CarScanInventory({ scanHistory, onDesignatedLocation }) {


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

    const [toggledIds, setToggledIds] = useState({});

    function toggleLocation(id) {
      setToggledIds(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    }


    const latestEvents = useMemo(() => {
      if (!Array.isArray(scanHistory)) return [];


      const events = scanHistory.flatMap((row) => {
        if (Array.isArray(row?.history) && row.history.length) {
          return row.history.map((h) => ({
            vin: row.vin,
            id: row.id,
            user: h.user ?? row.user ?? null,
            location: h.location ?? row.location ?? null,
            created_at: h.created_at ?? row.created_at,
            firstname: h.firstname ?? row.first_name ?? row.firstname ?? '',
            lastname:  h.lastname  ?? row.last_name  ?? row.lastname  ?? '',
            designated_location: h.designated_location ?? row.designated_location ?? null,
          }));
        }
        return [{
          vin: row.vin,
          id: row.id,
          user: row.user ?? null,
          location: row.location ?? null,
          created_at: row.created_at,
          firstname: row.first_name ?? row.firstname ?? '',
          lastname:  row.last_name  ?? row.lastname  ?? '',
          designated_location: row.designated_location ?? null,
        }];
      });

      const byVin = new Map();
      for (const ev of events) {
        if (!ev?.vin) continue;
        const prev = byVin.get(ev.vin);
        if (!prev || new Date(ev.created_at) > new Date(prev.created_at)) {
          byVin.set(ev.vin, ev);
        }
      }

      return Array.from(byVin.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [scanHistory]);

    const totalUniqueVINs = useMemo(() => {
      if (!Array.isArray(scanHistory)) return 0;
      const vins = new Set();
      for (const row of scanHistory) {
        if (row?.vin) vins.add(row.vin);
      }
      return vins.size;
    }, [scanHistory]);

  return (
    <div className="rounded-t-2xl overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2235] mt-6">
      <div className="h-1 w-[97%] md:w-[99%] mx-auto bg-gradient-to-r from-indigo-800 to-cyan-400 rounded-t-2xl"></div>

      <h2 className="text-2xl font-bold mb-3 ml-2 mt-2 text-slate-950 dark:text-slate-50 flex items-center justify-between gap-2">
        <span>{onDesignatedLocation ? onDesignatedLocation : "Scan History"}</span>
        <span className="text-base sm:text-lg font-semibold px-3 py-1 mr-2 rounded-md bg-slate-200/40 dark:bg-slate-700/30 text-slate-900 dark:text-slate-100">
          Count: {totalUniqueVINs}
        </span>
      </h2>
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
        <table className="w-full border-collapse table-auto min-w-full">
          <thead className="bg-slate-300/70 dark:bg-slate-800 sticky top-0 z-10">
            <tr>
              <th
                scope="col"
                className="px-4 py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 bg-slate-100/10 dark:bg-slate-800 text-left text-sm sm:text-base font-semibold text-slate-950 dark:text-slate-50"
              >
                VIN
              </th>
              <th
                scope="col"
                className="px-4 py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 bg-slate-100/10 dark:bg-slate-800 text-left text-sm sm:text-base font-semibold text-slate-950 dark:text-slate-50"
              >
                Location
              </th>
              <th
                scope="col"
                className="px-4 py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 bg-slate-100/10 dark:bg-slate-800 text-left text-sm sm:text-base font-semibold text-slate-950 dark:text-slate-50"
              >
                User
              </th>
              <th
                scope="col"
                className="px-4 py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 bg-slate-100/10 dark:bg-slate-800 text-left text-sm sm:text-base font-semibold text-slate-950 dark:text-slate-50"
              >
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {latestEvents.map((scan) => (
              <tr key={scan.id} className="even:bg-slate-200 dark:even:bg-slate-800">
                <td className="py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 text-sm sm:text-base text-slate-950 dark:text-slate-50">
                  <span className="font-mono tracking-tight select-all">{scan.vin || '\u2014'}</span>
                </td>

                <td className="px-4 py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 text-sm sm:text-base text-slate-950 dark:text-slate-50">
                  <div className="flex items-center gap-1">
                    <MapPin
                      onClick={() => toggleLocation(scan.id)}
                      className={`h-4 w-4 flex-shrink-0 cursor-pointer mr-1 ${
                        toggledIds[scan.id] || !scan.designated_location
                          ? 'text-yellow-300 dark:text-yellow-600'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    />
                    {!scan.designated_location
                      ? (toggledIds[scan.id] ? 'No designated location' : scan.location)
                      : (toggledIds[scan.id] ? scan.location : scan.designated_location)}
                  </div>
                </td>

                <td className="px-4 py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 text-sm sm:text-base text-slate-950 dark:text-slate-50">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    {scan.firstname} {scan.lastname}
                  </div>
                </td>

                <td className="px-4 py-2 whitespace-nowrap border-b border-slate-300 dark:border-slate-700 text-sm sm:text-base text-slate-950 dark:text-slate-50">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                    <time dateTime={scan.created_at}>{formatDateTime(scan.created_at)}</time>
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
