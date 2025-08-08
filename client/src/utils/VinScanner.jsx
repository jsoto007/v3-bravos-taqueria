import { useCallback, useEffect, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk/ui";
import ActionBtn from "../shared/ActionBtn";
import { decodeVinData } from "./VinDecoder";

export default function VinScanner() {
    
  const apiKey = import.meta.env.VITE_SCANBOT_LICENSE_KEY;

  const [scanMethod, setScanMethod] = useState("barcode"); // "barcode" or "text"
  const [vin, setVin] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [decodedVin, setDecodedVin] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      await ScanbotSDK.initialize({
        licenseKey: apiKey,
        enginePath: "/wasm/complete/",
      });
      setInitialized(true);
    })();
  }, [apiKey]);

  const startTextScan = useCallback(async () => {
    if (!initialized) return;

    const configuration = {
      containerId: "vin-scanner-container",
      onVinDetected: (result) => {
        const textVin = result?.textResult?.rawText;
        const barcodeVin = result?.barcodeResult?.extractedVIN;

        if (textVin) {
          setVin(textVin);
        } else if (barcodeVin) {
          setVin(barcodeVin);
        } else {
          console.log("VIN scanning canceled or failed.");
        }
      },
      onError: (error) => {
        console.error("VIN scanner error:", error);
      },
    };

    await ScanbotSDK.UI.createVinScanner(configuration);
  }, [initialized]);

  const startBarcodeScan = useCallback(async () => {
    if (!initialized) return;

    const config = new ScanbotSDK.UI.Config.BarcodeScannerScreenConfiguration();
    const result = await ScanbotSDK.UI.createBarcodeScanner(config);

    if (result?.items?.length) {
      const barcode = result.items[0].barcode.text;
      setVin(barcode);
      setScanResult(`VIN: ${barcode}`);

      try {
        const decoded = await decodeVinData(barcode);
        setDecodedVin(decoded);
      } catch (err) {
        console.error("VIN decode error:", err);
      }
    } else {
      setScanResult("No barcode detected");
    }
  }, [initialized]);

  return (
    <div className="p-6">
      {/* Toggle Buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${scanMethod === "barcode" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setScanMethod("barcode")}
        >
          Scan via Barcode
        </button>
        <button
          className={`px-4 py-2 rounded ${scanMethod === "text" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setScanMethod("text")}
        >
          Scan via Text
        </button>
      </div>

      {/* Scan Button */}
      {scanMethod === "barcode" ? (
        <div className="flex flex-col items-center">
          <ActionBtn label="Start Barcode Scan" onClick={startBarcodeScan} />
          {scanResult && <p className="mt-4 font-medium">{scanResult}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <ActionBtn label="Start Text Scan" onClick={startTextScan} />
          <div id="vin-scanner-container" className="w-full h-[500px] mt-4" />
        </div>
      )}

      {/* Display Scanned VIN */}
      {vin && (
        <div className="mt-6 text-center">
          <h2 className="text-lg font-semibold">Scanned VIN:</h2>
          <p className="text-blue-700">{vin}</p>
        </div>
      )}

      {/* Display Decoded VIN if available */}
      {decodedVin && (
        <div className="mt-4 text-sm">
          <h3 className="font-semibold">Decoded VIN Info:</h3>
          <pre>{JSON.stringify(decodedVin, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}