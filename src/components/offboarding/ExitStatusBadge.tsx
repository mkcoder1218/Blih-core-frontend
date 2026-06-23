import React from 'react';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  interview_scheduled: 'bg-violet-50 text-violet-700 border border-violet-200',
  interview_completed: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  clearance_pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  account_disabled: 'bg-slate-100 text-slate-700 border border-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'On Leave',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  rejected: 'Rejected',
  clearance_pending: 'Clearance Pending',
  completed: 'Completed',
  account_disabled: 'Left',
  cancelled: 'Revision Requested',
};

export default function ExitStatusBadge({ status }: { status?: string }) {
  const value = status || 'pending';

  return (
    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${STATUS_STYLE[value] || STATUS_STYLE.pending}`}>
      {STATUS_LABEL[value] || value}
    </span>
  );
}
