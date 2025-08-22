import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CarDetails from "./CarDetails"
import CarNotes from "../carNotes/CarNotes"
import CarScanHistory from "./CarScanHistory"

export default function CarContainer() {
    const { id } = useParams();
    const [car, setCar] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        async function fetchCarData() {
            try {
                const response = await fetch(`/api/cars/${id}`)
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setCar(data.car);
                setScanHistory(data.scan_history);
                setNotes(data.notes);
            } catch (error) {
                console.error('Failed to fetch car data:', error);
            }
        }
        fetchCarData();
    }, [id]);

    return (
        <div className="mt-20 text-left">
            <div>
                <h1 className="text-4xl font-bold text-slate-950 dark:text-slate-50">Vehicle Dashboard</h1>
                <h3 className="text-slate-500 dark:text-slate-400 mb-4">
                  Manage car records with full scan history. Add, edit, and delete notes or delete the car entirely.
                </h3>
            </div>
            <CarDetails car={car} setCar={setCar} />
            <CarNotes notes={notes} car={car} />
            <CarScanHistory scanHistory={scanHistory} />
        </div>
    )
}