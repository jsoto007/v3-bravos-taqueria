import React from "react";
import CompletedInventories from "../completedInventories/CompletedInventories";
import InventoryContainer from "./InventoryContainer";


export default function UserInventoryContainer() {

    return (
        <div className="flex flex-col gap-6 p-4 bg-white dark:bg-slate-800 rounded-lg">
            <InventoryContainer />
                <h1 className="text-left text-3xl text-nuetral-100 font-medium font-sans rounded-xl pt-2 mt-2">Scanned Vehicle Records</h1>
                <p className="text-left text-sm text-neutral-400">
                    Here is a list of scanned cars. Use the search bar to find vehicles by VIN, year, or make. Click the <span className="font-semibold text-blue-500">+ Car</span> button to scan and add new cars. After the VIN is scanned and decoded, review the vehicle details and click submit to add it to your records.
                </p>
            <CompletedInventories />
        </div>
    )
}