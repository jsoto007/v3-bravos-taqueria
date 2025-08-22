import { useEffect, useState } from 'react';
import ScanbotSDK from 'scanbot-web-sdk/ui';
import ActionBtn from '../shared/ActionBtn';
import { decodeVinData } from './VinDecoder';

// ISO 3779 VIN validation
function isRealVIN(vin) {
  if (typeof vin !== 'string' || vin.length !== 17) return false;
  // Only allowed characters (no I, O, Q)
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;

  // Transliteration table for VIN
  const translit = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
    '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  };

  // Position weights
  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  // Calculate sum
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i];
    const value = translit[c];
    if (typeof value === 'undefined') return false;
    sum += value * weights[i];
  }

  // Calculate check digit
  const checkDigit = vin[8];
  const remainder = sum % 11;
  const expected = remainder === 10 ? 'X' : String(remainder);
  return checkDigit === expected;
}

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
      if (!isRealVIN(vin)) {
        startScan();
        return;
      }
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