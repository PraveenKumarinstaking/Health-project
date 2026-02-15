
import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Camera, 
  MessageSquare, 
  LineChart, 
  HeartPulse,
  Database,
  User,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { NavigationTab, UserProfile } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onLogout: () => void;
  profiles: UserProfile[];
  activeProfileId: string;
  onSwitchProfile: (id: string) => void;
  onAddProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout
}) => {
  const menuItems = [
    { id: NavigationTab.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: NavigationTab.MEDICATIONS, label: 'Medications', icon: Pill },
    { id: NavigationTab.SCAN, label: 'Scan Meds', icon: Camera },
    { id: NavigationTab.AI_CONSULT, label: 'AI Assistant', icon: MessageSquare },
    { id: NavigationTab.INSIGHTS, label: 'Health Insights', icon: LineChart },
    { id: NavigationTab.PROFILE, label: 'Identity & Family', icon: User },
    { id: NavigationTab.HELP_CENTER, label: 'Help Center', icon: HelpCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-50">
          <HeartPulse className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-blue-600 tracking-tighter">
          Healthcare AI
        </h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-blue-600' : 'text-slate-400'} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100 space-y-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 text-red-600 bg-white border border-slate-950 rounded-[32px] transition-all hover:bg-red-50 active:scale-[0.97] group shadow-sm"
        >
          <LogOut size={22} className="text-red-500 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
          <span className="text-base font-black">Sign Out</span>
        </button>
        
        <div className="flex items-center gap-2 px-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-80">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <Database size={12} /> HIPAA SECURE
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
