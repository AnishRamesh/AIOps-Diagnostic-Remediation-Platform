import React from 'react';
import { Incident } from '../types';
import { StatusBadge } from './StatusBadge';
import { ArrowRight, Zap, CheckCircle2, AlertOctagon } from 'lucide-react';

interface IncidentTableProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onExecuteRemediation?: (incidentId: string) => void;
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  incidents,
  onSelectIncident,
  onExecuteRemediation
}) => {
  if (incidents.length === 0) {
    return (
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-8 text-center text-slate-300">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">No Incidents Detected</h3>
        <p className="text-xs text-slate-400 mt-1">Application running clean without active runtime errors.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800 text-[11px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
              <th className="py-2.5 px-4">Incident ID</th>
              <th className="py-2.5 px-4">Time</th>
              <th className="py-2.5 px-4">Severity</th>
              <th className="py-2.5 px-4">Error Type & Message</th>
              <th className="py-2.5 px-4">Root Cause</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">MTTR</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300">
            {incidents.map((inc) => {
              const timeFormatted = new Date(inc.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">
                    <button
                      onClick={() => onSelectIncident(inc.id)}
                      className="hover:underline text-left cursor-pointer"
                    >
                      {inc.incident_id}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">{timeFormatted}</td>
                  <td className="py-3 px-4">
                    <StatusBadge type="severity" value={inc.severity} />
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-white truncate">{inc.error_type}</div>
                    <div className="text-slate-400 truncate text-[11px] font-mono">{inc.error_message}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                    {inc.root_cause || <span className="text-slate-500 italic">Analyzing with LLaMA 3...</span>}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge type="status" value={inc.status} />
                  </td>
                  <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                    {inc.resolution_time_seconds ? (
                      <span className="text-emerald-400 font-bold">{inc.resolution_time_seconds}s</span>
                    ) : (
                      <span className="text-slate-500">In Progress</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      {inc.status === 'PENDING_APPROVAL' && onExecuteRemediation && (
                        <button
                          onClick={() => onExecuteRemediation(inc.id)}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>Approve Fix</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectIncident(inc.id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
