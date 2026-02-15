
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import AIConsultant from './components/AIConsultant';
import MedicationScanner from './components/MedicationScanner';
import ReminderSettings from './components/ReminderSettings';
import PrescriptionScanner from './components/PrescriptionScanner';
import Insights from './components/Insights';
import MedicationAlarm from './components/MedicationAlarm';
import MedicationForm from './components/MedicationForm';
import UserProfile from './components/UserProfile';
import HelpCenter from './components/HelpCenter';
import LogDoseModal from './components/LogDoseModal';
import Auth from './components/Auth';
import { dbService } from './services/dbService';
import { Medication, AdherenceRecord, NavigationTab, Reminder, HealthLog, UserProfile as UserProfileType } from './types';
import { 
  Pill, 
  Loader2,
  Settings,
  Plus,
  Trash2,
  ShieldCheck,
  HeartPulse
} from 'lucide-react';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>(NavigationTab.DASHBOARD);
  
  // Data State
  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherence, setAdherence] = useState<AdherenceRecord[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfileType[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  // UI State
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [editingReminders, setEditingReminders] = useState<Medication | null>(null);
  const [isMedicationFormOpen, setIsMedicationFormOpen] = useState(false);
  const [logDoseMed, setLogDoseMed] = useState<Medication | null>(null);
  
  // Real-time Alarm State
  const [activeAlarm, setActiveAlarm] = useState<{ med: Medication, reminder: Reminder } | null>(null);
  const [lastNotifiedMinute, setLastNotifiedMinute] = useState<string | null>(null);

  // Derived Data (Filtered by active profile)
  const activeMedications = useMemo(() => 
    medications.filter(m => m.profileId === activeProfileId),
    [medications, activeProfileId]
  );
  const activeAdherence = useMemo(() => 
    adherence.filter(a => a.date === new Date().toISOString().split('T')[0] && a.profileId === activeProfileId),
    [adherence, activeProfileId]
  );
  const activeLogs = useMemo(() => 
    healthLogs.filter(l => l.profileId === activeProfileId),
    [healthLogs, activeProfileId]
  );
  const activeProfile = useMemo(() => 
    allProfiles.find(p => p.id === activeProfileId) || allProfiles[0] || null,
    [allProfiles, activeProfileId]
  );

  const fetchData = useCallback(async () => {
    // If no one is logged in, reset and show Auth
    if (!dbService.activeEmail) {
      setMedications([]);
      setAdherence([]);
      setHealthLogs([]);
      setAllProfiles([]);
      setLoading(false);
      setIsInitialized(false);
      return;
    }

    setLoading(true);
    try {
      // Check server status
      const serverOnline = await dbService.isServerOnline();
      setIsOffline(!serverOnline);

      // Fetch all data
      const [meds, records, logs, profile] = await Promise.all([
        dbService.getMedications(),
        dbService.getAdherence(),
        dbService.getLogs(),
        dbService.getUserProfile(),
      ]);
      
      setMedications(meds || []);
      setAdherence(records || []);
      setHealthLogs(logs || []);
      
      if (profile) {
        setAllProfiles([profile]);
        setActiveProfileId(profile.id);
      } else {
        // Fallback to local profile if server returned null
        const cachedProfile = dbService.getLocal('user_profile', null);
        if (cachedProfile) {
          setAllProfiles([cachedProfile]);
          setActiveProfileId(cachedProfile.id);
        }
      }
      
      // Critical: If we have an active email, we are authenticated. 
      // Proceed to initialization regardless of profile completeness.
      setIsInitialized(true);
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      setIsOffline(true);
      
      // On error, attempt to load local cache
      const cachedProfile = dbService.getLocal('user_profile', null);
      if (cachedProfile) {
        setAllProfiles([cachedProfile]);
        setActiveProfileId(cachedProfile.id);
      }
      
      // If we have an email, we must allow access to the dashboard (Offline Mode)
      if (dbService.activeEmail) {
        setIsInitialized(true);
      } else {
        setIsInitialized(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  // Alarm Monitoring Logic
  useEffect(() => {
    if (!isInitialized) return;
    const checkAlarms = () => {
      const now = new Date();
      const currentMinute = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      if (currentMinute === lastNotifiedMinute) return;
      activeMedications.forEach(med => {
        med.reminders.forEach(reminder => {
          if (reminder.enabled && reminder.time === currentMinute) {
            triggerAlarm(med, reminder);
            setLastNotifiedMinute(currentMinute);
          }
        });
      });
    };
    const triggerAlarm = (med: Medication, reminder: Reminder) => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`Healthcare AI: ${med.name}`, {
          body: `Time for your dose: ${reminder.message || med.dosage}`,
          icon: 'https://cdn-icons-png.flaticon.com/512/883/883356.png'
        });
      }
      setActiveAlarm({ med, reminder });
    };
    const intervalId = setInterval(checkAlarms, 15000);
    return () => clearInterval(intervalId);
  }, [activeMedications, lastNotifiedMinute, isInitialized]);

  const handleIdentitySuccess = async (user: { name: string; email: string, id?: string }) => {
    setLoading(true);
    try {
      // dbService.activeEmail is already set inside dbService.signIn/signUp
      let profile = await dbService.getUserProfile();
      
      if (!profile || profile.email !== user.email) {
        profile = {
          id: user.id || `user-${Math.random().toString(36).substr(2, 9)}`,
          name: user.name,
          email: user.email,
          phone: '',
          age: '',
          weight: '',
          bloodType: '',
          notifications: { enabled: true }
        };
        await dbService.saveUserProfile(profile);
      }
    } catch (err) {
      console.warn("Could not sync profile during login, continuing in local mode.");
    } finally {
      // Always call fetchData to finalize state and set isInitialized(true)
      await fetchData();
    }
  };

  const handleLogout = useCallback(() => {
    // Immediate logout to satisfy "remove this" regarding any intrusive UI steps
    dbService.clearActiveUser();
    
    // Reset All States
    setMedications([]);
    setAdherence([]);
    setHealthLogs([]);
    setAllProfiles([]);
    setActiveProfileId('');
    
    // Force clean Auth state
    setLoading(false); 
    setIsInitialized(false);
    setActiveTab(NavigationTab.DASHBOARD);
  }, []);

  const handleSwitchProfile = (id: string) => {
    setActiveProfileId(id);
    setActiveTab(NavigationTab.DASHBOARD);
  };

  const handleAddMedication = async (med: Omit<Medication, 'id' | 'profileId'>) => {
    const newMed: Medication = {
      ...med,
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId
    };
    const updatedMeds = [...medications, newMed];
    setMedications(updatedMeds);
    setIsMedicationFormOpen(false);
    setIsSyncing(true);
    await dbService.saveMedications(updatedMeds);
    setIsSyncing(false);
  };

  const handleDeleteMedication = async (medId: string) => {
    if (!confirm("Delete this medication record from the database?")) return;
    const updatedMeds = medications.filter(m => m.id !== medId);
    setMedications(updatedMeds);
    setIsSyncing(true);
    await dbService.deleteMedication(medId);
    setIsSyncing(false);
  };

  const handleUpdateProfile = async (newProfile: UserProfileType) => {
    const updatedProfiles = allProfiles.map(p => p.id === newProfile.id ? newProfile : p);
    setAllProfiles(updatedProfiles);
    setIsSyncing(true);
    await dbService.saveUserProfile(newProfile);
    setIsSyncing(false);
  };

  const handleMarkTaken = async (medId: string, customTime?: string, customDate?: string) => {
    const record: AdherenceRecord = {
      date: customDate || new Date().toISOString().split('T')[0],
      profileId: activeProfileId,
      medicationId: medId,
      taken: true,
      timeTaken: customTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    const updatedMeds = medications.map(m => m.id === medId ? { ...m, remaining: Math.max(0, m.remaining - 1) } : m);
    setMedications(updatedMeds);
    const updatedAdherence = [...adherence, record];
    setAdherence(updatedAdherence);
    setActiveAlarm(null);
    setLogDoseMed(null);
    setIsSyncing(true);
    await Promise.all([dbService.saveMedications(updatedMeds), dbService.saveAdherence(updatedAdherence)]);
    setIsSyncing(false);
  };

  const renderContent = () => {
    if (loading && !isInitialized) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-slate-400 bg-white">
          <div className="relative mb-8">
            <Loader2 size={64} className="animate-spin text-blue-600" />
            <HeartPulse size={24} className="absolute inset-0 m-auto text-blue-400 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Accessing Health Database</h3>
          <p className="text-slate-400 font-medium mt-2">Retrieving your secure medical records...</p>
        </div>
      );
    }
    switch (activeTab) {
      case NavigationTab.DASHBOARD: return <Dashboard medications={activeMedications} adherence={activeAdherence} userProfile={activeProfile} onMarkTakenClick={(med) => setLogDoseMed(med)} onAddClick={() => setIsMedicationFormOpen(true)} />;
      case NavigationTab.AI_CONSULT: return <AIConsultant />;
      case NavigationTab.SCAN: return <MedicationScanner onAddMedication={handleAddMedication} />;
      case NavigationTab.MEDICATIONS:
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Schedule for {activeProfile?.name || 'User'}</h2>
                <p className="text-sm text-slate-500 font-medium">Synced with your secure medical database</p>
              </div>
              <button onClick={() => setIsMedicationFormOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 flex items-center gap-2 active:scale-95 transition-all"><Plus size={18} strokeWidth={3} /> Add New Med</button>
            </div>
            {activeMedications.length === 0 ? (
              <div className="bg-white p-20 rounded-[40px] border border-slate-200 text-center flex flex-col items-center shadow-sm">
                <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mb-6"><Pill size={40} /></div>
                <h3 className="text-2xl font-black text-slate-800">No active medications</h3>
                <p className="text-slate-500 max-w-sm mt-2">Add your first prescription to start tracking your health journey in our database.</p>
                <button onClick={() => setIsMedicationFormOpen(true)} className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">Start Adding</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeMedications.map(med => (
                  <div key={med.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform"><Pill size={24} /></div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingReminders(med)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Settings size={18} /></button>
                          <button onClick={() => handleDeleteMedication(med.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-800">{med.name}</h3>
                      <p className="text-slate-500 text-sm mb-4 font-medium">{med.dosage} • {med.frequency}</p>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Stock Level</span>
                        <span className={med.remaining < 5 ? 'text-orange-500' : 'text-slate-700'}>{med.remaining} Left</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${med.remaining < 5 ? 'bg-orange-500' : 'bg-blue-600'}`} style={{ width: `${(med.remaining / med.total) * 100}%` }}></div>
                      </div>
                      <button onClick={() => setLogDoseMed(med)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all">Log Dose</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case NavigationTab.PROFILE: return activeProfile ? <UserProfile profile={activeProfile} onUpdate={handleUpdateProfile} /> : null;
      case NavigationTab.INSIGHTS: return <Insights medications={activeMedications} adherence={activeAdherence} healthLogs={activeLogs} onExport={() => {}} />;
      case NavigationTab.HELP_CENTER: return <HelpCenter />;
      default: return null;
    }
  };

  if (!isInitialized && !loading) {
    return <Auth onAuthSuccess={handleIdentitySuccess} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-x-hidden transition-colors duration-300">
      {isInitialized && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout} 
          profiles={allProfiles}
          activeProfileId={activeProfileId}
          onSwitchProfile={handleSwitchProfile}
          onAddProfile={() => setActiveTab(NavigationTab.PROFILE)}
        />
      )}
      <main className={`flex-1 ${isInitialized ? 'md:ml-64' : ''} p-4 md:p-8 pt-safe`}>
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
      {isInitialized && <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      {editingReminders && <ReminderSettings medication={editingReminders} onClose={() => setEditingReminders(null)} onUpdateReminders={(id, rems) => { const updatedMeds = medications.map(m => m.id === id ? { ...m, reminders: rems } : m); setMedications(updatedMeds); dbService.saveMedications(updatedMeds); setEditingReminders(null); }} />}
      {isMedicationFormOpen && <MedicationForm onClose={() => setIsMedicationFormOpen(false)} onSave={handleAddMedication} />}
      {logDoseMed && <LogDoseModal medication={logDoseMed} onClose={() => setLogDoseMed(null)} onLog={handleMarkTaken} />}
      {activeAlarm && <MedicationAlarm medication={activeAlarm.med} reminder={activeAlarm.reminder} onDismiss={() => setActiveAlarm(null)} onTake={(id) => setLogDoseMed(activeMedications.find(m => m.id === id) || null)} />}
    </div>
  );
};

export default App;
