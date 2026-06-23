import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Clock, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { InfoAlert, SectionCard, StatCard, StatCardGrid, UserAvatar } from '@/components/ui/blih';
import {
  useApproveAttendanceRequest,
  useAttendanceRequests,
  useRejectAttendanceRequest,
  type AttendanceRequest,
} from '../../hooks/useAttendanceRequests';
import { getLatenessReasonUsage } from '../../api/attendanceHr';

interface AttendanceMemoLogTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
  memoLogs?: unknown[];
  setMemoLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  previousLeaves?: unknown[];
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours) return mins ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
}

function employeeName(row: AttendanceRequest) {
  return row.employee?.fullName || row.employee?.email || 'Employee';
}

function employeeMeta(row: { employee?: AttendanceRequest['employee'] | null }) {
  const profile = row.employee?.BusinessUserProfile;
  return {
    department: profile?.department?.name || '-',
    position: profile?.position?.title || '-',
    email: row.employee?.email || '',
  };
}

function statusTone(status: string) {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (s === 'invalid' || s === 'expired' || s === 'rejected') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-slate-50 text-slate-600 border-slate-100';
}

export default function AttendanceMemoLogTab({ showAlert }: AttendanceMemoLogTabProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pendingMemo = useAttendanceRequests({ requestType: 'memo_log', status: 'pending', size: 50 });
  const memoArchive = useAttendanceRequests({ requestType: 'memo_log', status, search: search || undefined, size: 100 });
  const reasonUsage = useQuery({
    queryKey: ['attendance-hr', 'lateness-reason-usage', search],
    queryFn: () => getLatenessReasonUsage({ search: search || undefined, size: 100 }),
    staleTime: 20_000,
  });
  const approve = useApproveAttendanceRequest();
  const reject = useRejectAttendanceRequest();

  const memoRows = memoArchive.data?.rows || [];
  const reasonRows = reasonUsage.data?.data?.rows || [];
  const selected = memoRows.find((row) => row.id === selectedId) || memoRows[0] || null;
  const thisWeekMemoCount = memoRows.filter((row) => {
    const created = new Date(row.createdAt).getTime();
    return Number.isFinite(created) && Date.now() - created <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const handleAction = async (id: string, next: 'approved' | 'rejected') => {
    try {
      if (next === 'approved') await approve.mutateAsync(id);
      else await reject.mutateAsync({ id, reason: 'Rejected by HR' });
      showAlert(next === 'approved' ? 'Memo log approved.' : 'Memo log rejected.', next === 'approved' ? 'success' : 'info');
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Failed to update memo log.', 'error');
    }
  };

  return (
    <motion.div
      key="memo-log"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <StatCardGrid cols={3}>
        <StatCard label="Memo Logs This Week" value={memoArchive.isLoading ? '-' : thisWeekMemoCount} icon={<Clock className="w-5 h-5" />} tone="blue" />
        <StatCard label="Pending Approval" value={pendingMemo.isLoading ? '-' : pendingMemo.data?.total || 0} icon={<Clock className="w-5 h-5" />} tone="amber" />
        <StatCard label="Total Memo Logs" value={memoArchive.isLoading ? '-' : memoArchive.data?.total || 0} icon={<CheckSquare className="w-5 h-5" />} tone="emerald" />
      </StatCardGrid>

      {memoArchive.isError || reasonUsage.isError ? (
        <InfoAlert variant="error" message="Failed to load memo log records." />
      ) : null}

      <SectionCard title="Memo Logs">
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee, title, or reason..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {memoArchive.isLoading ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase">Loading memo logs...</div>
          ) : memoRows.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-400 uppercase">No memo logs found.</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {memoRows.map((memo) => {
                const meta = employeeMeta(memo);
                return (
                  <div key={memo.id} onClick={() => setSelectedId(memo.id)} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4 cursor-pointer hover:border-blue-200">
                    <div className="flex items-start justify-between gap-3">
                      <UserAvatar name={employeeName(memo)} subtitle={meta.email} size="sm" />
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${statusTone(memo.status)}`}>{memo.status}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/70 rounded-xl p-3 text-[10.5px]">
                      <div><span className="text-slate-400 block font-bold">From</span><span className="font-mono font-bold text-slate-700">{formatDateTime(memo.fromAt)}</span></div>
                      <div><span className="text-slate-400 block font-bold">To</span><span className="font-mono font-bold text-slate-700">{formatDateTime(memo.toAt)}</span></div>
                      <div><span className="text-slate-400 block font-bold">Duration</span><span className="font-black text-blue-600">{formatDuration(memo.durationMinutes)}</span></div>
                      <div><span className="text-slate-400 block font-bold">Submitted</span><span className="font-mono font-bold text-slate-700">{formatDateTime(memo.createdAt)}</span></div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-400">{meta.department} / {meta.position}</div>
                      <h4 className="mt-1 text-xs font-black text-slate-950">{memo.title}</h4>
                      <p className="mt-1 text-[11px] font-semibold text-slate-600">{memo.reason}</p>
                    </div>
                    {memo.status === 'pending' ? (
                      <div className="flex gap-2 pt-2 border-t border-slate-50">
                        <Button disabled={approve.isPending || reject.isPending} onClick={(e) => { e.stopPropagation(); handleAction(memo.id, 'approved'); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex-1">Approve</Button>
                        <Button disabled={approve.isPending || reject.isPending} variant="outline" onClick={(e) => { e.stopPropagation(); handleAction(memo.id, 'rejected'); }} className="rounded-xl text-xs font-bold flex-1">Reject</Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Employee Reason Usage">
        <div className="space-y-3 pt-1">
          {reasonUsage.isLoading ? (
            <div className="py-6 text-xs font-semibold text-slate-500">Loading reason usage...</div>
          ) : reasonRows.length === 0 ? (
            <div className="py-6 text-xs font-semibold text-slate-500">No reason usage records found.</div>
          ) : reasonRows.map((item) => {
            const meta = employeeMeta(item);
            return (
              <div key={item.id} className="rounded-2xl border border-slate-100 p-4 flex flex-col md:flex-row justify-between gap-3">
                <div className="min-w-0">
                  <UserAvatar name={employeeName(item)} subtitle={`${meta.department} / ${meta.position}`} size="sm" />
                  <p className="mt-2 text-xs font-black text-slate-900">{item.reasonCategory || item.category || 'Reason'}</p>
                  <p className="text-[11px] font-semibold text-slate-600">{item.reasonText || item.reason}</p>
                  <p className="mt-2 text-[10px] font-bold text-slate-400">
                    For {formatDateTime(item.fromAt)} / Submitted {formatDateTime(item.submittedAt || item.createdAt)}
                  </p>
                </div>
                <span className={`self-start text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${statusTone(item.validityStatus || item.status)}`}>
                  {item.validityStatus || item.status}
                </span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {selected ? (
        <SectionCard title="Selected Memo Details">
          <div className="space-y-2 pt-1">
            <UserAvatar name={employeeName(selected)} subtitle={selected.employee?.email || ''} size="sm" />
            <p className="text-xs font-black text-slate-950">{selected.title}</p>
            <p className="text-xs font-semibold text-slate-600">{selected.reason}</p>
            <p className="text-[10px] font-bold text-slate-400">{formatDateTime(selected.fromAt)} to {formatDateTime(selected.toAt)}</p>
          </div>
        </SectionCard>
      ) : null}
    </motion.div>
  );
}
