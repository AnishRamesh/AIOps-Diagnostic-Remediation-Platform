import React from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  AlertOctagon, 
  Database, 
  BarChart3, 
  ShieldCheck, 
  FileText, 
  Settings,
  GraduationCap,
  Key
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'simulator' 
  | 'incidents' 
  | 'knowledge' 
  | 'analytics' 
  | 'allowlist' 
  | 'audit' 
  | 'settings'
  | 'auth';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openVivaGuide: () => void;
  currentUserRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openVivaGuide, currentUserRole }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'simulator', label: 'Failure Simulator', icon: Terminal, badge: 'Live Demo' },
    { id: 'auth', label: 'Auth & MongoDB', icon: Key, badge: 'Lead Admin' },
    { id: 'incidents', label: 'Incidents', icon: AlertOctagon },
    { id: 'knowledge', label: 'Knowledge Base', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'allowlist', label: 'Safe Allowlist', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-[#111827] border-r border-slate-800 shrink-0 hidden md:flex flex-col p-4 text-slate-300">
      <div className="space-y-1 flex-1">
        <p className="px-3 text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-400 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono ${
                  isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Local AI Engine Health Widget */}
      <div className="pt-4 border-t border-slate-800 space-y-3">
        <div className="p-3 bg-[#1E293B]/60 rounded-lg border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-[10px] uppercase font-mono text-slate-400">
            <span>Local AI Health</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
            <span>Ollama LLaMA 3</span>
            <span className="text-sky-400 font-mono text-[10px]">384d Vec</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-[92%] rounded-full"></div>
          </div>
        </div>

        {/* Viva Guide Quick Link */}
        <button
          onClick={openVivaGuide}
          className="w-full py-2 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <GraduationCap className="w-4 h-4 text-sky-400" />
          <span>Anish R • Viva Guide</span>
        </button>
      </div>
    </aside>
  );
};
