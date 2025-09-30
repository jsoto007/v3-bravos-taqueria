import { useEffect, useState } from 'react';
import ScanbotSDK from 'scanbot-web-sdk/ui';
import ActionBtn from '../shared/ActionBtn';
import { decodeVinData } from './VinDecoder';

export default function ScanbotScanner({ onScan, setDecodedVin }) {
  const [initialized, setInitialized] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const apiKey = import.meta.env.VITE_LICENSE_KEY;

  useEffect(() => {
    (async () => {
      await ScanbotSDK.initialize({
        licenseKey: apiKey,
        enginePath: '/wasm/'
      });
      setInitialized(true);
    })();
  }, []);

  const startScan = async () => {
    if (!initialized) return;

    const config = new ScanbotSDK.UI.Config.BarcodeScannerScreenConfiguration();
    const result = await ScanbotSDK.UI.createBarcodeScanner(config);

    if (result?.items?.length) {
      const vin = result.items[0].barcode.text;
      setScanResult(`VIN: ${vin}`);

      if (onScan) onScan(vin);

      try {
        const decoded = await decodeVinData(vin);
        setDecodedVin(decoded);
      } catch (err) {
        console.error("VIN decode error:", err);
      }
    } else {
      setScanResult('No barcode detected');
    }
  };

  return (
    <div className='mt-10' style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <ActionBtn label="Scan Barcode" onClick={startScan} />
      {scanResult && <p><strong>Result:</strong> {scanResult}</p>}
    </div>
  );
}

