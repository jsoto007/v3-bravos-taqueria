import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContextProvider";
import InventoryForm from "./InventoryForm";
import BarcodeScanner from "../utils/BarcodeScanner";
import { userLocation } from "../utils/UserLocation";
 
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
        if (!vin) {
            setDecodedVin({ vin: "", info: { modelYear: "", manufacturer: "" } });
            alert("Please scan a valid VIN.");
            return;
        }

        if (cars.some((car) => car.vin_number === vin)) {
            setDecodedVin({ vin: "", info: { modelYear: "", manufacturer: "" } });
            alert("This car has already been added to the current inventory.");
            
            return;
        }
      
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
          setYear("");
          setMake("");
          setDecodedVin({ vin: "", info: { modelYear: "", manufacturer: "" } });
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

    useEffect(() => {
        console.log("DECODED VIN in state", decodedVin);
        if (decodedVin && Object.keys(decodedVin).length > 0) {
          if (decodedVin.vin) setVin(decodedVin.vin);
          if (decodedVin.info?.modelYear) setYear(decodedVin.info.modelYear);
          if (decodedVin.info?.manufacturer) setMake(decodedVin.info.manufacturer);
        }
      }, [decodedVin]);
      
    useEffect(() => {
        if (vin) {
            const timer = setTimeout(() => {
                userLocation(vin, setLocation);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [vin]);

    return (    
        <div className="mt-16">
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
                <BarcodeScanner decodedVin={decodedVin} setDecodedVin={setDecodedVin} />
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
    )
}