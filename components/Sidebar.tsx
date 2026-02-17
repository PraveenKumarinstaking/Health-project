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
  ChevronRight,
  ShieldCheck
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
  setActiveTab
}) => {
  const menuItems = [
    { id: NavigationTab.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: NavigationTab.MEDICATIONS, label: 'Medications', icon: Pill },
    { id: NavigationTab.HEALTH_SCANNER, label: 'Health Scanner', icon: Camera },
    { id: NavigationTab.AI_CONSULT, label: 'AI Assistant', icon: MessageSquare },
    { id: NavigationTab.INSIGHTS, label: 'Health Insights', icon: LineChart },
    { id: NavigationTab.PROFILE, label: 'Profile & Settings', icon: User },
    { id: NavigationTab.HELP_CENTER, label: 'Help Center', icon: HelpCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <HeartPulse className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-none">
            Healthcare AI
          </h1>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <div className="px-3 pb-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Navigation</p>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-standard ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm font-medium">
                  {item.label}
                </span>
              </div>
              {isActive && <ChevronRight size={14} className="opacity-50" />}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-800">
        <div className="bg-slate-800 p-4 rounded-lg flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
            <ShieldCheck size={12} /> HIPAA SECURE
          </div>
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            Personal health data is encrypted and private.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;