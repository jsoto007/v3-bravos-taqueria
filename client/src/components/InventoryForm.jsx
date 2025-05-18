import { useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContextProvider";

export default function InventoryForm( { 
    vin, 
    setVin, 
    location, 
    setLocation, 
    year, 
    setYear, 
    make, 
    setMake, 
    addCar, 
    cars, 
    submitInventory
} ) {


    return (
        <div className="p-6 max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 shadow-md rounded-md">
                <>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Add Car</h3>
                    <input
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                        placeholder="VIN Number"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        type="number"
                        min="1886"
                        max={new Date().getFullYear()}
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Year"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Make"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <button
                        onClick={addCar}
                        className="w-full py-2 px-4 bg-green-600/80 text-white rounded hover:bg-green-700 transition mb-4"
                    >
                        Add Car
                    </button>
                    <ul className="mb-4 text-gray-700 dark:text-gray-300">
                        {cars.map((car) => (
                            <li key={car.id} className="mb-1">
                                {car.vin_number} - {car.make} ({car.year})
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={submitInventory}
                        className="w-full py-2 px-4 bg-indigo-600/80 text-white rounded hover:bg-indigo-700 transition"
                    >
                        Submit Inventory
                    </button>
                </>
        </div>
    );
}