import React from 'react';
import { Clock } from 'lucide-react';

const LABELS: Record<string, string> = {
  EXIT_RESIGNATION_SUBMITTED: 'Resignation submitted',
  EXIT_REQUEST_REVISED: 'Request revised',
    EXIT_APPROVED: 'Approved',
    EXIT_REVISION_REQUESTED: 'Revision Requested',
  EXIT_STATUS_UPDATED: 'Status updated',
  EXIT_PROCESS_COMPLETED: 'Process completed',
  EXIT_PROCESS_CANCELLED: 'Process cancelled',
  EXIT_HR_INITIATED: 'HR initiated exit',
  EXIT_PROCESS_UPDATED: 'Process updated',
  EXIT_INTERVIEW_SCHEDULED: 'Interview scheduled',
  EXIT_INTERVIEW_COMPLETED: 'Interview completed',
  EXIT_DOCUMENT_UPLOADED: 'Document uploaded',
  EXIT_DOCUMENT_VERIFIED: 'Document verified',
  EXIT_CLEARANCE_STEP_COMPLETED: 'Clearance step completed',
  EXIT_CLEARANCE_STEP_WAIVED: 'Clearance step waived',
  EXIT_FINAL_PAYMENT_SETTLED: 'Final payment settled',
};

export default function ExitTimeline({ events = [], isLoading = false }: { events?: any[]; isLoading?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 tracking-tight uppercase">Timeline</h3>
      {isLoading ? (
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest py-4">Loading timeline...</div>
      ) : events.length === 0 ? (
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest py-4">No timeline history yet</div>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0"><Clock className="w-3.5 h-3.5" /></div>
              <div>
                <p className="text-xs font-bold text-slate-700">{LABELS[event.action] || event.action}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
