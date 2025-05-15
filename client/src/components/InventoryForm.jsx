import { useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContextProvider";

export default function InventoryForm() {
    const [inventoryId, setInventoryId] = useState(null);
    const [vin, setVin] = useState("");
    const [location, setLocation] = useState("");
    const [year, setYear] = useState("");
    const [make, setMake] = useState("");
    const [cars, setCars] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    const { currentUser } = useContext(UserContext)

    console.log("from form:", currentUser)

    const createInventory = async () => {
        try {
            const res = await axios.post("/api/user_inventories", { user_id: currentUser.id });
            setInventoryId(res.data.id);
        } catch (err) {
            console.error("Error creating inventory", err);
        }
    };

    const addCar = async () => {
        try {
            const res = await axios.post("/api/cars", {
                user_id: currentUser.id,
                user_inventory_id: inventoryId,
                vin_number: vin,
                location,
                year,
                make,
            });
            setCars([...cars, res.data]);
            setVin("");
            setLocation("");
            setYear("");
            setMake("");
        } catch (err) {
            console.error("Error adding car", err);
        }
    };

    const submitInventory = async () => {
        try {
            await axios.patch(`/api/user_inventories/${inventoryId}`);
            setSubmitted(true);
        } catch (err) {
            console.error("Error submitting inventory", err);
        }
    };

console.log("currentUser from context:", currentUser);

    return (
        <div>
            {!inventoryId ? (
                <button onClick={createInventory}>Start Inventory</button>
            ) : submitted ? (
                <div>Inventory Submitted!</div>
            ) : (
                <>
                    <h3>Add Car</h3>
                    <input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="VIN Number" />
                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
                    <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" />
                    <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make" />
                    <button onClick={addCar}>Add Car</button>
                    <ul>
                        {cars.map((car) => (
                            <li key={car.id}>{car.vin_number} - {car.make} ({car.year})</li>
                        ))}
                    </ul>
                    <button onClick={submitInventory}>Submit Inventory</button>
                </>
            )}
        </div>
    );
}