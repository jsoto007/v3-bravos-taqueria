import React, { useContext, useMemo, useState, useEffect } from "react";
import InventoryContainer from "./InventoryContainer";
import CarScanInventory from "../car/CarScanInventory";
import { CarDataContext } from "../../context/CarDataContextProvider";

function capitalize(word = "") {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function parseNameFromEmail(email = "") {
  const local = (email || "").split("@")[0];
  if (!local) return { first: "", last: "" };
  const parts = local.split(/[._-]+/).filter(Boolean);
  const first = parts[0] ? capitalize(parts[0]) : "";
  const last = parts[1] ? capitalize(parts[1]) : "";
  return { first, last };
}

function toSectionId(label = "") {
  return (
    "loc-" + String(label)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  );
}

export default function UserInventoryContainer() {

    const { carData } = useContext(CarDataContext)
    console.log("CARDATA",carData)

    // Search state with debounce
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
        return () => clearTimeout(id);
    }, [query]);

    // Filter (by debouncedQuery) and group by most recent designated_location
    const groupedByLocation = useMemo(() => {
        if (!Array.isArray(carData)) return [];

        const q = debouncedQuery.toLowerCase();
        const hasQuery = q.length > 0;

        const NO_DESIG_KEY = "__NO_DESIGNATED__";
        const NO_DESIG_LABEL = "Cars with no designated location";

        const groups = new Map();

        for (const car of carData) {
            const historyArr = Array.isArray(car.history) ? car.history : [];

            // Determine most recent history entry by created_at
            let latest = null;
            for (const h of historyArr) {
                if (!h || !h.created_at) continue;
                const t = new Date(h.created_at).getTime();
                if (!Number.isFinite(t)) continue;
                if (!latest || t > new Date(latest.created_at).getTime()) latest = h;
            }

            const designated = latest && typeof latest.designated_location === 'string' && latest.designated_location.trim() !== ''
                ? latest.designated_location.trim()
                : null;

            // Prefer names on the latest history item, then on the car object; finally infer from email
            const userField = (latest?.user ?? car.user ?? null);
            const email = typeof userField === 'string' ? userField : (typeof userField === 'object' ? (userField.email ?? '') : '');

            let f = latest?.first_name ?? latest?.firstname ?? car.first_name ?? car.firstname ?? '';
            let l = latest?.last_name ?? latest?.lastname ?? car.last_name ?? car.lastname ?? '';

            if (!f && !l && email) {
              const parsed = parseNameFromEmail(email);
              f = parsed.first;
              l = parsed.last;
            }

            const scanRow = {
              id: car.id,
              created_at: latest?.created_at ?? car.created_at,
              designated_location: latest?.designated_location ?? null,
              location: (latest && latest.location) ? latest.location : (car.location ?? null),
              // keep both variants for downstream components that may expect one or the other
              first_name: f,
              last_name: l,
              firstname: f,
              lastname: l,
              user: userField ?? null,
              userEmail: email,
              vin: car.vin ?? '',
              make: car.make ?? '',
              year: car.year ?? '',
            };

            // Apply text filter if present
            if (hasQuery) {
                const haystack = [
                  scanRow.vin,
                  String(scanRow.year ?? ''),
                  scanRow.make,
                  scanRow.userEmail,
                  scanRow.user,
                  scanRow.first_name,
                  scanRow.last_name,
                  scanRow.firstname,
                  scanRow.lastname,
                  designated ?? '',
                  scanRow.location ?? '',
                ]
                  .filter(Boolean)
                  .join(' \u2003 ') // thin separators
                  .toLowerCase();
                if (!haystack.includes(q)) continue; // filtered out
            }

            const key = designated ?? NO_DESIG_KEY;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(scanRow);
        }

        // Build ordered array: alphabetical designated locations first, then no-designated at bottom
        const designatedKeys = [...groups.keys()].filter(k => k !== NO_DESIG_KEY).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const ordered = [];
        for (const k of designatedKeys) {
            ordered.push({ onDesignatedLocation: k, scans: groups.get(k) });
        }
        if (groups.has(NO_DESIG_KEY)) {
            ordered.push({ onDesignatedLocation: NO_DESIG_LABEL, scans: groups.get(NO_DESIG_KEY) });
        }
        return ordered;
    }, [carData, debouncedQuery]);

    // Simple summary of counts per group (cars per designated location)
    const groupSummaries = useMemo(() => {
        return groupedByLocation.map(g => ({
            label: g.onDesignatedLocation,
            count: Array.isArray(g.scans) ? g.scans.length : 0,
        }));
    }, [groupedByLocation]);


    return (
        <div className="flex flex-col gap-6 p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg scroll-smooth">
            <InventoryContainer />
            {/* Search Bar */}
            <div className="w-full">
                <label htmlFor="scan-search" className="sr-only">Search scans</label>
                <input
                    id="scan-search"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="🔍 Search by VIN, year, make, user, name, or location..."
                    className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:border-indigo-500/70"
                    autoComplete="off"
                    spellCheck={false}
                />
            </div>
                <h1 className="text-left text-3xl text-slate-900 dark:text-slate-50 font-medium font-sans rounded-xl pt-2 ">Scanned Vehicle Records</h1>
                <p className="text-left text-sm text-slate-600 dark:text-slate-300">
                    Car inventories grouped by location for easy browsing and management.
                </p>
            {/* Group counts summary */}
            {groupSummaries.length > 0 && (
                <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                        {groupSummaries.map(({ label, count }, i) => (
                            <button
                                type="button"
                                key={`${label}-${i}`}
                                onClick={() => {
                                  const id = toSectionId(label);
                                  const el = document.getElementById(id);
                                  if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }}
                                className="inline-flex items-center rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                                title={`${label}: ${count} ${count === 1 ? 'car' : 'cars'}`}
                            >
                                <span className="truncate max-w-[12rem] text-left">{label}</span>
                                <span className="ml-2 inline-flex items-center justify-center rounded-full min-w-6 h-6 text-xs font-semibold bg-indigo-600 text-white px-2">
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        Total cars: {groupSummaries.reduce((sum, g) => sum + g.count, 0)}
                    </div>
                </div>
            )}
            {groupedByLocation.length === 0 ? (
                <div
                    className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1A2235] p-4 text-sm text-slate-700 dark:text-slate-200"
                    aria-live="polite"
                >
                    {debouncedQuery ? (
                        <span>
                            No results for “<span className="font-semibold">{debouncedQuery}</span>”. Try a different VIN, year, make, user, name, or location.
                        </span>
                    ) : (
                        <span>No scanned vehicles to show yet.</span>
                    )}
                </div>
            ) : (
                groupedByLocation.map((group, idx) => (
                  <section
                    key={`${group.onDesignatedLocation}-${idx}`}
                    id={toSectionId(group.onDesignatedLocation)}
                    className="scroll-mt-24"
                    aria-label={`${group.onDesignatedLocation} inventory section`}
                  >
                    <CarScanInventory
                      scanHistory={group.scans}
                      onDesignatedLocation={group.onDesignatedLocation}
                    />
                  </section>
                ))
            )}
        </div>
    )
}
