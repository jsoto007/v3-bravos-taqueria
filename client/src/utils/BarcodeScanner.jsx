import { useEffect, useRef } from 'react';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer
} from '@zxing/library';

export default function BarcodeScanner() {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    const constraints = { video: { facingMode: "environment" } };
    const reader = new MultiFormatReader();
    const hints = new Map();
    const formats = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    reader.setHints(hints);
  
    let stream;
    let intervalId;
  
    const captureFrame = () => {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  
      const luminanceSource = new RGBLuminanceSource(imageData.data, canvas.width, canvas.height);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
  
      try {
        const result = reader.decode(binaryBitmap);
        console.log("Decoded barcode:", result.getText());
      } catch (err) {
        // Ignore decode errors
      }
    };
  
    navigator.mediaDevices.getUserMedia(constraints)
      .then((mediaStream) => {
        stream = mediaStream;
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', true);
  
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          intervalId = setInterval(captureFrame, 1000);
        };
      })
      .catch(console.error);
  
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return <video ref={videoRef} style={{ width: '100%' }} autoPlay playsInline />;
}