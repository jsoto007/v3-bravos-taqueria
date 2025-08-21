import React, { useState } from "react";
import CarDetails from "./CarDetails"
import CarNotes from "../carNotes/CarNotes"
import CarScanHistory from "./CarScanHistory"

export default function CarContainer() {

    // Car Scan Vin data
    // Car Notes
    // 

    const [scanHistory, setScanHistory] = useState([
        { id: 1, vin: 'JH4KA8260MC000000', location: 'Main Street Garage', user: 'Mike Johnson', dateTime: '2024-08-17T09:15:00Z' },
        { id: 2, vin: 'JH4KA8260MC000000', location: 'Downtown Service Center', user: 'Sarah Wilson', dateTime: '2024-08-16T16:45:00Z' },
        { id: 3, vin: 'JH4KA8260MC000000', location: 'Downtown Service Center', user: 'Sarah Wilson', dateTime: '2024-08-16T16:45:00Z' },
        { id: 4, vin: 'JH4KA8260MC000000', location: 'Downtown Service Center', user: 'Sarah Wilson', dateTime: '2024-08-16T16:45:00Z' },
        { id: 5, vin: 'JH4KA8260MC000000', location: 'Express Auto Check', user: 'David Brown', dateTime: '2024-08-15T11:30:00Z' },
      ]);


    return (
        <div className="mt-20 text-left">
            <div>
                <h1 className="text-4xl font-bold text-slate-950 dark:text-slate-50">Vehicle Dashboard</h1>
                <h3 className="text-slate-500 dark:text-slate-400 mb-4">
                  Manage car records with full scan history. Add, edit, and delete notes or delete the car entirely.
                </h3>
            </div>
            <CarDetails />
            <CarNotes />
            <CarScanHistory scanHistory={scanHistory} />
        </div>
    )
}