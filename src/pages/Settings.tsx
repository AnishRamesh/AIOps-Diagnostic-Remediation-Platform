import React from 'react';
import { Settings as SettingsIcon, Database, Cpu, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm flex items-center space-x-3">
        <div className="p-2.5 bg-slate-800 rounded-lg text-slate-300 border border-slate-700">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">System Configuration</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            AIOps Engine, Ollama LLaMA 3 local model parameters, ChromaDB vector collection settings, and security policy.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        
        {/* Ollama LLaMA 3 Configuration */}
        <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 shadow-xs space-y-4 text-slate-200">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>Local LLM Engine (Ollama / LLaMA 3)</span>
          </h3>

          <div className="space-y-3 font-mono">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Ollama Host URL</label>
              <input type="text" readOnly value="http://localhost:11434" className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900 text-sky-300" />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Model Identifier</label>
              <input type="text" readOnly value="llama3:8b-instruct-q4_K_M" className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900 text-sky-300" />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Structured Output Validation</label>
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Pydantic JSON Schema Validation Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Threshold Policy */}
        <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 shadow-xs space-y-4 text-slate-200">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Security & Confidence Gate Policy</span>
          </h3>

          <div className="space-y-3 font-mono">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Auto-Execution Confidence Gate</label>
              <input type="text" readOnly value="0.90 (90% AI Confidence threshold required)" className="w-full px-3 py-2 border border-slate-800 rounded-lg bg-slate-900 text-emerald-400 font-bold" />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Allowlist Strict Enforcement</label>
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Arbitrary Shell Command Blocking ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
