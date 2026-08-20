import React from 'react';
import { Incident, SystemStatus } from '../types';
import { HealthCard } from '../components/HealthCard';
import { IncidentTable } from '../components/IncidentTable';
import { Terminal, Zap, Activity, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';

interface DashboardProps {
  status: SystemStatus | null;
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onNavigateToSimulator: () => void;
  onExecuteRemediation: (incidentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  status,
  incidents,
  onSelectIncident,
  onNavigateToSimulator,
  onExecuteRemediation
}) => {
  const recentIncidents = incidents.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-[#1E293B] rounded-xl p-5 text-slate-200 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 text-[11px] font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Autonomous Self-Healing System Active</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            AIOps Diagnostic & Auto-Remediation Engine
          </h1>
          <p className="text-slate-300 text-xs leading-relaxed">
            Real-time log ingestion, 384d vector embeddings with SentenceTransformers, ChromaDB semantic search, LLaMA 3 root-cause diagnosis, and safe allowlisted remediation.
          </p>
          <div className="pt-1 flex flex-wrap gap-2">
            <button
              onClick={onNavigateToSimulator}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Simulate Failure Scenario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Health Overview Cards */}
      <HealthCard status={status} />

      {/* Architecture Highlights & Recent Incidents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Incidents Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Active & Recent Incident Pipeline</span>
            </h2>
          </div>

          <IncidentTable
            incidents={recentIncidents}
            onSelectIncident={onSelectIncident}
            onExecuteRemediation={onExecuteRemediation}
          />
        </div>

        {/* Right Column: Key System Metrics & AI Stream */}
        <div className="space-y-4">
          
          {/* Vector RAG Status Widget */}
          <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-sky-400" />
              <span>Vector RAG Pipeline Status</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between font-mono font-semibold text-slate-200 text-[11px]">
                  <span>ChromaDB Vector Store</span>
                  <span className="text-emerald-400">CONNECTED</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  7 indexed troubleshooting docs with 384d SentenceTransformer embeddings.
                </p>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between font-mono font-semibold text-slate-200 text-[11px]">
                  <span>Local LLM Engine</span>
                  <span className="text-sky-400">LLaMA 3 (8B)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Pydantic JSON output validation enabled for structured root cause diagnosis.
                </p>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 space-y-1">
                <div className="flex justify-between font-mono font-semibold text-slate-200 text-[11px]">
                  <span>Allowlist Gate</span>
                  <span className="text-amber-400">Conf &ge; 0.90</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Auto-execution requires &ge;90% AI confidence + allowlisted action code.
                </p>
              </div>
            </div>
          </div>

          {/* LLaMA 3 Performance Gauge */}
          <div className="bg-[#1E293B] border border-slate-800 rounded-xl p-4 space-y-2.5 font-mono">
            <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Llama 3 Inference Metrics</h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Tokens/Sec</span>
                <span className="text-sky-400 font-bold">42.1 t/s</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full w-3/4 rounded-full"></div>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">VRAM Allocation</span>
                <span className="text-amber-400 font-bold">6.4 GB</span>
              </div>
            </div>
          </div>

          {/* RAG Insights Callout */}
          <div className="bg-sky-950/20 border border-sky-500/30 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
              <h3 className="text-xs font-bold text-sky-400">RAG Tuning Note (Anish R.)</h3>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed italic">
              "Similarity threshold tuned to 0.85 for MongoDB timeout patterns. Semantic search accuracy improved by 22% using custom log-embedding layer."
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
