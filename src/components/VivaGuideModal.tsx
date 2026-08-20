import React, { useState } from 'react';
import { X, BookOpen, GraduationCap, CheckCircle2, HelpCircle, Cpu, Database, ShieldAlert, Zap, Layers } from 'lucide-react';

interface VivaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VivaGuideModal: React.FC<VivaGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'role' | 'viva_qa' | 'architecture' | 'cheatsheet'>('role');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-600 rounded-lg text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">College Project Review & Viva Guide</h2>
              <p className="text-xs text-sky-400 mt-0.5">
                Assigned Responsibilities: <strong>Anish R</strong> (RAG Architecture, ChromaDB & Sentence Transformer Embeddings)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-900/60 border-b border-slate-800 px-5 pt-3 flex space-x-4 text-xs font-mono font-semibold">
          <button
            onClick={() => setActiveTab('role')}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'role' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            My Role (Anish R)
          </button>
          <button
            onClick={() => setActiveTab('viva_qa')}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'viva_qa' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Viva Q&A
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'architecture' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Data Flow & Architecture
          </button>
          <button
            onClick={() => setActiveTab('cheatsheet')}
            className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'cheatsheet' ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            MongoDB vs ChromaDB
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed">
          
          {/* TAB 1: ANISH R'S ROLE */}
          {activeTab === 'role' && (
            <div className="space-y-4">
              <div className="p-4 bg-sky-500/10 rounded-xl border border-sky-500/20">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Summary of Responsibilities (Anish R)</span>
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  As the AI/ML & RAG Specialist for this project, Anish R designed and implemented the <strong>semantic knowledge retrieval pipeline</strong> that enables LLaMA 3 to diagnose unseen software exceptions using prior troubleshooting experience.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center space-x-2 text-sky-400 font-bold mb-2">
                    <Database className="w-4 h-4" />
                    <span>1. ChromaDB Vector DB</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>Created the ChromaDB vector database collection.</li>
                    <li>Indexed troubleshooting resolution documents.</li>
                    <li>Configured cosine similarity matching threshold (0.85+).</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center space-x-2 text-sky-400 font-bold mb-2">
                    <Cpu className="w-4 h-4" />
                    <span>2. Sentence Transformers</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>Integrated all-MiniLM-L6-v2 embedding model.</li>
                    <li>Converted raw error logs into 384d semantic vectors.</li>
                    <li>L2 normalization for exact vector distances.</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="flex items-center space-x-2 text-sky-400 font-bold mb-2">
                    <Zap className="w-4 h-4" />
                    <span>3. RAG Pipeline</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>Built prompt context enricher combining log + vector docs.</li>
                    <li>Structured output schema for LLaMA 3 / Ollama.</li>
                    <li>Integrated confidence score thresholding (0.90).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIVA QUESTIONS & ANSWERS */}
          {activeTab === 'viva_qa' && (
            <div className="space-y-3">
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-2">
                <span className="font-bold text-sky-400 flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q1: What is RAG and why did you use it instead of fine-tuning LLaMA 3?</span>
                </span>
                <p className="text-slate-300 pl-6 leading-relaxed">
                  <strong>Answer:</strong> Retrieval-Augmented Generation (RAG) dynamically fetches relevant troubleshooting knowledge from our vector database (ChromaDB) and injects it into the LLM prompt. We chose RAG over fine-tuning because fine-tuning is computationally expensive, static, and prone to hallucinations. RAG allows us to update the knowledge base instantaneously without retraining models.
                </p>
              </div>

              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-2">
                <span className="font-bold text-sky-400 flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q2: Why do you need ChromaDB when MongoDB is already present?</span>
                </span>
                <p className="text-slate-300 pl-6 leading-relaxed">
                  <strong>Answer:</strong> MongoDB is a document database optimized for structured data (incidents, audit logs, timestamps). ChromaDB is a specialized Vector Database designed for high-dimensional vector similarity search. Searching error logs semantically requires vector embeddings, which ChromaDB computes in milliseconds.
                </p>
              </div>

              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-2">
                <span className="font-bold text-sky-400 flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q3: How do you prevent the AI from executing dangerous shell commands?</span>
                </span>
                <p className="text-slate-300 pl-6 leading-relaxed">
                  <strong>Answer:</strong> Security is enforced via a strict <strong>Allowlist</strong>. The LLM never outputs arbitrary shell commands; it only selects an approved remediation ID (e.g., <code className="bg-slate-950 text-sky-300 px-1.5 py-0.5 rounded font-mono text-[10px]">restart_database</code>). The backend verifies this ID against a hardcoded security policy. Additionally, if the AI confidence score is below 90% (0.90), automatic execution is blocked and sent for human review.
                </p>
              </div>

              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-2">
                <span className="font-bold text-sky-400 flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Q4: What is MTTR and how does this system reduce it?</span>
                </span>
                <p className="text-slate-300 pl-6 leading-relaxed">
                  <strong>Answer:</strong> MTTR stands for Mean Time To Resolution. In traditional DevOps, manual debugging takes 20 to 40 minutes per incident. Our AIOps platform ingests logs, searches vector knowledge, diagnoses root causes, and executes safe remediations in <strong>10 to 15 seconds</strong>, reducing MTTR by over 95%.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ARCHITECTURE & DATA FLOW */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-slate-950 text-slate-300 p-4 rounded-xl font-mono text-[11px] overflow-x-auto space-y-1.5 border border-slate-800">
                <div className="text-sky-400 font-bold mb-2">// End-to-End AIOps Data Flow Architecture</div>
                <div>1. Application Failure Generates Error Log</div>
                <div>2. Log Monitoring Engine Ingests & Extracts Error Message</div>
                <div className="text-emerald-400 font-semibold">3. [Anish R] Sentence Transformer Generates 384d Embedding Vector</div>
                <div className="text-emerald-400 font-semibold">4. [Anish R] ChromaDB Vector Search Finds Top K Similar Troubleshooting Docs</div>
                <div className="text-sky-400 font-semibold">5. [Anish R] RAG Prompt Builder Injects Error + Retrieved Docs</div>
                <div>6. Local LLaMA 3 via Ollama Generates Structured JSON Diagnosis</div>
                <div>7. Security Policy Checks Allowlist & Confidence Threshold (0.90)</div>
                <div>8. Safe Remediation Engine Executes Approved Action & Verifies Health</div>
                <div>9. MongoDB Stores Incident, Remediation Audit Log & MTTR Metrics</div>
                <div>10. React + TypeScript Dashboard Displays Real-Time Incident Timeline</div>
              </div>
            </div>
          )}

          {/* TAB 4: MONGODB VS CHROMADB */}
          {activeTab === 'cheatsheet' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 font-bold text-slate-200">
                      <th className="p-3">Feature</th>
                      <th className="p-3 text-sky-400">MongoDB (NoSQL)</th>
                      <th className="p-3 text-emerald-400">ChromaDB (Vector DB)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white">Primary Purpose</td>
                      <td className="p-3">Structured Incident & Audit Logs</td>
                      <td className="p-3">Semantic Vector Search for RAG</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Data Structure</td>
                      <td className="p-3">BSON / JSON Documents</td>
                      <td className="p-3">High-Dimensional Vector Embeddings</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Query Mechanism</td>
                      <td className="p-3">Exact field matching & indexes</td>
                      <td className="p-3">Cosine Distance / K-Nearest Neighbors</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white">Stored Example</td>
                      <td className="p-3"><code className="bg-slate-950 text-sky-300 p-1 rounded font-mono text-[10px]">{`{"incident_id": "INC001", "status": "RESOLVED"}`}</code></td>
                      <td className="p-3"><code className="bg-slate-950 text-emerald-300 p-1 rounded font-mono text-[10px]">{`[0.21, -0.42, 0.76, 0.11, ...]`}</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer font-mono"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
