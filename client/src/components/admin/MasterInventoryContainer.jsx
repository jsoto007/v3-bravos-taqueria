import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MasterInventoryCard from '../inventory/MasterInventoryCard';

export default function MasterInventoryContainer() {

    const [inventory, setInventory] = useState([])
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("")

    useEffect(() => {
        fetch('/api/master_inventory')
            .then(response => response.json())
            .then(MastInventory => {
                setInventory(MastInventory)
            })
            .catch(err => {
                setError(err);
            });
    }, []);

    // Search bar is to be move to it's own component once context is implemented. 
    const filteredInventory = inventory.filter(car =>
        (car.vin_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (car.make?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (car.year?.toString() || "").includes(searchTerm)
    );

    return (
        <>
            <div className="flex justify-between items-start mb-4 mt-16">
                <div className="sm:flex-auto text-left">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-gray-100">Cars Master List</h1>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        All the cars in your account, including their model, VIN, location, and purchase price.
                    </p>
                    <input
                        type="text"
                        placeholder="Search by VIN, year, or make"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-2 p-1 border border-gray-300 rounded w-full sm:w-80"
                    />
                </div>
                <Link
                    to="/master_inventory/create_master_inventory"
                    className="bg-blue-500/30 dark:bg-blue-500/40 text-gray-800  text-bold dark:text-white rounded-md px-3 py-1"
                >
                    + Car
                </Link>
            </div>
            <MasterInventoryCard onInventory={filteredInventory} />
        </>
    );
}
