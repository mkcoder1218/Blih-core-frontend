import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, ShieldAlert, BadgeAlert, Plus, Sparkles, RefreshCw, Activity } from 'lucide-react';
import { UserAvatar, StatusBadge, SectionCard, FormField, FormRow, LoadingSpinner, EmptyState, InfoAlert, ConfirmDialog } from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { useDisciplinaryCases, useCreateDisciplinaryCase, useUpdateDisciplinaryCase } from '../../hooks/useDisciplinary';
import { useApproveAttendanceRequest, useRejectAttendanceRequest } from '../../hooks/useAttendanceRequests';
import { useMyPermissions } from '../../hooks/usePermissions';
import type { DisciplinaryCase } from '../../api/disciplinary';
import { api } from '../../api/client';

interface DisciplineTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Map severity to display style
const SEVERITY_TONE: Record<string, string> = {
  critical: 'rose', major: 'rose', minor: 'amber',
  high: 'rose', medium: 'amber', low: 'slate',
};

// Map status to badge label
const STATUS_LABEL: Record<string, string> = {
  open:         'Awaiting Action',
  under_review: 'Reviewed',
  resolved:     'Reviewed',
  closed:       'Closed',
};

const STATUS_TONE: Record<string, string> = {
  open:         'rose',
  under_review: 'blue',
  resolved:     'blue',
  closed:       'slate',
};

// Score from metadata or derived from severity
function severityScore(c: DisciplinaryCase): string {
  const raw = (c.metadata as any)?.score;
  if (raw) return `${raw}/10`;
  return c.severity === 'critical' ? '8.5/10' : c.severity === 'major' ? '6.5/10' : '4.0/10';
}

function shortDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
}

function hasPendingReasons(c: DisciplinaryCase) {
  return (c.attendanceReasons?.unavailable || []).some((item) => item.status === 'pending');
}

