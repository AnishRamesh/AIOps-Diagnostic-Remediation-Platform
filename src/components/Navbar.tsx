import React from 'react';
import { Activity, Shield, BookOpen, Sparkles, Terminal, Key, UserCheck, LogOut } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  onOpenVivaModal: () => void;
  onNavigateToSimulator: () => void;
  onNavigateToAuth: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentUser, onOpenVivaModal, onNavigateToSimulator, onNavigateToAuth, onSignOut }) => {
  return (
    <header className="h-14 bg-[#1E293B] border-b border-slate-800 sticky top-0 z-30 text-slate-200 px-4 sm:px-6 shrink-0 flex items-center justify-between">
      {/* Logo & Platform Name */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shadow-sky-500/20 shadow-md">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-bold text-base tracking-tight text-white">
            AIOps <span className="text-sky-400 font-light">Sentinel</span>
          </span>
          <span className="bg-sky-500/10 text-sky-400 text-[10px] px-2 py-0.5 rounded border border-sky-500/20 font-mono font-medium">
            v2.4-STABLE
          </span>
        </div>
      </div>

      {/* Center / Action Header Controls */}
      <div className="flex items-center space-x-3">
        {/* Live System Online Pulse */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-700/80 text-[11px] font-mono font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-400">SYSTEM ONLINE</span>
        </div>

        {/* Inject Failure Trigger Button */}
        <button
          onClick={onNavigateToSimulator}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-xs transition-all space-x-1.5 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Simulate Failure</span>
        </button>

        {/* Viva & College Review Guide Button */}
        <button
          onClick={onOpenVivaModal}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-semibold shadow-xs transition-all space-x-1.5 cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Viva Guide</span>
        </button>

        <div className="h-6 w-px bg-slate-700/80 mx-1 hidden sm:block"></div>

        {/* Lead Architect Profile Pill & Sign Out */}
        <div className="hidden sm:flex items-center space-x-2">
          <button
            onClick={onNavigateToAuth}
            className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700/80 transition-all cursor-pointer group"
          >
            <div className="text-right text-xs">
              <p className="text-[9px] uppercase tracking-wider text-rose-400 font-mono font-bold flex items-center justify-end space-x-1">
                <span>{currentUser?.is_lead_architect ? 'Lead Architect & Admin' : currentUser?.role || 'Admin'}</span>
              </p>
              <p className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                {currentUser?.name || 'Anish Ramesh'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xs font-bold text-rose-300 font-mono shadow-sm">
              {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('') : 'AR'}
            </div>
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/80 hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-center"
              title="Sign Out from MongoDB Auth Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

