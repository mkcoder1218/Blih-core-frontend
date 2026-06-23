import React, { useEffect, useState } from 'react';
import { AlertCircle, AlignLeft, Bold, CheckCircle, Italic, List, Loader2, Send } from 'lucide-react';
import { useMe } from '../../../hooks/useMe';
import { useCreateExitInterview, useExitForms, useExitRequests, useExitTimeline, useMyExitRequest, useSendOffboardingForm, useSubmitExitRequest, useSubmitOffboardingForm, useUpdateExitStatus } from '../../../hooks/useHrRecords';
import ExitAdminList from '../ExitAdminList';
import ExitStatusBadge from '../ExitStatusBadge';
import ExitTimeline from '../ExitTimeline';

function RichTextEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value;
  }, [value]);

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
      />
    </div>
  );
}

interface Props {
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
}

function formatTime(value?: string) {
  return value ? new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
}

function buildResignationLetterHtml({
  employeeName,
  effectiveDate,
  reason,
  templateName,
}: {
  employeeName?: string;
  effectiveDate?: string;
  reason?: string;
  templateName?: string;
}) {
  const displayName = employeeName || 'Employee';
  const lastWorkingDay = effectiveDate ? formatDate(effectiveDate) : '[Last working day]';
  const reasonText = reason || '[Reason for leaving]';
  const subject = templateName || 'Resignation Request';

  return [
    `<p>Dear HR Team,</p>`,
    `<p>I, ${displayName}, am submitting this ${subject.toLowerCase()} with a fixed notice period of 30 days.</p>`,
    `<p>My requested last working day is <strong>${lastWorkingDay}</strong>.</p>`,
    `<p>Reason for leaving: <strong>${reasonText}</strong>.</p>`,
    `<p>I will support the handover process and complete any required clearance or offboarding forms within the system.</p>`,
    `<p>Thank you.</p>`,
  ].join('');
}

