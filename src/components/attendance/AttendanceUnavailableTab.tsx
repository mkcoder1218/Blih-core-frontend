import React, { useState } from 'react';
import { CalendarX, CheckSquare, Clock, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { FormField, FormRow, SectionCard, StatCard, StatCardGrid, UserAvatar } from '@/components/ui/blih';
import {
  useApproveAttendanceRequest,
  useAttendanceRequests,
  useRejectAttendanceRequest,
  useSubmitAttendanceRequest,
} from '../../hooks/useAttendanceRequests';
import { useHrLateReasons } from '../../hooks/useHrLateReasons';
import { useMyPermissions } from '../../hooks/usePermissions';

interface AttendanceUnavailableTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
}

export default function AttendanceUnavailableTab({ showAlert }: AttendanceUnavailableTabProps) {
  const perms = useMyPermissions();
  const canApprove = perms.isSuperAdmin || perms.hasAny('attendance.manage', 'attendance.checkin_correction.approve');
  const submit = useSubmitAttendanceRequest();
  const lateReasons = useHrLateReasons();
  const approve = useApproveAttendanceRequest();
  const reject = useRejectAttendanceRequest();
  const pending = useAttendanceRequests({ requestType: 'not_available', status: 'pending', size: 50, enabled: canApprove });
  const archive = useAttendanceRequests({ requestType: 'not_available', status: 'all', size: 50, mine: !canApprove });
  const [form, setForm] = useState({
    category: 'Personal emergency',
    title: 'Not available to work',
    fromAt: '',
    toAt: '',
    reason: '',
  });

  const rows = pending.data?.rows || [];
  const mineRows = archive.data?.rows || [];
  const reasonOptions = (lateReasons.data?.data?.reasons || []).filter((item: any) => item.isActive !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromAt || !form.toAt || !form.reason.trim()) {
      showAlert('Please complete the unavailable dates and reason.', 'error');
      return;
    }
    try {
      await submit.mutateAsync({
        requestType: 'not_available',
        category: form.category,
        title: form.title,
        reason: form.reason.trim(),
        fromAt: form.fromAt,
        toAt: form.toAt,
      });
      setForm({ category: 'Personal emergency', title: 'Not available to work', fromAt: '', toAt: '', reason: '' });
      showAlert('Unavailable request submitted for approval.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to submit unavailable reason.', 'error');
    }
  };

  const action = async (id: string, next: 'approved' | 'rejected') => {
    if (next === 'approved') await approve.mutateAsync(id);
    else await reject.mutateAsync({ id, reason: 'Rejected by HR' });
    showAlert(next === 'approved' ? 'Unavailable reason approved.' : 'Unavailable reason rejected.', next === 'approved' ? 'success' : 'info');
  };

  return (
    <motion.div
      key="not-available"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <StatCardGrid cols={3}>
        <StatCard label="Pending Reasons" value={pending.data?.total || 0} icon={<Clock className="w-5 h-5" />} tone="amber" />
        <StatCard label="All Unavailable Requests" value={archive.data?.total || 0} icon={<CheckSquare className="w-5 h-5" />} tone="emerald" />
        <StatCard label="Review Queue" value={rows.length} icon={<CalendarX className="w-5 h-5" />} tone="blue" />
      </StatCardGrid>

      <SectionCard title="Submit Not Available Reason">
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FormRow cols={2}>
            <FormField label="Reason Type">
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
              >
                {reasonOptions.map((item: any) => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
                {reasonOptions.length === 0 && (
                  <>
                    <option>Personal emergency</option>
                    <option>Medical appointment</option>
                    <option>Family responsibility</option>
                    <option>Transport disruption</option>
                  </>
                )}
                <option>Other</option>
              </select>
            </FormField>
            <FormField label="Title">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none"
              />
            </FormField>
          </FormRow>
          <FormRow cols={2}>
            <FormField label="From" required>
              <input type="datetime-local" value={form.fromAt} onChange={(e) => setForm((p) => ({ ...p, fromAt: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none" />
            </FormField>
            <FormField label="To" required>
              <input type="datetime-local" value={form.toAt} onChange={(e) => setForm((p) => ({ ...p, toAt: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none" />
            </FormField>
          </FormRow>
          <FormField label="Reason" required>
            <textarea
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Explain why you will not be available to work..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none resize-none"
            />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit" disabled={submit.isPending} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
              <Send className="w-4 h-4 mr-1" />
              {submit.isPending ? 'Submitting...' : 'Submit Reason'}
            </Button>
          </div>
        </form>
      </SectionCard>

      {canApprove && (
        <SectionCard title="Pending Manager Approval">
          <div className="space-y-4 pt-1">
            {pending.isLoading ? (
              <div className="text-xs font-semibold text-slate-500 py-4">Loading unavailable reasons...</div>
            ) : rows.length === 0 ? (
              <div className="text-xs font-semibold text-slate-500 py-4">No pending unavailable reasons.</div>
            ) : rows.map((item) => (
              <div key={item.id} className="border border-slate-150 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <UserAvatar name={item.employee?.fullName || 'Employee'} subtitle={item.employee?.email || ''} size="sm" />
                  <p className="text-xs font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs font-semibold text-slate-600">{item.reason}</p>
                  <div className="text-[11px] font-bold text-slate-400">{formatDateTime(item.fromAt)} to {formatDateTime(item.toAt)} • {item.category}</div>
                </div>
                <div className="flex gap-2 self-start md:self-center">
                  <Button disabled={approve.isPending || reject.isPending} onClick={() => action(item.id, 'approved')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">Approve</Button>
                  <Button disabled={approve.isPending || reject.isPending} variant="outline" onClick={() => action(item.id, 'rejected')} className="rounded-xl text-xs font-bold">Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Unavailable History">
        <div className="space-y-3 pt-1">
          {mineRows.length === 0 ? (
            <div className="text-xs font-semibold text-slate-500 py-4">No unavailable reasons submitted yet.</div>
          ) : mineRows.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-100 p-4 flex justify-between gap-4">
              <div>
                <p className="text-xs font-black text-slate-900">{item.title}</p>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">{item.reason}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">{formatDateTime(item.fromAt)} to {formatDateTime(item.toAt)}</p>
              </div>
              <span className="text-[10px] font-black uppercase text-slate-500">{item.status}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  );
}
