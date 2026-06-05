import React from 'react';

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'Approved',
  completed: 'Completed',
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
