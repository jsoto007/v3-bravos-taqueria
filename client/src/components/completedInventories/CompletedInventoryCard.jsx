import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CarDataContext } from "../../context/CarDataContextProvider";
import { UserContext } from "../../context/UserContextProvider";


export default function CompletedInventoryCard() {
  const { carData } = useContext(CarDataContext);
  const { currentUser } = useContext(UserContext);
  const [searchTerm, setSearchTerm] = useState("");

  const [recentlyAdded, setRecentlyAdded] = useState({}); // { [carId]: true }
  const prevIdsRef = useRef(new Set());
  const didInitRef = useRef(false);
  const highlightTimersRef = useRef([]);
  const prevLatestRef = useRef(new Map()); // id -> latestCreatedAt (ms)

  const navigate = useNavigate();

  useEffect(() => {
    if (!Array.isArray(carData)) return;

    // Build maps for current snapshot
    const currIds = new Set();
    const currLatest = new Map(); // id -> latest created_at (ms)

    for (const c of carData) {
      currIds.add(c.id);
      const latestMs = Array.isArray(c.history)
        ? c.history.reduce((acc, h) => {
            const t = Date.parse(h.created_at);
            return isNaN(t) ? acc : Math.max(acc, t);
          }, 0)
        : 0;
      currLatest.set(c.id, latestMs);
    }

    const fiveMinutesMs = 5 * 60 * 1000;
    const now = Date.now();

    // Skip highlighting on first load (prevents green on reload)
    if (!didInitRef.current) {
      didInitRef.current = true;
      prevIdsRef.current = currIds;
      prevLatestRef.current = currLatest;
      return;
    }

    const prevIds = prevIdsRef.current;
    const prevLatest = prevLatestRef.current;
    const toHighlight = [];

    // 1) New cars added since last render
    for (const id of currIds) {
      if (!prevIds.has(id)) {
        const latestMs = currLatest.get(id) || 0;
        if (latestMs && (now - latestMs) <= fiveMinutesMs) {
          toHighlight.push(id);
        }
      }
    }

    // 2) Existing cars whose most recent scan (history) advanced
    for (const [id, latestMs] of currLatest.entries()) {
      const prevMs = prevLatest.get(id) || 0;
      if (latestMs > prevMs && (now - latestMs) <= fiveMinutesMs) {
        toHighlight.push(id);
      }
    }

    if (toHighlight.length > 0) {
      setRecentlyAdded((prev) => {
        const next = { ...prev };
        toHighlight.forEach((id) => (next[id] = true));
        return next;
      });

      toHighlight.forEach((id) => {
        const tid = setTimeout(() => {
          setRecentlyAdded((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }, 45 * 1000);
        highlightTimersRef.current.push(tid);
      });
    }

    // Update snapshots for next comparison
    prevIdsRef.current = currIds;
    prevLatestRef.current = currLatest;

    return () => {
      // Clear any pending highlight timers
      highlightTimersRef.current.forEach((tid) => clearTimeout(tid));
      highlightTimersRef.current = [];
    };
  }, [carData]);

  const events = carData
  ? carData.flatMap(({ vin, history, id }) =>
      history.map(({ created_at, location, user, firstname, lastname, designated_location }) => ({
        vin,
        id,
        user,
        location,
        created_at,
        firstname,
        lastname,
        designated_location,
      }))
    )
  : [];

  const latestByVin = new Map();
  events.forEach((event) => {
    const existing = latestByVin.get(event.vin);
    if (!existing || new Date(event.created_at) > new Date(existing.created_at)) {
      latestByVin.set(event.vin, event);
    }
  });

  const latestEvents = Array.from(latestByVin.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const filteredEvents = latestEvents.filter(({ vin, year, make }) => {
    const term = searchTerm.toLowerCase();
    return (
      vin.toLowerCase().includes(term) ||
      (year && year.toString().includes(term)) ||
      (make && make.toLowerCase().includes(term))
    );
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 outline outline-white/15 rounded-t-lg rounded-b-xl overflow-hidden">
      <div className="p-4">
        <input
          type="text"
          placeholder="🔍 Search by VIN, year, or make"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      <div className="overflow-y-auto max-h-[400px] sm:max-h-[500px]">
        <div className="overflow-x-auto">
          <table className="min-w-max w-full text-left font-mono divide-y-6 divide-gray-300 dark:divide-gray-700 whitespace-nowrap">
            <thead>
              <tr>
                <th className="px-4 py-2 whitespace-nowrap">VIN</th>
                <th className="px-4 py-2 whitespace-nowrap">Location</th>
                <th className="px-4 py-2 whitespace-nowrap">User</th>
                <th className="px-4 py-2 whitespace-nowrap">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-200/30">
              {filteredEvents.map((item) => {
                const addressParts = item.location?.split(" ") || [];
                const number = addressParts[0] || "";
                const street = addressParts.slice(1, 3).join(" ") || "";
              return (
                <tr
                  key={item.id}
                  onClick={() => {
                    if (currentUser?.admin) {
                      navigate(`/cars/${item.id}`);
                    }
                  }}
                  className={`${currentUser?.admin ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700" : ""} ${recentlyAdded[item.id] ? "bg-green-50 dark:bg-green-900/30" : ""}`}
                >
                  <td className={`px-4 py-2 whitespace-nowrap ${
                      !item.designated_location
                        ? "border-l-4 border-l-yellow-300 dark:border-l-yellow-600"
                        : ""
                    }`}>{item.vin}</td>

                  <td
                    className='px-4 py-2 whitespace-nowrap'
                  >
                    {item.designated_location ? item.designated_location : `${number} ${street}`}
                  </td>

                  <td className="px-4 py-2 whitespace-nowrap">{item.firstname} {item.lastname}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(item.created_at)}</td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}