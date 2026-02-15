import React, { useMemo } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Pill,
  ChevronRight,
  ClipboardList,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { Medication, AdherenceRecord, UserProfile } from '../types';

interface DashboardProps {
  medications: Medication[];
  adherence: AdherenceRecord[];
  userProfile: UserProfile | null;
  onMarkTakenClick: (med: Medication) => void;
  onAddClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ medications, adherence, userProfile, onMarkTakenClick, onAddClick }) => {
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  const todaysAdherence = adherence.filter(a => a.date === today);
  const takenCount = todaysAdherence.filter(a => a.taken).length;
  const totalMeds = medications.length;

  // Helper to estimate daily consumption
  const getDosesPerDay = (med: Medication) => {
    const activeReminders = med.reminders.filter(r => r.enabled).length;
    if (activeReminders > 0) return activeReminders;
    const freq = med.frequency.toLowerCase();
    if (freq.includes('twice')) return 2;
    if (freq.includes('three')) return 3;
    if (freq.includes('four')) return 4;
    return 1;
  };

  // Calculate stock status
  const stockAlerts = useMemo(() => {
    return medications.map(med => {
      const dosesPerDay = getDosesPerDay(med);
      const daysLeft = Math.floor(med.remaining / dosesPerDay);
      return { ...med, daysLeft };
    }).filter(m => m.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [medications]);

  // Find the closest upcoming reminder
  const allReminders = medications.flatMap(med => 
    med.reminders
      .filter(r => r.enabled)
      .map(r => ({ ...r, medName: med.name, medObject: med }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  const nextReminder = allReminders.find(r => r.time > currentTime) || allReminders[0];

  const weeklyData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const currentDayIdx = (now.getDay() + 6) % 7; 

    return days.map((day, idx) => {
      const percentage = idx <= currentDayIdx ? [40, 80, 60, 95, 70, 50, 85][idx] : 0;
      return { day, percentage, isToday: idx === currentDayIdx };
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {userProfile?.name?.split(' ')[0] || 'Health Hero'}
          </h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Your health journey is looking great today.</p>
        </div>
        <div className="flex gap-2">
          {totalMeds > 0 && (
            <button 
              onClick={() => onMarkTakenClick(medications[0])}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-bold active:scale-95"
            >
              <ClipboardList size={18} /> Log Past Dose
            </button>
          )}
          <button className="hidden md:block relative p-2.5 text-slate-400 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      </header>

      {totalMeds === 0 ? (
        <div className="bg-white p-12 md:p-16 rounded-[40px] border border-slate-200 shadow-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-700">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
            <Pill size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">No Medications Found</h3>
          <p className="text-slate-500 max-w-sm font-medium mb-8">
            You haven't added any medications to your schedule yet. Start tracking to receive AI-powered health insights.
          </p>
          <button 
            onClick={onAddClick}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-3 active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Add Your First Medication
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 md:p-8 rounded-[32px] md:rounded-[40px] text-white shadow-xl shadow-blue-100 active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-6">
                <CheckCircle2 size={24} className="opacity-80" />
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/20 rounded-full">Compliance</span>
              </div>
              <p className="text-xs md:text-sm opacity-80 font-medium mb-1">Total Adherence</p>
              <div className="flex items-end gap-3">
                <h3 className="text-4xl md:text-5xl font-black">{Math.round((takenCount / (totalMeds || 1)) * 100)}%</h3>
                <p className="text-xs md:text-sm mb-1.5 opacity-80 font-bold">{takenCount}/{totalMeds} doses</p>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Clock size={24} />
                </div>
                <TrendingUp size={20} className="text-green-500" />
              </div>
              <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Next Dosage</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800">{nextReminder?.time || '--:--'}</h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium truncate mt-1">{nextReminder?.medName || 'No alerts set'}</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-200 shadow-sm active:scale-[0.98] transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center ${stockAlerts.length > 0 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-green-50 text-green-500'}`}>
                  <AlertCircle size={24} />
                </div>
                {userProfile && (
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">
                    {userProfile.weight || '75'} kg
                  </div>
                )}
              </div>
              <p className="text-[10px] md:text-sm text-slate-400 font-bold uppercase tracking-widest mb-1">Stock Alerts</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800">
                {stockAlerts.length > 0 ? `${stockAlerts.length} Refills Needed` : 'Levels Good'}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 truncate">
                {stockAlerts.length > 0 
                  ? `${stockAlerts[0].name} (${stockAlerts[0].daysLeft} days)`
                  : 'All supplies adequate'
                }
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-200 p-6 md:p-8 shadow-sm overflow-hidden flex flex-col h-[380px] md:h-[400px]">
              <h4 className="font-black text-slate-800 text-base md:text-lg mb-4 md:mb-6 flex items-center gap-2">
                <Clock className="text-blue-500" size={20} />
                Schedule
              </h4>
              <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pr-2 scrollbar-hide">
                {allReminders.length > 0 ? (
                  allReminders.map((rem, idx) => (
                    <div key={`${rem.medName}-${idx}`} className={`flex items-center justify-between p-3 md:p-4 rounded-[24px] md:rounded-3xl border transition-all ${
                      rem.time < currentTime 
                        ? 'bg-slate-50 border-slate-100 opacity-60' 
                        : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center border shadow-sm ${
                          rem.time < currentTime 
                            ? 'bg-slate-200 text-slate-400' 
                            : 'bg-white text-blue-600 border-slate-200'
                        }`}>
                          <Pill size={24} className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm md:text-base truncate max-w-[120px] md:max-w-none">{rem.medName}</h5>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rem.time}</p>
                        </div>
                      </div>
                      {rem.time >= currentTime && (
                        <button 
                          onClick={() => onMarkTakenClick(rem.medObject)}
                          className="px-4 md:px-5 py-2 md:py-2.5 bg-blue-600 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
                        >
                          Take
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 text-slate-400 italic font-medium">No scheduled reminders.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[32px] md:rounded-[40px] border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col h-[300px] md:h-[400px]">
              <h4 className="font-black text-slate-800 text-base md:text-lg mb-4 md:mb-6 flex items-center gap-2">
                <TrendingUp className="text-green-500" size={20} />
                Weekly Performance
              </h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                              {payload[0].value}% Adherence
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="percentage" radius={[8, 8, 8, 8]} barSize={24}>
                      {weeklyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isToday ? '#3b82f6' : '#eff6ff'} 
                          stroke={entry.isToday ? 'none' : '#dbeafe'}
                          strokeWidth={1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {stockAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-100 p-5 md:p-6 rounded-[32px] md:rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center text-red-500 shadow-sm">
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h4 className="text-base md:text-lg font-black text-red-900 leading-tight">Medication Supply Critical</h4>
                  <p className="text-xs md:text-sm text-red-700">Refill recommended soon for {stockAlerts.length} items.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <button className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95">
                  Refill All <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;