export default function OffboardingSubmitTab({ showAlert }: Props) {
  const { data: meRes } = useMe();
  const me = meRes?.data;
  const isAdmin = Boolean(me?.permissions?.includes('hr.write') || me?.roles?.some((r: any) => ['BUSINESS_ADMIN', 'HR_MANAGER'].includes(typeof r === 'string' ? r : r.key)));

  const { data: requests = [], isLoading: loadingList, isError: isListError, error: listError, refetch } = useExitRequests({ enabled: isAdmin });
  const { data: myRequest, isLoading: loadingMine, isError: isMineError, error: mineError } = useMyExitRequest();
  const { data: myTimeline = [], isLoading: loadingMyTimeline } = useExitTimeline(myRequest?.id);
  const submitExit = useSubmitExitRequest();
  const updateStatus = useUpdateExitStatus();
  const createInterview = useCreateExitInterview();
  const sendOffboardingForm = useSendOffboardingForm();
  const submitOffboardingForm = useSubmitOffboardingForm();
  const { data: exitForms = [] } = useExitForms();

  const [letterHtml, setLetterHtml] = useState('');
  const [letterTouched, setLetterTouched] = useState(false);
  const autoLetterRef = React.useRef('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const noticePeriodDays = '30';
  const [handoverNotes, setHandoverNotes] = useState('');
  const [deviceConfirmation, setDeviceConfirmation] = useState(false);
  const activeTemplates = exitForms.filter((form: any) => form.status === 'active');
  const [templateId, setTemplateId] = useState('');
  const selectedTemplate = activeTemplates.find((form: any) => form.id === templateId) || activeTemplates.find((form: any) => form.key === 'employee_resignation');

  const canEdit = !myRequest || myRequest.status === 'cancelled';

  useEffect(() => {
    if (myRequest?.status === 'cancelled') {
      setLetterHtml(myRequest.clearanceData?.letterHtml || '');
      autoLetterRef.current = myRequest.clearanceData?.letterHtml || '';
      setLetterTouched(Boolean(myRequest.clearanceData?.letterHtml));
      setReason(myRequest.reason || '');
      setEffectiveDate(myRequest.effectiveDate ? String(myRequest.effectiveDate).slice(0, 10) : '');
      setTemplateId(myRequest.clearanceData?.templateId || '');
    }
  }, [myRequest]);

  useEffect(() => {
    if (!canEdit || letterTouched) return;
    const nextLetter = buildResignationLetterHtml({
      employeeName: me?.user?.fullName || me?.user?.email,
      effectiveDate,
      reason,
      templateName: selectedTemplate?.name,
    });
    autoLetterRef.current = nextLetter;
    setLetterHtml(nextLetter);
  }, [canEdit, effectiveDate, letterTouched, me, reason, selectedTemplate?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { showAlert('Only requests marked for revision can be edited and resubmitted.', 'error'); return; }
    if (!effectiveDate) { showAlert('Please set your last working day', 'error'); return; }
    if (!letterHtml.trim() || letterHtml === '<br>') { showAlert('Please write your offboarding letter', 'error'); return; }
    try {
      await submitExit.mutateAsync({
        effectiveDate,
        reason,
        letterHtml,
        noticePeriodDays: Number(noticePeriodDays),
        templateId: selectedTemplate?.id,
        templateSnapshot: selectedTemplate ? {
          id: selectedTemplate.id,
          key: selectedTemplate.key,
          name: selectedTemplate.name,
          description: selectedTemplate.description,
          settings: selectedTemplate.settings,
        } : null,
        formValues: { reason, effectiveDate, noticePeriodDays: Number(noticePeriodDays) },
      });
      showAlert(myRequest?.status === 'cancelled' ? 'Offboarding request resubmitted. HR has been notified.' : 'Offboarding request submitted. HR has been notified.', 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || e.response?.data?.message || 'Failed to submit request', 'error');
    }
  };

  const handleUpdateStatus = async (id: string, status: string, data?: any) => {
    try {
      if (status === 'interview_scheduled') {
        await createInterview.mutateAsync({
          exitProcessId: id,
          data: {
            interviewDate: data?.interviewDate,
            startTime: data?.startTime,
            title: 'Exit Interview',
            interviewType: data?.interviewType || 'in-person',
            location: data?.location || null,
            meetingUrl: data?.meetingUrl || null,
          },
        });
      } else if (status === 'send_offboarding_form') {
        await sendOffboardingForm.mutateAsync(id);
      } else {
        await updateStatus.mutateAsync({ id, status, data });
      }
      showAlert(status === 'in_progress' ? 'Leave approved. Employee is now on leave.' : status === 'send_offboarding_form' ? 'Offboarding form sent and employee notified.' : status === 'completed' ? 'Final offboarding approved. Account hidden from active lists.' : status === 'rejected' ? 'Request rejected' : 'Interview scheduled', 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || e.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleSubmitOffboardingForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myRequest?.id) return;
    if (!deviceConfirmation) { showAlert('Please confirm your assigned devices before submitting.', 'error'); return; }
    try {
      await submitOffboardingForm.mutateAsync({
        id: myRequest.id,
        data: {
          handoverNotes,
          deviceConfirmation,
        },
      });
      showAlert('Offboarding form submitted to HR.', 'success');
    } catch (e: any) {
      showAlert(e.response?.data?.error || e.response?.data?.message || 'Failed to submit offboarding form', 'error');
    }
  };

  if (isAdmin) {
    return (
      <ExitAdminList
        requests={requests}
        isLoading={loadingList}
        isError={isListError}
        errorMessage={(listError as any)?.response?.data?.error || (listError as any)?.message}
        isUpdating={updateStatus.isPending || sendOffboardingForm.isPending}
        onRefresh={() => refetch()}
        onUpdateStatus={handleUpdateStatus}
      />
    );
  }

  if (loadingMine) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs font-bold">Loading request...</span>
      </div>
    );
  }

  if (isMineError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-14 text-center">
        <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">
          {(mineError as any)?.response?.data?.error || 'Failed to load your offboarding request'}
        </p>
      </div>
    );
  }

  if (myRequest && !canEdit) {
    const noticeDays = myRequest.clearanceData?.noticePeriodDays || 30;
    const acceptedDevices = myRequest.offboardingFormData?.acceptedDevices || [];
    const showEmployeeForm = Boolean(
      myRequest.offboardingFormSentAt &&
      !myRequest.offboardingFormSubmittedAt &&
      !['completed', 'account_disabled', 'rejected', 'cancelled'].includes(myRequest.status),
    );
    const scheduledInterview = myRequest.scheduledInterview || myRequest.exitInterviews?.find((item: any) => item.status === 'scheduled');
    const interviewPlace = scheduledInterview?.interviewType === 'in-person'
      ? scheduledInterview?.location || 'Location will be shared by HR'
      : scheduledInterview?.meetingUrl || 'Meeting details will be shared by HR';
    return (
      <div className="max-w-2xl mx-auto space-y-6 font-sans pb-12">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
          <h3 className="text-sm font-black text-slate-900">Offboarding Request Tracking</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Your request is with HR.</p>
            </div>
            <ExitStatusBadge status={myRequest.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Submitted Date</span><span className="font-bold text-slate-700">{formatDate(myRequest.createdAt)}</span></div>
            <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Last Working Day</span><span className="font-bold text-slate-700">{formatDate(myRequest.effectiveDate)}</span></div>
            <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Notice Period</span><span className="font-bold text-slate-700">{noticeDays} days</span></div>
            <div><span className="text-[10px] text-slate-400 font-bold block uppercase">Reason</span><span className="font-bold text-blue-600">{myRequest.reason || '-'}</span></div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">HR Response</span>
            <p className="text-xs text-slate-500 font-semibold mt-2">
              {myRequest.status === 'pending'
                ? 'HR has received your request and will review it shortly.'
                : myRequest.status === 'in_progress'
                ? 'HR has approved your request and will continue the offboarding process.'
                : myRequest.status === 'interview_scheduled'
                ? 'HR has scheduled an exit interview. Check your interview details in the timeline and interview section.'
                : myRequest.status === 'interview_completed'
                ? 'Your exit interview is completed. HR will continue the final offboarding process.'
                : myRequest.status === 'rejected'
                ? `Your request was rejected. Reason: ${myRequest.rejectionReason || 'No reason provided.'}`
                : myRequest.status === 'completed'
                ? 'Your offboarding process has been completed and your account will be deactivated.'
                : myRequest.status === 'account_disabled'
                ? 'Your offboarding process has been completed and your account has been deactivated.'
                : 'HR has requested revisions.'}
            </p>
          </div>

          {scheduledInterview && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-3">
              <span className="text-[10px] font-black text-violet-700 uppercase tracking-wider">Interview Details</span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-violet-500 font-bold block uppercase">Date</span>
                  <span className="font-bold text-violet-900">{formatDate(scheduledInterview.scheduledAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-violet-500 font-bold block uppercase">Time</span>
                  <span className="font-bold text-violet-900">{scheduledInterview.startTime || formatTime(scheduledInterview.scheduledAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-violet-500 font-bold block uppercase">Mode</span>
                  <span className="font-bold text-violet-900 capitalize">{String(scheduledInterview.interviewType || 'in-person').replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-violet-500 font-bold block uppercase">Interviewer</span>
                  <span className="font-bold text-violet-900">{scheduledInterview.interviewer?.fullName || scheduledInterview.interviewer?.email || 'HR'}</span>
                </div>
              </div>
              <div className="text-xs font-semibold text-violet-900 bg-white/70 border border-violet-100 rounded-lg p-3">
                {interviewPlace}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">Progress</span>
            <p className="text-xs font-semibold text-blue-700 mt-2">
              {myRequest.offboardingFormSubmittedAt ? 'Your offboarding form has been submitted to HR.' : myRequest.offboardingFormSentAt ? 'HR has sent your offboarding form. Please complete and submit it below.' : 'HR will send your offboarding form after the leave stage begins.'}
            </p>
          </div>
        </div>
        {showEmployeeForm && (
          <form onSubmit={handleSubmitOffboardingForm} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-900">Offboarding Form</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Confirm handover details and assigned devices for HR review.</p>
            </div>
            {acceptedDevices.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Assigned Devices</span>
                {acceptedDevices.map((device: any) => (
                  <div key={device.id || device.assetTag || device.name} className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700">
                    <span>{device.name} {device.assetTag ? `(${device.assetTag})` : ''}</span>
                    <span className="text-blue-600">{device.acceptanceStatus || device.status || 'assigned'}</span>
                  </div>
                ))}
              </div>
            )}
            <label className="flex items-start gap-2.5 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={deviceConfirmation} onChange={(e) => setDeviceConfirmation(e.target.checked)} className="mt-0.5 accent-blue-600" />
              I confirm the listed company devices and items are correctly shown for HR clearance.
            </label>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Handover Notes</label>
              <textarea
                rows={4}
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                placeholder="Pending handover notes, returned items, credentials, or other clearance details"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitOffboardingForm.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
            >
              {submitOffboardingForm.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Offboarding Form'}
            </button>
          </form>
        )}
        <ExitTimeline events={myTimeline} isLoading={loadingMyTimeline} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans pb-12">
      <div>
        <h3 className="text-sm font-black text-slate-900">{myRequest ? 'Edit Offboarding Request' : 'Submit Offboarding Request'}</h3>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          Write your resignation letter and set your last working day. HR will be notified automatically.
        </p>
      </div>

      {myRequest?.status === 'cancelled' && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-rose-700 leading-relaxed">
            HR requested revisions. Update your request and resubmit it for review.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Offboarding Request Template</label>
          <select
            value={templateId || selectedTemplate?.id || ''}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400"
          >
            {activeTemplates.length === 0 ? <option value="">Standard Resignation Request</option> : activeTemplates.map((template: any) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 font-medium mt-1.5">{selectedTemplate?.description || 'Use the standard resignation request format.'}</p>
        </div>

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
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Notice Period (days)</label>
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700">
              30 days
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">Reason for Leaving</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400"
          >
            <option value="">Select a reason</option>
            {['Better career opportunity', 'Personal reasons', 'Relocation', 'Further education', 'Health reasons', 'Work-life balance', 'Other'].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
            Resignation Letter <span className="text-rose-500">*</span>
          </label>
          <RichTextEditor
            value={letterHtml}
            onChange={(value) => {
              if (value !== autoLetterRef.current) setLetterTouched(true);
              setLetterHtml(value);
            }}
          />
          <p className="text-[10px] text-slate-400 font-medium mt-1.5">Write a formal resignation letter. Use the toolbar to format your text.</p>
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
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
            : <><Send className="w-4 h-4" /> {myRequest ? 'Resubmit Offboarding Request' : 'Submit Offboarding Request'}</>
          }
        </button>
      </form>
    </div>
  );
}
