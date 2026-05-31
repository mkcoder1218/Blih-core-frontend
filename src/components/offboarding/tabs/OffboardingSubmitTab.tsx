/**
 * OffboardingSubmitTab — Employee resignation submission + HR admin review.
 * Replaces the inline OffboardingTab function in ExitOffboardingView.
 * Uses React Query hooks instead of direct api calls.
 */
import React, { useState } from 'react';
import {
  FileText,
  Mail,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  Bold,
  Italic,
  List,
  AlignLeft,
  RefreshCw,
  Eye,
  FileSignature,
  AlertCircle,
} from 'lucide-react';
import { useMe } from '../../../hooks/useMe';
import { useExitRequests, useSubmitExitRequest, useUpdateExitStatus } from '../../../hooks/useHrRecords';

// ─── Status badge helper ──────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  pending:     'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled:   'bg-rose-50 text-rose-700 border border-rose-200',
};

// ─── Simple rich-text editor ──────────────────────────────────────────────────
function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200">
        {[
          { icon: <Bold className="w-3.5 h-3.5" />, cmd: 'bold', title: 'Bold' },
          { icon: <Italic className="w-3.5 h-3.5" />, cmd: 'italic', title: 'Italic' },
          { icon: <List className="w-3.5 h-3.5" />, cmd: 'insertUnorderedList', title: 'Bullet list' },
          { icon: <AlignLeft className="w-3.5 h-3.5" />, cmd: 'justifyLeft', title: 'Align left' },
        ].map((btn) => (
          <button
            key={btn.cmd}
            type="button"
            title={btn.title}
            onMouseDown={(e) => { e.preventDefault(); exec(btn.cmd); }}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
          >
            {btn.icon}
          </button>
        ))}
        <div className="w-px h-4 bg-slate-200 mx-1" />
        {['H1', 'H2', 'H3'].map((h) => (
          <button
            key={h}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', h); }}
            className="px-2 py-1 rounded-lg hover:bg-slate-200 text-slate-600 text-[10px] font-black transition-colors"
          >
            {h}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }}
        className="min-h-[200px] p-4 text-sm text-slate-700 focus:outline-none prose prose-sm max-w-none"
        style={{ lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}

interface Props {
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function OffboardingSubmitTab({ showAlert }: Props) {
  const { data: meRes } = useMe();
  const me = meRes?.data;

  const isAdmin =
    me?.roles?.some((r: any) => ['BUSINESS_ADMIN', 'HR_MANAGER'].includes(r.key)) ?? false;

  // ── Employee form state ──
  const [letterHtml, setLetterHtml] = useState('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [noticePeriodDays, setNoticePeriodDays] = useState('30');
  const [submitted, setSubmitted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── React Query hooks ──
  const { data: requests = [], isLoading: loadingList, refetch } = useExitRequests();
  const submitExit = useSubmitExitRequest();
  const updateStatus = useUpdateExitStatus();

  // ── Stats ──
  const pending   = requests.filter((r: any) => r.status === 'pending').length;
  const approved  = requests.filter((r: any) => ['in_progress', 'completed'].includes(r.status)).length;
  const thisMonth = requests.filter((r: any) => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveDate) { showAlert('Please set your last working day', 'error'); return; }
    if (!letterHtml.trim() || letterHtml === '<br>') { showAlert('Please write your offboarding letter', 'error'); return; }
    try {
      await submitExit.mutateAsync({
        effectiveDate,
        reason,
        letterHtml,
        noticePeriodDays: Number(noticePeriodDays),
      });
      setSubmitted(true);
      showAlert('Offboarding request submitted. HR has been notified.', 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || 'Failed to submit request', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      showAlert(status === 'in_progress' ? 'Request approved' : 'Revision requested', 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || 'Failed to update status', 'error');
    }
  };

  // ── Admin view ────────────────────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="space-y-6 font-sans pb-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Received',   value: requests.length, icon: <FileText className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Pending Approval', value: pending,         icon: <Mail className="w-5 h-5" />,     color: 'text-amber-600 bg-amber-50' },
            { label: 'Approved',         value: approved,        icon: <CheckCircle className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'This Month',       value: thisMonth,       icon: <FileText className="w-5 h-5" />, color: 'text-violet-600 bg-violet-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{s.label}</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{loadingList ? '—' : s.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Resignation Letters Received</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Employee offboarding requests submitted through the portal</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={loadingList}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* List */}
        {loadingList ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-bold">Loading requests…</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No offboarding requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req: any) => {
              const emp = req.employee;
              const profile = emp?.BusinessUserProfile;
              const name = emp?.fullName || 'Unknown';
              const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const dept = profile?.department?.name || '—';
              const role = profile?.position?.title || '—';
              const isExpanded = expandedId === req.id;
              const letter = req.clearanceData?.letterHtml;
              const noticeDays = req.clearanceData?.noticePeriodDays || 30;
              const lastDay = req.effectiveDate
                ? new Date(req.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';
              const submittedDate = req.createdAt
                ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—';

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  <div className="flex flex-col md:flex-row gap-4 p-5">
                    {/* Employee info */}
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">{name}</span>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{dept}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${STATUS_STYLE[req.status] || STATUS_STYLE.pending}`}>
                            {req.status === 'in_progress' ? 'Approved' : req.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{role}</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-[11px]">
                          <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Submitted</span><span className="font-bold text-slate-700">{submittedDate}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Last Working Day</span><span className="font-bold text-slate-700">{lastDay}</span></div>
                          <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Notice Period</span><span className="font-bold text-slate-700">{noticeDays} days</span></div>
                          <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Reason</span><span className="font-bold text-blue-600 text-[10px]">{req.reason || '—'}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Letter + actions */}
                    <div className="md:w-96 space-y-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <FileSignature className="w-3.5 h-3.5" /> Resignation Letter
                      </div>
                      {letter ? (
                        <div className={`bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed overflow-hidden transition-all ${isExpanded ? '' : 'max-h-28'}`}>
                          <div dangerouslySetInnerHTML={{ __html: letter }} />
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-400 italic">No letter content provided.</div>
                      )}
                      {letter && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req.id)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-3 h-3" /> {isExpanded ? 'Collapse' : 'Read full letter'}
                        </button>
                      )}

                      {req.status === 'pending' ? (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'in_progress')}
                            disabled={updateStatus.isPending}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                          >
                            {updateStatus.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Approve & Respond
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                            disabled={updateStatus.isPending}
                            className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-black py-2 rounded-xl transition-colors"
                          >
                            Request Revision
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <button disabled className="flex-1 bg-slate-100 text-slate-400 text-[11px] font-black py-2 rounded-xl cursor-not-allowed">
                            {req.status === 'in_progress' ? 'Approved & Responded' : req.status === 'cancelled' ? 'Revision Requested' : 'Completed'}
                          </button>
                        </div>
                      )}
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

  // ── Employee submission success state ─────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Request Submitted</h3>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          Your offboarding request has been submitted. HR has been notified and will review it shortly.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-sm w-full text-center">
          <p className="text-xs font-semibold text-blue-700">
            You will receive a notification once HR approves your request.
          </p>
        </div>
      </div>
    );
  }

  // ── Employee submission form ───────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans pb-12">
      <div>
        <h3 className="text-sm font-black text-slate-900">Submit Offboarding Request</h3>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          Write your resignation letter and set your last working day. HR will be notified automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
              Last Working Day <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
              Notice Period (days)
            </label>
            <select
              value={noticePeriodDays}
              onChange={(e) => setNoticePeriodDays(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400"
            >
              {['14', '30', '60', '90'].map((d) => (
                <option key={d} value={d}>{d} days</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
            Reason for Leaving
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400"
          >
            <option value="">Select a reason</option>
            {['Better career opportunity', 'Personal reasons', 'Relocation', 'Further education', 'Health reasons', 'Work-life balance', 'Other'].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
            Resignation Letter <span className="text-rose-500">*</span>
          </label>
          <RichTextEditor value={letterHtml} onChange={setLetterHtml} />
          <p className="text-[10px] text-slate-400 font-medium mt-1.5">
            Write a formal resignation letter. Use the toolbar to format your text.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-700 leading-relaxed">
            Once submitted, your HR team will be notified immediately. Please ensure your letter is complete before submitting.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitExit.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {submitExit.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            : <><Send className="w-4 h-4" /> Submit Offboarding Request</>
          }
        </button>
      </form>
    </div>
  );
}
