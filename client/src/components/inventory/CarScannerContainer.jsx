import { useState, useContext, useEffect } from "react";
import { UserContext } from "../../context/UserContextProvider";
import ActionBtn from "../../shared/ActionBtn";
import ScanbotScanner from "../../utils/ScanbotScanner";
import ScanbotVinText from "../../utils/ScanbotVinText";
import { userLocation } from "../../utils/UserLocation";
import FadeIn from "../../shared/FadeIn";

export default function CarScannerContainer() {
  const [vin, setVin] = useState("");
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [submittedCar, setSubmittedCar] = useState(null);
  const [errors, setErrors] = useState({});
  const [scanMode, setScanMode] = useState("scanner");
  const [decodedVin, setDecodedVin] = useState({});
  const [scanComplete, setScanComplete] = useState(false);

  const { currentUser } = useContext(UserContext);

  console.log("Updated Location: ", location)

  const addCar = async (e) => {
    e.preventDefault();

    if (!vin) {
      alert("Please scan a valid VIN.");
      return;
    }

    try {
      const response = await fetch("/api/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.id,
          account_group_id: currentUser.account_group_id,
          vin_number: vin,
          location: location?.address,
          longitude: location?.longitude,
          latitude: location?.latitude,
          year,
          make,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit car");

      const data = await response.json();
      setSubmittedCar(data);
      
      // After submission, show barcode scanner for next car
      setScanMode("scanner");
      setScanComplete(false);
    } catch (err) {
      console.error(err);
      setErrors({ message: err.message });
    }
  };

  useEffect(() => {
    if (decodedVin && Object.keys(decodedVin).length > 0) {
      if (decodedVin.vin) setVin(decodedVin.vin);
      if (decodedVin.info?.modelYear) setYear(decodedVin.info.modelYear);
      if (decodedVin.info?.manufacturer) setMake(decodedVin.info.manufacturer);
 
      

      setScanComplete(true);
    }
  }, [decodedVin]);

  useEffect(() => {
    if (vin) {
      const timer = setTimeout(() => userLocation(vin, setLocation), 500);
      return () => clearTimeout(timer);
    }
  }, [vin]);

  return (
    <FadeIn>
    <div className="mt-20 py-4 bg-white dark:bg-slate-800 rounded-xl">
      <div className="text-center mb-6">
        <p className="text-2xl text-gray-600 dark:text-gray-300">
          <strong>Scan and Submit a Car</strong>
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic">
          Scan the VIN → Submit Car → Repeat for the next car.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        If the VIN is invalid, the app will continue scanning.
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

      {!scanComplete && (
        <>
          {scanMode === "scanner" ? (
            <ScanbotScanner onScan={setVin} setDecodedVin={setDecodedVin} />
          ) : (
            <ScanbotVinText onScan={setVin} setDecodedVin={setDecodedVin} />
          )}
        </>
      )}

      {scanComplete && (
        <div className="max-w-md mx-auto mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg shadow-md border border-green-300 dark:border-green-700">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Scanned VIN Data</h3>
          <ul className="text-green-700 dark:text-green-300 space-y-1">
            <li className="text-green-700 dark:text-green-100 text-xl font-bold my-2"><span className="font-semibold text-lg">VIN:</span> {vin}</li>
            <li><strong>Location:</strong> {location?.address || "N/A"}</li>
            <li><strong>Year:</strong> {year || "N/A"}</li>
            <li><strong>Make:</strong> {make || "N/A"}</li>
          </ul>
        </div>
      )}

      <hr className="mt-10 text-slate-200 dark:text-slate-700" />

      <div className="flex justify-center mt-4 pb-2">
        <ActionBtn 
            label="Submit Car" 
            onClick={addCar} 
            color="bg-green-700/90 hover:bg-green-500 active:bg-green-700 dark:bg-green-700 dark:hover:bg-green-500 dark:active:bg-green-800"
        />
      </div>

      {submittedCar && (
        <div className="mt-4 text-green-600 dark:text-green-400 text-center">
          Car with VIN <strong>{submittedCar.vin_number}</strong> submitted successfully!
        </div>
      )}

      {errors.message && (
        <div className="mt-4 text-red-600 dark:text-red-400 text-center">
          {errors.message}
        </div>
      )}
    </div>
    </FadeIn>
  );
}