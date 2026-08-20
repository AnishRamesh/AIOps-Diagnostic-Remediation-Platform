import React from 'react';
import { Severity, IncidentStatus, RemediationStatus, RecoveryStatus } from '../types';

interface StatusBadgeProps {
  type: 'severity' | 'status' | 'remediation' | 'recovery' | 'confidence';
  value: string | number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (type === 'severity') {
    const sev = value as Severity;
    if (sev === 'CRITICAL') colorClasses = 'bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold';
    else if (sev === 'HIGH') colorClasses = 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-semibold';
    else if (sev === 'MEDIUM') colorClasses = 'bg-sky-500/20 text-sky-400 border-sky-500/30';
    else colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  } else if (type === 'status') {
    const st = value as IncidentStatus;
    if (st === 'RESOLVED') colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold';
    else if (st === 'REMEDIATING' || st === 'ANALYZING') colorClasses = 'bg-sky-500/20 text-sky-400 border-sky-500/30 animate-pulse';
    else if (st === 'PENDING_APPROVAL') colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-semibold';
    else if (st === 'FAILED') colorClasses = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    else colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  } else if (type === 'remediation') {
    const rem = value as RemediationStatus;
    if (rem === 'SUCCESS') colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    else if (rem === 'EXECUTING') colorClasses = 'bg-sky-500/20 text-sky-400 border-sky-500/30 animate-pulse';
    else if (rem === 'PENDING_APPROVAL') colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    else if (rem === 'REJECTED' || rem === 'FAILED') colorClasses = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    else colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
  } else if (type === 'recovery') {
    const rec = value as RecoveryStatus;
    if (rec === 'RECOVERED') colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium';
    else if (rec === 'RECOVERING') colorClasses = 'bg-sky-500/20 text-sky-400 border-sky-500/30 animate-pulse';
    else if (rec === 'FAILED') colorClasses = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    else colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
  } else if (type === 'confidence') {
    const num = Number(value);
    if (num >= 0.90) colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold';
    else if (num >= 0.75) colorClasses = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    else colorClasses = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  }

  const formatText = () => {
    if (type === 'confidence') return `${(Number(value) * 100).toFixed(0)}% Conf`;
    return String(value).replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${colorClasses}`}>
      {formatText()}
    </span>
  );
};
