import { useEffect } from "react";

export default function ClientsContainer() {
    useEffect(() => {
        fetch("/api/user_inventories/history/17")
            .then(res => res.json())
            .then(data => console.log("User 17 inventory history:", data))
            .catch(err => console.error("Error fetching inventory history:", err));
    }, []);

    return (
        <div className="text-4xl text-bold mt-10">
            Hello from Client Outrach: This route is under construction!
        </div>
    );
}