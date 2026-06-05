/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { JobRequest } from '../../types';
import {
  Clock,
  CheckCircle,
  Briefcase,
} from 'lucide-react';
import {
  StatCard, StatCardGrid, StatusBadge, FilterBar, EmptyState,
} from '@/components/ui/blih';

interface RecruitmentRequestsProps {
  onSuggestJustification: (jobTitle: string, dept: string) => void;
  onOpenNewJobModal: () => void;
  jobs: JobRequest[];
  onApproveJob: (id: string) => void;
  onJustifyJob: (id: string) => void;
  currentUser?: { id: string; role: string; name?: string };
}

export default function RecruitmentRequests({
  onSuggestJustification,
  onOpenNewJobModal,
  jobs,
  onApproveJob,
  onJustifyJob,
  currentUser,
}: RecruitmentRequestsProps) {
  // Local state for Declined section filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('All');

  // De-duplicate departments & types for dropdowns
  const departments = ['All', 'TECHNICAL DEPT.', 'CREATIVE DEPT.', 'DIGITAL MARKETING DEPT.'];
  const jobTypes = ['All', 'Full-time', 'Part-time', 'Remote', 'Contract'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  // Categorize jobs
  const pendingRequests = jobs.filter((j) => j.status === 'pending' && (!j.approvals || j.approvals.length === 0));
  
  const approvedByMe = jobs.filter((j) => (j.status === 'pending' || j.status === 'approved') && j.approvals?.some(a => a.userId === currentUser?.id));
  
  const approvedByOthers = jobs.filter((j) => j.status === 'pending' && j.approvals && j.approvals.length > 0 && !j.approvals.some(a => a.userId === currentUser?.id));

  const declinedRequests = jobs.filter((j) => {
    if (j.status !== 'declined') return false;
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === 'All' || j.department === selectedDeptFilter;
    const matchesType = selectedTypeFilter === 'All' || j.type === selectedTypeFilter;
    const matchesPriority = selectedPriorityFilter === 'All' || j.priority === selectedPriorityFilter;
    return matchesSearch && matchesDept && matchesType && matchesPriority;
  });

  const pendingCount = pendingRequests.length;
  const approvedThisMonth = approvedByMe.length + approvedByOthers.length;
  const totalOpenCount = jobs.filter(j => j.status === 'approved' || j.isPosted).length;

  return (
    <div id="recruitment-requests-view" className="space-y-8">
      {/* Mini top metrics */}
      <StatCardGrid cols={3}>
        <StatCard label="Pending Requests" value={pendingCount} icon={<Clock className="w-5 h-5" />} tone="blue" />
        <StatCard label="Approved This Month" value={approvedThisMonth} icon={<CheckCircle className="w-5 h-5" />} tone="cyan" />
        <StatCard label="Total Open Positions" value={totalOpenCount} icon={<Briefcase className="w-5 h-5" />} tone="violet" />
      </StatCardGrid>

      {/* SECTION 1: Pending Approval Requests */}
      <div>
        <div className="mb-2">
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Pending Approval Requests</h4>
          <p className="text-[11px] text-slate-400 font-medium">Review and publish job postings</p>
        </div>

        {pendingRequests.length === 0 ? (
          <EmptyState
            title="No pending approval requests"
            description="All submitted job requisitions have been processed."
            compact
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {pendingRequests.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-[13px] font-bold text-slate-900 tracking-tight">{job.title}</h5>
                      <span className="text-[10px] font-extrabold text-blue-600 block mt-1 tracking-wider uppercase">
                        {job.department}
                      </span>
                    </div>
                    <StatusBadge
                      label={job.priority}
                      tone={job.priority === 'High' ? 'rose' : job.priority === 'Medium' ? 'amber' : 'slate'}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-500 font-semibold border-t border-slate-50 pt-3">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Positions</span>
                      <span className="text-slate-900 font-extrabold">{job.positions}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Type</span>
                      <span className="text-slate-800 font-bold">{job.type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Requested</span>
                      <span className="text-slate-600 font-semibold truncate block">{job.requestedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => onApproveJob(job.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs py-2.5 shadow-xs cursor-pointer select-none active:scale-98 transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onJustifyJob(job.id)}
                    className="px-4 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 font-bold rounded-xl text-xs py-2.5 transition-all cursor-pointer select-none"
                    title="Write justification using Gemini"
                  >
                    Justify
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Submitted by You */}
      <div>
        <div className="mb-2">
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight font-sans">Submitted by You</h4>
          <p className="text-[11px] text-slate-400 font-medium font-sans">Recently signed job postings pending other department consent</p>
        </div>

        {approvedByMe.length === 0 ? (
          <EmptyState
            title="No signed jobs pending other signatures"
            description="Signed jobs will populate here while waiting for publishing."
            compact
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {approvedByMe.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-emerald-500/10 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-[13px] font-bold text-slate-900 tracking-tight">{job.title}</h5>
                        <span className="bg-slate-100 text-[9px] font-semibold text-slate-500 px-1.5 py-0.5 rounded">Senior</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-blue-600 block mt-1 tracking-wider uppercase">
                        {job.department}
                      </span>
                    </div>
                    <StatusBadge
                      label={job.status === 'approved' ? 'Approved' : 'Signature Saved'}
                      tone="emerald"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-500 font-semibold border-t border-slate-50 pt-3">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Positions</span>
                      <span className="text-slate-900 font-extrabold">{job.positions}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Type</span>
                      <span className="text-slate-800 font-bold">{job.type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Requested</span>
                      <span className="text-slate-600 font-semibold truncate block">{job.requestedDate}</span>
                    </div>
                  </div>
                </div>

                {!job.isPosted && job.status !== 'approved' && (
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] font-semibold text-blue-600 bg-sky-50/30 rounded-lg p-2.5">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-1 or border-x border-[#1a56db] border-t-transparent" />
                    <span>Waiting other board member consensus to publish...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Submitted by Others */}
      <div>
        <div className="mb-2">
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight font-sans">Submitted by Others</h4>
          <p className="text-[11px] text-slate-400 font-medium font-sans">Requests signed by other departments requiring your consent</p>
        </div>

        {approvedByOthers.length === 0 ? (
          <EmptyState
            title="No requests pending your signature"
            description="Other board member signs will appear here."
            compact
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {approvedByOthers.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-indigo-500/10 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-[13px] font-bold text-slate-900 tracking-tight">{job.title}</h5>
                      <span className="text-[10px] font-extrabold text-blue-600 block mt-1 tracking-wider uppercase">
                        {job.department}
                      </span>
                    </div>
                    <StatusBadge label="Signature Needed" tone="violet" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-500 font-semibold border-t border-slate-50 pt-3">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Positions</span>
                      <span className="text-slate-900 font-extrabold">{job.positions}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Type</span>
                      <span className="text-slate-800 font-bold">{job.type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Requested</span>
                      <span className="text-slate-600 font-semibold truncate block">{job.requestedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => onApproveJob(job.id)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs py-2.5 shadow-xs cursor-pointer select-none active:scale-98 transition-all"
                  >
                    Cosign & Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Declined Job Postings (with inline filters) */}
      <div>
        <div className="mb-4">
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight font-sans">Declined Job Postings</h4>
          <p className="text-[11px] text-slate-400 font-medium">Archived positions and requests requiring edits</p>
        </div>

        {/* Filter Toolbar */}
        <FilterBar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search jobs..."
          filters={[
            {
              value: selectedDeptFilter,
              onChange: setSelectedDeptFilter,
              placeholder: 'All Departments',
              options: departments.map(d => ({ value: d, label: d === 'All' ? 'All Departments' : d })),
              width: 'w-48',
            },
            {
              value: selectedTypeFilter,
              onChange: setSelectedTypeFilter,
              placeholder: 'All Job Types',
              options: jobTypes.map(t => ({ value: t, label: t === 'All' ? 'All Job Types' : t })),
              width: 'w-36',
            },
            {
              value: selectedPriorityFilter,
              onChange: setSelectedPriorityFilter,
              placeholder: 'All Priorities',
              options: priorities.map(p => ({ value: p, label: p === 'All' ? 'All Priorities' : `${p} Priority` })),
              width: 'w-36',
            },
          ]}
          actions={
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDeptFilter('All');
                setSelectedTypeFilter('All');
                setSelectedPriorityFilter('All');
              }}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold rounded-xl text-xs py-2 px-3 transition-colors cursor-pointer"
            >
              Reset
            </button>
          }
        />
        <p className="text-[10px] text-slate-400 font-bold mt-2">{declinedRequests.length} matching jobs found</p>

        {declinedRequests.length === 0 ? (
          <EmptyState
            title="No declined records match active filter selection."
            compact
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {declinedRequests.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs opacity-90 relative flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-[13px] font-bold text-slate-900 tracking-tight">{job.title}</h5>
                        <span className="bg-slate-100 text-[9px] font-bold text-slate-600 px-1.5 py-0.5 rounded">Senior</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-blue-600 block mt-1 tracking-wider uppercase">
                        {job.department}
                      </span>
                    </div>
                    <StatusBadge status="declined" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] text-slate-500 font-semibold border-t border-slate-50 pt-3">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Positions</span>
                      <span className="text-slate-900 font-extrabold">{job.positions}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Type</span>
                      <span className="text-slate-800 font-semibold">{job.type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider font-bold">Requested</span>
                      <span className="text-slate-600 font-semibold leading-none">{job.requestedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] text-slate-500 italic bg-rose-50/20 p-2.5 rounded-lg border border-rose-50/50">
                  <span className="font-bold text-rose-600 block not-italic uppercase text-[8px] tracking-wider mb-0.5">Disapproval note:</span>
                  Headcount approval temporarily capped. Refile in Q3 during budgetary reviews.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
