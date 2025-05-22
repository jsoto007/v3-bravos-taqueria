import { useEffect, useState } from 'react';

export default function InventoryForm( { 
    location, 
    addCar, 
    cars, 
    submitInventory,
    decodedVin
} ) {

    const [justAddedId, setJustAddedId] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(true);

    useEffect(() => {
        if (cars.length > 0) {
            const lastCar = cars[cars.length - 1];
            setJustAddedId(lastCar.id);
            const timer = setTimeout(() => setJustAddedId(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [cars]);

    useEffect(() => {
        if (location) {
            setLoadingLocation(false);
        }
    }, [location]);

    return (
        <div className="p-6 max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 shadow-md rounded-md">
                <>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Add Car</h3>
                    <input
                        value={decodedVin?.vin}
                        placeholder="VIN Number"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        value={loadingLocation ? 'Getting location...' : location}
                        readOnly
                        placeholder="Location"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 italic"
                    />
                    <input
                        type="number"
                        min="1886"
                        max={new Date().getFullYear()}
                        value={decodedVin?.info?.modelYear}
                        placeholder="Year"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        value={decodedVin?.info?.manufacturer}
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
                            <li
                                key={car.id}
                                className={`mb-1 rounded-md ${car.id === justAddedId ? 'bg-green-200/30 dark:bg-green-900' : ''}`}
                            >
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
