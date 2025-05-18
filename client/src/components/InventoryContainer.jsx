import { useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContextProvider";
import InventoryForm from "./InventoryForm";

export default function InventoryContainer() {

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
        <div>
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
                <InventoryForm 
                    vin={vin}
                    setVin={setVin}
                    location={location}
                    setLocation={setLocation}
                    year={year}
                    setYear={setYear}
                    make={make}
                    setMake={setMake}
                    addCar={addCar}
                    cars={cars}
                    submitInventory={submitInventory}
                />
            )}
        </div>
    )
}