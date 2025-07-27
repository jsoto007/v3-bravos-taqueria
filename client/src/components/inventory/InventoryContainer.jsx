import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../../context/UserContextProvider";
import InventoryForm from "./InventoryForm";
import { userLocation } from "../../utils/UserLocation";
import ActionBtn from "../../shared/ActionBtn";
import ScanbotScanner from "../../utils/ScanbotScanner";

export default function InventoryContainer() {
    const [inventoryId, setInventoryId] = useState(null);
    const [vin, setVin] = useState("");
    const [location, setLocation] = useState("");
    const [year, setYear] = useState("");
    const [make, setMake] = useState("");
    const [cars, setCars] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [decodedVin, setDecodedVin] = useState({});
    const [errors, setErrors] = useState({});

    const { currentUser } = useContext(UserContext);

    const createInventory = async () => {
        try {
            const res = await axios.post("/api/user_inventories", {
                user_id: currentUser.id,
                account_group_id: currentUser.account_group_id, // ✅ FIXED: Include account_group_id
            });
            setInventoryId(res.data.id);
            return res.data.id;
        } catch (err) {
            console.error("Error creating inventory:", err.response?.data || err.message);
            setErrors(err);
        }
    };

    const handleStartInventory = async () => {
        const id = await createInventory(); // wait for inventory to be created
        if (id) {
            setShowForm(true);
        }
    };

    const addCar = async () => {
        if (!vin) {
            setDecodedVin({ vin: "", info: { modelYear: "", manufacturer: "" } });
            alert("Please scan a valid VIN.");
            return;
        }

        if (cars.some((car) => car.vin_number === vin)) {
            setDecodedVin({ vin: "", info: { modelYear: "", manufacturer: "" } });
            // alert("This car has already been added to the current inventory.");
            return;
        }

        console.log("Adding car with data:", {
            vin_number: vin,
            year,
            make,
            location,
            user_id: currentUser.id,
            user_inventory_id: inventoryId,
            account_group_id: currentUser.account_group_id,
        });

        try {
            const res = await axios.post("/api/cars", {
                user_id: currentUser.id,
                user_inventory_id: inventoryId,
                account_group_id: currentUser.account_group_id,
                vin_number: vin,
                location,
                year,
                make,
            });

            setCars([...cars, res.data]);
            setVin("");
            setYear("");
            setMake("");
            setDecodedVin({ vin: "", info: { modelYear: "", manufacturer: "" } });
        } catch (err) {
            console.error("Error adding car:", err.response?.data || err.message);
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

    useEffect(() => {
        if (decodedVin && Object.keys(decodedVin).length > 0) {
            if (decodedVin.vin) setVin(decodedVin.vin);
            if (decodedVin.info?.modelYear) setYear(decodedVin.info.modelYear);
            if (decodedVin.info?.manufacturer) setMake(decodedVin.info.manufacturer);
        }
    }, [decodedVin]);

    useEffect(() => {
        if (vin) {
            const timer = setTimeout(() => {
                console.log("Location being trigerred")
                userLocation(vin, setLocation);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [vin]);

    return (
        <div className="mt-10">
            {!showForm ? (
                <div className="float-right -mb-6">
                    <ActionBtn label="+ Car" onClick={handleStartInventory} />
                </div>
            ) : submitted ? (
                <div className="text-green-600 dark:text-green-400 font-semibold text-center">
                    Inventory Submitted!
                </div>
            ) : (
                <>
                    <ScanbotScanner decodedVin={decodedVin} setDecodedVin={setDecodedVin} />

                    <InventoryForm
                        location={location}
                        addCar={addCar}
                        cars={cars}
                        submitInventory={submitInventory}
                        decodedVin={decodedVin}
                    />
                </>
            )}
        </div>
    );
}

