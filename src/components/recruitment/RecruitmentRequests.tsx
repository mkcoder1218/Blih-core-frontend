/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useMemo, useState } from 'react';
import { JobRequest } from '../../types';
import {
  AlertCircle,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  CircleDot,
  Clock3,
  Eye,
  Filter,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/blih';

interface RecruitmentRequestsProps {
  onSuggestJustification: (jobTitle: string, dept: string) => void;
  onOpenNewJobModal: () => void;
  jobs: JobRequest[];
  onApproveJob: (id: string) => void;
  onRejectJob?: (id: string, reason: string) => void;
  onJustifyJob: (id: string) => void;
  currentUser?: { id: string; role: string; roles?: string[]; permissions?: string[]; name?: string };
}

type TabKey = 'pending' | 'mine' | 'others' | 'approved' | 'declined';
type ProgressState = 'completed' | 'active' | 'rejected' | 'waiting';

const flowStages = [
  { key: 'department_head', label: 'Department Head', icon: UserRound },
  { key: 'hr_review', label: 'HR Review', icon: ShieldCheck },
  { key: 'final_approval', label: 'CEO / Business Admin', icon: BriefcaseBusiness },
] as const;

const statusFilterOptions = ['All', 'Pending', 'Approved', 'Declined'];
const dateRangeOptions = ['All', 'Last 7 days', 'Last 30 days', 'This year'];

export default function RecruitmentRequests({
  onSuggestJustification,
  onOpenNewJobModal,
  jobs,
  onApproveJob,
  onRejectJob = () => {},
  onJustifyJob,
  currentUser,
}: RecruitmentRequestsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('All');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const departments = useMemo(
    () => ['All', ...Array.from(new Set(jobs.map((job) => job.department).filter(Boolean)))],
    [jobs],
  );
  const jobTypes = useMemo(
    () => ['All', ...Array.from(new Set(jobs.map((job) => job.type).filter(Boolean)))],
    [jobs],
  );

  const roleSet = new Set((currentUser?.roles?.length ? currentUser.roles : [currentUser?.role || '']).map((role) => role.toUpperCase()));
  const permissionSet = new Set(currentUser?.permissions || []);
  const isHrReviewer = roleSet.has('HR_MANAGER') || permissionSet.has('hr.write');
  const isFinalReviewer = roleSet.has('CEO') || roleSet.has('BUSINESS_ADMIN');

  const canActOn = (job: JobRequest) => {
    if (job.status !== 'pending') return false;
    if ((job.approvalStage || 'hr_review') === 'hr_review') return isHrReviewer;
    if (job.approvalStage === 'final_approval') return isFinalReviewer;
    return false;
  };

  const requestReject = (job: JobRequest) => {
    const reason = window.prompt(`Rejection reason for ${job.title}`);
    if (!reason?.trim()) return;
    onRejectJob(job.id, reason.trim());
  };

  const isSubmittedByCurrentUser = (job: JobRequest) => {
    if (!currentUser) return false;
    return job.requestedBy?.name === currentUser.name || job.approvalHistory?.some((entry) => entry.userId === currentUser.id && entry.action === 'submitted');
  };

  const isReviewedByCurrentUser = (job: JobRequest) => (
    job.approvalHistory?.some((entry) => entry.userId === currentUser?.id && entry.action === 'approved') || false
  );

  const dashboardJobs = useMemo(() => {
    const matchesDateRange = (job: JobRequest) => {
      if (selectedDateRange === 'All') return true;
      const requested = new Date(job.requestedDate);
      if (Number.isNaN(requested.getTime())) return true;
      const now = new Date();
      const diffDays = (now.getTime() - requested.getTime()) / (1000 * 60 * 60 * 24);
      if (selectedDateRange === 'Last 7 days') return diffDays <= 7;
      if (selectedDateRange === 'Last 30 days') return diffDays <= 30;
      return requested.getFullYear() === now.getFullYear();
    };

    return jobs.filter((job) => {
      const text = `${job.title} ${job.department} ${job.requestedBy?.name || ''} ${job.currentReviewer || ''}`.toLowerCase();
      const matchesSearch = text.includes(searchQuery.toLowerCase());
      const matchesDept = selectedDeptFilter === 'All' || job.department === selectedDeptFilter;
      const matchesType = selectedTypeFilter === 'All' || job.type === selectedTypeFilter;
      const matchesStatus = selectedStatusFilter === 'All' || job.status === selectedStatusFilter.toLowerCase();
      return matchesSearch && matchesDept && matchesType && matchesStatus && matchesDateRange(job);
    });
  }, [jobs, searchQuery, selectedDateRange, selectedDeptFilter, selectedStatusFilter, selectedTypeFilter]);

  const pendingRequests = dashboardJobs.filter((job) => job.status === 'pending' && canActOn(job));
  const submittedByMe = dashboardJobs.filter((job) => isSubmittedByCurrentUser(job) || isReviewedByCurrentUser(job));
  const submittedByOthers = dashboardJobs.filter((job) => job.status === 'pending' && !canActOn(job) && !isSubmittedByCurrentUser(job));
  const approvedRequests = dashboardJobs.filter((job) => job.status === 'approved');
  const declinedRequests = dashboardJobs.filter((job) => job.status === 'declined');
  const inProgressRequests = jobs.filter((job) => job.status === 'pending');

  const tabs: { key: TabKey; label: string; count: number; jobs: JobRequest[] }[] = [
    { key: 'pending', label: 'Pending Approval', count: pendingRequests.length, jobs: pendingRequests },
    { key: 'mine', label: 'Submitted by Me', count: submittedByMe.length, jobs: submittedByMe },
    { key: 'others', label: 'Submitted by Others', count: submittedByOthers.length, jobs: submittedByOthers },
    { key: 'approved', label: 'Approved', count: approvedRequests.length, jobs: approvedRequests },
    { key: 'declined', label: 'Declined', count: declinedRequests.length, jobs: declinedRequests },
  ];

  const activeJobs = tabs.find((tab) => tab.key === activeTab)?.jobs || [];
  const currentFlowStage = getCurrentWorkflowStage(jobs);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDeptFilter('All');
    setSelectedTypeFilter('All');
    setSelectedStatusFilter('All');
    setSelectedDateRange('All');
  };

  return (
    <div id="recruitment-requests-view" className="-m-4 w-full max-w-none bg-slate-50 px-6 py-5 sm:-m-6 lg:px-8">
      <div className="w-full max-w-none space-y-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-600">Recruitment approvals</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Job Approval Requests</h3>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
              Review requisitions, track approval movement, and keep hiring decisions visible across HR leadership.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewJobModal}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <BriefcaseBusiness className="h-4 w-4" />
            New Request
          </button>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard label="Pending My Approval" value={jobs.filter((job) => job.status === 'pending' && canActOn(job)).length} tone="amber" icon={Clock3} />
          <SummaryCard label="Submitted by Me" value={jobs.filter((job) => isSubmittedByCurrentUser(job) || isReviewedByCurrentUser(job)).length} tone="blue" icon={UserRound} />
          <SummaryCard label="In Progress" value={inProgressRequests.length} tone="sky" icon={CircleDot} />
          <SummaryCard label="Approved" value={jobs.filter((job) => job.status === 'approved').length} tone="emerald" icon={CheckCircle2} />
          <SummaryCard label="Declined" value={jobs.filter((job) => job.status === 'declined').length} tone="rose" icon={XCircle} />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-950">Approval Workflow</h4>
                <p className="mt-0.5 text-xs font-medium text-slate-500">Department Head to HR Review to CEO / Business Admin.</p>
              </div>
              <StatusBadge label={formatStageLabel(currentFlowStage)} tone={currentFlowStage === 'approved' ? 'emerald' : currentFlowStage === 'rejected' ? 'rose' : 'blue'} />
            </div>
            <WorkflowRail activeStage={currentFlowStage} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_repeat(4,minmax(140px,0.7fr))_auto] xl:items-end">
              <label className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Search</span>
                <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-300 focus-within:bg-white">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
                    placeholder="Search position, requester..."
                    className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>
              <FilterSelect label="Department" value={selectedDeptFilter} onChange={setSelectedDeptFilter} options={departments} />
              <FilterSelect label="Employment Type" value={selectedTypeFilter} onChange={setSelectedTypeFilter} options={jobTypes} />
              <FilterSelect label="Approval Status" value={selectedStatusFilter} onChange={setSelectedStatusFilter} options={statusFilterOptions} />
              <FilterSelect label="Date Range" value={selectedDateRange} onChange={setSelectedDateRange} options={dateRangeOptions} />
              <div className="flex items-center justify-between gap-3 xl:justify-end">
                <span className="text-xs font-bold text-slate-500">
                  <Filter className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                  {activeJobs.length} results
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto">
              {tabs.map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-black transition ${
                      active
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100">
            {activeJobs.length === 0 ? (
              <CompactEmptyState tab={activeTab} />
            ) : (
              <JobRequestsTable
                jobs={activeJobs}
                expandedJobId={expandedJobId}
                canActOn={canActOn}
                onToggleDetails={(id) => setExpandedJobId((current) => current === id ? null : id)}
                onApprove={(job) => onApproveJob(job.id)}
                onReject={requestReject}
                onJustify={(job) => onJustifyJob(job.id)}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone, icon: Icon }: { label: string; value: number; tone: 'amber' | 'blue' | 'sky' | 'emerald' | 'rose'; icon: typeof Clock3 }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <div className="min-h-[84px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 leading-tight">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-950 leading-none">{value}</p>
        </div>
        <div className={`rounded-lg border p-2 ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function WorkflowRail({ activeStage }: { activeStage: string }) {
  const activeIndex = activeStage === 'final_approval' ? 2 : activeStage === 'hr_review' ? 1 : activeStage === 'approved' ? 2 : 0;

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[620px] grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
        {flowStages.map((stage, index) => {
          const Icon = stage.icon;
          const isRejected = activeStage === 'rejected' && index === activeIndex;
          const isComplete = activeStage === 'approved' || index < activeIndex;
          const isActive = !isRejected && index === activeIndex && activeStage !== 'approved';
          return (
            <div key={stage.key} className="contents">
              <div className={`rounded-lg border px-3 py-2 ${isRejected ? 'border-rose-200 bg-rose-50' : isActive ? 'border-blue-200 bg-blue-50' : isComplete ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isRejected ? 'bg-rose-600 text-white' : isActive ? 'bg-blue-600 text-white' : isComplete ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 ring-1 ring-slate-200'}`}>
                    {isComplete ? <Check className="h-4 w-4" /> : isRejected ? <XCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">{stage.label}</p>
                    <p className={`text-[10px] font-bold ${isRejected ? 'text-rose-600' : isActive ? 'text-blue-600' : isComplete ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isRejected ? 'Declined' : isActive ? 'Active review' : isComplete ? 'Completed' : 'Waiting'}
                    </p>
                  </div>
                </div>
              </div>
              {index < flowStages.length - 1 ? (
                <div className={`h-0.5 w-12 rounded-full ${index < activeIndex || activeStage === 'approved' ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'All' ? `All ${label}` : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function JobRequestsTable({
  jobs,
  expandedJobId,
  canActOn,
  onToggleDetails,
  onApprove,
  onReject,
  onJustify,
}: {
  jobs: JobRequest[];
  expandedJobId: string | null;
  canActOn: (job: JobRequest) => boolean;
  onToggleDetails: (id: string) => void;
  onApprove: (job: JobRequest) => void;
  onReject: (job: JobRequest) => void;
  onJustify: (job: JobRequest) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-black">Position</th>
            <th className="px-4 py-3 font-black">Requester</th>
            <th className="px-4 py-3 font-black">Department</th>
            <th className="px-4 py-3 font-black">Employment Type</th>
            <th className="px-4 py-3 font-black">Submitted Date</th>
            <th className="px-4 py-3 font-black">Current Approval Step</th>
            <th className="px-4 py-3 font-black">Status</th>
            <th className="px-4 py-3 text-right font-black">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {jobs.map((job) => {
            const expanded = expandedJobId === job.id;
            const canAct = canActOn(job);
            return (
              <Fragment key={job.id}>
                <tr className="hover:bg-blue-50/40">
                  <td className="max-w-[280px] px-4 py-3">
                    <div className="font-black text-slate-950">{job.title}</div>
                    <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{getSeniority(job)} · {job.positions} position{Number(job.positions) === 1 ? '' : 's'}</div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.requestedBy?.name || 'Unassigned'}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.department}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.type}</td>
                  <td className="px-4 py-3 font-semibold text-slate-500">{job.requestedDate}</td>
                  <td className="px-4 py-3 font-bold text-slate-700">{job.approvalStageLabel || formatStageLabel(job.approvalStage || 'hr_review')}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={formatStatus(job)} tone={getStatusTone(job)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleDetails(job.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>
                      {canAct ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(job)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 text-[11px] font-bold text-white transition hover:bg-blue-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(job)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 text-[11px] font-bold text-white transition hover:bg-rose-700"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="hidden text-[11px] font-bold text-slate-400 2xl:inline">
                          {job.status === 'pending' ? `Waiting for ${job.currentReviewer || 'reviewer'}` : formatStatus(job)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onJustify(job)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                        title="Write justification using Gemini"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        Justify
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded ? (
                  <tr>
                    <td colSpan={8} className="bg-slate-50 px-4 py-3">
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(420px,0.8fr)_1fr]">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Approval Progress</p>
                          <div className="mt-2 overflow-x-auto">
                            <div className="grid min-w-[420px] grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                              {getProgressStages(job).map((stage, index) => (
                                <div key={stage.label} className="contents">
                                  <ProgressPill label={stage.label} state={stage.state} />
                                  {index < flowStages.length - 1 ? <div className={`h-0.5 w-8 rounded-full ${stage.state === 'completed' ? 'bg-emerald-300' : stage.state === 'rejected' ? 'bg-rose-300' : 'bg-slate-200'}`} /> : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <ApprovalHistory job={job} />
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProgressPill({ label, state }: { label: string; state: ProgressState }) {
  const styles = {
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    active: 'border-blue-200 bg-blue-50 text-blue-700',
    rejected: 'border-rose-200 bg-rose-50 text-rose-700',
    waiting: 'border-slate-200 bg-slate-50 text-slate-500',
  };
  const Icon = state === 'completed' ? CheckCircle2 : state === 'active' ? CircleDot : state === 'rejected' ? XCircle : Clock3;

  return (
    <div className={`rounded-xl border px-3 py-2 ${styles[state]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black">{label}</p>
          <p className="text-[9px] font-bold capitalize">{state}</p>
        </div>
      </div>
    </div>
  );
}

function ApprovalHistory({ job }: { job: JobRequest }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
        <DetailBlock label="Reviewer" value={job.currentReviewer || 'HR'} />
        <DetailBlock label="Approval Stage" value={job.approvalStageLabel || formatStageLabel(job.approvalStage || 'hr_review')} />
        <DetailBlock label="Status" value={formatStatus(job)} />
      </div>

      {job.rejectionReason ? (
        <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          <span className="block text-[10px] font-black uppercase tracking-wider text-rose-500">Decline reason</span>
          {job.rejectionReason}
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Approval History</p>
        {job.approvalHistory?.length ? (
          <div className="mt-2 space-y-2">
            {job.approvalHistory.map((entry, index) => (
              <div key={`${entry.at || index}-${entry.action}`} className="flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs">
                <div className="min-w-0">
                  <p className="font-black capitalize text-slate-800">{entry.action} at {entry.stage.replace(/_/g, ' ')}</p>
                  <p className="mt-0.5 font-medium text-slate-500">{entry.userName || entry.role || 'System reviewer'}</p>
                  {entry.reason ? <p className="mt-1 font-semibold text-rose-600">{entry.reason}</p> : null}
                </div>
                <span className="shrink-0 text-[10px] font-bold text-slate-400">{entry.at ? new Date(entry.at).toLocaleDateString() : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-400">No approval actions recorded yet.</p>
        )}
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate font-bold text-slate-800">{value}</p>
    </div>
  );
}

function CompactEmptyState({ tab }: { tab: TabKey }) {
  const copy = {
    pending: ['No approvals waiting on you', 'New requisitions that need your review will appear here.'],
    mine: ['No submitted requests found', 'Requests you submitted or reviewed are not matching the current filters.'],
    others: ['No in-progress requests from others', 'There are no matching requisitions currently sitting with another reviewer.'],
    approved: ['No approved requests', 'Approved requisitions will appear here once the workflow is complete.'],
    declined: ['No declined requests', 'Declined requisitions or filtered decline records will appear here.'],
  }[tab];

  return (
    <div className="flex min-h-[150px] w-full items-center justify-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-900">{copy[0]}</h4>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{copy[1]}</p>
      </div>
    </div>
  );
}

function getProgressStages(job: JobRequest): { label: string; state: ProgressState }[] {
  const stage = job.approvalStage || 'hr_review';
  const rejectedStage = job.approvalHistory?.find((entry) => entry.action === 'rejected')?.stage || stage;

  return [
    { label: 'Department Head', state: getStageState(job, 'department_head', stage, rejectedStage) },
    { label: 'HR', state: getStageState(job, 'hr_review', stage, rejectedStage) },
    { label: 'CEO / Business Admin', state: getStageState(job, 'final_approval', stage, rejectedStage) },
  ];
}

function getStageState(job: JobRequest, target: string, currentStage: string, rejectedStage: string): ProgressState {
  const order = ['department_head', 'hr_review', 'final_approval'];
  const targetIndex = order.indexOf(target);
  const currentStageIndex = order.indexOf(currentStage);
  const currentIndex = currentStage === 'approved' ? order.length : currentStageIndex === -1 ? 1 : currentStageIndex;
  if (job.status === 'declined' || currentStage === 'rejected') {
    if (target === rejectedStage || (rejectedStage === 'rejected' && targetIndex === Math.max(currentIndex, 0))) return 'rejected';
    return targetIndex < currentIndex ? 'completed' : 'waiting';
  }
  if (job.status === 'approved' || currentStage === 'approved') return 'completed';
  if (targetIndex < currentIndex) return 'completed';
  if (targetIndex === currentIndex) return 'active';
  return 'waiting';
}

function getCurrentWorkflowStage(jobs: JobRequest[]) {
  const pending = jobs.find((job) => job.status === 'pending');
  if (pending) return pending.approvalStage || 'hr_review';
  if (jobs.some((job) => job.status === 'declined')) return 'rejected';
  if (jobs.some((job) => job.status === 'approved')) return 'approved';
  return 'hr_review';
}

function getStatusTone(job: JobRequest) {
  if (job.status === 'approved') return 'emerald' as const;
  if (job.status === 'declined') return 'rose' as const;
  if (job.approvalStage === 'final_approval') return 'blue' as const;
  return 'amber' as const;
}

function formatStatus(job: JobRequest) {
  if (job.status === 'approved') return 'Approved';
  if (job.status === 'declined') return 'Declined';
  if (job.approvalStage === 'final_approval') return 'Final Review';
  return 'Pending';
}

function formatStageLabel(stage: string) {
  if (stage === 'final_approval') return 'CEO / Business Admin';
  if (stage === 'hr_review') return 'HR Review';
  if (stage === 'department_head') return 'Department Head';
  if (stage === 'approved') return 'Approved';
  if (stage === 'rejected') return 'Declined';
  return stage.replace(/_/g, ' ');
}

function getSeniority(job: JobRequest) {
  if (job.priority === 'High') return 'Senior level';
  if (job.priority === 'Low') return 'Associate level';
  return 'Mid level';
}
