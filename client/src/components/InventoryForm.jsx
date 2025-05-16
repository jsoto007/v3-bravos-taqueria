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
    const [showForm, setShowForm] = useState(false);
    
    const [errors, setErrors] = useState({})

    const { currentUser } = useContext(UserContext)

    // Move createInventory out of handleStartInventory and call it asynchronously without awaiting
    const createInventory = async () => {
        try {
            const res = await axios.post("/api/user_inventories", { user_id: currentUser.id });
            setInventoryId(res.data.id);
        } catch (err) {
            setErrors(err);
        }
    };

    const handleStartInventory = () => {
        setShowForm(true);
        // Run createInventory in the background
        createInventory();
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
            setErrors(err);
        }
    };

    const submitInventory = async () => {
        try {
            await axios.patch(`/api/user_inventories/${inventoryId}`);
            setSubmitted(true);
        } catch (err) {
            setErrors(err);
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto mt-12 bg-white dark:bg-gray-800 shadow-md rounded-md">
            {!showForm ? (
                <button
                    onClick={handleStartInventory}
                    className="w-full py-2 px-4 bg-blue-600/60 text-white rounded hover:bg-blue-700 transition"
                >
                    Start Inventory
                </button>
            ) : submitted ? (
                <div className="text-green-600 dark:text-green-400 font-semibold text-center">
                    Inventory Submitted!
                </div>
            ) : (
                <>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Add Car</h3>
                    <input
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                        placeholder="VIN Number"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Location"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        type="number"
                        min="1886"
                        max={new Date().getFullYear()}
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Year"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <input
                        value={make}
                        onChange={(e) => setMake(e.target.value)}
                        placeholder="Make"
                        className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    />
                    <button
                        onClick={addCar}
                        className="w-full py-2 px-4 bg-green-600/80 text-white rounded hover:bg-green-700 transition mb-4"
                    >
                        Add Car
                    </button>
                    <ul className="mb-4 text-gray-700 dark:text-gray-300">
                        {cars.map((car) => (
                            <li key={car.id} className="mb-1">
                                {car.vin_number} - {car.make} ({car.year})
                            </li>
                        ))}
                    </ul>
                    <button
                        onClick={submitInventory}
                        className="w-full py-2 px-4 bg-indigo-600/80 text-white rounded hover:bg-indigo-700 transition"
                    >
                        Submit Inventory
                    </button>
                </>
            )}
        </div>
    );
}