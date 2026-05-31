/**
 * ResignationsTab — HR admin view of all resignation letters.
 * Extracted from ExitOffboardingView and converted to React Query hooks.
 */
import React, { useState } from 'react';
import {
  FileText,
  Mail,
  CheckCircle,
  Loader2,
  Eye,
  FileSignature,
  RefreshCw,
} from 'lucide-react';
import { useExitRequests, useUpdateExitStatus } from '../../../hooks/useHrRecords';

interface Props {
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ResignationsTab({ showAlert }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: requests = [], isLoading, refetch } = useExitRequests();
  const updateStatus = useUpdateExitStatus();

  const pending   = requests.filter((r: any) => r.status === 'pending').length;
  const approved  = requests.filter((r: any) => ['in_progress', 'completed'].includes(r.status)).length;
  const thisMonth = requests.filter((r: any) => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      showAlert(
        status === 'in_progress' ? 'Resignation approved successfully!' : 'Revision requested.',
        'success',
      );
    } catch (e: any) {
      showAlert(e.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Received',   value: requests.length, icon: <FileText className="w-5 h-5" /> },
          { label: 'Pending Approval', value: pending,         icon: <Mail className="w-5 h-5" /> },
          { label: 'Approved',         value: approved,        icon: <CheckCircle className="w-5 h-5" /> },
          { label: 'This Month',       value: thisMonth,       icon: <FileText className="w-5 h-5" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{s.label}</span>
              <span className="text-3xl font-bold text-slate-800">{isLoading ? '—' : s.value}</span>
            </div>
            <div className="w-10 h-10 bg-slate-50 text-blue-600 rounded-xl flex items-center justify-center border border-slate-100">
              {s.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Resignation Letters Received</h3>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-xs font-bold">Loading…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-14 text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No resignation letters received</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => {
            const emp = req.employee;
            const profile = emp?.BusinessUserProfile;
            const name = emp?.fullName || 'Unknown';
            const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
            const dept = profile?.department?.name || '—';
            const role = profile?.position?.title || '—';
            const letter = req.clearanceData?.letterHtml;
            const noticeDays = req.clearanceData?.noticePeriodDays || 30;
            const isExpanded = expandedId === req.id;

            const lastDay = req.effectiveDate
              ? new Date(req.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
              : '—';
            const submittedDate = req.createdAt
              ? new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
              : '—';

            const statusStyle =
              req.status === 'in_progress' || req.status === 'completed'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                : req.status === 'cancelled'
                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                : 'bg-amber-50 text-amber-600 border border-amber-100';
            const statusLabel =
              req.status === 'in_progress' ? 'Approved'
              : req.status === 'cancelled'  ? 'Revision Requested'
              : req.status === 'completed'  ? 'Completed'
              : 'Pending';

            return (
              <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Employee info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800">{name}</h4>
                          <span className="bg-slate-50 border border-slate-100 text-slate-500 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{dept}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{role}</span>
                      </div>
                      <span className={`ml-auto text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Submitted Date</span><span className="font-bold text-slate-700">{submittedDate}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Last Working Day</span><span className="font-bold text-slate-700">{lastDay}</span></div>
                      <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Notice Period</span><span className="font-bold text-slate-700">{noticeDays} days</span></div>
                      <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Reason</span><span className="font-bold text-blue-600">{req.reason || '—'}</span></div>
                    </div>
                  </div>

                  {/* Letter + actions */}
                  <div className="flex-1 bg-slate-50/80 p-5 rounded-xl border border-slate-200/60 flex flex-col justify-between gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileSignature className="w-3.5 h-3.5" /> Resignation Letter
                      </span>
                      {letter ? (
                        <>
                          <div className={`bg-white p-4 rounded-lg border border-slate-100 text-xs text-slate-600 leading-relaxed overflow-hidden transition-all ${isExpanded ? '' : 'max-h-28'}`}>
                            <div dangerouslySetInnerHTML={{ __html: letter }} />
                          </div>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : req.id)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> {isExpanded ? 'Collapse' : 'Read full letter'}
                          </button>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-white p-4 rounded-lg border border-slate-100">No letter content provided.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                        disabled={req.status !== 'pending' || updateStatus.isPending}
                        className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl transition-all border flex items-center justify-center gap-1.5 ${
                          req.status !== 'pending'
                            ? 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {req.status === 'in_progress' || req.status === 'completed' ? 'Approved & Responded' : 'Approve & Respond'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                        disabled={req.status !== 'pending' || updateStatus.isPending}
                        className={`flex-1 font-bold text-xs py-2.5 px-4 rounded-xl transition-all border ${
                          req.status !== 'pending'
                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Request Revision
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
