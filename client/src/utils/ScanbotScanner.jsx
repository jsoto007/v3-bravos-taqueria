

import { useEffect, useState } from 'react';
import ScanbotSDK from 'scanbot-web-sdk/ui';
import ActionBtn from '../shared/ActionBtn';

export default function ScanbotScanner( { onScan, setDecodedVin } ) {
  const [initialized, setInitialized] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const apiKey = import.meta.env.SCANBOT_LICENSE_KEY;

  useEffect(() => {
    (async () => {
      await ScanbotSDK.initialize({
        licenseKey: apiKey, // trial mode (60s/session)
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
      const item = result.items[0].barcode;
      setScanResult(`${item.format}: ${item.text}`);
    } else {
      setScanResult('No barcode detected');
    }
  };

  return (
    <div className='mt-20' style={{ padding: '1rem', fontFamily: 'sans-serif' }}>

      <ActionBtn label="Scan Barcode" onClick={startScan} />

      {/* <button onClick={startScan} disabled={!initialized}>
        {initialized ? 'Start Scanning' : 'Initializing...'}
      </button> */}
      {scanResult && <p><strong>Result:</strong> {scanResult}</p>}
    </div>
  );
}

