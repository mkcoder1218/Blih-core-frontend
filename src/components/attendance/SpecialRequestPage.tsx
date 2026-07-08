import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/blih';
import { useLegacyUser } from '../../api/legacyUserStore';
import { useMyPermissions } from '../../hooks/usePermissions';
import {
  useApproveSpecialRequest,
  useRejectSpecialRequest,
  useSpecialRequests,
  useSubmitSpecialRequest,
  type SpecialRequest,
  type SpecialRequestLunchUsageType,
} from '../../hooks/useSpecialRequests';

interface SpecialRequestPageProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

const todayYmd = new Date().toISOString().slice(0, 10);

export default function SpecialRequestPage({ showAlert }: SpecialRequestPageProps) {
  const perms = useMyPermissions();
  const legacyUser = useLegacyUser();
  const submit = useSubmitSpecialRequest();
  const approve = useApproveSpecialRequest();
  const reject = useRejectSpecialRequest();
  const canApprove = perms.isSuperAdmin || legacyUser?.role === 'HR Manager' || legacyUser?.role === 'Business Admin' || perms.hasAny('attendance.manage', 'attendance.checkin_correction.approve');
  const myRequests = useSpecialRequests({ mine: true, status: 'all', size: 10 });
  const pendingRequests = useSpecialRequests({ status: 'pending', size: 20, enabled: canApprove });
  const [form, setForm] = useState({
    requestedDate: todayYmd,
    lunchUsageType: 'FULL' as SpecialRequestLunchUsageType,
    requestedMinutes: 30,
    reason: '',
  });
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});

  const rows = myRequests.data?.rows || [];
  const pendingRows = pendingRequests.data?.rows || [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.requestedDate || !form.reason.trim()) {
      showAlert('Please add the date and reason.', 'error');
      return;
    }
    if (form.lunchUsageType === 'PARTIAL' && (!form.requestedMinutes || form.requestedMinutes < 1 || form.requestedMinutes > 60)) {
      showAlert('Please enter a number of minutes between 1 and 60.', 'error');
      return;
    }

    try {
      await submit.mutateAsync({
        requestedDate: form.requestedDate,
        lunchUsageType: form.lunchUsageType,
        requestedMinutes: form.lunchUsageType === 'FULL' ? undefined : Number(form.requestedMinutes),
        reason: form.reason.trim(),
      });
      setForm({ requestedDate: todayYmd, lunchUsageType: 'FULL', requestedMinutes: 30, reason: '' });
      showAlert('Special Request submitted.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.message || 'Failed to submit request.', 'error');
    }
  };

  const handleApprove = async (id: string) => {
    await approve.mutateAsync(id);
    showAlert('Special Request approved.', 'success');
  };

  const handleReject = async (id: string) => {
    const reason = (rejectReasonById[id] || '').trim();
    if (!reason) {
      showAlert('Please add a rejection reason.', 'error');
      return;
    }
    await reject.mutateAsync({ id, reason });
    setRejectReasonById((current) => ({ ...current, [id]: '' }));
    showAlert('Special Request rejected.', 'info');
  };

  return (
    <motion.div
      key="special-request"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="mx-auto w-full max-w-3xl space-y-5"
    >
      <SectionCard title="Special Request">
        <p className="text-xs font-semibold text-slate-500 -mt-1 mb-5">
          Request to use part or all of your lunch time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500">Date</span>
            <input
              type="date"
              value={form.requestedDate}
              onChange={(e) => setForm((current) => ({ ...current, requestedDate: e.target.value }))}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-[10px] font-black uppercase text-slate-500">Use lunch time</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <RadioOption
                label="Full lunch time"
                checked={form.lunchUsageType === 'FULL'}
                onChange={() => setForm((current) => ({ ...current, lunchUsageType: 'FULL' }))}
              />
              <RadioOption
                label="Specific minutes"
                checked={form.lunchUsageType === 'PARTIAL'}
                onChange={() => setForm((current) => ({ ...current, lunchUsageType: 'PARTIAL' }))}
              />
            </div>
          </fieldset>

          {form.lunchUsageType === 'PARTIAL' && (
            <label className="block space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500">Number of minutes</span>
              <input
                type="number"
                min={1}
                max={60}
                value={form.requestedMinutes}
                onChange={(e) => setForm((current) => ({ ...current, requestedMinutes: Math.min(60, Math.max(1, Number(e.target.value) || 1)) }))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </label>
          )}

          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500">Reason</span>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((current) => ({ ...current, reason: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              placeholder="Add a short reason..."
            />
          </label>

          <Button type="submit" disabled={submit.isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
            <Send className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </form>
      </SectionCard>

      {canApprove ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-black text-slate-900">Pending Special Requests</h3>
          {pendingRequests.isLoading ? (
            <p className="text-xs font-semibold text-slate-500 mt-3">Loading pending requests...</p>
          ) : pendingRows.length === 0 ? (
            <p className="text-xs font-semibold text-slate-500 mt-3">No pending requests.</p>
          ) : (
            <PendingRequestsTable
              rows={pendingRows}
              rejectReasonById={rejectReasonById}
              setRejectReasonById={setRejectReasonById}
              onApprove={handleApprove}
              onReject={handleReject}
              busy={approve.isPending || reject.isPending}
            />
          )}
        </section>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-black text-slate-900">Recent Requests</h3>
        {myRequests.isLoading ? (
          <p className="text-xs font-semibold text-slate-500 mt-3">Loading requests...</p>
        ) : rows.length === 0 ? (
          <p className="text-xs font-semibold text-slate-500 mt-3">No requests yet.</p>
        ) : (
          <RecentRequestsTable rows={rows} />
        )}
      </section>
    </motion.div>
  );
}

function PendingRequestsTable(props: {
  rows: SpecialRequest[];
  rejectReasonById: Record<string, string>;
  setRejectReasonById: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  busy: boolean;
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
            <th className="py-2 pr-3">Employee</th>
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Time Used</th>
            <th className="py-2 pr-3">Reason</th>
            <th className="py-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {props.rows.map((item) => (
            <tr key={item.id}>
              <td className="py-3 pr-3 font-bold text-slate-800">{item.requester?.fullName || 'Employee'}</td>
              <td className="py-3 pr-3 font-bold text-slate-800 font-mono">{item.requestedDate}</td>
              <td className="py-3 pr-3 font-semibold text-slate-600">
                {item.lunchUsageType === 'FULL' ? 'Full lunch time' : `${item.requestedMinutes} minutes`}
              </td>
              <td className="py-3 pr-3 font-semibold text-slate-600 max-w-[220px] truncate">{item.reason}</td>
              <td className="py-3">
                <div className="flex min-w-[240px] items-center gap-2">
                  <Button type="button" disabled={props.busy} onClick={() => props.onApprove(item.id)} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                    Approve
                  </Button>
                  <input
                    value={props.rejectReasonById[item.id] || ''}
                    onChange={(e) => props.setRejectReasonById((current) => ({ ...current, [item.id]: e.target.value }))}
                    placeholder="Reject reason"
                    className="h-8 w-28 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-700"
                  />
                  <Button type="button" variant="outline" disabled={props.busy} onClick={() => props.onReject(item.id)} className="h-8 text-xs font-bold">
                    Reject
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RadioOption({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold cursor-pointer transition-colors ${
      checked ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    }`}>
      <input type="radio" checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-blue-600" />
      <span>{label}</span>
    </label>
  );
}

function RecentRequestsTable({ rows }: { rows: SpecialRequest[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Time Used</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2">Approved By / Rejected Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {rows.map((item) => (
            <tr key={item.id}>
              <td className="py-3 pr-3 font-bold text-slate-800 font-mono">{item.requestedDate}</td>
              <td className="py-3 pr-3 font-semibold text-slate-600">
                {item.lunchUsageType === 'FULL' ? 'Full lunch time' : `${item.requestedMinutes} minutes`}
              </td>
              <td className="py-3 pr-3">
                <StatusPill status={item.status} />
              </td>
              <td className="py-3 font-semibold text-slate-600">
                {item.approver?.fullName || item.rejectedReason || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }: { status: SpecialRequest['status'] }) {
  const cls = status === 'approved'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : status === 'rejected'
      ? 'bg-rose-50 text-rose-700 border-rose-100'
      : 'bg-amber-50 text-amber-700 border-amber-100';
  return <span className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-black uppercase ${cls}`}>{status}</span>;
}
