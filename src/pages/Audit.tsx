import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types';
import { api } from '../services/api';
import { FileText, Search, ShieldCheck } from 'lucide-react';

export const Audit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.getAuditLogs().then(setLogs).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm flex items-center space-x-3">
        <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">MongoDB System Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable log trail recording every incident creation, RAG vector retrieval, security gate validation, and remediation execution.
          </p>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-800 text-[11px] font-mono font-semibold uppercase text-slate-400 tracking-wider">
              <th className="py-2.5 px-4">Audit ID</th>
              <th className="py-2.5 px-4">Time</th>
              <th className="py-2.5 px-4">Action</th>
              <th className="py-2.5 px-4">Actor</th>
              <th className="py-2.5 px-4">Incident ID</th>
              <th className="py-2.5 px-4">Details</th>
              <th className="py-2.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs text-slate-300 font-mono">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-bold text-sky-400">{log.id}</td>
                <td className="py-3 px-4 text-slate-400 text-[11px]">{new Date(log.timestamp).toLocaleTimeString()}</td>
                <td className="py-3 px-4 font-bold text-white">{log.action}</td>
                <td className="py-3 px-4 text-slate-300">{log.actor}</td>
                <td className="py-3 px-4 text-sky-400">{log.incident_id}</td>
                <td className="py-3 px-4 max-w-xs truncate text-slate-400 font-sans text-[11px]">{log.details}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
