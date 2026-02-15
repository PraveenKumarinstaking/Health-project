
import React, { useState, useRef } from 'react';
import { FileUp, Camera, X, Check, Loader2, Sparkles, AlertCircle, Trash2, Pill, ChevronRight } from 'lucide-react';
import { analyzePrescriptionImage } from '../services/geminiService';
import { Medication, Reminder } from '../types';

interface ExtractedMed {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  suggestedTimes: string[];
  selected: boolean;
}

interface PrescriptionScannerProps {
  onClose: () => void;
  // Fix: Omit id and profileId as they are managed by the parent component (App.tsx)
  onImport: (meds: Omit<Medication, 'id' | 'profileId'>[]) => void;
}

const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({ onClose, onImport }) => {
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload');
  const [extractedMeds, setExtractedMeds] = useState<ExtractedMed[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setStep('scanning');
    setError(null);
    try {
      const results = await analyzePrescriptionImage(base64);
      setExtractedMeds(results.map((m: any) => ({ ...m, selected: true })));
      setStep('review');
    } catch (err) {
      setError('Failed to analyze the prescription. Please ensure the image is clear.');
      setStep('upload');
    }
  };

  const toggleMed = (index: number) => {
    setExtractedMeds(prev => prev.map((m, i) => i === index ? { ...m, selected: !m.selected } : m));
  };

  const handleConfirm = () => {
    // Fix: Corrected type to Omit<Medication, 'id' | 'profileId'>[] and removed manual id generation for the medication object
    const medsToImport: Omit<Medication, 'id' | 'profileId'>[] = extractedMeds
      .filter(m => m.selected)
      .map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions,
        timeOfDay: m.suggestedTimes || ['08:00'],
        remaining: 30,
        total: 30,
        reminders: (m.suggestedTimes || ['08:00']).map(t => ({
          id: Math.random().toString(36).substr(2, 9),
          time: t,
          enabled: true
        }))
      }));
    
    onImport(medsToImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-blue-500 fill-blue-500" />
              Prescription Bulk Import
            </h3>
            <p className="text-sm text-slate-500">Extract multiple medications using Healthcare AI</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <FileUp size={32} />
                </div>
                <h4 className="text-lg font-bold text-slate-700">Upload Prescription</h4>
                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                  Drop an image here or click to browse. Works with JPG, PNG, and PDF.
                </p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-500">
                    <Check size={16} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">Identifies Drug Names</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-blue-500">
                    <Check size={16} />
                  </div>
                  <span className="text-xs font-medium text-slate-600">Extracts Dosages</span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-3 animate-shake">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'scanning' && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800">Healthcare AI Analysis in Progress</h4>
                <p className="text-slate-500 max-w-xs mt-2">Healthcare AI is reading your prescription to identify all listed medications.</p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-700">
                  {extractedMeds.filter(m => m.selected).length} Items Selected
                </span>
                <span className="text-xs text-blue-500 bg-white px-2 py-1 rounded-full border border-blue-100 font-bold uppercase">
                  Verify before importing
                </span>
              </div>

              {extractedMeds.map((med, idx) => (
                <div 
                  key={idx}
                  onClick={() => toggleMed(idx)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    med.selected ? 'border-blue-500 bg-white shadow-md' : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                      med.selected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Pill size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h5 className="font-bold text-slate-800 text-lg">{med.name}</h5>
                        {med.selected && <Check className="text-blue-600" size={20} />}
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{med.dosage} • {med.frequency}</p>
                      {med.instructions && (
                        <p className="text-xs text-slate-400 mt-2 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{med.instructions}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 sticky bottom-0">
          {step === 'review' ? (
            <>
              <button 
                onClick={handleConfirm}
                disabled={extractedMeds.filter(m => m.selected).length === 0}
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                Import Selected <ChevronRight size={20} />
              </button>
              <button 
                onClick={() => setStep('upload')}
                className="px-6 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-100 transition-all"
              >
                Start Over
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionScanner;
