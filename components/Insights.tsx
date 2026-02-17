
import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  Download, 
  Share2, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Info,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  Search as SearchIcon,
  Filter,
  History,
  Pill,
  HeartPulse,
  X,
  Mail,
  Loader2
} from 'lucide-react';
import { Medication, AdherenceRecord, HealthLog } from '../types';
import { dbService } from '../services/dbService';
import { analyzeHealthQuery } from '../services/geminiService';

interface InsightsProps {
  medications: Medication[];
  adherence: AdherenceRecord[];
  healthLogs: HealthLog[];
  onExport: () => void;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

const Insights: React.FC<InsightsProps> = ({ medications, adherence, healthLogs, onExport }) => {
  const [selectedMetric, setSelectedMetric] = useState<'blood_pressure' | 'glucose' | 'weight' | 'mood'>('blood_pressure');
  const [historySearch, setHistorySearch] = useState('');
  const [isEmailing, setIsEmailing] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Adherence Chart Data
  const adherenceData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayRecords = adherence.filter(a => a.date === date);
      const taken = dayRecords.filter(a => a.taken).length;
      const expected = medications.length || 1; 
      const percentage = Math.min(Math.round((taken / expected) * 100), 100);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date,
        percentage,
        doses: taken
      };
    });
  }, [adherence, medications]);

  const handleEmailReport = async () => {
    setIsEmailing(true);
    setEmailStatus('idle');
    try {
      const reportContext = `Generate a detailed health progress report summary for a patient. 
      Medications tracked: ${medications.map(m => m.name).join(', ')}. 
      Weekly average adherence: ${Math.round(adherenceData.reduce((a, b) => a + b.percentage, 0) / 7)}%. 
      Vitals logged: ${healthLogs.length} records. 
      Format this as a professional medical report summary that can be shared with a doctor.`;
      
      const report = await analyzeHealthQuery(reportContext, []);
      const success = await dbService.sendEmail('Healthcare AI: Your Comprehensive Health Report', report, dbService.activeEmail);
      
      if (success) {
        setEmailStatus('success');
        setTimeout(() => setEmailStatus('idle'), 3000);
      } else {
        throw new Error();
      }
    } catch (err) {
      setEmailStatus('error');
      setTimeout(() => setEmailStatus('idle'), 3000);
    } finally {
      setIsEmailing(false);
    }
  };

  // Unified Searchable History (Adherence + Logs)
  const unifiedHistory = useMemo(() => {
    const medEntries = adherence.map(a => {
      const med = medications.find(m => m.id === a.medicationId);
      return {
        type: 'med' as const,
        id: `med-${a.medicationId}-${a.date}-${a.timeTaken}`,
        title: med?.name || 'Unknown Medication',
        subtitle: `Dose: ${med?.dosage || 'N/A'}`,
        date: a.date,
        time: a.timeTaken || '00:00',
        status: a.taken ? 'Taken' : 'Missed',
        fullText: `${med?.name} ${a.date} ${a.timeTaken} taken dose`
      };
    });

    const logEntries = healthLogs.map(l => ({
      type: 'log' as const,
      id: `log-${l.id}`,
      title: l.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      subtitle: `${l.value} ${l.unit}`,
      date: l.date,
      time: 'Logged',
      status: 'Recorded',
      fullText: `${l.type} ${l.value} ${l.unit} ${l.date} log metric`
    }));

    return [...medEntries, ...logEntries].sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.type === 'med' ? a.time : '00:00'}`);
      const dateB = new Date(`${b.date} ${b.type === 'med' ? b.time : '00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [adherence, healthLogs, medications]);

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return unifiedHistory.slice(0, 15);
    const term = historySearch.toLowerCase();
    return unifiedHistory.filter(item => 
      item.fullText.toLowerCase().includes(term) ||
      item.title.toLowerCase().includes(term) ||
      item.date.includes(term)
    );
  }, [unifiedHistory, historySearch]);

  const inventoryData = useMemo(() => {
    return medications.map((m, i) => ({
      name: m.name,
      value: m.remaining,
      color: COLORS[i % COLORS.length]
    }));
  }, [medications]);

  const lowStockMedsList = useMemo(() => {
    return medications.map(med => {
      const activeReminders = med.reminders.filter(r => r.enabled).length || 1;
      const daysLeft = Math.floor(med.remaining / activeReminders);
      return { ...med, daysLeft };
    }).filter(m => m.daysLeft <= 7);
  }, [medications]);

  const stats = useMemo(() => {
    const avgAdherence = adherenceData.reduce((acc, curr) => acc + curr.percentage, 0) / (adherenceData.length || 1);
    const trend = adherenceData.length >= 2 
      ? adherenceData[adherenceData.length - 1].percentage - adherenceData[adherenceData.length - 2].percentage
      : 0;

    return {
      avgAdherence: Math.round(avgAdherence),
      trend,
      metricsLogged: healthLogs.length,
      lowStockCount: lowStockMedsList.length
    };
  }, [adherenceData, healthLogs, lowStockMedsList]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-100 shadow-2xl rounded-2xl ring-1 ring-black/5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-sm font-black text-slate-800">
              {payload[0].value}% Adherence
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Health Insights</h2>
          <p className="text-slate-500 font-medium">Deep dive into your longitudinal treatment progress</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            disabled={isEmailing}
            onClick={handleEmailReport}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${
              emailStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isEmailing ? <Loader2 size={18} className="animate-spin" /> : emailStatus === 'success' ? <CheckCircle size={18} /> : <Mail size={18} />}
            {emailStatus === 'success' ? 'Report Sent' : 'Email Report'}
          </button>
          <button 
            onClick={onExport}
            className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={18} /> Full Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Adherence</p>
          <div className="flex items-center justify-between">
            <h4 className="text-2xl font-black text-slate-800">{stats.avgAdherence}%</h4>
            <div className={`flex items-center gap-1 text-xs font-bold ${stats.trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(stats.trend)}%
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Metrics Logged</p>
          <h4 className="text-2xl font-black text-slate-800">{stats.metricsLogged}</h4>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Supply Alerts</p>
          <h4 className={`text-2xl font-black ${stats.lowStockCount > 0 ? 'text-orange-500' : 'text-slate-800'}`}>
            {stats.lowStockCount} Low
          </h4>
        </div>
        <div className="bg-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-100">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Health Status</p>
          <h4 className="text-2xl font-black">Optimized</h4>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Chart Card */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-[420px] transition-all hover:shadow-md">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Activity size={20} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Weekly Adherence</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Goal: 90%
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 10 }} />
                <Bar 
                  dataKey="percentage" 
                  name="percentage"
                  fill="#3b82f6" 
                  radius={[10, 10, 4, 4]} 
                  barSize={32}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Searchable History Card */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-[420px] transition-all hover:shadow-md overflow-hidden">
          <div className="flex flex-col gap-6 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <History size={20} />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">History Explorer</h3>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">
                {unifiedHistory.length} Total Entries
              </div>
            </div>

            {/* Unified Search Bar */}
            <div className="relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Search meds, metrics, or dates..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/10 focus:bg-white transition-all text-sm font-medium"
              />
              {historySearch && (
                <button 
                  onClick={() => setHistorySearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-1 pb-4">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-100 hover:bg-white hover:shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${
                      item.type === 'med' 
                        ? 'bg-blue-50 text-blue-600 border-blue-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {item.type === 'med' ? <Pill size={18} /> : <HeartPulse size={18} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</span>
                         <span className="w-1 h-1 bg-slate-300 rounded-full" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${item.type === 'med' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                      {item.subtitle}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <SearchIcon size={48} className="mb-4 opacity-10" />
                <p className="font-bold">No entries found for "{historySearch}"</p>
                <p className="text-sm mt-1">Try searching by medication name or date (YYYY-MM-DD).</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supply Pie Chart */}
        <div className="lg:col-span-1 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Info size={18} className="text-blue-500" />
            Supply Status
          </h3>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {inventoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">{medications.length}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Meds</span>
            </div>
          </div>
          <div className="space-y-2 mt-4 overflow-y-auto max-h-[100px] scrollbar-hide">
             {inventoryData.slice(0, 3).map((item) => (
               <div key={item.name} className="flex items-center justify-between text-xs">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                   <span className="font-bold text-slate-600 truncate max-w-[120px]">{item.name}</span>
                 </div>
                 <span className="font-black text-slate-800">{item.value} left</span>
               </div>
             ))}
          </div>
        </div>

        {/* AI Health Brief */}
        <div className={`lg:col-span-2 p-10 rounded-[40px] text-white shadow-xl flex flex-col justify-between transition-all ${lowStockMedsList.length > 0 ? 'bg-gradient-to-br from-red-900 to-slate-900 ring-4 ring-red-500/20' : 'bg-gradient-to-br from-indigo-900 to-slate-900'}`}>
          <div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${lowStockMedsList.length > 0 ? 'bg-red-500' : 'bg-white/10'}`}>
              {lowStockMedsList.length > 0 ? <AlertTriangle size={24} /> : <FileText size={24} className="text-blue-400" />}
            </div>
            <h3 className="text-2xl font-black mb-4">AI Health Summary</h3>
            <div className="text-indigo-100/70 text-sm leading-relaxed mb-6 space-y-4">
              <p>
                Your latest 7-day adherence is {stats.avgAdherence}%. Trends show your {selectedMetric.replace('_', ' ')} management is stable.
              </p>
              {lowStockMedsList.length > 0 && (
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <p className="font-bold text-white mb-2">Supply Warning:</p>
                  <ul className="space-y-1">
                    {lowStockMedsList.map(med => (
                      <li key={med.id} className="flex justify-between items-center text-red-200">
                        <span>• {med.name}</span>
                        <span className="font-black">{med.daysLeft} days remaining</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className={`flex-1 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${lowStockMedsList.length > 0 ? 'bg-white text-red-900 hover:bg-red-50' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/40'}`}>
              {lowStockMedsList.length > 0 ? 'Request Urgent Refills' : 'Auto-Refill Request'}
            </button>
            <button 
              onClick={handleEmailReport}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold transition-all active:scale-95"
            >
              Email My Brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
