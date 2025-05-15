import React, { useEffect, useState, useContext } from "react";
import { UserContext } from '../context/UserContextProvider';
import CompletedInventoryCard from '../components/CompletedInventoryCard';

export default function CompletedInventories() {
    const [inventories, setInventories] = useState([]);
    const { currentUser } = useContext(UserContext);

    useEffect(() => {
        if (!currentUser?.id) return;
    
        fetch(`/api/user_inventories/history/${currentUser.id}`)
            .then(res => res.json())
            .then(data => setInventories(data))
            .catch(err => console.error("Error fetching inventory history:", err));
    }, [currentUser]);

    console.log("inventories in state:", inventories)
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {inventories.map((inventory) => (
                <CompletedInventoryCard key={inventory.id} inventory={inventory} />
            ))}
        </div>
    );
}
