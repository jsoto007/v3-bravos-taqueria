import React, { useContext, useMemo } from "react";
import CompletedInventories from "../completedInventories/CompletedInventories";
import InventoryContainer from "./InventoryContainer";
import CarScanHistory from "../car/CarScanHistory";
import { CarDataContext } from "../../context/CarDataContextProvider";


export default function UserInventoryContainer() {

    const { carData } = useContext(CarDataContext)

    // Group cars by most recent designated_location (from history),
    // sorting groups alphabetically and placing the "no designated" group last.
    const groupedByLocation = useMemo(() => {
        if (!Array.isArray(carData)) return [];

        const NO_DESIG_KEY = "__NO_DESIGNATED__";
        const NO_DESIG_LABEL = "Cars with no designated location";

        const groups = new Map(); // key -> array of cars

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
            };

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
    }, [carData]);

    console.log("CarData", carData)

    return (
        <div className="flex flex-col gap-6 p-4 bg-white dark:bg-slate-800 rounded-lg">
            <InventoryContainer />
                <h1 className="text-left text-3xl text-neutral-100 font-medium font-sans rounded-xl pt-2 mt-2">Scanned Vehicle Records</h1>
                <p className="text-left text-sm text-neutral-400">
                    Here is a list of scanned cars. Use the search bar to find vehicles by VIN, year, or make. Click the <span className="font-semibold text-blue-500">+ Car</span> button to scan and add new cars. After the VIN is scanned and decoded, review the vehicle details and click submit to add it to your records.
                </p>
            {groupedByLocation.map((group, idx) => (
                <CarScanHistory
                    key={`${group.onDesignatedLocation}-${idx}`}
                    scanHistory={group.scans}
                    onDesignatedLocation={group.onDesignatedLocation}
                />
            ))}
            {/* <CompletedInventories /> */}
        </div>
    )
}
