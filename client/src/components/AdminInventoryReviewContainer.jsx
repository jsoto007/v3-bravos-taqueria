import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminInventoryReviewCard from "./AdminInventoryReviewCard";

export default function AdminInventoryReviewContainer() {
    const [userInventory, setUserInventory] = useState(null);
    const [matchingCars, setMatchingCars] = useState([]);
    const [error, setError] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        fetch(`/api/admin/user_inventory_check/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to fetch user inventory");
                }
                return response.json();
            })
            .then(data => {
                setUserInventory(data.user_inventory);
                setMatchingCars(data.matching_cars);
            })
            .catch(err => {
                setError(err.message);
            });
    }, []);

    console.log("USER Inventory:", userInventory)
    console.log("USER matchingCAR:", matchingCars)

    return (
        <>
            <AdminInventoryReviewCard 
                userInventory={userInventory}
                matchingCars={matchingCars}
                error={error}
            />
        </>
    );
}
