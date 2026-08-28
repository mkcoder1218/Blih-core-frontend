/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatusBadge } from '@/components/ui/blih';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Filter,
  RotateCcw,
  Search,
  UserRound,
  XCircle
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { JobRequest } from '../../types';
import {
  CompactEmptyState,
  dateRangeOptions,
  FilterSelect,
  formatStageLabel,
  getCurrentWorkflowStage,
  JobRequestsTable,
  KpiCard,
  statusFilterOptions,
  type TabKey
} from './RecruitmentRequestParts';

interface RecruitmentRequestsProps {
  onSuggestJustification: (jobTitle: string, dept: string) => void;
  onOpenNewJobModal: () => void;
  jobs: JobRequest[];
  onApproveJob: (id: string) => void;
  onRejectJob?: (id: string, reason: string) => void;
  onJustifyJob: (id: string) => void;
  currentUser?: { id: string; role: string; roles?: string[]; permissions?: string[]; name?: string };
}
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
  const [showMoreFilters, setShowMoreFilters] = useState(false);

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
  const isDepartmentHead = roleSet.has('DEPARTMENT_HEAD') || roleSet.has('DEPT_HEAD');
  const canRequestJob = isDepartmentHead || permissionSet.has('job.request');
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
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">Job Approval Requests</h3>
           
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Department Head → HR Review → CEO / Business Admin</span>
              <StatusBadge label={formatStageLabel(currentFlowStage)} tone={currentFlowStage === 'approved' ? 'emerald' : currentFlowStage === 'rejected' ? 'rose' : 'blue'} />
            </div>
          </div>
          {canRequestJob && (
            <button
              type="button"
              onClick={onOpenNewJobModal}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              New Request
            </button>
          )}
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="Pending My Approval" value={jobs.filter((job) => job.status === 'pending' && canActOn(job)).length} icon={Clock3} />
          <KpiCard label="Submitted by Me" value={jobs.filter((job) => isSubmittedByCurrentUser(job) || isReviewedByCurrentUser(job)).length} icon={UserRound} />
          <KpiCard label="In Progress" value={inProgressRequests.length} icon={CircleDot} />
          <KpiCard label="Approved" value={jobs.filter((job) => job.status === 'approved').length} icon={CheckCircle2} />
          <KpiCard label="Declined" value={jobs.filter((job) => job.status === 'declined').length} icon={XCircle} />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[200px] flex-1 space-y-1">
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

              <div className="flex shrink-0 items-center gap-2 pb-0.5">
                <span className="text-xs font-bold text-slate-500">
                  <Filter className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                  {activeJobs.length} results
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="group inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  <RotateCcw className="h-3.5 w-3.5 transition group-hover:text-red-500" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowMoreFilters((prev) => !prev)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${
                    showMoreFilters
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  More Filters
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showMoreFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {showMoreFilters && (
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 md:grid-cols-4">
                <FilterSelect label="Department" value={selectedDeptFilter} onChange={setSelectedDeptFilter} options={departments} />
                <FilterSelect label="Employment Type" value={selectedTypeFilter} onChange={setSelectedTypeFilter} options={jobTypes} />
                <FilterSelect label="Approval Status" value={selectedStatusFilter} onChange={setSelectedStatusFilter} options={statusFilterOptions} />
                <FilterSelect label="Date Range" value={selectedDateRange} onChange={setSelectedDateRange} options={dateRangeOptions} />
              </div>
            )}

            <div className="mt-3">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
                <TabsList variant="line" className="h-auto bg-transparent p-0">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="h-9 px-3 text-xs font-semibold data-active:text-blue-700 data-active:after:bg-blue-600"
                    >
                      {tab.label}
                      <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 data-active:bg-blue-100 data-active:text-blue-700">
                        {tab.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
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
