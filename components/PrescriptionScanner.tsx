
import React, { useState, useRef } from 'react';
import { FileUp, X, Check, Loader2, Sparkles, AlertCircle, Pill, ChevronRight, Edit2, Clock, Calendar, Hash, Save } from 'lucide-react';
import { analyzePrescriptionImage } from '../services/geminiService';
import { Medication } from '../types';

interface ExtractedMed {
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  suggestedTimes: string[];
  selected: boolean;
  isEditing?: boolean;
}

interface PrescriptionScannerProps {
  onClose: () => void;
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
      // Ensure suggested times are present and mapping is sensible
      const mapped = results.map((m: any) => ({
        ...m,
        selected: true,
        isEditing: false,
        // Standardize frequency strings if possible
        frequency: m.frequency || 'Once Daily',
        suggestedTimes: m.suggestedTimes?.length ? m.suggestedTimes : ['08:00']
      }));
      setExtractedMeds(mapped);
      setStep('review');
    } catch (err) {
      setError('Failed to analyze the prescription. Please ensure the image is clear.');
      setStep('upload');
    }
  };

  const toggleMedSelection = (index: number) => {
    setExtractedMeds(prev => prev.map((m, i) => i === index ? { ...m, selected: !m.selected } : m));
  };

  const toggleEditMode = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExtractedMeds(prev => prev.map((m, i) => i === index ? { ...m, isEditing: !m.isEditing } : m));
  };

  const updateMedField = (index: number, field: keyof ExtractedMed, value: any) => {
    setExtractedMeds(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleConfirm = () => {
    const medsToImport: Omit<Medication, 'id' | 'profileId'>[] = extractedMeds
      .filter(m => m.selected)
      .map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions,
        timeOfDay: m.suggestedTimes,
        remaining: 30, // Sensible default for a new prescription
        total: 30,
        reminders: m.suggestedTimes.map(t => ({
          id: Math.random().toString(36).substr(2, 9),
          time: t,
          enabled: true,
          message: `Time for your ${m.name}`
        }))
      }));
    
    onImport(medsToImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <Sparkles size={24} className="text-blue-500 fill-blue-500" />
              Smart Import
            </h3>
            <p className="text-sm text-slate-500 font-medium">Verify and edit extracted health records</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {step === 'upload' && (
            <div className="space-y-8">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-slate-100 rounded-[40px] p-16 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group"
              >
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm">
                  <FileUp size={40} />
                </div>
                <h4 className="text-2xl font-black text-slate-800">Upload Prescription</h4>
                <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2 leading-relaxed">
                  Drop an image here or click to browse. Healthcare AI will handle the transcription.
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
                {[
                  { icon: Pill, label: "Detects Drug Names" },
                  { icon: Clock, label: "Parses Frequencies" },
                  { icon: Calendar, label: "Suggests Schedules" },
                  { icon: Edit2, label: "Allows Full Editing" }
                ].map((feat, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
                      <feat.icon size={18} />
                    </div>
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{feat.label}</span>
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-5 bg-red-50 text-red-700 rounded-3xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-2">
                  <AlertCircle size={24} />
                  <p className="text-sm font-bold">{error}</p>
                </div>
              )}
            </div>
          )}

          {step === 'scanning' && (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-8">
              <div className="relative">
                <div className="w-28 h-28 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                <Sparkles className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={40} />
              </div>
              <div className="space-y-3">
                <h4 className="text-3xl font-black text-slate-800 tracking-tight">AI Analysis Active</h4>
                <p className="text-slate-500 font-medium max-w-sm">Healthcare AI is digitizing your prescription and mapping it to clinical standards.</p>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-blue-600 p-6 rounded-[32px] text-white shadow-xl shadow-blue-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-black">Verify Extraction</h4>
                  <p className="text-blue-100 text-sm font-medium">{extractedMeds.filter(m => m.selected).length} items ready to sync</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Check size={24} strokeWidth={3} />
                </div>
              </div>

              <div className="space-y-4">
                {extractedMeds.map((med, idx) => (
                  <div 
                    key={idx}
                    className={`rounded-[32px] border-2 transition-all overflow-hidden ${
                      med.selected ? 'border-blue-500 bg-white shadow-lg' : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    {med.isEditing ? (
                      <div className="p-6 space-y-4 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-xs font-black text-blue-500 uppercase tracking-widest">Editing Entry</h5>
                          <button onClick={(e) => toggleEditMode(idx, e)} className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Save size={18} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Drug Name</label>
                            <input 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/20"
                              value={med.name}
                              onChange={(e) => updateMedField(idx, 'name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Dosage</label>
                            <input 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/20"
                              value={med.dosage}
                              onChange={(e) => updateMedField(idx, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Frequency</label>
                            <input 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 ring-blue-500/20"
                              value={med.frequency}
                              onChange={(e) => updateMedField(idx, 'frequency', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => toggleMedSelection(idx)}
                        className="p-6 flex items-start gap-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                          med.selected ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <Pill size={28} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h5 className="font-black text-slate-800 text-xl truncate">{med.name}</h5>
                            <button 
                              onClick={(e) => toggleEditMode(idx, e)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                          <p className="text-sm text-slate-500 font-bold mb-3">{med.dosage} • {med.frequency}</p>
                          <div className="flex items-center gap-2">
                             {med.suggestedTimes.map((time, tIdx) => (
                               <span key={tIdx} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100 flex items-center gap-1">
                                 <Clock size={10} /> {time}
                               </span>
                             ))}
                          </div>
                          {med.instructions && (
                            <p className="text-[11px] text-slate-400 mt-3 font-medium italic border-l-2 border-slate-200 pl-3">
                              "{med.instructions}"
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 sticky bottom-0">
          {step === 'review' ? (
            <>
              <button 
                onClick={handleConfirm}
                disabled={extractedMeds.filter(m => m.selected).length === 0}
                className="flex-1 py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                Confirm & Sync <ChevronRight size={20} strokeWidth={3} />
              </button>
              <button 
                onClick={() => setStep('upload')}
                className="px-8 py-5 bg-white text-slate-600 border border-slate-200 rounded-[24px] font-black hover:bg-white/80 transition-all active:scale-95"
              >
                Reset
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="w-full py-5 bg-white text-slate-600 border border-slate-200 rounded-[24px] font-black hover:bg-slate-100 transition-all active:scale-95"
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
