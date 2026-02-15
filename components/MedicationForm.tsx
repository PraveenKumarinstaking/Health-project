
import React, { useState } from 'react';
import { X, Pill, Save, Hash, Info, Calendar, MessageSquareText, Clock, Plus, Trash2, ListChecks } from 'lucide-react';
import { Medication, Reminder } from '../types';

interface MedicationFormProps {
  onClose: () => void;
  // Fix: Omit profileId as it is assigned by App.tsx based on the active profile
  onSave: (med: Omit<Medication, 'id' | 'profileId'>) => void;
}

const MedicationForm: React.FC<MedicationFormProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'Once Daily',
    total: 30,
    instructions: '',
    reminderTimes: ['08:00'],
    reminderMessage: ''
  });

  const handleAddTime = () => {
    setFormData({ ...formData, reminderTimes: [...formData.reminderTimes, '12:00'] });
  };

  const handleRemoveTime = (index: number) => {
    if (formData.reminderTimes.length > 1) {
      const updated = formData.reminderTimes.filter((_, i) => i !== index);
      setFormData({ ...formData, reminderTimes: updated });
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const updated = [...formData.reminderTimes];
    updated[index] = value;
    setFormData({ ...formData, reminderTimes: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.dosage) return;

    // Fix: Object structure now matches Omit<Medication, 'id' | 'profileId'>
    onSave({
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      timeOfDay: formData.reminderTimes,
      remaining: formData.total,
      total: formData.total,
      instructions: formData.instructions,
      reminders: formData.reminderTimes.map(time => ({
        id: Math.random().toString(36).substr(2, 9),
        time: time,
        enabled: true,
        message: formData.reminderMessage || `Time for your ${formData.name}`
      }))
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manual Entry</h3>
            <p className="text-sm text-slate-500 font-medium">Add a new medication to your schedule</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medication Details</label>
              <div className="relative">
                <Pill className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  autoFocus
                  required
                  type="text" 
                  placeholder="Medication Name (e.g. Lipitor)"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosage</label>
              <div className="relative">
                <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="text" 
                  placeholder="e.g. 20mg"
                  value={formData.dosage}
                  onChange={e => setFormData({...formData, dosage: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium appearance-none"
                >
                  <option>Once Daily</option>
                  <option>Twice Daily</option>
                  <option>Three Times Daily</option>
                  <option>Four Times Daily</option>
                  <option>As Needed</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Quantity</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  required
                  type="number" 
                  value={formData.total}
                  onChange={e => setFormData({...formData, total: parseInt(e.target.value) || 0})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructions</label>
              <div className="relative">
                <ListChecks className="absolute left-4 top-4 text-slate-400" size={18} />
                <textarea 
                  placeholder="e.g. Take with food, avoid alcohol..."
                  rows={1}
                  value={formData.instructions}
                  onChange={e => setFormData({...formData, instructions: e.target.value})}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium resize-none min-h-[56px]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Reminders</label>
              <button 
                type="button" 
                onClick={handleAddTime}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors"
              >
                <Plus size={14} /> Add Time
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formData.reminderTimes.map((time, idx) => (
                <div key={idx} className="relative group">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    className="w-full pl-9 pr-8 py-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 font-bold focus:outline-none focus:ring-2 ring-blue-500/20 transition-all text-sm"
                  />
                  {formData.reminderTimes.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTime(idx)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reminder Message (Optional)</label>
            <div className="relative">
              <MessageSquareText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Custom alert note..."
                value={formData.reminderMessage}
                onChange={e => setFormData({...formData, reminderMessage: e.target.value})}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
          <button 
            type="submit"
            onClick={handleSubmit}
            className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Save size={20} strokeWidth={3} /> Save Medication
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicationForm;
