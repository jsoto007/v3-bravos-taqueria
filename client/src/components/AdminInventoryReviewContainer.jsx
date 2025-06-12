import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminInventoryReviewDisplay from "./AdminInventoryReviewDisplay";

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


    return (
        <div className="mt-16">
            <AdminInventoryReviewDisplay 
                userInventory={userInventory}
                matchingCars={matchingCars}
                error={error}
            />
        </div>
    );
}
