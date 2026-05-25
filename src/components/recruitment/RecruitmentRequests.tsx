/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { mockJobRequests } from '../../mockData';
import { JobRequest } from '../../types';
import {
  Clock,
  CheckCircle,
  Briefcase,
  Search,
  Filter,
  Plus,
  AlertCircle,
  Trash2,
  Sparkles,
  Check,
  ChevronDown,
  X,
  PlusCircle
} from 'lucide-react';

interface RecruitmentRequestsProps {
  onSuggestJustification: (jobTitle: string, dept: string) => void;
  onOpenNewJobModal: () => void;
  jobs: JobRequest[];
  onApproveJob: (id: string) => void;
  onJustifyJob: (id: string) => void;
}

export default function RecruitmentRequests({
  onSuggestJustification,
  onOpenNewJobModal,
  jobs,
  onApproveJob,
  onJustifyJob,
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
  const pendingRequests = jobs.filter((j) => j.status === 'pending');
  const approvedRequests = jobs.filter((j) => j.status === 'approved');
  const declinedRequests = jobs.filter((j) => {
    if (j.status !== 'declined') return false;
    const matchesSearch = j.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === 'All' || j.department === selectedDeptFilter;
    const matchesType = selectedTypeFilter === 'All' || j.type === selectedTypeFilter;
    const matchesPriority = selectedPriorityFilter === 'All' || j.priority === selectedPriorityFilter;
    return matchesSearch && matchesDept && matchesType && matchesPriority;
  });

  // Calculate stats dynamically based on the current list
  const pendingCount = pendingRequests.length * 3 + 1; // scaled slightly for design
  const approvedThisMonth = approvedRequests.length * 4 + 12;
  const totalOpenCount = (pendingRequests.length + approvedRequests.length) * 5 + 20;

  return (
    <div id="recruitment-requests-view" className="space-y-8">
      {/* Mini top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-2xl font-extrabold text-[#111827] mt-1.5 tracking-tight">{pendingRequests.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved This Month</p>
            <h3 className="text-2xl font-extrabold text-[#111827] mt-1.5 tracking-tight">{approvedThisMonth}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Open Positions</p>
            <h3 className="text-2xl font-extrabold text-[#111827] mt-1.5 tracking-tight">{totalOpenCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SECTION 1: Pending Approval Requests */}
      <div>
        <div className="mb-2">
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight">Pending Approval Requests</h4>
          <p className="text-[11px] text-slate-400 font-medium">Review and publish job postings</p>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center bg-slate-50/50">
            <p className="text-xs font-semibold text-slate-500 mb-1">No pending approval requests</p>
            <p className="text-[11px] text-slate-400">All submitted job requisitions have been processed.</p>
          </div>
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

                    {/* Priority Tag */}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                        job.priority === 'High'
                          ? 'bg-rose-50 text-rose-600 border-rose-100'
                          : job.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}
                    >
                      {job.priority}
                    </span>
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

      {/* SECTION 2: Approved by You */}
      <div>
        <div className="mb-2">
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight font-sans">Approved by You</h4>
          <p className="text-[11px] text-slate-400 font-medium font-sans">Recently approved job postings pending other department consent</p>
        </div>

        {approvedRequests.length === 0 ? (
          <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center bg-slate-50/50 mt-4">
            <p className="text-xs font-semibold text-slate-500 mb-1">No approved jobs pending other signatures</p>
            <p className="text-[11px] text-slate-400">Approved jobs will populate here while waiting for publishing.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {approvedRequests.map((job) => (
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

                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-100">
                      Approved
                    </span>
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

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] font-semibold text-blue-600 bg-sky-50/30 rounded-lg p-2.5">
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-1 or border-x border-[#1a56db] border-t-transparent" />
                  <span>Waiting other board member consensus to publish...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Declined Job Postings (with inline filters) */}
      <div>
        <div className="mb-4">
          <h4 className="text-[14px] font-bold text-slate-900 tracking-tight font-sans">Declined Job Postings</h4>
          <p className="text-[11px] text-slate-400 font-medium">Archived positions and requests requiring edits</p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            {/* Department Filter */}
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Departments</option>
              {departments.filter(d => d !== 'All').map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Job Type Filter */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Job Types</option>
              {jobTypes.filter(t => t !== 'All').map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-700 font-medium cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Priorities</option>
              {priorities.filter(p => p !== 'All').map((p) => (
                <option key={p} value={p}>
                  {p} Priority
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDeptFilter('All');
                setSelectedTypeFilter('All');
                setSelectedPriorityFilter('All');
              }}
              className="bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-semibold rounded-xl text-xs py-2 px-3 transition-colors cursor-pointer text-center"
            >
              Reset Filters
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-bold">{declinedRequests.length} matching jobs found</p>
        </div>

        {declinedRequests.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/20 mt-4">
            <span className="text-xs text-slate-500">No declined records match active filter selection.</span>
          </div>
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

                    <span className="text-[9px] font-bold uppercase tracking-wider px-2.2 py-0.5 rounded bg-black text-white">
                      Declined
                    </span>
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

      {/* FOOTER ACTION: Request a Job Placeholder screen */}
      <div className="border border-slate-100 rounded-2xl p-6 bg-[#fafbfc] flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-blue-50/60 rounded-full flex items-center justify-center text-blue-600 mb-3 border border-blue-50">
          <CheckCircle className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-slate-500 mb-1">No jobs ready for post.</span>
        <span className="text-[10px] text-slate-400 mb-4 max-w-xs leading-normal">
          Draft a new request or approve any existing requests to transfer them to the ready queue.
        </span>
        <button
          onClick={onOpenNewJobModal}
          className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold rounded-xl text-xs px-5 py-3 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request a Job</span>
        </button>
      </div>
    </div>
  );
}
