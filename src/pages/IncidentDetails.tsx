import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { IncidentTimeline } from '../components/IncidentTimeline';
import { ArrowLeft, Cpu, Database, ShieldCheck, Zap, Clock, Terminal, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface IncidentDetailsProps {
  incidentId: string;
  onBack: () => void;
  onExecuteRemediation: (incidentId: string) => void;
}

export const IncidentDetails: React.FC<IncidentDetailsProps> = ({
  incidentId,
  onBack,
  onExecuteRemediation
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getIncidentById(incidentId)
      .then(setIncident)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) {
    return (
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-12 text-center text-slate-400">
        <p className="text-xs font-mono">Loading incident details from MongoDB...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-12 text-center text-slate-400 space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <p className="text-sm font-semibold text-white">Incident Not Found</p>
        <button onClick={onBack} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded-lg cursor-pointer font-mono">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-semibold text-slate-300 hover:text-white bg-[#1E293B] border border-slate-800 px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer space-x-1.5"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>Back to Incident Registry</span>
        </button>

        {incident.status === 'PENDING_APPROVAL' && (
          <button
            onClick={() => onExecuteRemediation(incident.id)}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md flex items-center space-x-2 cursor-pointer font-mono"
          >
            <Zap className="w-4 h-4" />
            <span>Approve & Execute Remediation</span>
          </button>
        )}
      </div>

      {/* Incident Summary Card */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono text-base font-extrabold text-sky-400">{incident.incident_id}</span>
              <StatusBadge type="severity" value={incident.severity} />
              <StatusBadge type="status" value={incident.status} />
            </div>
            <h1 className="text-base font-bold text-white">{incident.error_type}: {incident.error_message}</h1>
          </div>

          <div className="text-right text-xs text-slate-400 font-mono">
            <div>Detected: {new Date(incident.detection_timestamp).toLocaleString()}</div>
            {incident.resolution_time_seconds && (
              <div className="text-emerald-400 font-bold mt-1">
                Resolution Time: {incident.resolution_time_seconds}s (AIOps Recovery)
              </div>
            )}
          </div>
        </div>

        {/* Diagnostic Metadata Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Root Cause</span>
            <span className="font-bold text-white text-[11px]">{incident.root_cause || 'Analyzing...'}</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">AI Confidence</span>
            <span className="font-bold text-emerald-400 text-[11px]">
              {incident.confidence ? `${(incident.confidence * 100).toFixed(0)}% Score` : 'N/A'}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Recommended Action</span>
            <span className="font-bold text-sky-400 text-[11px]">
              {incident.recommended_remediation || 'N/A'}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
            <span className="text-slate-400 block font-semibold uppercase text-[9px] tracking-wider">Manual Time Saved</span>
            <span className="font-bold text-white text-[11px]">
              ~{Math.round(incident.manual_estimated_time_seconds / 60)} minutes
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Raw Logs / Vector RAG Docs vs Execution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Raw Log, Embedding, Vector RAG Retrieval */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Raw Log & Stack Trace */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 text-slate-200 font-mono text-xs space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-slate-800 pb-2">
              <span className="flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                <span>Raw Application Exception Log</span>
              </span>
              <span className="text-sky-400">{incident.app_name}</span>
            </div>
            <p className="text-rose-300 font-semibold">{incident.raw_log}</p>
            {incident.stack_trace && (
              <pre className="text-slate-400 text-[10px] overflow-x-auto whitespace-pre-wrap bg-slate-900 p-2.5 rounded border border-slate-800/80">
                {incident.stack_trace}
              </pre>
            )}
          </div>

          {/* Sentence Transformer Embedding Vector */}
          {incident.embedding && (
            <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 shadow-xs space-y-2 text-slate-200">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Sentence Transformer 384d Vector Embedding</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                L2 Normalized floating-point vector representation computed for ChromaDB similarity matching.
              </p>
              <div className="font-mono text-[10px] bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-sky-300 overflow-x-auto">
                [{incident.embedding.slice(0, 16).join(', ')}, ... {incident.embedding.length} dimensions]
              </div>
            </div>
          )}

          {/* ChromaDB Vector Search Retrieved Docs */}
          {incident.retrieved_knowledge && incident.retrieved_knowledge.length > 0 && (
            <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 shadow-xs space-y-3 text-slate-200">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Database className="w-4 h-4 text-sky-400" />
                <span>ChromaDB Retrieved Knowledge Base Docs</span>
              </h3>

              <div className="space-y-2">
                {incident.retrieved_knowledge.map((doc, idx) => (
                  <div key={doc.id || idx} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{doc.error_pattern}</span>
                      <span className="text-sky-400 font-mono">[{doc.category}]</span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{doc.description}</p>
                    <div className="text-[10px] font-mono text-emerald-400 pt-1">
                      Recommended: {doc.recommended_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: End-to-End Timeline */}
        <div className="lg:col-span-6 bg-[#1E293B] rounded-xl border border-slate-800 p-5 shadow-xs space-y-4 text-slate-200">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Diagnostic & Remediation Execution Timeline</span>
          </h3>

          <IncidentTimeline timeline={incident.timeline} />
        </div>

      </div>

    </div>
  );
};
