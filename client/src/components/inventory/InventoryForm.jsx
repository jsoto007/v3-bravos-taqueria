import { useEffect, useState } from 'react';
import ActionBtn from '../../shared/ActionBtn';

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
            const timer = setTimeout(() => setJustAddedId(null), 120000);
            return () => clearTimeout(timer);
        }
    }, [cars]);

    useEffect(() => {
        if (location) {
            setLoadingLocation(false);
        }
    }, [location]);

    return (
        <div className="p-6 text-left max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 shadow-md rounded-md">
                <>
                    <h3 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">Vehicle Details</h3>
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">VIN Number</label>
                    <input
                        value={decodedVin?.vin}
                        placeholder="VIN Number"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <input
                        value={loadingLocation ? 'Getting location...' : location}
                        readOnly
                        placeholder="Location"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 italic"
                    />
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                    <input
                        type="number"
                        min="1886"
                        max={new Date().getFullYear()}
                        value={decodedVin?.info?.modelYear}
                        placeholder="Car's Year"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Make</label>
                    <input
                        value={decodedVin?.info?.manufacturer}
                        placeholder="Manufacturer"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    /> 
                    <div className='text-center mt-2'>
                        <ActionBtn label='Add Car' onClick={addCar} color='bg-green-600/80 hover:db-green-700 active:bg-indigo-800' />

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
                        <hr className='mt-8 mb-4 dark:text-slate-600 text-slate-300'/>
                        <ActionBtn label='Submit Inventory' onClick={submitInventory} />
                    </div>
                </>
        </div>
    );
}
