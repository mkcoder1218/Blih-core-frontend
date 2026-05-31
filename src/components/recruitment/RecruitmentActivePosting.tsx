import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronUp, ChevronDown, Check, Briefcase, Loader2, TrendingUp, Sparkles, X,
} from 'lucide-react';
import {
  useJobApplications, useJobRequests, useScheduleInterview, useAdvanceCandidate, useInterviews, useCloseJob,
} from '../../hooks/useJobRequests';
import CandidateDetailModal from './CandidateDetailModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';

interface Props {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// Stages that mean the applicant has already been moved out of the "new applicants" pool
const MOVED_STAGES = new Set(['interview', 'shortlisted', 'waitlisted', 'offer', 'hired', 'rejected']);

export default function RecruitmentActivePosting({ onDraftAiSuggestion, showAlert }: Props) {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests({ includePublished: true });
  const { data: applications, isLoading: loadingApps } = useJobApplications();
  const { data: interviews } = useInterviews();
  const scheduleMutation = useScheduleInterview();
  const advanceMutation = useAdvanceCandidate();

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, 'detail' | 'applicants' | 'analytics'>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, Set<string>>>({});
  const [closingJobId, setClosingJobId] = useState<string | null>(null);

  const closeJob = useCloseJob();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Index of applicant IDs that already have an interview scheduled
  const scheduledAppIds = useMemo(() => {
    const ids = new Set<string>();
    (interviews || []).forEach((iv: any) => {
      if (iv.jobApplicationId) ids.add(iv.jobApplicationId);
    });
    return ids;
  }, [interviews]);

  const activeJobs = useMemo(() => {
    if (!jobRequests?.rows) return [];
    return jobRequests.rows
      .filter(j => j.isPosted)
      .map(job => {
        const allApps = (applications || []).filter((a: any) => a.jobOpeningId === job.id);
        // Only show applicants who are still in "applied" stage AND not yet scheduled for interview
        const pendingApps = allApps.filter(
          (a: any) => !MOVED_STAGES.has(a.stage) && !scheduledAppIds.has(a.id)
        );
        return {
          ...job,
          allApps,
          apps: pendingApps,           // shown in applicants tab
          applicantsCount: pendingApps.length,
          totalApplicants: allApps.length,
          viewsCount: job.views ?? 0,
        };
      });
  }, [jobRequests, applications, scheduledAppIds]);

  // ── handlers ────────────────────────────────────────────────────────────────

  const toggleRow = (jobId: string, appId: string) => {
    setSelectedRows(prev => {
      const set = new Set(prev[jobId] || []);
      set.has(appId) ? set.delete(appId) : set.add(appId);
      return { ...prev, [jobId]: set };
    });
  };

  const toggleAll = (jobId: string, appIds: string[]) => {
    setSelectedRows(prev => {
      const set = prev[jobId] || new Set();
      const allSelected = appIds.every(id => set.has(id));
      return { ...prev, [jobId]: allSelected ? new Set() : new Set(appIds) };
    });
  };

  const handleOpenScheduler = () => {
    setShowDetailModal(false);
    setTimeout(() => setShowScheduleModal(true), 50);
  };

  const handleShortlist = () => {
    if (!selectedCandidate) return;
    advanceMutation.mutate({ id: selectedCandidate.id, stage: 'shortlisted' }, {
      onSuccess: () => { setShowDetailModal(false); showAlert(`${selectedCandidate.fullName || 'Candidate'} shortlisted`, 'success'); },
      onError: (e: any) => showAlert(`Failed: ${e.message}`, 'error'),
    });
  };

  const handleReject = () => {
    if (!selectedCandidate) return;
    advanceMutation.mutate({ id: selectedCandidate.id, stage: 'rejected' }, {
      onSuccess: () => { setShowDetailModal(false); showAlert(`${selectedCandidate.fullName || 'Candidate'} rejected`, 'error'); },
      onError: (e: any) => showAlert(`Failed: ${e.message}`, 'error'),
    });
  };

  const handleScheduleInterview = (data: any) => {
    scheduleMutation.mutate(data, {
      onSuccess: () => { setShowScheduleModal(false); showAlert(`Interview invitation sent to ${selectedCandidate?.fullName}`, 'success'); },
      onError: (e: any) => showAlert(`Failed to schedule: ${e.message}`, 'error'),
    });
  };

  const handleCloseJob = (e: React.MouseEvent, jobId: string, jobTitle: string) => {
    e.stopPropagation();
    if (!confirm(`Close "${jobTitle}"? It will be removed from the public careers page immediately.`)) return;
    setClosingJobId(jobId);
    closeJob.mutate(jobId, {
      onSuccess: () => { showAlert(`"${jobTitle}" closed and removed from careers page`, 'success'); setClosingJobId(null); },
      onError: (err: any) => { showAlert(err?.response?.data?.message || 'Failed to close job', 'error'); setClosingJobId(null); },
    });
  };

  // ── loading / empty ──────────────────────────────────────────────────────────

  if (loadingJobs || loadingApps) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Syncing published vacancies...</span>
      </div>
    );
  }

  if (activeJobs.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center space-y-4 font-sans">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
          <Briefcase className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900">No active postings</h3>
        <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
          Once you publish a job request it will appear here.
        </p>
      </div>
    );
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 font-sans">
      {activeJobs.map(job => {
        const isExpanded = expandedJobId === job.id;
        const currentTab = activeSubTab[job.id] || 'detail';
        const appIds = job.apps.map((a: any) => a.id);
        const selected = selectedRows[job.id] || new Set<string>();
        const allChecked = appIds.length > 0 && appIds.every((id: string) => selected.has(id));

        return (
          <div key={job.id}
            className={`bg-white rounded-2xl border overflow-hidden transition-all ${
              isExpanded ? 'border-slate-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'
            }`}>

            {/* ── Card header ── */}
            <div
              className="px-4 sm:px-6 py-4 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
              onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
            >
              {/* top row: title + badge + close button */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h4 className="text-[14px] sm:text-[15px] font-black text-slate-900 tracking-tight leading-tight">{job.title}</h4>
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded uppercase tracking-wide whitespace-nowrap flex-shrink-0">
                    Active Post
                  </span>
                </div>
                {/* Close button — always top-right */}
                <button
                  onClick={(e) => handleCloseJob(e, job.id, job.title)}
                  disabled={closingJobId === job.id}
                  title="Close job posting"
                  className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
                >
                  {closingJobId === job.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <X className="w-4 h-4" />
                  }
                </button>
              </div>

              {/* meta row: dept · type · positions */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] mt-1.5">
                <span className="text-blue-600 font-black uppercase tracking-widest">{job.department || '—'}</span>
                {job.type && <><span className="text-slate-300">·</span><span className="text-slate-500 font-semibold">{job.type}</span></>}
                {job.positions && <><span className="text-slate-300">·</span><span className="text-slate-500 font-semibold">{job.positions} Position{job.positions > 1 ? 's' : ''}</span></>}
              </div>

              {/* stats + expand toggle row */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Applicants</p>
                    <p className="text-[14px] font-black text-slate-700 mt-0.5">{job.applicantsCount}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Views</p>
                    <p className="text-[14px] font-black text-slate-700 mt-0.5">{job.viewsCount}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-black text-slate-400">
                  {isExpanded ? <><ChevronUp className="w-4 h-4" /> Less</> : <><ChevronDown className="w-4 h-4" /> More</>}
                </span>
              </div>
            </div>

            {/* ── Expanded body ── */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  {/* Tab row */}
                  <div className="grid grid-cols-3 border-t border-slate-100">
                    {(['detail', 'applicants', 'analytics'] as const).map((tab, i) => {
                      const label =
                        tab === 'detail' ? 'Job Detail' :
                        tab === 'applicants' ? `Applicants (${job.applicantsCount})` :
                        'Analytics';
                      const active = currentTab === tab;
                      return (
                        <button key={tab}
                          onClick={e => { e.stopPropagation(); setActiveSubTab(p => ({ ...p, [job.id]: tab })); }}
                          className={`py-3 text-[12px] font-black transition-colors border-b-2
                            ${i > 0 ? 'border-l border-slate-100' : ''}
                            ${active
                              ? 'border-b-blue-600 text-slate-900 bg-white'
                              : 'border-b-transparent text-slate-400 bg-slate-50/60 hover:text-slate-700'
                            }`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* ── Job Detail tab ── */}
                    {currentTab === 'detail' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            { label: 'Priority',       value: job.priority },
                            { label: 'Due Date',        value: job.dueDate },
                            { label: 'Expected Date',   value: job.expectedDate },
                            { label: 'Date Published',  value: job.requestedDate },
                          ].map(item => (
                            <div key={item.label} className="bg-slate-50 rounded-2xl p-4">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                              <p className="text-[12px] font-black text-slate-700">{item.value || '—'}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-2">Job Overview</h5>
                              <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">{job.overview}</p>
                            </div>
                            <div>
                              <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-2">Requirements</h5>
                              <ul className="space-y-1.5 pl-1">
                                {(job.requirements || []).map((r: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                    <span className="font-medium">{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-2">Qualifications</h5>
                              <ul className="space-y-1.5 pl-1">
                                {(job.qualifications || []).map((q: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                    <span className="font-medium">{q}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-1">Business Justification</h5>
                              <p className="leading-relaxed text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">{job.importance}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Applicants tab ── */}
                    {currentTab === 'applicants' && (
                      <div className="space-y-4">
                        {/* toolbar */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <Check className="w-4 h-4 text-blue-600" />
                            All Applicants Syncing...
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors">
                            Bulk Actions
                          </button>
                        </div>

                        {job.apps.length === 0 && (
                          <div className="border border-slate-100 rounded-2xl px-5 py-12 text-center text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                            No new applicants
                          </div>
                        )}

                        {/* Desktop table — hidden on mobile */}
                        {job.apps.length > 0 && (
                          <div className="border border-slate-100 rounded-2xl overflow-hidden hidden sm:block">
                            {/* header */}
                            <div className="grid grid-cols-12 gap-2 bg-slate-50 px-5 py-3 border-b border-slate-100">
                              <div className="col-span-1 flex items-center">
                                <input type="checkbox" checked={allChecked}
                                  onChange={() => toggleAll(job.id, appIds)}
                                  className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer" />
                              </div>
                              {['Candidate', 'Applied Date', 'Score', 'Actions'].map((h, i) => (
                                <span key={h}
                                  className={`text-[10px] font-black text-blue-600 uppercase tracking-widest ${
                                    i === 0 ? 'col-span-4' : i === 1 ? 'col-span-3' : i === 2 ? 'col-span-2 text-center' : 'col-span-2 text-center'
                                  }`}>
                                  {h}
                                </span>
                              ))}
                            </div>
                            {/* rows */}
                            {job.apps.map((app: any, idx: number) => {
                              const isChecked = selected.has(app.id);
                              const name = app.fullName || 'Anonymous';
                              return (
                                <div key={app.id || idx}
                                  className={`grid grid-cols-12 gap-2 px-5 py-4 items-center border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/60 cursor-pointer
                                    ${idx % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}
                                  onClick={() => { setSelectedCandidate(app); setSelectedJob(job); setShowDetailModal(true); }}
                                >
                                  <div className="col-span-1" onClick={e => { e.stopPropagation(); toggleRow(job.id, app.id); }}>
                                    <input type="checkbox" checked={isChecked} onChange={() => {}}
                                      className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer" />
                                  </div>
                                  <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-600 uppercase flex-shrink-0">
                                      {name[0]}
                                    </div>
                                    <div>
                                      <p className="text-[13px] font-black text-slate-900 leading-tight">{name}</p>
                                      <p className="text-[11px] text-slate-400 font-medium">{app.email}</p>
                                    </div>
                                  </div>
                                  <div className="col-span-3">
                                    <p className="text-[12px] font-bold text-slate-600">
                                      {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                    </p>
                                  </div>
                                  <div className="col-span-2 flex justify-center">
                                    <span className="text-[12px] font-black text-slate-700">{app.score ?? 90}%</span>
                                  </div>
                                  <div className="col-span-2 flex justify-center">
                                    <button
                                      onClick={e => { e.stopPropagation(); setSelectedCandidate(app); setSelectedJob(job); setShowDetailModal(true); }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-black rounded-xl hover:bg-blue-100 transition-colors">
                                      <Sparkles className="w-3 h-3 fill-blue-600" /> View
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Mobile card list — shown only on mobile */}
                        {job.apps.length > 0 && (
                          <div className="space-y-2 sm:hidden">
                            {job.apps.map((app: any, idx: number) => {
                              const name = app.fullName || 'Anonymous';
                              return (
                                <div key={app.id || idx}
                                  className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
                                  onClick={() => { setSelectedCandidate(app); setSelectedJob(job); setShowDetailModal(true); }}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-600 uppercase flex-shrink-0">
                                      {name[0]}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[13px] font-black text-slate-900 leading-tight truncate">{name}</p>
                                      <p className="text-[11px] text-slate-400 font-medium truncate">{app.email}</p>
                                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                        {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[12px] font-black text-slate-700">{app.score ?? 90}%</span>
                                    <button
                                      onClick={e => { e.stopPropagation(); setSelectedCandidate(app); setSelectedJob(job); setShowDetailModal(true); }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-[11px] font-black rounded-xl hover:bg-blue-100 transition-colors">
                                      <Sparkles className="w-3 h-3 fill-blue-600" /> View
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Analytics tab ── */}
                    {currentTab === 'analytics' && (
                      <div className="py-12 text-center">
                        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="w-7 h-7 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900">Analytics Processing...</h4>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                          Real-time view tracking and conversion rates will appear here soon.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <CandidateDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        candidate={selectedCandidate}
        jobTitle={selectedJob?.title}
        onScheduleInterview={handleOpenScheduler}
        onShortlist={handleShortlist}
        onReject={handleReject}
      />

      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onBackToApplication={() => { setShowScheduleModal(false); setShowDetailModal(true); }}
        candidateName={selectedCandidate?.fullName}
        jobTitle={selectedJob?.title}
        jobApplicationId={selectedCandidate?.id}
        onSchedule={handleScheduleInterview}
        isLoading={scheduleMutation.isPending}
      />
    </div>
  );
}
