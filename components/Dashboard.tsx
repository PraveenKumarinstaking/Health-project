import React, { useMemo } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  Pill,
  ChevronRight,
  Plus,
  Activity,
  Calendar
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
  onLogVitalClick: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  medications, 
  adherence, 
  userProfile, 
  onMarkTakenClick, 
  onAddClick,
  onLogVitalClick
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  const todaysAdherence = adherence.filter(a => a.date === today);
  const takenCount = todaysAdherence.filter(a => a.taken).length;
  const totalMeds = medications.length;

  const stockAlerts = useMemo(() => {
    return medications.map(med => {
      const activeReminders = med.reminders.filter(r => r.enabled).length || 1;
      const daysLeft = Math.floor(med.remaining / activeReminders);
      return { ...med, daysLeft };
    }).filter(m => m.daysLeft <= 7)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [medications]);

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
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome, {userProfile?.name?.split(' ')[0] || 'User'}
          </h2>
          <p className="text-slate-500 text-sm">Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onLogVitalClick}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-standard text-sm font-semibold flex items-center gap-2"
          >
            <Activity size={16} /> Log Vitals
          </button>
          <button 
            onClick={onAddClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-standard text-sm font-semibold flex items-center gap-2"
          >
            <Plus size={16} /> Add Medication
          </button>
        </div>
      </header>

      {totalMeds === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Pill size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Start your health tracking</h3>
          <p className="text-slate-500 max-w-sm mb-6">Add your first medication or scan a prescription to begin.</p>
          <button 
            onClick={onAddClick}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
          >
            Add Now
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adherence</p>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{Math.round((takenCount / (totalMeds || 1)) * 100)}%</h3>
              <p className="text-sm text-slate-500">{takenCount} of {totalMeds} doses taken</p>
              <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${(takenCount / (totalMeds || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Dose</p>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Clock size={18} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{nextReminder?.time || '--:--'}</h3>
              <p className="text-sm text-indigo-600 font-medium truncate">{nextReminder?.medName || 'No alerts scheduled'}</p>
            </div>

            <div className={`card p-6 ${stockAlerts.length > 0 ? 'bg-amber-50 border-amber-200' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <p className={`text-xs font-bold uppercase tracking-wider ${stockAlerts.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>Refills</p>
                <div className={`p-2 rounded-lg ${stockAlerts.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Activity size={18} />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">
                {stockAlerts.length > 0 ? stockAlerts.length : 'OK'}
              </h3>
              <p className="text-sm text-slate-500">
                {stockAlerts.length > 0 ? 'Items need restocking' : 'All stocks are healthy'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card overflow-hidden flex flex-col h-[400px]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-slate-900">Today's Schedule</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Times in 24h</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
                {allReminders.map((rem, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 rounded-lg transition-standard ${
                    rem.time < currentTime 
                      ? 'bg-slate-50 opacity-50' 
                      : 'hover:bg-slate-50'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center">
                        <Pill size={20} />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900">{rem.medName}</h5>
                        <p className="text-xs text-slate-500">{rem.time}</p>
                      </div>
                    </div>
                    {rem.time >= currentTime && (
                      <button 
                        onClick={() => onMarkTakenClick(rem.medObject)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-standard"
                      >
                        Take
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 flex flex-col h-[400px]">
              <h4 className="font-bold text-slate-900 mb-6">Weekly Performance</h4>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="percentage" radius={[4, 4, 4, 4]} barSize={32}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isToday ? '#2563eb' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;