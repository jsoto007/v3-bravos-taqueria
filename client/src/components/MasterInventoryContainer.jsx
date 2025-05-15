
import { useEffect, useState } from 'react';

export default function MasterInventoryContainer() {

    useEffect(() => {
        fetch('/api/master_inventory')
            .then(response => response.json())
            .then(data => {
                console.log('Fetched master inventory:', data);
            })
            .catch(error => {
                console.error('Error fetching master inventory:', error);
            });
    }, []);

    return (
        <div>
            Hello from Master Inventory Container
        </div>
    );
}

