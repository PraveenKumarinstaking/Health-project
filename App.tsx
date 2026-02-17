
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import AIConsultant from './components/AIConsultant';
import HealthScanner from './components/MedicationScanner';
import ReminderSettings from './components/ReminderSettings';
import PrescriptionScanner from './components/PrescriptionScanner';
import Insights from './components/Insights';
import MedicationAlarm from './components/MedicationAlarm';
import MedicationForm from './components/MedicationForm';
import UserProfile from './components/UserProfile';
import HelpCenter from './components/HelpCenter';
import LogDoseModal from './components/LogDoseModal';
import LogVitalModal from './components/LogVitalModal';
import Auth from './components/Auth';
import { dbService } from './services/dbService';
import { Medication, AdherenceRecord, NavigationTab, Reminder, HealthLog, UserProfile as UserProfileType } from './types';
import { 
  Pill, 
  Settings,
  Plus,
  HeartPulse,
  WifiOff
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
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  
  const [aiContext, setAiContext] = useState<{ query: string, image?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingReminders, setEditingReminders] = useState<Medication | null>(null);
  const [isMedicationFormOpen, setIsMedicationFormOpen] = useState(false);
  const [isLogVitalOpen, setIsLogVitalOpen] = useState(false);
  const [logDoseMed, setLogDoseMed] = useState<Medication | null>(null);
  const [isPrescriptionScannerOpen, setIsPrescriptionScannerOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<{ med: Medication, reminder: Reminder } | null>(null);
  const [lastNotifiedMinute, setLastNotifiedMinute] = useState<string>('');

  const activeProfile = useMemo(() => 
    allProfiles.find(p => p.id === activeProfileId) || null, 
    [allProfiles, activeProfileId]
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Optimized initialization for zero-latency load
  const initializeAppData = useCallback(async () => {
    setLoading(true);
    
    // Step 1: Immediate local data recovery
    const email = dbService.activeEmail;
    if (email && email !== 'anonymous') {
      const cachedProfile = dbService.getLocal('user_profile', null);
      if (cachedProfile) {
        setAllProfiles([cachedProfile]);
        setActiveProfileId(cachedProfile.id);
        setMedications(dbService.getLocal('medications', []));
        setAdherence(dbService.getLocal('adherence', []));
        setHealthLogs(dbService.getLocal('health_logs', []));
        setIsInitialized(true);
        setLoading(false); 
      }
    }

    // Step 2: Background sync (does not block UI if local cache exists)
    try {
      const profile = await dbService.getUserProfile();
      if (profile) {
        setAllProfiles([profile]);
        setActiveProfileId(profile.id);
        
        const [meds, records, logs] = await Promise.all([
          dbService.getMedications(),
          dbService.getAdherence(),
          dbService.getLogs()
        ]);
        
        setMedications(meds);
        setAdherence(records);
        setHealthLogs(logs);
        setIsInitialized(true);
      } else if (!email || email === 'anonymous') {
        setIsInitialized(false);
      }
    } catch (error) {
      console.warn("Background sync failed. Offline mode active.");
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAppData();
  }, [initializeAppData]);

  // Alarm System
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentMinute = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      
      if (currentMinute !== lastNotifiedMinute) {
        medications.forEach(med => {
          med.reminders.forEach(rem => {
            if (rem.enabled && rem.time === currentMinute) {
              setActiveAlarm({ med, reminder: rem });
              setLastNotifiedMinute(currentMinute);
            }
          });
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [medications, lastNotifiedMinute]);

  const handleAuthSuccess = async (user: { name: string; email: string }) => {
    setLoading(true);
    try {
      let profile = await dbService.getUserProfile();
      if (!profile) {
        profile = {
          id: Math.random().toString(36).substr(2, 9),
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
      setAllProfiles([profile]);
      setActiveProfileId(profile.id);
      setIsInitialized(true);
      
      const [meds, records, logs] = await Promise.all([
        dbService.getMedications(),
        dbService.getAdherence(),
        dbService.getLogs()
      ]);
      
      setMedications(meds);
      setAdherence(records);
      setHealthLogs(logs);
    } catch (err) {
      console.warn("Sync failed after auth. Running locally.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsInitialized(false);
    setLoading(true);
    await dbService.resetAll();
    setMedications([]);
    setAdherence([]);
    setHealthLogs([]);
    setAllProfiles([]);
    setActiveProfileId('');
    setLoading(false);
  };

  const handleMarkTaken = async (medId: string, time: string, date: string) => {
    const newRecord: AdherenceRecord = {
      date,
      profileId: activeProfileId,
      medicationId: medId,
      taken: true,
      timeTaken: time
    };
    
    const updatedAdherence = [...adherence, newRecord];
    setAdherence(updatedAdherence);
    dbService.saveAdherence(updatedAdherence);

    const updatedMeds = medications.map(m => 
      m.id === medId ? { ...m, remaining: Math.max(0, m.remaining - 1) } : m
    );
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
    
    setLogDoseMed(null);
    setActiveAlarm(null);
  };

  const handleAddMedication = async (medData: Omit<Medication, 'id' | 'profileId'>) => {
    const newMed: Medication = {
      ...medData,
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId
    };
    const updatedMeds = [...medications, newMed];
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
    setIsMedicationFormOpen(false);
  };

  const handleImportMeds = async (medsData: Omit<Medication, 'id' | 'profileId'>[]) => {
    const newMeds: Medication[] = medsData.map(m => ({
      ...m,
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId
    }));
    const updatedMeds = [...medications, ...newMeds];
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
    setIsPrescriptionScannerOpen(false);
  };

  const handleUpdateReminders = async (medId: string, reminders: Reminder[]) => {
    const updatedMeds = medications.map(m => m.id === medId ? { ...m, reminders } : m);
    setMedications(updatedMeds);
    dbService.saveMedications(updatedMeds);
  };

  const handleLogVital = async (logData: Omit<HealthLog, 'id' | 'profileId'>) => {
    const newLog: HealthLog = {
      ...logData,
      id: Math.random().toString(36).substr(2, 9),
      profileId: activeProfileId
    };
    const updatedLogs = [...healthLogs, newLog];
    setHealthLogs(updatedLogs);
    dbService.saveLogs(updatedLogs);
    setIsLogVitalOpen(false);
  };

  const handleUpdateProfile = async (profile: UserProfileType) => {
    setAllProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
    dbService.saveUserProfile(profile);
  };

  if (loading && !isInitialized) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
          <HeartPulse size={40} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Accessing Health Vault</h2>
          <p className="text-slate-400 font-medium">Securing your medical data link...</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        profiles={allProfiles}
        activeProfileId={activeProfileId}
        onSwitchProfile={setActiveProfileId}
        onAddProfile={() => {}}
      />
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {isOffline && (
        <div className="md:ml-64 fixed top-0 left-0 right-0 z-[60] bg-orange-500 text-white py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md">
          <WifiOff size={12} /> Offline Mode - Reliable Local Database Active
        </div>
      )}

      <main className={`md:ml-64 p-4 md:p-8 lg:p-12 pb-24 md:pb-8 ${isOffline ? 'pt-10' : ''}`}>
        {activeTab === NavigationTab.DASHBOARD && (
          <Dashboard 
            medications={medications}
            adherence={adherence}
            userProfile={activeProfile}
            onMarkTakenClick={setLogDoseMed}
            onAddClick={() => setIsMedicationFormOpen(true)}
            onLogVitalClick={() => setIsLogVitalOpen(true)}
          />
        )}
        {activeTab === NavigationTab.MEDICATIONS && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black text-slate-900">Medications</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPrescriptionScannerOpen(true)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
                >
                  Bulk Import
                </button>
                <button 
                  onClick={() => setIsMedicationFormOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  <Plus size={18} /> Add New
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medications.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-[40px] border border-dashed border-slate-200">
                  No medications tracked yet.
                </div>
              ) : (
                medications.map(med => (
                  <div key={med.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Pill size={24} />
                      </div>
                      <button 
                        onClick={() => setEditingReminders(med)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"
                      >
                        <Settings size={20} />
                      </button>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">{med.name}</h3>
                    <p className="text-sm font-bold text-slate-500 mb-4">{med.dosage} • {med.frequency}</p>
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {med.remaining} Left
                      </div>
                      <button 
                        onClick={() => setLogDoseMed(med)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all"
                      >
                        Log Dose
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === NavigationTab.HEALTH_SCANNER && (
          <HealthScanner 
            onAddMedication={handleAddMedication}
            onConsultAI={(query, image) => {
              setAiContext({ query, image });
              setActiveTab(NavigationTab.AI_CONSULT);
            }}
          />
        )}
        {activeTab === NavigationTab.AI_CONSULT && (
          <AIConsultant 
            initialQuery={aiContext?.query}
            initialImage={aiContext?.image}
            onResetContext={() => setAiContext(null)}
          />
        )}
        {activeTab === NavigationTab.INSIGHTS && (
          <Insights 
            medications={medications}
            adherence={adherence}
            healthLogs={healthLogs}
            onExport={() => alert('Exporting medical records...')}
          />
        )}
        {activeTab === NavigationTab.PROFILE && (
          <UserProfile 
            profile={activeProfile!}
            onUpdate={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}
        {activeTab === NavigationTab.HELP_CENTER && <HelpCenter />}
      </main>

      {/* Overlays */}
      {isMedicationFormOpen && (
        <MedicationForm 
          onClose={() => setIsMedicationFormOpen(false)}
          onSave={handleAddMedication}
        />
      )}
      {isLogVitalOpen && (
        <LogVitalModal 
          onClose={() => setIsLogVitalOpen(false)}
          onLog={handleLogVital}
        />
      )}
      {logDoseMed && (
        <LogDoseModal 
          medication={logDoseMed}
          onClose={() => setLogDoseMed(null)}
          onLog={handleMarkTaken}
        />
      )}
      {editingReminders && (
        <ReminderSettings 
          medication={editingReminders}
          onClose={() => setEditingReminders(null)}
          onUpdateReminders={handleUpdateReminders}
        />
      )}
      {isPrescriptionScannerOpen && (
        <PrescriptionScanner 
          onClose={() => setIsPrescriptionScannerOpen(false)}
          onImport={handleImportMeds}
        />
      )}
      {activeAlarm && (
        <MedicationAlarm 
          medication={activeAlarm.med}
          reminder={activeAlarm.reminder}
          onDismiss={() => setActiveAlarm(null)}
          onTake={(id) => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const date = now.toISOString().split('T')[0];
            handleMarkTaken(id, time, date);
          }}
        />
      )}
    </div>
  );
};

export default App;
