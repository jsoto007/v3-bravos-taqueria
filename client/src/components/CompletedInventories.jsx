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
        <div>
            <h1>Container</h1>
            {inventories.map((inventory) => (
                <CompletedInventoryCard key={inventory.id} inventory={inventory} />
            ))}
        </div>
    );
}

