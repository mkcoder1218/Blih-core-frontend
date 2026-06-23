import React, { useState } from 'react';
import { CalendarPlus, CheckCircle, Eye, FileSignature, Loader2, Send, XCircle } from 'lucide-react';
import ExitStatusBadge from './ExitStatusBadge';
import { InputDialog } from '@/components/ui/blih';

interface Props {
  key?: React.Key;
  request: any;
  expanded: boolean;
  updating: boolean;
  onToggle: () => void;
  onUpdateStatus: (id: string, status: string, data?: any) => void;
}

export default function ExitRequestCard({ request, expanded, updating, onToggle, onUpdateStatus }: Props) {
  const interviewDateOptions = Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const value = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return { value, label: index === 0 ? `Today - ${label}` : index === 1 ? `Tomorrow - ${label}` : label };
  });
  const [inputAction, setInputAction] = useState<null | 'approve' | 'reject' | 'schedule'>(null);
  const [scheduleForm, setScheduleForm] = useState({
    interviewDate: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    interviewType: 'in-person',
    location: '',
    meetingUrl: '',
  });
  const emp = request.employee;
  const profile = emp?.BusinessUserProfile;
  const name = emp?.fullName || 'Unknown';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const dept = profile?.department?.name || '-';
  const role = profile?.position?.title || '-';
  const letter = request.clearanceData?.letterHtml;
  const noticeDays = request.clearanceData?.noticePeriodDays || 30;
  const templateName = request.clearanceData?.templateSnapshot?.name;
  const lastDay = request.effectiveDate
    ? new Date(request.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '-';
  const submittedDate = request.createdAt
    ? new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '-';
  const leaveEndsAt = request.leaveEndsAt ? new Date(request.leaveEndsAt) : null;
  const leaveReady = leaveEndsAt ? leaveEndsAt.getTime() <= Date.now() : false;
  const leaveRemaining = leaveEndsAt ? Math.max(Math.ceil((leaveEndsAt.getTime() - Date.now()) / 86400000), 0) : null;
  const acceptedDevices = request.offboardingFormData?.acceptedDevices || request.clearanceData?.acceptedDevices || [];
  const canRunFinalStage = ['in_progress', 'interview_completed', 'clearance_pending'].includes(request.status);
  const needsLeaveApproval = canRunFinalStage && !leaveEndsAt;
  const finalApprovalBlocker = needsLeaveApproval
    ? 'Approve leave first to start the 30-day window.'
    : !leaveReady
    ? `${leaveRemaining} day(s) remaining in the leave window.`
    : !request.offboardingFormSubmittedAt
    ? 'Waiting for employee offboarding form submission.'
    : null;

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
              {leaveEndsAt && <div className="col-span-2"><span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Leave Window</span><span className="font-bold text-slate-700">{leaveReady ? 'Ready for final approval' : `${leaveRemaining} day(s) remaining`}</span></div>}
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

          {request.rejectionReason && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs font-semibold text-rose-700">
              Rejection reason: {request.rejectionReason}
            </div>
          )}
          {(request.reviewer || request.reviewedAt || request.approvalNote) && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-500 space-y-1">
              <div><span className="font-black text-slate-600">Reviewer:</span> {request.reviewer?.fullName || request.reviewer?.email || '-'}</div>
              <div><span className="font-black text-slate-600">Reviewed:</span> {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : '-'}</div>
              {request.approvalNote && <div><span className="font-black text-slate-600">Note:</span> {request.approvalNote}</div>}
              {templateName && <div><span className="font-black text-slate-600">Template:</span> {templateName}</div>}
            </div>
          )}

          {acceptedDevices.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Accepted Devices</div>
              <div className="space-y-1">
                {acceptedDevices.map((device: any) => (
                  <div key={device.id || device.assetTag || device.name} className="text-[11px] font-semibold text-blue-900 flex items-center justify-between gap-2">
                    <span>{device.name} {device.assetTag ? `(${device.assetTag})` : ''}</span>
                    <span className="text-blue-600">{device.acceptanceStatus || device.status || 'assigned'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {request.status === 'pending' ? (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setInputAction('approve')}
                disabled={updating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve & Respond
              </button>
              <button
                onClick={() => setInputAction('reject')}
                disabled={updating}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-black py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => setInputAction('schedule')}
                disabled={updating}
                className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-[11px] font-black py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <CalendarPlus className="w-3.5 h-3.5" /> Schedule
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              {canRunFinalStage ? (
                <div className="flex-1 space-y-2">
                  {needsLeaveApproval && (
                    <button
                      onClick={() => setInputAction('approve')}
                      disabled={updating}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve Leave
                    </button>
                  )}
                  <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(request.id, 'send_offboarding_form')}
                    disabled={updating || Boolean(request.offboardingFormSentAt)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> {request.offboardingFormSentAt ? 'Form Sent' : 'Send Form'}
                  </button>
                  <button
                    onClick={() => onUpdateStatus(request.id, 'completed')}
                    disabled={updating || !leaveReady || !request.offboardingFormSubmittedAt}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-black py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Final Approve
                  </button>
                  </div>
                  {finalApprovalBlocker && (
                    <p className="text-[10px] font-bold text-amber-600 leading-snug">{finalApprovalBlocker}</p>
                  )}
                </div>
              ) : (
                <button disabled className="flex-1 bg-slate-100 text-slate-400 text-[11px] font-black py-2 rounded-xl cursor-not-allowed">
                  {request.status === 'rejected' ? 'Rejected' : request.status === 'interview_scheduled' ? 'Interview Scheduled' : request.status === 'account_disabled' ? 'Left' : request.status === 'cancelled' ? 'Revision Requested' : request.status === 'completed' ? 'Account Disabled' : 'Completed'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <InputDialog
        open={inputAction === 'approve'}
        onClose={() => setInputAction(null)}
        onConfirm={(effectiveDate) => {
          setInputAction(null);
          onUpdateStatus(request.id, 'in_progress', { effectiveDate, approvalNote: '' });
        }}
        title="Approve Resignation"
        description="Confirm the employee's last working date."
        label="Last working date"
        initialValue={request.effectiveDate ? String(request.effectiveDate).slice(0, 10) : ''}
        placeholder="YYYY-MM-DD"
        confirmLabel="Approve"
        required
        loading={updating}
      />
      <InputDialog
        open={inputAction === 'reject'}
        onClose={() => setInputAction(null)}
        onConfirm={(rejectionReason) => {
          setInputAction(null);
          onUpdateStatus(request.id, 'rejected', { rejectionReason });
        }}
        title="Reject Resignation"
        description="Enter the mandatory rejection reason."
        label="Reason"
        placeholder="Reason for rejection"
        confirmLabel="Reject"
        required
        loading={updating}
      />
      {inputAction === 'schedule' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/35 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Schedule Exit Interview</h3>
                <button onClick={() => setInputAction(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
              </div>
              <p className="text-[11px] font-semibold text-slate-400">Choose the date, time, and interview mode.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setInputAction(null);
                onUpdateStatus(request.id, 'interview_scheduled', scheduleForm);
              }}
              className="border-t border-slate-100 p-5 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Interview Date</label>
                  <select
                    required
                    value={scheduleForm.interviewDate}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, interviewDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400"
                  >
                    {interviewDateOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Start Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Interview Mode</label>
                <select
                  value={scheduleForm.interviewType}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, interviewType: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400"
                >
                  <option value="in-person">In-person</option>
                  <option value="video">Video call</option>
                  <option value="phone">Phone call</option>
                </select>
              </div>
              {scheduleForm.interviewType === 'in-person' ? (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Location</label>
                  <input
                    type="text"
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="HR office, meeting room, branch..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Meeting Link / Contact</label>
                  <input
                    type="text"
                    value={scheduleForm.meetingUrl}
                    onChange={(e) => setScheduleForm((prev) => ({ ...prev, meetingUrl: e.target.value }))}
                    placeholder="Meeting URL or phone number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setInputAction(null)} className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black py-2.5 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={updating} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black py-2.5 rounded-xl transition-colors">
                  {updating ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
