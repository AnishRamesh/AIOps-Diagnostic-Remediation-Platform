import React, { useState, useEffect } from 'react';
import { KnowledgeDoc } from '../types';
import { api } from '../services/api';
import { Database, Search, Plus, CheckCircle2, Cpu, FileText } from 'lucide-react';

export const KnowledgeBase: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newErrorPattern, setNewErrorPattern] = useState('');
  const [newCategory, setNewCategory] = useState('Application Exception');
  const [newDescription, setNewDescription] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newRecommendedAction, setNewRecommendedAction] = useState('restart_application');

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = () => {
    api.getKnowledgeDocs().then(setDocs).catch(console.error);
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newErrorPattern || !newRootCause) return;

    try {
      await api.addKnowledgeDoc({
        error_pattern: newErrorPattern,
        category: newCategory,
        description: newDescription || newErrorPattern,
        root_cause: newRootCause,
        recommended_action: newRecommendedAction
      });
      setShowAddModal(false);
      setNewErrorPattern('');
      setNewRootCause('');
      setNewDescription('');
      loadDocs();
    } catch (err) {
      console.error('Failed adding knowledge document:', err);
    }
  };

  const filteredDocs = docs.filter(doc =>
    doc.error_pattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.root_cause.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">ChromaDB Vector Knowledge Store</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Troubleshooting resolutions indexed with 384d Sentence Transformer embeddings for RAG retrieval.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search vector store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-700 rounded-lg bg-slate-900 text-slate-200 focus:outline-none focus:border-sky-500 w-56 font-mono"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Index New Doc</span>
          </button>
        </div>
      </div>

      {/* Grid of Knowledge Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-[#1E293B] rounded-xl border border-slate-800 p-4 shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-sky-400">{doc.id}</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-semibold font-mono">
                  {doc.category}
                </span>
              </div>

              <h3 className="text-xs font-bold text-white line-clamp-2 mb-1">{doc.error_pattern}</h3>
              <p className="text-xs text-slate-400 line-clamp-3 mb-3">{doc.description}</p>
            </div>

            <div className="pt-2.5 border-t border-slate-800 text-xs space-y-1 font-mono text-[11px]">
              <div className="text-slate-300">
                <span className="text-slate-400">Cause:</span> {doc.root_cause}
              </div>
              <div className="text-emerald-400 font-bold">
                Action: {doc.recommended_action}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Index New Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-[#1E293B] rounded-xl border border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-bold text-white">Index New Knowledge Document</h3>
            <p className="text-xs text-slate-400">
              The embedding model will compute a 384d vector embedding and index it into ChromaDB for RAG retrieval.
            </p>

            <form onSubmit={handleAddDoc} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Error Pattern / Log Keyword</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SocketTimeoutException 10.0.0.1:5432"
                  value={newErrorPattern}
                  onChange={(e) => setNewErrorPattern(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Root Cause Explanation</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain why this exception occurs..."
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Recommended Allowlisted Action</label>
                <select
                  value={newRecommendedAction}
                  onChange={(e) => setNewRecommendedAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-white font-mono"
                >
                  <option value="restart_database">restart_database</option>
                  <option value="restart_application">restart_application</option>
                  <option value="restart_worker">restart_worker</option>
                  <option value="kill_port_process">kill_port_process</option>
                  <option value="restore_configuration">restore_configuration</option>
                  <option value="clear_temp_files">clear_temp_files</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  Index Vector
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
