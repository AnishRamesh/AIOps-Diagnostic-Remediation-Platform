import React, { useState } from 'react';
import { Incident } from '../types';
import { IncidentTable } from '../components/IncidentTable';
import { Search, Filter, AlertOctagon } from 'lucide-react';

interface IncidentsProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onExecuteRemediation: (incidentId: string) => void;
}

export const Incidents: React.FC<IncidentsProps> = ({
  incidents,
  onSelectIncident,
  onExecuteRemediation
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.incident_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.error_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.error_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.root_cause && inc.root_cause.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-800 p-5 text-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Incident Registry (MongoDB)</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit record of runtime errors, RAG root-cause diagnoses, safe remediations, and MTTR resolution metrics.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-700 rounded-lg bg-slate-900 text-slate-200 focus:outline-none focus:border-sky-500 w-48 font-mono"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-700 rounded-lg bg-slate-900 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="RESOLVED">Resolved</option>
            <option value="ANALYZING">Analyzing</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-700 rounded-lg bg-slate-900 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Incident Table */}
      <IncidentTable
        incidents={filteredIncidents}
        onSelectIncident={onSelectIncident}
        onExecuteRemediation={onExecuteRemediation}
      />

    </div>
  );
};
