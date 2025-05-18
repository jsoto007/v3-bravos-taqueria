import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function BarcodeScanner({ onScan }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result) {
        console.log('Scanned result:', result.getText());
        if (onScan) onScan(result.getText());
      }
    });

    return () => {
      try {
        codeReader.reset?.();
        codeReader.stopContinuousDecode?.();
      } catch (err) {
        console.warn("Error cleaning up barcode scanner:", err);
      }
    };
  }, [onScan]);

  return <video ref={videoRef} style={{ width: '100%' }} />;
}