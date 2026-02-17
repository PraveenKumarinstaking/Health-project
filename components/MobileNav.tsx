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
    { id: NavigationTab.HEALTH_SCANNER, label: 'Scan', icon: Camera },
    { id: NavigationTab.AI_CONSULT, label: 'AI', icon: MessageSquare },
    { id: NavigationTab.INSIGHTS, label: 'Data', icon: LineChart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-standard ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;