export default function DisciplineTab({ onDraftAiSuggestion, showAlert }: DisciplineTabProps) {
  const queryClient = useQueryClient();
  const { hasAny } = useMyPermissions();
  const canManageDiscipline = hasAny('performance.manage', 'hr.write');
  const canRunAnalysis = hasAny('performance.manage', 'attendance.manage');
  const { data, isLoading } = useDisciplinaryCases({ size: 100 });
  const createCase   = useCreateDisciplinaryCase();
  const updateCase   = useUpdateDisciplinaryCase();
  const approveReason = useApproveAttendanceRequest();
  const rejectReason = useRejectAttendanceRequest();

  const cases: DisciplinaryCase[] = data?.rows ?? [];

  const [activeCaseModal, setActiveCaseModal] = useState<DisciplinaryCase | null>(null);
  const [logIncidentOpen, setLogIncidentOpen] = useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [analysisResetting, setAnalysisResetting] = useState(false);
  const [caseSending, setCaseSending] = useState<'all' | 'managers' | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [resetAnalysisOpen, setResetAnalysisOpen] = useState(false);
  const [analysisConfig, setAnalysisConfig] = useState({ windowDays: 30, lateThreshold: 3 });
  const [caseStatusFilter, setCaseStatusFilter] = useState<'all' | 'open' | 'under_review' | 'closed'>('all');
  const [caseSeverityFilter, setCaseSeverityFilter] = useState<'all' | 'minor' | 'major' | 'critical'>('all');
  const [casePage, setCasePage] = useState(1);
  const [incidentForm, setIncidentForm] = useState({
    employeeUserId: '',
    employeeName:   '',   // display only — for search; actual submit uses employeeUserId
    caseType:  'attendance',
    severity:  'minor' as 'minor' | 'major' | 'critical',
    title:     '',
    description: '',
    score:     '6.0',
  });

  // Stats
  const activeCount   = cases.filter(c => c.status !== 'closed').length;
  const pendingCount  = cases.filter(c => c.status === 'open').length;
  const scores        = cases.map(c => parseFloat(severityScore(c)));
  const avgScore      = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0.0';
  const distinctTypes = new Set(cases.map(c => c.caseType)).size;
  const filteredCases = cases.filter((c) => {
    const statusOk = caseStatusFilter === 'all' || c.status === caseStatusFilter;
    const severityOk = caseSeverityFilter === 'all' || c.severity === caseSeverityFilter;
    return statusOk && severityOk;
  });
  const casePageSize = 8;
  const totalCasePages = Math.max(1, Math.ceil(filteredCases.length / casePageSize));
  const visibleCases = filteredCases.slice((casePage - 1) * casePageSize, casePage * casePageSize);

  React.useEffect(() => {
    setCasePage(1);
  }, [caseStatusFilter, caseSeverityFilter]);

  React.useEffect(() => {
    if (casePage > totalCasePages) setCasePage(totalCasePages);
  }, [casePage, totalCasePages]);

  const handleUpdateStatus = async (id: string, status: 'under_review' | 'closed') => {
    const updatedCase = await updateCase.mutateAsync({ id, status });
    if (status === 'closed') {
      setActiveCaseModal(null);
    } else {
      setActiveCaseModal((current) => current && current.id === id ? { ...current, ...updatedCase, status } : current);
    }
    showAlert(`Case status updated to ${STATUS_LABEL[status]}.`, 'success');
  };

  const handleAiAdvisor = (c: DisciplinaryCase) => {
    const name = c.employee?.fullName ?? 'Employee';
    onDraftAiSuggestion(
      `Formulate a formal compliance corrective advice draft for ${name} who had a "${c.caseType}" issue (severity: ${c.severity}, score: ${severityScore(c)}). Details: "${c.description}". Suggest progressive disciplinary milestones (PIP benchmarks or written warnings) aligned to corporate compliance rules.`
    );
  };

  const handleRunAnalysis = async () => {
    setAnalysisRunning(true);
    try {
      const res = await api.post('/api/v1/hr/disciplinary/analyze-attendance', {
        windowDays:    analysisConfig.windowDays,
        lateThreshold: analysisConfig.lateThreshold,
        dryRun:        false,
      });
      setAnalysisResult(res.data?.data ?? res.data);
      await queryClient.invalidateQueries({ queryKey: ['disciplinary-cases'] });
      await queryClient.refetchQueries({ queryKey: ['disciplinary-cases'] });
      showAlert(res.data?.message ?? 'Analysis complete.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error ?? 'Analysis failed.', 'error');
    } finally {
      setAnalysisRunning(false);
    }
  };

  const handleResetAnalysis = async () => {
    setAnalysisResetting(true);
    try {
      const res = await api.delete('/api/v1/hr/disciplinary/analyze-attendance');
      setAnalysisResult(null);
      setResetAnalysisOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['disciplinary-cases'] });
      showAlert(res.data?.message ?? 'Attendance analysis reset.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error ?? 'Failed to reset attendance analysis.', 'error');
    } finally {
      setAnalysisResetting(false);
    }
  };

  const handleSendCase = async (c: DisciplinaryCase, audience: 'all' | 'managers') => {
    if (c.status !== 'under_review') {
      showAlert('Review and approve this case before sending.', 'error');
      return;
    }
    if (hasPendingReasons(c)) {
      showAlert('Approve or reject the employee reason before sending this case.', 'error');
      return;
    }
    setCaseSending(audience);
    try {
      const res = await api.post('/api/v1/hr/disciplinary/analyze-attendance/send', {
        audience,
        caseIds: [c.id],
      });
      await queryClient.invalidateQueries({ queryKey: ['disciplinary-cases'] });
      showAlert(res.data?.message ?? 'Case notification sent.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error ?? err?.response?.data?.message ?? 'Failed to send case notification.', 'error');
    } finally {
      setCaseSending(null);
    }
  };

  const handleReasonAction = async (reasonId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') await approveReason.mutateAsync(reasonId);
      else await rejectReason.mutateAsync({ id: reasonId, reason: 'Rejected during discipline review' });

      if (activeCaseModal) {
        setActiveCaseModal({
          ...activeCaseModal,
          attendanceReasons: {
            ...activeCaseModal.attendanceReasons,
            unavailable: (activeCaseModal.attendanceReasons?.unavailable || []).map((item) =>
              item.id === reasonId ? { ...item, status } : item
            ),
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['disciplinary-cases'] });
      showAlert(status === 'approved' ? 'Reason approved.' : 'Reason rejected.', status === 'approved' ? 'success' : 'info');
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update reason.', 'error');
    }
  };

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentForm.employeeUserId && !incidentForm.employeeName) return;
    try {
      await createCase.mutateAsync({
        employeeUserId: incidentForm.employeeUserId || incidentForm.employeeName, // fallback for now
        caseType:    incidentForm.caseType,
        severity:    incidentForm.severity,
        title:       incidentForm.title || incidentForm.caseType,
        description: incidentForm.description,
        metadata: { score: parseFloat(incidentForm.score) },
      });
      setLogIncidentOpen(false);
      showAlert('Incident logged successfully!', 'success');
      setIncidentForm({ employeeUserId: '', employeeName: '', caseType: 'attendance', severity: 'minor', title: '', description: '', score: '6.0' });
    } catch (err: any) {
      showAlert(err?.response?.data?.error ?? 'Failed to log incident.', 'error');
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading disciplinary cases…" />;

  return (
    <div id="discipline-tab-panel" className="space-y-6">

      {/* Warning banner — top 2 open cases */}
      {pendingCount > 0 && (
        <div className="bg-red-50/5 border border-red-500 rounded-3xl p-5 shadow-xs relative overflow-hidden ring-4 ring-rose-500/10">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-4 w-full">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-tight flex items-center gap-1.5 leading-none">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Discipline Action Required</span>
                </h4>
                <span className="text-[10px] text-slate-500 block leading-tight font-semibold">
                  {pendingCount} employees have active discipline tags requiring immediate review and corporate safety actions.
                </span>
              </div>
              <Carousel className="w-full">
                <CarouselContent>
                  {cases.filter(c => c.status === 'open').map(c => (
                    <CarouselItem key={c.id}>
                      <div className="h-full bg-white border border-rose-200 shadow-3xs p-4 rounded-2xl relative flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-3">
                            <UserAvatar name={c.employee?.fullName ?? 'Employee'} subtitle={c.employee?.email ?? ''} size="sm" />
                            <span className="text-[10px] text-slate-400 font-bold">{c.createdAt.slice(0, 10)}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <StatusBadge label={c.caseType.replace('_', ' ')} tone="rose" />
                            <StatusBadge label={c.severity} tone={SEVERITY_TONE[c.severity] as any} />
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500 mt-2.5 leading-snug line-clamp-2">"{c.description}"</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase">Severity Score</span>
                            <span className="text-xs font-black text-rose-600">{severityScore(c)}</span>
                          </div>
                          <Button onClick={() => setActiveCaseModal(c)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg">
                            Review Case
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </div>
      )}

      {/* Statistics bar */}
      <div className="bg-slate-50/60 p-5 rounded-3xl border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <h4 className="text-xs font-black text-slate-950 uppercase tracking-tight">Discipline Statistics</h4>
        <div className="flex flex-wrap items-center gap-6 sm:gap-11 text-right">
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-405 block uppercase">Active Cases</span>
            <span className="text-lg font-black text-slate-900 leading-none block">{activeCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-450 block uppercase">Pending Review</span>
            <span className="text-lg font-black text-red-600 leading-none block">{pendingCount}</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-405 block uppercase">Avg Severity</span>
            <span className="text-lg font-black text-blue-600 leading-none block">{avgScore}/10</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold text-slate-405 block uppercase">Issue Types</span>
            <span className="text-lg font-black text-slate-900 leading-none block">{distinctTypes}</span>
          </div>
          {canManageDiscipline && (
            <button onClick={() => setLogIncidentOpen(true)} className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-black py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all">
              <Plus className="w-4 h-4 shrink-0" />
              <span>Document Incident</span>
            </button>
          )}
          {canRunAnalysis && (
            <>
              <button
                onClick={() => setAnalysisOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all"
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span>Run Attendance Analysis</span>
              </button>
              <button
                onClick={() => setResetAnalysisOpen(true)}
                disabled={analysisResetting || cases.length === 0}
                className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black py-2 px-3.5 rounded-xl flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${analysisResetting ? 'animate-spin' : ''}`} />
                <span>Reset Analysis</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* All cases grid */}
      <SectionCard title={`Incident Files (${filteredCases.length})`}>
        <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Status">
              <select
                value={caseStatusFilter}
                onChange={(e) => setCaseStatusFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All statuses</option>
                <option value="open">Awaiting Action</option>
                <option value="under_review">Reviewed</option>
                <option value="closed">Closed</option>
              </select>
            </FormField>
            <FormField label="Severity">
              <select
                value={caseSeverityFilter}
                onChange={(e) => setCaseSeverityFilter(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All severity</option>
                <option value="critical">Critical</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
              </select>
            </FormField>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500 lg:justify-end">
            <span>
              Page {casePage} of {totalCasePages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={casePage <= 1}
                onClick={() => setCasePage((p) => Math.max(1, p - 1))}
                className="rounded-xl text-xs font-bold"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={casePage >= totalCasePages}
                onClick={() => setCasePage((p) => Math.min(totalCasePages, p + 1))}
                className="rounded-xl text-xs font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
        {filteredCases.length === 0 ? (
          <EmptyState title="No disciplinary cases on record" compact />
        ) : (
          <div className="overflow-x-auto mt-2 border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                  <th className="p-3.5 pl-5">Employee</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Severity Score</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCases.map(c => (
                  <tr key={c.id} onClick={() => setActiveCaseModal(c)}
                    className="hover:bg-slate-50/50 border-b border-slate-100/80 cursor-pointer text-xs font-bold text-slate-800 transition-colors">
                    <td className="p-3.5 pl-5 flex items-center gap-2">
                      <UserAvatar name={c.employee?.fullName ?? 'Employee'} size="xs" />
                      <span>{c.employee?.fullName ?? 'Employee'}</span>
                    </td>
                    <td className="p-3.5 text-slate-500">{c.createdAt.slice(0, 10)}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-100 text-slate-650 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                        {c.caseType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700">{severityScore(c)}</td>
                    <td className="p-3.5">
                      <StatusBadge label={STATUS_LABEL[c.status] ?? c.status} tone={STATUS_TONE[c.status] as any} />
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <span className="text-blue-600 hover:underline">Review Case</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Review Case Modal */}
      {activeCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setActiveCaseModal(null)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-5 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 animate-pulse" />
                <h4 className="text-[13px] font-bold text-slate-900">
                  Incident File: {activeCaseModal.employee?.fullName ?? 'Employee'}
                </h4>
              </div>
              <button onClick={() => setActiveCaseModal(null)} className="text-xs font-bold text-slate-400 hover:text-slate-800">✕</button>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Employee:</span>
                  <span className="text-slate-850">{activeCaseModal.employee?.fullName ?? '—'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Reported:</span>
                  <span className="text-slate-850">{activeCaseModal.createdAt.slice(0, 10)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Type:</span>
                  <span className="text-slate-850 capitalize">{activeCaseModal.caseType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Severity:</span>
                  <span className="text-red-600 font-extrabold capitalize">{activeCaseModal.severity} — {severityScore(activeCaseModal)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-slate-850">{STATUS_LABEL[activeCaseModal.status] ?? activeCaseModal.status}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Incident Details</span>
                <p className="text-slate-700 bg-slate-50/50 p-3.5 border border-slate-100 rounded-xl text-xs font-semibold leading-relaxed">
                  "{activeCaseModal.description}"
                </p>
              </div>
              {activeCaseModal.actionTaken && (
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Action Taken</span>
                  <p className="text-slate-700 bg-emerald-50/50 p-3.5 border border-emerald-100 rounded-xl text-xs font-semibold leading-relaxed">
                    {activeCaseModal.actionTaken}
                  </p>
                </div>
              )}
              {((activeCaseModal.attendanceReasons?.late?.length || 0) > 0 || (activeCaseModal.attendanceReasons?.unavailable?.length || 0) > 0) && (
                <div className="space-y-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Employee Reasons</span>
                  {(activeCaseModal.attendanceReasons?.late || []).map((item) => (
                    <div key={item.id} className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-xs">
                      <div className="flex justify-between gap-3 font-black text-amber-900">
                        <span>Late check-in: {item.reasonName || 'Custom reason'}</span>
                        <span>{item.lateByMinutes}m late</span>
                      </div>
                      {item.customReason && <p className="text-[11px] font-semibold text-slate-600 mt-1">{item.customReason}</p>}
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{shortDateTime(item.createdAt)}</p>
                    </div>
                  ))}
                  {(activeCaseModal.attendanceReasons?.unavailable || []).map((item) => (
                    <div key={item.id} className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex flex-wrap justify-between gap-3 font-black text-blue-900">
                        <span>{item.title}</span>
                        <span className="uppercase">{item.status}</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600 mt-1">{item.reason}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{shortDateTime(item.fromAt)} to {shortDateTime(item.toAt)}</p>
                      {canManageDiscipline && item.status === 'pending' && (
                        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                          <Button
                            type="button"
                            onClick={() => handleReasonAction(item.id, 'approved')}
                            disabled={approveReason.isPending || rejectReason.isPending}
                            className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            Approve Reason
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleReasonAction(item.id, 'rejected')}
                            disabled={approveReason.isPending || rejectReason.isPending}
                            className="rounded-xl border-rose-200 bg-white text-xs font-bold text-rose-600 hover:bg-rose-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {canManageDiscipline && (
                <div className="bg-blue-50/30 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <h5 className="font-extrabold text-blue-900 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600" />
                      AI Corrective Action Advisor
                    </h5>
                    <p className="text-slate-500 font-medium">Draft progressive warning, suspension or PIP recommendations aligned to compliance guidelines.</p>
                  </div>
                  <button onClick={() => handleAiAdvisor(activeCaseModal)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-1 cursor-pointer w-full sm:w-auto shrink-0 justify-center transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                    Draft corrective PIP
                  </button>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              {canManageDiscipline ? (
                <Button onClick={() => handleUpdateStatus(activeCaseModal.id, 'closed')}
                  disabled={updateCase.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl">
                  Archive & Close
                </Button>
              ) : <span />}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button variant="outline" onClick={() => setActiveCaseModal(null)} className="rounded-xl text-xs font-bold text-slate-500">Dismiss</Button>
                {canManageDiscipline && activeCaseModal.status === 'open' && (
                  <Button onClick={() => handleUpdateStatus(activeCaseModal.id, 'under_review')}
                    disabled={updateCase.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl">
                    Mark as Reviewed
                  </Button>
                )}
                {canManageDiscipline && activeCaseModal.metadata?.autoGenerated && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleSendCase(activeCaseModal, 'managers')}
                      disabled={activeCaseModal.status !== 'under_review' || hasPendingReasons(activeCaseModal) || caseSending !== null || Boolean(activeCaseModal.metadata?.notificationStatus?.managersSentAt)}
                      className="border-blue-200 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100"
                    >
                      {caseSending === 'managers' ? 'Sending...' : 'Send for Managers'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSendCase(activeCaseModal, 'all')}
                      disabled={activeCaseModal.status !== 'under_review' || hasPendingReasons(activeCaseModal) || caseSending !== null || Boolean(activeCaseModal.metadata?.notificationStatus?.employeesSentAt)}
                      className="border-rose-200 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100"
                    >
                      {caseSending === 'all' ? 'Sending...' : 'Send for All'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log Incident Modal */}
      {logIncidentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setLogIncidentOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-4 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BadgeAlert className="w-5 h-5 text-red-600" />
                <h4 className="text-[13px] font-bold text-slate-900">Document Compliance Incident</h4>
              </div>
              <button onClick={() => setLogIncidentOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={handleAddIncident} className="space-y-4">
              <FormField label="Employee User ID" required>
                <input type="text" required placeholder="Paste employee user ID…"
                  value={incidentForm.employeeUserId}
                  onChange={e => setIncidentForm(p => ({ ...p, employeeUserId: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white" />
              </FormField>
              <FormField label="Incident Title" required>
                <input type="text" required placeholder="e.g. Repeated Late Arrivals"
                  value={incidentForm.title}
                  onChange={e => setIncidentForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white" />
              </FormField>
              <FormRow cols={2}>
                <FormField label="Case Type">
                  <select value={incidentForm.caseType} onChange={e => setIncidentForm(p => ({ ...p, caseType: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer">
                    <option value="attendance">Attendance Issues</option>
                    <option value="policy_violation">Policy Violation</option>
                    <option value="misconduct">Misconduct</option>
                    <option value="performance">Performance Issues</option>
                    <option value="insubordination">Insubordination</option>
                    <option value="grievance">Grievance</option>
                  </select>
                </FormField>
                <FormRow cols={2}>
                  <FormField label="Severity">
                    <select value={incidentForm.severity} onChange={e => setIncidentForm(p => ({ ...p, severity: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer">
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                  </FormField>
                  <FormField label="Score (1-10)">
                    <input type="number" step="0.1" min="1" max="10" value={incidentForm.score}
                      onChange={e => setIncidentForm(p => ({ ...p, score: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs font-bold focus:outline-none text-center" />
                  </FormField>
                </FormRow>
              </FormRow>
              <FormField label="Incident Details">
                <textarea rows={3} required placeholder="Document specific actions, dates, witnesses…"
                  value={incidentForm.description}
                  onChange={e => setIncidentForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white resize-none" />
              </FormField>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setLogIncidentOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                <button type="submit" disabled={createCase.isPending}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50">
                  {createCase.isPending ? 'Logging…' : 'Log Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Attendance Analysis Modal ──────────────────────────────────────── */}
      {analysisOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => { if (!analysisRunning) setAnalysisOpen(false); }} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-2xl space-y-5 animate-fade-in mx-4 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h4 className="text-[13px] font-bold text-slate-900">Attendance Discipline Analysis</h4>
              </div>
              <button onClick={() => setAnalysisOpen(false)} disabled={analysisRunning} className="text-xs font-bold text-slate-400 hover:text-slate-800">✕</button>
            </div>

            {/* Config */}
            {!analysisResult && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  This scans attendance records, creates review cases for employees above the threshold, and keeps notifications paused until each case is approved and sent from its incident file.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Look-back Window (days)">
                    <input type="number" min={7} max={365} value={analysisConfig.windowDays}
                      onChange={e => setAnalysisConfig(p => ({ ...p, windowDays: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white" />
                  </FormField>
                  <FormField label="Min Infractions to Flag">
                    <input type="number" min={1} max={30} value={analysisConfig.lateThreshold}
                      onChange={e => setAnalysisConfig(p => ({ ...p, lateThreshold: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white" />
                  </FormField>
                </div>
                <InfoAlert
                  variant="info"
                  message="No employee or manager notifications are sent during analysis. Open each case, approve review, then send it individually."
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setAnalysisOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                  <button onClick={handleRunAnalysis} disabled={analysisRunning}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors">
                    {analysisRunning ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
                    ) : (
                      <><Activity className="w-3.5 h-3.5" /> Run Analysis</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Results */}
            {analysisResult && (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Employees Scanned', value: analysisResult.totalEmployees ?? 0, color: 'text-slate-900' },
                    { label: 'Cases Created',      value: analysisResult.actioned ?? 0,       color: 'text-rose-600' },
                    { label: 'Already Had Case',   value: analysisResult.skipped ?? 0,        color: 'text-amber-600' },
                    { label: 'Period',             value: analysisConfig.windowDays + 'd',    color: 'text-blue-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                      <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Per-employee report */}
                {(analysisResult.report ?? []).length === 0 ? (
                  <EmptyState title="No employees exceeded the infraction threshold." compact />
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Employee Breakdown</span>
                    {(analysisResult.report ?? []).map((r: any) => (
                      <div key={r.userId}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                          r.actionCreated ? 'bg-rose-50/60 border-rose-200' :
                          r.wouldAction   ? 'bg-amber-50/60 border-amber-200' :
                          r.existingCaseId ? 'bg-slate-50 border-slate-200' :
                          'bg-white border-slate-100'
                        }`}>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{r.fullName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{r.department}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-semibold">
                          {r.missedDays > 0 && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">{r.missedDays} missed</span>}
                          {r.lateDays   > 0 && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">{r.lateDays} late</span>}
                          <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                            r.severity === 'critical' ? 'bg-red-100 text-red-700' :
                            r.severity === 'major'    ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{r.severity}</span>
                          <span className="text-slate-700 font-bold">{r.score}</span>
                          {r.actionCreated  && <span className="text-rose-600 font-black">✓ Case Created</span>}
                          {r.existingCaseId && <span className="text-slate-400">Existing case</span>}
                          {r.wouldAction    && <span className="text-amber-600 font-black">Would flag</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => setAnalysisResult(null)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Run Again</button>
                  <button onClick={() => { setAnalysisResult(null); setAnalysisOpen(false); }} className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer">Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <ConfirmDialog
        open={resetAnalysisOpen}
        onClose={() => setResetAnalysisOpen(false)}
        onConfirm={handleResetAnalysis}
        title="Reset Attendance Analysis"
        description="This removes only auto-generated attendance discipline cases. Manually documented incidents will stay on record."
        confirmLabel="Reset Analysis"
        variant="destructive"
        loading={analysisResetting}
      />
    </div>
  );
}

