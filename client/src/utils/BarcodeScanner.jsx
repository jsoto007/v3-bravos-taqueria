import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { decodeVinData } from './VinDecoder';
import Tesseract from 'tesseract.js';

export default function BarcodeScanner({ onScan, setDecodedVin, decodedVin }) {
  const videoRef = useRef(null);
  const [imageDataUrl, setImageDataUrl] = useState(null);

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      captureFrame();
    }, 2000); // Changed to 2000ms

    return () => clearInterval(intervalId);
  }, []);

  const captureFrame = () => {
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    if (!video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    enhanceImage(canvas); // Enhance frame before OCR
    const dataUrl = canvas.toDataURL("image/png");
    setImageDataUrl(dataUrl);
    // Run OCR on enhanced image
    runOCR(dataUrl);
  };

  const enhanceImage = (canvas) => {
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      const value = grayscale > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const runOCR = (image) => {
    Tesseract.recognize(image, "eng", {
      logger: m => console.log("OCR progress:", m.status, m.progress),
      // Optional character whitelist (may require tweaks depending on environment)
      // Not officially supported in browser-only setup
      // charWhitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    }).then(result => {
      console.log("**** Full OCR result:", result);
      let { text } = result.data;
      console.log("^^^^^^ OCR extracted text (raw):", text);

      text = text.replace(/\s+/g, '').toUpperCase(); // Ensure uppercase
      console.log("Cleaned OCR text:", text);

      const vinCandidates = text.match(/[A-Z0-9]{15,18}/g);
      console.log("Potential VIN candidates:", vinCandidates);

      if (vinCandidates && vinCandidates.length > 0) {
        const vin = vinCandidates.find(
          v => v.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(v)
        );
        if (vin) {
          console.log("Detected VIN from OCR:", vin);
          if (onScan) onScan(vin);

          decodeVinData(vin)
            .then(decoded => setDecodedVin(decoded))
            .catch(err => console.error('VIN decode error:', err));
        } else {
          console.warn("No valid VIN found among candidates.");
        }
      } else {
        console.warn("No potential VINs detected in OCR text.");
      }
    });
  };

  return (
    <>
      <video ref={videoRef} style={{ width: '100%' }} />
    </>
  );
}