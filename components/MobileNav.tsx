import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  Camera, 
  MessageSquare, 
  LineChart 
} from 'lucide-react';
import { NavigationTab } from '../types';

interface MobileNavProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: NavigationTab.DASHBOARD, label: 'Home', icon: LayoutDashboard },
    { id: NavigationTab.MEDICATIONS, label: 'Meds', icon: Pill },
    { id: NavigationTab.SCAN, label: 'Scan', icon: Camera, special: true },
    { id: NavigationTab.AI_CONSULT, label: 'AI', icon: MessageSquare },
    { id: NavigationTab.INSIGHTS, label: 'Data', icon: LineChart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 md:hidden z-50 pb-safe shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-20 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          if (tab.special) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative -top-6 flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-[24px] shadow-2xl shadow-blue-300 active:scale-90 transition-all border-4 border-white"
              >
                <Icon size={28} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all active:scale-95 px-2 py-1 ${
                isActive ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 bg-blue-600 rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;