import React, { useState, useEffect } from 'react';
import { ApprovedRemediation } from '../types';
import { api } from '../services/api';
import { ShieldCheck, CheckCircle2, Lock, Terminal, AlertTriangle } from 'lucide-react';

export const Allowlist: React.FC = () => {
  const [actions, setActions] = useState<ApprovedRemediation[]>([]);

  useEffect(() => {
    api.getApprovedRemediations().then(setActions).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm flex items-center space-x-3">
        <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Security Policy: Approved Remediation Allowlist</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict safety mechanism preventing arbitrary LLM shell execution. AI diagnosis can only choose from pre-approved actions.
          </p>
        </div>
      </div>

      {/* Grid of Approved Remediation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((act) => (
          <div key={act.id} className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 shadow-xs space-y-3 text-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-sky-400">{act.id}</span>
              <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold ${
                act.risk_level === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {act.risk_level} RISK
              </span>
            </div>

            <div>
              <h3 className="text-xs font-bold text-white mb-1">{act.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs font-mono text-[11px]">
              <div className="text-slate-300">
                Target: <span className="font-semibold text-sky-400">{act.target_service}</span>
              </div>
              <div className="bg-slate-950 text-sky-300 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] overflow-x-auto">
                {act.script_code}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
