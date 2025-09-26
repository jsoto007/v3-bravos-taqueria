import React, { useContext, useMemo, useState, useEffect } from "react";
import CompletedInventories from "../completedInventories/CompletedInventories";
import InventoryContainer from "./InventoryContainer";
import CarScanInventory from "../car/CarScanInventory";
import { CarDataContext } from "../../context/CarDataContextProvider";


export default function UserInventoryContainer() {

    const { carData } = useContext(CarDataContext)

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

            // Build a normalized scan row for the child component
            const scanRow = {
                id: car.id,
                created_at: latest?.created_at ?? car.created_at,
                designated_location: latest?.designated_location ?? null,
                location: (latest && latest.location) ? latest.location : (car.location ?? null),
                first_name: car.first_name ?? car.firstname ?? '',
                last_name: car.last_name ?? car.lastname ?? '',
                user: car.user ?? null,
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
                    scanRow.user,
                    scanRow.first_name,
                    scanRow.last_name,
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

    console.log("CarData", carData)

    return (
        <div className="flex flex-col gap-6 p-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg">
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
                <h1 className="text-left text-3xl text-slate-900 dark:text-slate-50 font-medium font-sans rounded-xl pt-2 mt-2">Scanned Vehicle Records</h1>
                <p className="text-left text-sm text-slate-600 dark:text-slate-300">
                    Here is a list of scanned cars. Use the search bar above to quickly find vehicles by VIN, year, make, user, name, or location. You can also click the <span className="font-semibold text-blue-500">+ Car</span> button to scan and add new cars. After the VIN is scanned and decoded, review the vehicle details and click submit to add it to your records.
                </p>
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
                    <CarScanInventory
                        key={`${group.onDesignatedLocation}-${idx}`}
                        scanHistory={group.scans}
                        onDesignatedLocation={group.onDesignatedLocation}
                    />
                ))
            )}
            {/* <CompletedInventories /> */}
        </div>
    )
}
