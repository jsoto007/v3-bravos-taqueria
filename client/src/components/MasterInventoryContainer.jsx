import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MasterInventoryCard from './MasterInventoryCard';

export default function MasterInventoryContainer() {

    const [inventory, setInventory] = useState([])
    
    useEffect(() => {
        fetch('/api/master_inventory')
            .then(response => response.json())
            .then(MastInventory => {
                setInventory(MastInventory)
            })
            .catch(error => {
                console.error('Error fetching master inventory:', error);
            });
    }, []);

    return (
        <>
            <div className="flex justify-between items-start mb-4 mt-6">
                <div className="sm:flex-auto text-left">
                    <h1 className="text-2xl font-semibold leading-6 text-gray-900 dark:text-gray-100">Cars Master List</h1>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        The master list of all the cars in your account including their model, VIN, Location and purchased price.
                    </p>
                </div>
                <Link
                    to="/master_inventory/create_master_inventory"
                    className="bg-blue-500/30 dark:bg-blue-500/40 text-gray-800 dark:text-white rounded-md px-3 py-1"
                >
                    + Car
                </Link>
            </div>
            <MasterInventoryCard onInventory={inventory} />
        </>
    );
}
