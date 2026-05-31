import React, { useState } from 'react';
import {
  UserPlus, CheckCircle, Clock, TrendingUp, Plus, RefreshCw, ExternalLink, Sparkles, Loader2,
} from 'lucide-react';
import { useOnboardings } from '../../../hooks/useCandidateOnboarding';

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_CANDIDATE_COMPLETION: { label: 'Pending',    color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  IN_PROGRESS:                  { label: 'In Progress', color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  SUBMITTED_FOR_REVIEW:         { label: 'Submitted',  color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
  COMPLETED:                    { label: 'Completed',  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  CANCELLED:                    { label: 'Cancelled',  color: 'text-rose-600',   bg: 'bg-rose-50 border-rose-200' },
};

const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview', personal_info: 'Personal Info', documents: 'Documents',
  emergency_contact: 'Emergency Contact', payroll: 'Payroll / Bank', policies: 'Policies',
  resources: 'Resources', review: 'Review & Submit',
};

interface Process {
  id: string;
  employee: string;
  dept: string;
  role: string;
  tasks: { label: string; done: boolean }[];
}

interface OnboardingProgressTabProps {
  processes: Process[];
  toggleTaskStatus: (id: string, idx: number) => void;
  setAssignModalOpen: (v: boolean) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function OnboardingProgressTab({
  processes,
  toggleTaskStatus,
  setAssignModalOpen,
  showAlert,
}: OnboardingProgressTabProps) {
  const { data: onboardingData, isLoading, refetch } = useOnboardings({ limit: 100 });
  const liveOnboardings: any[] = onboardingData?.rows ?? [];

  const activeCount    = liveOnboardings.filter(o => ['PENDING_CANDIDATE_COMPLETION', 'IN_PROGRESS'].includes(o.status)).length;
  const completedCount = liveOnboardings.filter(o => ['COMPLETED', 'SUBMITTED_FOR_REVIEW'].includes(o.status)).length;
  const avgProgress    = liveOnboardings.length
    ? Math.round(liveOnboardings.reduce((s, o) => s + (o.progress || 0), 0) / liveOnboardings.length)
    : 0;

  const circumference = 2 * Math.PI * 24;

  return (
    <div id="tab-progress-pane" className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Active Onboarding', value: isLoading ? '—' : activeCount, icon: <UserPlus className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Submitted / Completed', value: isLoading ? '—' : completedCount, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Avg. Completion', value: isLoading ? '—' : `${avgProgress}%`, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-violet-50 text-violet-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Active Onboarding Processes</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Live candidate onboarding progress from the system</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={() => setAssignModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Assign Checklist</span>
          </button>
        </div>
      </div>

      {/* Live onboarding cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="ml-2 text-sm font-semibold text-slate-400">Loading onboarding data…</span>
        </div>
      ) : liveOnboardings.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl bg-white/40 p-10 text-center text-slate-400 font-semibold text-xs">
          No active onboarding sessions found. Initialize one from an accepted offer letter.
        </div>
      ) : (
        <div className="space-y-3">
          {liveOnboardings.map((ob) => {
            const pct = ob.progress ?? 0;
            const sections: string[] = ob.sections ?? [];
            const candidateData: Record<string, any> = ob.candidateData ?? {};
            const statusMeta = STATUS_LABEL[ob.status] ?? { label: ob.status, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
            const startDate = ob.metadata?.startDate
              ? new Date(ob.metadata.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : null;
            const ringColor = pct >= 80 ? '#10b981' : pct >= 40 ? '#2563eb' : '#f59e0b';

            return (
              <div key={ob.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black flex-shrink-0">
                      {ob.candidateName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black text-slate-900">{ob.candidateName}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded border ${statusMeta.bg} ${statusMeta.color}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{ob.candidateEmail}</span>
                        {startDate && <span className="text-[10px] text-slate-400 font-medium">· Start: <strong className="text-slate-600">{startDate}</strong></span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="20" cy="20" r="16" stroke="#e2e8f0" strokeWidth="3.5" fill="transparent" />
                        <circle cx="20" cy="20" r="16" stroke={ringColor} strokeWidth="3.5" fill="transparent"
                          strokeDasharray={2 * Math.PI * 16}
                          strokeDashoffset={2 * Math.PI * 16 - (pct / 100) * 2 * Math.PI * 16}
                          strokeLinecap="round" className="transition-all duration-500" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-800">{pct}%</span>
                    </div>
                    <a
                      href={`/career/onboarding/${ob.onboardingId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> Portal
                    </a>
                  </div>
                </div>

                <div className="px-4 py-3 flex flex-wrap gap-1.5">
                  {sections.filter(s => s !== 'review').map((sectionKey) => {
                    let isDone = false;
                    if (sectionKey === 'overview') {
                      isDone = true;
                    } else if (sectionKey === 'resources') {
                      const resources: any[] = ob.resources ?? [];
                      const resourceResponses: any[] = ob.resourceResponses ?? [];
                      const needsAcceptance = resources.filter((r: any) => r.acceptanceRequired);
                      isDone = needsAcceptance.length === 0 ||
                        needsAcceptance.every((_: any, i: number) =>
                          resourceResponses.some((rr: any) => rr.resourceIndex === i && rr.status)
                        );
                    } else {
                      const d = candidateData[sectionKey];
                      isDone = !!(d && Object.keys(d).length > 0);
                    }
                    return (
                      <span key={sectionKey} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border ${isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        {isDone ? <CheckCircle className="w-2.5 h-2.5 text-emerald-500" /> : <Clock className="w-2.5 h-2.5 text-slate-300" />}
                        {SECTION_LABELS[sectionKey] ?? sectionKey}
                      </span>
                    );
                  })}
                </div>

                {ob.resources?.length > 0 && (
                  <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Resources:</span>
                    {ob.resources.map((r: any, i: number) => {
                      const resp = ob.resourceResponses?.find((rr: any) => rr.resourceIndex === i);
                      const respStatus = resp?.status;
                      return (
                        <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          respStatus === 'accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          respStatus === 'declined' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                          respStatus === 'correction_requested' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          {r.resourceName}
                          {respStatus && <span className="opacity-70">· {respStatus.replace(/_/g, ' ')}</span>}
                        </span>
                      );
                    })}
                    {ob.submittedAt && (
                      <span className="ml-auto text-[10px] font-bold text-emerald-600">
                        ✓ Submitted {new Date(ob.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual checklists */}
      {processes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">Manual Checklists</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          {processes.map((proc) => {
            const completedCount = proc.tasks.filter(t => t.done).length;
            const pct = proc.tasks.length > 0 ? Math.round((completedCount / proc.tasks.length) * 100) : 0;
            const radius = 24;
            const strokeWidth = 5.5;
            const circ = 2 * Math.PI * radius;
            const strokeDashoffset = circ - (pct / 100) * circ;

            return (
              <div key={proc.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col xl:flex-row gap-5 items-stretch shadow-xs">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-600 text-white flex items-center justify-center text-xs font-black">
                      {proc.employee.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900">{proc.employee}</h4>
                        <span className="bg-slate-100 text-[9.5px] text-slate-600 font-extrabold uppercase px-2 py-0.5 rounded-md">{proc.dept}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{proc.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {proc.tasks.map((task, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleTaskStatus(proc.id, idx)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-[11px] font-bold transition-all cursor-pointer border ${task.done ? 'bg-blue-50/50 border-blue-100 text-blue-600' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100 text-slate-500'}`}
                      >
                        {task.done ? <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 stroke-[2.5]" /> : <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                        <span className="truncate">{task.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full xl:w-52 bg-slate-50/50 rounded-2xl border border-slate-100/80 p-4 flex flex-row xl:flex-col items-center justify-between text-center xl:justify-center xl:space-y-3">
                  <div className="flex items-center gap-1.5 pb-1 xl:border-b xl:border-slate-100 w-full xl:justify-center">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Completion Bar</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  </div>
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="transparent" />
                      <circle cx="40" cy="40" r={radius} stroke="#2563eb" strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circ} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-300" />
                    </svg>
                    <span className="absolute text-sm font-black text-slate-900 tracking-tight">{pct}%</span>
                  </div>
                  <div className="text-right xl:text-center text-[11px] font-semibold">
                    <p className="text-slate-800">Overall Progress</p>
                    <span className="text-blue-600 font-black block mt-0.5">{completedCount}/{proc.tasks.length} tasks</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
