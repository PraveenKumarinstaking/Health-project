
import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Weight, 
  Bell, 
  Save, 
  Camera,
  CheckCircle2,
  Stethoscope,
  ShieldCheck,
  ChevronRight,
  Edit3,
  Calendar,
  Activity,
  Droplet,
  Shield,
  LogOut,
  Clock,
  Send,
  Loader2,
  Wifi,
  BellRing
} from 'lucide-react';
import { UserProfile as UserProfileType } from '../types';
import { dbService } from '../services/dbService';

interface UserProfileProps {
  profile: UserProfileType;
  onUpdate: (profile: UserProfileType) => void;
  onLogout?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ profile, onUpdate, onLogout }) => {
  const [formData, setFormData] = useState<UserProfileType>({ ...profile });
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    onUpdate(formData);
    setShowSavedToast(true);
    setIsEditing(false);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handleSendLoginDetails = async () => {
    setIsEmailing(true);
    try {
      const body = `Hello ${profile.name},\n\nHere are your requested identity details from Healthcare AI:\n\nProfile ID: ${profile.id}\nRegistered Email: ${profile.email}\nPhone: ${profile.phone || 'Not provided'}\n\nPlease keep these details secure.\n\nBest,\nHealthcare AI Team`;
      await dbService.sendEmail('Healthcare AI: Your Account Details', body, profile.email);
      alert('Login details and profile summary sent to your email.');
    } catch (err) {
      alert('Failed to send email. Check your connection.');
    } finally {
      setIsEmailing(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        alert('Notifications connected! You will now receive alerts for your medications.');
      } else {
        alert('Notification permission denied.');
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Health Identity</h2>
          <p className="text-slate-500 font-medium">Your verified digital health credentials</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Edit3 size={18} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => { setFormData({...profile}); setIsEditing(false); }}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-400 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
            >
              <Save size={18} strokeWidth={3} /> Save Changes
            </button>
          </div>
        )}
      </header>

      {!isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] transform transition-transform group-hover:scale-[1.01] duration-500"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            
            <div className="relative p-8 md:p-10 text-white flex flex-col h-full min-h-[380px] justify-between">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl font-black border border-white/30 shadow-2xl">
                    {getInitials(profile.name)}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">{profile.name}</h3>
                    <div className="flex items-center gap-2 text-blue-100/80 text-sm font-medium">
                      <Shield size={14} className="text-blue-300" /> Healthcare AI Verified
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSendLoginDetails}
                  disabled={isEmailing}
                  className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition-all active:scale-90"
                  title="Send profile to email"
                >
                  {isEmailing ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y border-white/10 my-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Blood Type</p>
                  <div className="flex items-center gap-2">
                    <Droplet size={18} className="text-red-400" />
                    <span className="text-xl font-bold">{profile.bloodType || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Age</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-300" />
                    <span className="text-xl font-bold">{profile.age || '--'} yrs</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Weight</p>
                  <div className="flex items-center gap-2">
                    <Weight size={18} className="text-blue-300" />
                    <span className="text-xl font-bold">{profile.weight || '--'} kg</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Status</p>
                  <div className="flex items-center gap-2">
                    <Activity size={18} className="text-emerald-400" />
                    <span className="text-xl font-bold">Stable</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-blue-100/60">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Mail size={14} /> {profile.email}</div>
                  <div className="flex items-center gap-2"><Phone size={14} /> {profile.phone || 'No phone'}</div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                  <ShieldCheck size={14} className="text-emerald-400" /> Encrypted Vault Access
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                   <Bell size={24} />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alarms</p>
                   <h4 className="font-bold text-slate-800">{profile.notifications?.enabled ? 'Enabled' : 'Disabled'}</h4>
                 </div>
               </div>
               <div className={`w-3 h-3 rounded-full ${profile.notifications?.enabled ? 'bg-emerald-500' : 'bg-slate-300'} animate-pulse`}></div>
             </div>

             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Wifi size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800">System Connectivity</h4>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={requestNotificationPermission}
                    className="w-full flex justify-between items-center text-xs group"
                  >
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <BellRing size={14} className="group-hover:text-blue-500 transition-colors" /> Browser Notifications
                    </span>
                    <span className={`font-bold ${Notification.permission === 'granted' ? 'text-emerald-600' : 'text-blue-600 underline'}`}>
                      {Notification.permission === 'granted' ? 'Connected' : 'Connect'}
                    </span>
                  </button>
                  <button 
                    onClick={handleSendLoginDetails}
                    className="w-full flex justify-between items-center text-xs group"
                  >
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      <Mail size={14} className="group-hover:text-blue-500 transition-colors" /> Email Dispatcher
                    </span>
                    <span className="text-emerald-600 font-bold">Active</span>
                  </button>
                </div>
             </div>

             {onLogout && (
               <button 
                onClick={() => {
                  if (confirm("Sign out of your secure medical database?")) {
                    onLogout();
                  }
                }}
                className="w-full bg-red-50 p-6 rounded-[32px] text-red-600 flex items-center justify-between group cursor-pointer hover:bg-red-100 transition-all border border-red-100"
               >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                      <LogOut size={24} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-sm uppercase tracking-tight">Sign Out</h4>
                      <p className="text-[10px] font-bold opacity-60">Switch Users</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </button>
             )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center border-4 border-white shadow-md relative group">
                  <User size={40} />
                  <button className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-xl shadow-lg border-2 border-white opacity-100 transition-opacity">
                    <Camera size={14} />
                  </button>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Account Details</h3>
                  <p className="text-sm text-slate-400 font-medium">Update your core identity info</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="email" 
                      value={formData.email}
                      disabled
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl opacity-60 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm animate-in zoom-in-95 duration-300 delay-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Biometric Stats</h3>
                  <p className="text-sm text-slate-400 font-medium">Keep your vitals updated for AI precision</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                  <input 
                    type="text" 
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 text-center font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                  <div className="relative">
                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={formData.weight}
                      onChange={e => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 text-center font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Type</label>
                  <input 
                    type="text" 
                    value={formData.bloodType}
                    onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 ring-blue-500/20 text-center font-bold text-red-600"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm animate-in zoom-in-95 duration-300 delay-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Bell size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800">Alerts</h3>
              </div>
              <button 
                onClick={() => setFormData({ ...formData, notifications: { enabled: !formData.notifications?.enabled } })}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  formData.notifications?.enabled ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}
              >
                <span className="font-bold">Push Notifications</span>
                <div className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${formData.notifications?.enabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all ${formData.notifications?.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </section>

            <section className="bg-slate-900 p-8 rounded-[40px] text-white">
               <div className="flex items-center gap-3 mb-4 text-blue-400">
                <ShieldCheck size={24} />
                <h3 className="text-xl font-black">Data Safety</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Your health records are stored in your secure health database. Updates take effect immediately.
              </p>
            </section>
          </div>
        </div>
      )}

      {showSavedToast && (
        <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-[300] border border-white/10">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
          <p className="font-bold">Health Identity Updated</p>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
