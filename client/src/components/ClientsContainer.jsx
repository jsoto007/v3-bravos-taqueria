import { useEffect } from "react";
import InventoryContainer from "./InventoryContainer";
import { userLocatoin } from "../utils/UserLocation"

export default function ClientsContainer() {
    useEffect(() => {
        fetch("/api/user_inventories/history/17")
            .then(res => res.json())
            .then(data => console.log("User 17 inventory history:", data))
            .catch(err => console.error("Error fetching inventory history:", err));
    }, []);

    
    userLocatoin()

    return (
        <div className="text-4xl text-bold mt-10">
            Hello from Client Outrach: This route is under construction!
            {/* <InventoryContainer /> */}

        </div>
    );
}

