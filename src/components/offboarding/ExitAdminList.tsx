import React, { useState } from 'react';
import { CheckCircle, FileText, Loader2, Mail, RefreshCw } from 'lucide-react';
import ExitRequestCard from './ExitRequestCard';

interface Props {
  requests: any[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  isUpdating: boolean;
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: string, data?: any) => void;
}

export default function ExitAdminList({
  requests,
  isLoading,
  isError,
  errorMessage,
  isUpdating,
  onRefresh,
  onUpdateStatus,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pending = requests.filter((r: any) => r.status === 'pending').length;
  const approved = requests.filter((r: any) => ['in_progress', 'completed'].includes(r.status)).length;
  const thisMonth = requests.filter((r: any) => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6 font-sans pb-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Received', value: requests.length, icon: <FileText className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Approval', value: pending, icon: <Mail className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Approved', value: approved, icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'This Month', value: thisMonth, icon: <FileText className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{isLoading ? '-' : s.value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Resignation Letters Received</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Employee offboarding requests submitted through the portal</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {isError ? (
        <div className="bg-white rounded-2xl border border-rose-100 p-14 text-center">
          <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">{errorMessage || 'Failed to load offboarding requests'}</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-bold">Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No offboarding requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request: any) => (
            <ExitRequestCard
              key={request.id}
              request={request}
              expanded={expandedId === request.id}
              updating={isUpdating}
              onToggle={() => setExpandedId(expandedId === request.id ? null : request.id)}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
