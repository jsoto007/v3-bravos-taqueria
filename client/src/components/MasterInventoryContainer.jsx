
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

    console.log("INVENTORY:", inventory)

    return (
        <>
            <MasterInventoryCard onInventory={inventory} />
        </>
    );
}

