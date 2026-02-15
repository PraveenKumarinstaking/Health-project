
import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Check, Loader2, RefreshCw, AlertCircle, Info, Plus } from 'lucide-react';
import { scanMedicationImage } from '../services/geminiService';
import { Medication } from '../types';

interface ScannedResult {
  name: string;
  dosage: string;
  usage: string;
  instructions: string;
}

interface MedicationScannerProps {
  // Fix: Omit profileId as it is managed by the App component
  onAddMedication?: (med: Omit<Medication, 'id' | 'profileId'>) => void;
}

const MedicationScanner: React.FC<MedicationScannerProps> = ({ onAddMedication }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScannedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError(null);
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        setCapturedImage(dataUrl);
        processImage(base64);
        stopCamera();
      }
    }
  }, []);

  const processImage = async (base64: string) => {
    setIsScanning(true);
    setResult(null);
    setIsAdded(false);
    try {
      const analysis = await scanMedicationImage(base64);
      setResult(analysis);
    } catch (err) {
      setError('Failed to analyze the medication. Please try a clearer picture.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToSchedule = () => {
    if (result && onAddMedication) {
      // Fix: Object structure now correctly matches Omit<Medication, 'id' | 'profileId'>
      onAddMedication({
        name: result.name,
        dosage: result.dosage,
        frequency: 'Once Daily',
        timeOfDay: ['08:00'],
        instructions: result.instructions || result.usage,
        remaining: 30,
        total: 30,
        reminders: [{
          id: Math.random().toString(36).substr(2, 9),
          time: '08:00',
          enabled: true,
          message: `Time for your ${result.name}`
        }]
      });
      setIsAdded(true);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setResult(null);
    setError(null);
    setIsAdded(false);
    startCamera();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Smart Med Scanner</h2>
        <p className="text-slate-500">Scan your medication bottle to automatically extract details</p>
      </div>

      <div className="relative aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl">
        {!cameraActive && !capturedImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-400">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center">
              <Camera size={40} />
            </div>
            <button 
              onClick={startCamera}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Open Camera
            </button>
          </div>
        )}

        {cameraActive && (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
              <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg"></div>
            </div>
            <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 bg-white border-2 border-slate-400 rounded-full"></div>
              </button>
              <button 
                onClick={stopCamera}
                className="absolute left-6 bottom-6 w-12 h-12 bg-black/40 text-white rounded-full flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm"
              >
                <X size={24} />
              </button>
            </div>
          </>
        )}

        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-10 text-center gap-4">
            <div className="relative">
              <Loader2 size={48} className="animate-spin text-blue-400" />
              <RefreshCw size={20} className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-y-1/2" />
            </div>
            <p className="text-xl font-bold animate-pulse">Healthcare AI Analyzing...</p>
            <p className="text-sm opacity-80 max-w-xs">Extracting medication name, dosage information, and standard instructions from the image.</p>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {result && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center border border-green-100 dark:border-green-800 shadow-sm">
                <Check size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Medication Identified</p>
                <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{result.name}</h3>
              </div>
            </div>
            <button 
              onClick={resetScanner}
              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              <RefreshCw size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Info size={12} /> Dosage
              </p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">{result.dosage}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Info size={12} /> Common Usage
              </p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-medium">{result.usage}</p>
            </div>
          </div>

          <div className="mt-6 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Extracted Instructions</p>
            <p className="text-slate-700 dark:text-slate-300 italic text-sm">{result.instructions || 'No specific instructions detected on label.'}</p>
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              disabled={isAdded}
              onClick={handleAddToSchedule}
              className={`flex-1 py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                isAdded 
                  ? 'bg-green-600 text-white cursor-default' 
                  : 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-95'
              }`}
            >
              {isAdded ? <><Check size={20} /> Saved to List</> : <><Plus size={20} /> Add to Schedule</>}
            </button>
            <button 
              onClick={resetScanner}
              className="px-6 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Retake
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MedicationScanner;
