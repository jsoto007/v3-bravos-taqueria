import { useCallback, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk/ui";
import ActionBtn from "../shared/ActionBtn";
import { decodeVinData } from "./VinDecoder"; // import if needed

export default function ScanbotVinText({ onScan, setDecodedVin }) {
  const apiKey = import.meta.env.VITE_SCANBOT_LICENSE_KEY;
  const [vin, setVin] = useState("");

  const startVinScanner = useCallback(async () => {
    try {
      const sdk = await ScanbotSDK.initialize({
        licenseKey: apiKey,
        enginePath: "/wasm/complete/",
      });

      const configuration = {
        containerId: "vin-scanner-container",
        onVinDetected: async (result) => {
          let foundVin = "";
          if (result?.textResult?.rawText) {
            foundVin = result.textResult.rawText;
          } else if (result?.barcodeResult?.extractedVIN) {
            foundVin = result.barcodeResult.extractedVIN;
          }
          if (foundVin) {
            setVin(foundVin);

            // Notify parent -- update parent's VIN.
            if (onScan) onScan(foundVin);

            // Decode and update parent's decodedVin state. 
            if (setDecodedVin) {
              try {
                const decoded = await decodeVinData(foundVin);
                setDecodedVin(decoded);
              } catch (err) {
                console.error("VIN decode error:", err);
                setDecodedVin({}); // Or handle as you wish
              }
            }
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
  }, [apiKey, onScan, setDecodedVin]);

  return (
    <div className="mt-2 flex flex-col items-center space-y-4">
      <ActionBtn label="Scan Text" onClick={startVinScanner} />
      <h1>{vin}</h1>
      <div id="vin-scanner-container" style={{ width: "100%", height: "500px" }} />
    </div>
  );
}
