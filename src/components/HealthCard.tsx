import React from 'react';
import { SystemStatus } from '../types';
import { Activity, Database, Cpu, Layers, Zap, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface HealthCardProps {
  status: SystemStatus | null;
}

export const HealthCard: React.FC<HealthCardProps> = ({ status }) => {
  if (!status) return null;

  const mttrSavedPercent = status.manual_avg_mttr_seconds > 0
    ? Math.round(((status.manual_avg_mttr_seconds - status.average_mttr_seconds) / status.manual_avg_mttr_seconds) * 100)
    : 95;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* System Health Status */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">AIOps Core Health</span>
          <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white">{status.application}</span>
          <span className="flex items-center text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Online
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-mono">
          <div>FastAPI: <span className="font-semibold text-emerald-400">{status.backend_fastapi}</span></div>
          <div>MongoDB: <span className="font-semibold text-emerald-400">{status.database_mongodb}</span></div>
          <div>ChromaDB: <span className="font-semibold text-emerald-400">{status.vector_chromadb}</span></div>
          <div>LLaMA 3: <span className="font-semibold text-sky-400">{status.ai_engine_ollama}</span></div>
        </div>
      </div>

      {/* Incidents Overview */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Incidents Overview</span>
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-white">{status.active_incidents}</span>
            <span className="text-xs text-slate-400 ml-1.5">active</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-300">{status.total_incidents}</span>
            <span className="text-[10px] text-slate-400 block font-mono">total tracked</span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Resolved: <strong className="text-emerald-400">{status.resolved_incidents}</strong></span>
          <span>Success Rate: <strong className="text-sky-400">{status.total_incidents > 0 ? Math.round((status.resolved_incidents / status.total_incidents) * 100) : 100}%</strong></span>
        </div>
      </div>

      {/* Auto-Remediations Executed */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Safe Remediations</span>
          <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-sky-400">{status.successful_remediations}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
            Allowlist Validated
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between font-mono">
          <span>Failed Execs: <strong className="text-slate-200">{status.failed_remediations}</strong></span>
          <span>Review Gate: <strong className="text-amber-400">Conf &lt; 90%</strong></span>
        </div>
      </div>

      {/* MTTR Metric Reduction */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 transition-all hover:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Avg. MTTR</span>
          <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-white">{status.average_mttr_seconds}s</span>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {mttrSavedPercent}% faster
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between font-mono">
          <span>AIOps: <strong className="text-sky-400">{status.average_mttr_seconds}s</strong></span>
          <span>Manual: <strong className="text-slate-500 line-through">{status.manual_avg_mttr_seconds}s</strong></span>
        </div>
      </div>
    </div>
  );
};
