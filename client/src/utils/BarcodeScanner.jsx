import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { decodeVinData } from './VinDecoder';

export default function BarcodeScanner({ onScan, setDecodedVin, decodedVin }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (result) {
        const vin = result.getText();
        if (onScan) onScan(vin);

        decodeVinData(vin)
          .then(decoded => setDecodedVin(decoded))
          .catch(err => console.error('VIN decode error:', err));
      }
    });

    return () => {
      try {
        codeReader.reset?.();
        codeReader.stopContinuousDecode?.();

        const stream = videoRef.current?.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.warn("Error cleaning up barcode scanner:", err);
      }
    };
  }, [onScan]);


  return <video ref={videoRef} style={{ width: '100%' }} />;
}