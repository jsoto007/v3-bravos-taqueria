import { useState, useContext, useEffect } from "react";
import axios from "axios";
import { UserContext } from "../../context/UserContextProvider";
import InventoryForm from "./InventoryForm";
import { userLocation } from "../../utils/UserLocation";
import ActionBtn from "../../shared/ActionBtn";
import ScanbotScanner from "../../utils/ScanbotScanner";
import ScanbotVinText from "../../utils/ScanbotVinText";

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
  const [scanMode, setScanMode] = useState("scanner");

  const { currentUser } = useContext(UserContext);

  const createInventory = async () => {
    try {
      const res = await axios.post("/api/user_inventories", {
        user_id: currentUser.id,
        account_group_id: currentUser.account_group_id,
      });
      setInventoryId(res.data.id);
      return res.data.id;
    } catch (err) {
      console.error("Error creating inventory:", err.response?.data || err.message);
      setErrors(err);
    }
  };

  const handleStartInventory = async () => {
    const id = await createInventory();
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
      return;
    }

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
        console.log("Location being trigerred");
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
            <div className="text-center mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 text-xl">
                    <strong>Add Many Cars to Inventory</strong>
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    Select a scan method → Scan VIN → Add Cars → Submit Inventory to save all at once.
                </p>
            </div>
          <fieldset aria-label="VIN input method" className="mt-2 flex justify-center">
            <div className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-sm font-semibold ring-1 ring-inset ring-gray-200 dark:ring-gray-700">
              <label className="group relative rounded-full px-3 py-1 has-[:checked]:bg-indigo-600 cursor-pointer">
                <input
                  type="radio"
                  name="vin-input-mode"
                  value="scanner"
                  checked={scanMode === "scanner"}
                  onChange={() => setScanMode("scanner")}
                  className="absolute inset-0 appearance-none rounded-full cursor-pointer"
                />
                <span className="text-gray-500 dark:text-gray-300 group-has-[:checked]:text-white">Barcode</span>
              </label>
              <label className="group relative rounded-full px-3 py-1 has-[:checked]:bg-indigo-600 cursor-pointer">
                <input
                  type="radio"
                  name="vin-input-mode"
                  value="text"
                  checked={scanMode === "text"}
                  onChange={() => setScanMode("text")}
                  className="absolute inset-0 appearance-none rounded-full cursor-pointer"
                />
                <span className="text-gray-500 dark:text-gray-300 group-has-[:checked]:text-white">Text</span>
              </label>
            </div>
          </fieldset>

          {scanMode === "scanner" ? (
            <ScanbotScanner onScan={setVin} setDecodedVin={setDecodedVin} />
          ) : (
            <ScanbotVinText onScan={setVin} setDecodedVin={setDecodedVin} />
          )}

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