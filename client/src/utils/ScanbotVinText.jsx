import { useCallback, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk/ui";

export default function ScanbotVinText() {
  const apiKey = import.meta.env.VITE_SCANBOT_LICENSE_KEY;
  const [vin, setVin] = useState(""); // Step 1: Add state

  const startVinScanner = useCallback(async () => {
    try {
      const sdk = await ScanbotSDK.initialize({
        licenseKey: apiKey,
        enginePath: "/wasm/complete/",
      });

      const configuration = {
        containerId: "vin-scanner-container",
        onVinDetected: (result) => {
          console.log("SCAN RESULT:", result);

          if (result?.textResult?.rawText) {
            console.log("Scanned VIN:", result.textResult.rawText);
            setVin(result.textResult.rawText); // Step 2: Update state
          } else if (result?.barcodeResult?.extractedVIN) {
            console.log("Scanned VIN from barcode:", result.barcodeResult.extractedVIN);
            setVin(result.barcodeResult.extractedVIN); // Optional: fall back to barcode VIN
          } else {
            console.log("VIN scanning canceled or failed.");
          }
        },
        onError: (error) => {
          console.error("VIN scanner error:", error);
        },
      };

      await sdk.createVinScanner(configuration);
    } catch (error) {
      console.error("VIN scanner error:", error);
    }
  }, [apiKey]);

  return (
    <div className="mt-10 flex flex-col items-center space-y-4">
      <button
        onClick={startVinScanner}
        className="px-6 py-3 text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        Start VIN Scan
      </button>
      <h1>{vin}</h1> {/* Step 3: Render VIN */}
      <div id="vin-scanner-container" style={{ width: "100%", height: "500px" }} />
    </div>
  );
}
