import { useCallback } from "react";
import ScanbotSDK from "scanbot-web-sdk/ui";


export default function ScanbotVinText() {
  const apiKey = import.meta.env.VITE_SCANBOT_LICENSE_KEY;

  const startVinScanner = useCallback(async () => {
    try {
      const sdk = await ScanbotSDK.initialize({
        licenseKey: apiKey,
        enginePath: "/wasm/complete/",
      });

      const configuration = {
        containerId: "vin-scanner-container", // Ensure this div exists in your component's render
        onVinDetected: (result) => {
            console.log("SCAN RESULT:", result)
            if (result?.textResult?.rawText) {
                console.log('Scanned VIN:', result.textResult.rawText);
              } else if (result?.barcodeResult?.extractedVIN) {
                console.log('Scanned VIN from barcode:', result.barcodeResult.extractedVIN);
              } else {
                console.log('VIN scanning canceled or failed.');
              }
        },
        onError: (error) => {
          console.error("VIN scanner error:", error);
        },
        // Add further configuration as needed (styling, videoConstraints, etc)
      };

      await sdk.createVinScanner(configuration);
      // You may wish to save the scanner instance for later disposal
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
      <div id="vin-scanner-container" style={{ width: "100%", height: "500px" }} />
    </div>
  );
}
