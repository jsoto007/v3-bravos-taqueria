import { useCallback, useState } from "react";
import ScanbotSDK from "scanbot-web-sdk/ui";
import ActionBtn from "../shared/ActionBtn";
import { decodeVinData } from "./VinDecoder"; // import if needed

export default function ScanbotVinText({ onScan, setDecodedVin }) {
  const apiKey = import.meta.env.VITE_SCANBOT_LICENSE_KEY;
  const [vin, setVin] = useState("");

  // ISO 3779 VIN validation
  function isRealVIN(vin) {
    if (typeof vin !== "string") return false;
    vin = vin.trim().toUpperCase();
    // Must be 17 chars, and only allowed chars
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
    // Check digit (9th char)
    const transliterate = (char) => {
      // Letters to numbers per ISO 3779
      const map = {
        A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
        J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
        S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9
      };
      if (/[A-Z]/.test(char)) return map[char] || 0;
      if (/[0-9]/.test(char)) return Number(char);
      return 0;
    };
    const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += transliterate(vin[i]) * weights[i];
    }
    let remainder = sum % 11;
    let checkDigit = remainder === 10 ? "X" : remainder.toString();
    return vin[8] === checkDigit;
  }

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
          if (foundVin && isRealVIN(foundVin)) {
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
            // Optionally, dispose scanner after valid VIN found
            if (sdk && typeof sdk.dispose === "function") {
              sdk.dispose();
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
