import React, { useState, useRef, useEffect } from 'react';
import { Camera, Square, Check, X, RotateCcw, AlertCircle, Eye } from 'lucide-react';

const VINScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectedVINs, setDetectedVINs] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showExtractedText, setShowExtractedText] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const workerRef = useRef(null);

  // VIN validation regex - 17 characters, no I, O, or Q
  const vinRegex = /[A-HJ-NPR-Z0-9]{17}/g;

  // Initialize Tesseract worker
  const initializeOCR = async () => {
    try {
      if (!workerRef.current) {
        // Load Tesseract from CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js';
        script.onload = async () => {
          workerRef.current = await window.Tesseract.createWorker();
          await workerRef.current.load();
          await workerRef.current.loadLanguage('eng');
          await workerRef.current.initialize('eng');
          await workerRef.current.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            tessedit_pageseg_mode: window.Tesseract.PSM.SINGLE_BLOCK,
          });
        };
        document.head.appendChild(script);
      }
    } catch (err) {
      console.error('OCR initialization failed:', err);
    }
  };

  const checkCameraSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera not supported in this browser');
      return false;
    }
    return true;
  };

  const startCamera = async () => {
    if (!checkCameraSupport()) return;

    try {
      setError('');
      setIsScanning(true);
      setCameraReady(false);

      // Initialize OCR when starting camera
      await initializeOCR();

      // Try different camera configurations
      const constraints = [
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: true }
      ];

      let stream = null;
      for (const constraint of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          console.log('Trying next camera constraint...', err.message);
        }
      }

      if (!stream) {
        throw new Error('Could not access camera');
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      setError(`Camera error: ${err.message}`);
      setIsScanning(false);
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setCameraReady(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      setError('Camera not ready');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Flip the image back to normal (remove mirror effect)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      stopCamera();
      processImage(imageData);
    } catch (err) {
      setError(`Capture error: ${err.message}`);
    }
  };

  const processImage = async (imageData) => {
    setIsProcessing(true);
    setDetectedVINs([]);
    setExtractedText('');
    setError('');
    setOcrProgress(0);
  
    try {
      if (!window.Tesseract) {
        throw new Error('OCR library not loaded. Please try again.');
      }
  
      if (!workerRef.current) {
        setError('OCR not initialized. Please try again.');
        setIsProcessing(false);
        return;
      }
  
      // ✅ Set progress logger separately (fix for DataCloneError)
      workerRef.current.setLogger(m => {
        if (m.status === 'recognizing text') {
          setOcrProgress(Math.round(m.progress * 100));
        }
      });
  
      const result = await workerRef.current.recognize(imageData);
      const extractedText = result.data.text.toUpperCase();
      setExtractedText(extractedText);
  
      const foundVINs = extractedText.match(vinRegex) || [];
      const validVINs = foundVINs.filter(vin => isValidVIN(vin));
      const uniqueVINs = [...new Set(validVINs)];
  
      setDetectedVINs(uniqueVINs);
  
      if (uniqueVINs.length === 0) {
        setError('No valid VINs detected. Try capturing again with better lighting and ensure the VIN is clearly visible.');
      }
    } catch (err) {
      setError(`OCR error: ${err.message}`);
      console.error('OCR processing error:', err);
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const isValidVIN = (vin) => {
    if (vin.length !== 17) return false;
    if (/[IOQ]/.test(vin)) return false;
    
    // Additional VIN validation - check digit validation could be added here
    const pattern = /^[A-HJ-NPR-Z0-9]{17}$/;
    return pattern.test(vin);
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setDetectedVINs([]);
    setExtractedText('');
    setError('');
    setIsProcessing(false);
    setOcrProgress(0);
    setShowExtractedText(false);
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        // Simple feedback
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = originalText;
        }, 1000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">VIN Scanner</h1>
        <p className="text-gray-600">Real-time VIN detection using OCR</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start gap-2">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {!isScanning && !capturedImage && (
        <div className="text-center space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">For best results:</p>
            <ul className="text-xs text-blue-700 space-y-1 text-left">
              <li>• Use bright, even lighting</li>
              <li>• Hold camera 6-12 inches from VIN</li>
              <li>• Keep VIN horizontal and centered</li>
              <li>• Avoid shadows and glare</li>
              <li>• Ensure all 17 characters are visible</li>
            </ul>
          </div>
          <button
            onClick={startCamera}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Camera size={20} />
            {isScanning ? 'Starting Camera...' : 'Start Camera'}
          </button>
        </div>
      )}

      {isScanning && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-64 object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Loading camera...</p>
                </div>
              </div>
            )}
            {cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-yellow-400 border-dashed w-11/12 h-16 rounded flex items-center justify-center">
                  <span className="text-yellow-400 text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                    Align VIN within this box
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={captureImage}
              disabled={!cameraReady}
              className="flex items-center justify-center gap-2 flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square size={16} />
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex items-center justify-center gap-2 flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-64 object-cover rounded-lg border"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Processing with OCR...</p>
                  {ocrProgress > 0 && (
                    <div className="mt-2">
                      <div className="bg-white bg-opacity-20 rounded-full h-2 w-32 mx-auto">
                        <div 
                          className="bg-white rounded-full h-2 transition-all duration-300"
                          style={{ width: `${ocrProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm mt-1">{ocrProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isProcessing && detectedVINs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Check size={16} className="text-green-600" />
                Detected VINs ({detectedVINs.length}):
              </h3>
              {detectedVINs.map((vin, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <span className="font-mono text-sm break-all">{vin}</span>
                  <button
                    onClick={(e) => copyToClipboard(vin)}
                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded hover:bg-blue-50 ml-2 flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isProcessing && extractedText && (
            <div className="space-y-2">
              <button
                onClick={() => setShowExtractedText(!showExtractedText)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <Eye size={14} />
                {showExtractedText ? 'Hide' : 'Show'} extracted text
              </button>
              {showExtractedText && (
                <div className="p-3 bg-gray-50 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {extractedText || 'No text detected'}
                </div>
              )}
            </div>
          )}

          <button
            onClick={resetScanner}
            className="flex items-center justify-center gap-2 w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={16} />
            Scan Another
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {!isScanning && !capturedImage && (
        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">VIN Requirements:</p>
            <p>• Exactly 17 characters</p>
            <p>• Letters A-H, J-N, P-R, S-Z</p>
            <p>• Numbers 0-9</p>
            <p>• No letters I, O, or Q</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VINScanner;