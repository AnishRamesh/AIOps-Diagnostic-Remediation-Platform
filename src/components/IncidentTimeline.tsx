import React from 'react';
import { TimelineEvent } from '../types';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, ShieldCheck, Cpu, Database, Zap, HeartPulse } from 'lucide-react';

interface IncidentTimelineProps {
  timeline: TimelineEvent[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return <p className="text-xs text-slate-400 italic">No timeline events recorded.</p>;
  }

  const getPhaseIcon = (phase: TimelineEvent['phase'], status: TimelineEvent['status']) => {
    switch (phase) {
      case 'INGESTION':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'EMBEDDING':
      case 'VECTOR_SEARCH':
        return <Database className="w-3.5 h-3.5 text-sky-400" />;
      case 'LLM_DIAGNOSIS':
      case 'RAG_ANALYSIS':
        return <Cpu className="w-3.5 h-3.5 text-purple-400" />;
      case 'SAFETY_CHECK':
        return <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />;
      case 'REMEDIATION':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'HEALTH_CHECK':
      case 'RECOVERY':
        return <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBorder = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'success': return 'border-emerald-500 bg-emerald-500/10';
      case 'error': return 'border-rose-500 bg-rose-500/10';
      case 'warning': return 'border-amber-500 bg-amber-500/10';
      default: return 'border-sky-500 bg-sky-500/10';
    }
  };

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 font-mono">
      {timeline.map((event, idx) => {
        const timeFormatted = new Date(event.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        return (
          <div key={event.id || idx} className="relative group">
            {/* Phase Node Dot */}
            <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center bg-[#1E293B] ${getStatusBorder(event.status)}`}>
              {getPhaseIcon(event.phase, event.status)}
            </div>

            {/* Event Content Card */}
            <div className="bg-[#111827]/80 border border-slate-800 rounded-lg p-3 transition-all hover:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-sky-400 tracking-wide uppercase">
                  [{event.phase}] {event.title}
                </span>
                <span className="text-[10px] text-slate-500">{timeFormatted}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{event.description}</p>

              {/* Extra Details Json / Tags */}
              {event.details && (
                <div className="mt-2 pt-2 border-t border-slate-800 font-mono text-[10px] text-slate-400 bg-slate-900/90 rounded p-2 overflow-x-auto space-y-0.5">
                  {Object.entries(event.details).map(([k, v]) => (
                    <div key={k} className="flex space-x-2">
                      <span className="text-sky-400 font-semibold">{k}:</span>
                      <span className="text-slate-300 truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
