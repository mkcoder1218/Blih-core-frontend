import React from 'react';
import { CheckCircle, Eye, FileSignature, Loader2 } from 'lucide-react';
import ExitStatusBadge from './ExitStatusBadge';

interface Props {
  key?: React.Key;
  request: any;
  expanded: boolean;
  updating: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

export default function ExitRequestCard({ request, expanded, updating, onToggle, onUpdateStatus }: Props) {
  const emp = request.employee;
  const profile = emp?.BusinessUserProfile;
  const name = emp?.fullName || 'Unknown';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const dept = profile?.department?.name || '-';
  const role = profile?.position?.title || '-';
  const letter = request.clearanceData?.letterHtml;
  const noticeDays = request.clearanceData?.noticePeriodDays || 30;
  const lastDay = request.effectiveDate
    ? new Date(request.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '-';
  const submittedDate = request.createdAt
    ? new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '-';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 p-5">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-900">{name}</span>
              <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{dept}</span>
              <ExitStatusBadge status={request.status} />
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{role}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-[11px]">
              <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Submitted</span><span className="font-bold text-slate-700">{submittedDate}</span></div>
              <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Last Working Day</span><span className="font-bold text-slate-700">{lastDay}</span></div>
              <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Notice Period</span><span className="font-bold text-slate-700">{noticeDays} days</span></div>
              <div><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Reason</span><span className="font-bold text-blue-600 text-[10px]">{request.reason || '-'}</span></div>
            </div>
          </div>
        </div>

        <div className="md:w-96 space-y-3">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
            <FileSignature className="w-3.5 h-3.5" /> Resignation Letter
          </div>
          {letter ? (
            <div className={`bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed overflow-hidden transition-all ${expanded ? '' : 'max-h-28'}`}>
              <div dangerouslySetInnerHTML={{ __html: letter }} />
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-400 italic">No letter content provided.</div>
          )}
          {letter && (
            <button onClick={onToggle} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700">
              <Eye className="w-3 h-3" /> {expanded ? 'Collapse' : 'Read full letter'}
            </button>
          )}

          {request.status === 'pending' ? (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onUpdateStatus(request.id, 'in_progress')}
                disabled={updating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve & Respond
              </button>
              <button
                onClick={() => onUpdateStatus(request.id, 'cancelled')}
                disabled={updating}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-black py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                Request Revision
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button disabled className="flex-1 bg-slate-100 text-slate-400 text-[11px] font-black py-2 rounded-xl cursor-not-allowed">
                {request.status === 'in_progress' ? 'Approved & Responded' : request.status === 'cancelled' ? 'Revision Requested' : 'Completed'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
