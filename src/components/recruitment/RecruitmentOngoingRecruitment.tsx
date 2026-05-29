import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, ChevronUp, Sparkles, Loader2, TrendingUp, Clock, Calendar, Users, Send, CheckCircle, X,
} from 'lucide-react';
import OfferLetterModal from './OfferLetterModal';
import CandidateDetailModal from './CandidateDetailModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import OfferLetterCreateModal from '../offer-letters/OfferLetterCreateModal';
import {
  useJobApplications, useJobRequests, useScheduleInterview,
  useAdvanceCandidate, useInterviews, useCloseJob,
} from '../../hooks/useJobRequests';
import { useQuery } from '@tanstack/react-query';
import { getOfferLetters } from '../../api/offerLetters';

interface Props {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

type SubTab = 'interview' | 'shortlisted' | 'waitlisted';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ── Interview schedule cell ───────────────────────────────────────────────────

function InterviewScheduleCell({ interview }: { interview: any | null }) {
  if (!interview) {
    return <span className="text-[11px] text-slate-300 font-semibold">—</span>;
  }
  if (interview.status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-black rounded-lg">
        Interviewed
      </span>
    );
  }
  if (interview.status === 'pending_acceptance') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-black rounded-lg">
        <Clock className="w-3 h-3" /> Awaiting
      </span>
    );
  }
  if (interview.status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-[11px] font-black rounded-lg">
        Cancelled
      </span>
    );
  }
  // scheduled — show date + time
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] font-black text-slate-700">{fmtDate(interview.interviewAt)}</span>
      <span className="text-[11px] font-bold text-slate-400">{fmtTime(interview.interviewAt)}</span>
    </div>
  );
}

// ── Rating badge ──────────────────────────────────────────────────────────────

function RatingBadge({ score }: { score?: number | null }) {
  if (score == null) return <span className="text-[11px] text-slate-300 font-semibold">—</span>;
  // score is avg skill rating on 1–5 scale; display as x/5
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fefce8] border border-[#fef08a] text-[#a16207] text-[11px] font-black rounded-full whitespace-nowrap">
      <Sparkles className="w-3 h-3 fill-[#a16207]" />
      {score.toFixed(1)}/5
    </span>
  );
}

// ── Top Match card ────────────────────────────────────────────────────────────

function TopMatchCard({ app, onClick }: { app: any; onClick: () => void }) {
  const meta = app.metadata || {};
  return (
    <div
      onClick={onClick}
      className="w-full bg-[#f0f5ff] border border-blue-200 rounded-2xl px-6 py-4 cursor-pointer hover:bg-blue-50 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 uppercase tracking-widest">
          <TrendingUp className="w-3.5 h-3.5" /> Top Match
        </span>
        {app.avgSkillRating != null && <RatingBadge score={app.avgSkillRating} />}
      </div>
      <div className="grid grid-cols-4 gap-4 items-end">
        <div>
          <p className="text-[15px] font-black text-slate-900 leading-tight">{app.fullName || 'Anonymous'}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{app.phone || meta.phone || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Experience</p>
          <p className="text-[13px] font-black text-slate-800">{meta.experience || meta.yearsOfExperience || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Salary Expectation</p>
          <p className="text-[13px] font-black text-slate-800">{meta.salaryExpectation || meta.expectedSalary || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Can Start</p>
          <p className="text-[13px] font-black text-slate-800">
            {meta.availableFrom ? fmtDate(meta.availableFrom) : meta.canStart || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Candidate grid card (shortlisted / waitlisted) ────────────────────────────

function CandidateGridCard({ app, onClick }: { app: any; onClick: () => void }) {
  const name = app.fullName || 'Anonymous';
  const phone = app.phone || app.metadata?.phone || app.email || '—';
  const dateApplied = fmtDate(app.createdAt);

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[13px] font-black text-slate-900 truncate">{name}</p>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">{phone}</p>
        </div>
        {app.avgSkillRating != null && <RatingBadge score={app.avgSkillRating} />}
      </div>
      {dateApplied && (
        <p className="text-[11px] text-slate-400 font-semibold">{dateApplied}</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RecruitmentOngoingRecruitment({ onDraftAiSuggestion, showAlert }: Props) {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests({ includePublished: true });
  const { data: applications, isLoading: loadingApps } = useJobApplications();
  const { data: interviews, isLoading: loadingInterviews } = useInterviews();
  const scheduleMutation = useScheduleInterview();
  const advanceMutation = useAdvanceCandidate();

  // Fetch existing offer letters to know which candidates already have one sent
  const { data: offerLettersData } = useQuery({
    queryKey: ['offer-letters-sent-check'],
    queryFn: async () => {
      const res = await getOfferLetters({ limit: 500 });
      const raw = res.data?.data;
      return Array.isArray(raw) ? raw : (raw?.rows ?? []);
    },
    staleTime: 30_000,
  });

  // Set of emails that already have a SENT or ACCEPTED offer
  const sentOfferEmails = useMemo(() => {
    const set = new Set<string>();
    (offerLettersData || []).forEach((o: any) => {
      if (o.status === 'SENT' || o.status === 'ACCEPTED') {
        set.add((o.candidateEmail || '').toLowerCase());
      }
    });
    return set;
  }, [offerLettersData]);

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, SubTab>>({});
  const [closingJobId, setClosingJobId] = useState<string | null>(null);
  const closeJob = useCloseJob();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showOfferCreateModal, setShowOfferCreateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // index interviews by jobApplicationId — keep most recent per application
  const interviewByAppId = useMemo(() => {
    const map: Record<string, any> = {};
    (interviews || []).forEach((iv: any) => {
      const existing = map[iv.jobApplicationId];
      if (!existing || new Date(iv.createdAt) > new Date(existing.createdAt)) {
        map[iv.jobApplicationId] = iv;
      }
    });
    return map;
  }, [interviews]);

  const ongoingData = useMemo(() => {
    if (!jobRequests?.rows || !applications) return [];

    return jobRequests.rows
      .map((job: any) => {
        const jobApps = (applications as any[]).filter((a: any) => a.jobOpeningId === job.id);

        const topMatch = jobApps.length > 0
          ? [...jobApps].sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))[0]
          : null;

        // "On Interview" = has any interview record OR is in applied/interview stage
        // This includes completed interviews (stage may have advanced to "offer")
        const interviewApps = jobApps.filter((a: any) =>
          interviewByAppId[a.id] ||
          !a.stage ||
          a.stage === 'applied' ||
          a.stage === 'interview'
        );
        const shortlistedApps = jobApps.filter((a: any) => a.stage === 'shortlisted');
        const waitlistedApps  = jobApps.filter((a: any) => a.stage === 'waitlisted');

        const interviewedCount = interviewApps.filter((a: any) => interviewByAppId[a.id]).length;

        return {
          ...job,
          allApps: jobApps,
          interviewApps,
          shortlistedApps,
          waitlistedApps,
          topMatch,
          interviewedCount,
        };
      })
      .filter((j: any) => j.allApps.length > 0);
  }, [jobRequests, applications, interviewByAppId]);

  // ── handlers ─────────────────────────────────────────────────────────────────

  const openCandidateDetail = (candidate: any, job: any) => {
    setSelectedCandidate(candidate);
    setSelectedJob(job);
    setShowDetailModal(true);
    setShowScheduleModal(false);
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
      onSuccess: () => { setShowScheduleModal(false); showAlert('Interview scheduled. Invitation sent to candidate.', 'success'); },
      onError: (e: any) => showAlert(`Failed: ${e.message}`, 'error'),
    });
  };

  const handleSendOffer = (candidate: any, job: any) => {
    setSelectedCandidate(candidate);
    setSelectedJob(job);
    setShowOfferCreateModal(true);
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

  // ── loading ───────────────────────────────────────────────────────────────────

  if (loadingJobs || loadingApps || loadingInterviews) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading recruitment data...</span>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 font-sans">
      {/* Page header */}
      <div className="mb-1">
        <h1 className="text-[18px] font-black text-slate-900 tracking-tight">Interviews and Schedules</h1>
        <p className="text-[12px] text-slate-400 font-semibold mt-0.5">Track candidates through the hiring pipeline</p>
      </div>

      {ongoingData.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center">
          <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No active job postings with applicants</p>
        </div>
      )}

      {/* Job cards */}
      {ongoingData.map((job: any) => {
        const isExpanded = expandedJobId === job.id;
        const currentTab: SubTab = activeSubTab[job.id] || 'interview';

        const tabApps =
          currentTab === 'interview'   ? job.interviewApps   :
          currentTab === 'shortlisted' ? job.shortlistedApps :
          job.waitlistedApps;

        const dept = job.metadata?.department || job.department || '';

        return (
          <div key={job.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

            {/* ── Card header ── */}
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
              onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-[15px] font-black text-slate-900 tracking-tight">{job.title}</h3>
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-md uppercase tracking-wide">
                    Active Job
                  </span>
                </div>
                {dept && (
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{dept}</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {job.interviewedCount > 0 && (
                  <span className="px-3 py-1 bg-[#fef9c3] border border-[#fef08a] text-[#a16207] text-[11px] font-black rounded-full">
                    {job.interviewedCount} Interviewed
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] font-black text-slate-500 hover:text-slate-800 transition-colors">
                  {isExpanded
                    ? <><ChevronUp className="w-4 h-4" /> Less</>
                    : <><ChevronDown className="w-4 h-4" /> More</>}
                </span>
                {/* Close job button */}
                <button
                  onClick={(e) => handleCloseJob(e, job.id, job.title)}
                  disabled={closingJobId === job.id}
                  title="Close job posting"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-50"
                >
                  {closingJobId === job.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <X className="w-4 h-4" />
                  }
                </button>
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
                  <div className="border-t border-slate-100 px-6 pb-6 pt-5 space-y-5">

                    {/* ── Sub-tabs ── */}
                    <div className="grid grid-cols-3 gap-0 border border-slate-200 rounded-xl overflow-hidden">
                      {([
                        { key: 'interview'   as SubTab, label: 'On Interview',  count: job.interviewApps.length   },
                        { key: 'shortlisted' as SubTab, label: 'Shortlisted',   count: job.shortlistedApps.length },
                        { key: 'waitlisted'  as SubTab, label: 'Waitlisted',    count: job.waitlistedApps.length  },
                      ]).map(({ key, label, count }, i) => {
                        const active = currentTab === key;
                        return (
                          <button
                            key={key}
                            onClick={e => { e.stopPropagation(); setActiveSubTab(p => ({ ...p, [job.id]: key })); }}
                            className={`py-2.5 text-[12px] font-black transition-colors
                              ${i > 0 ? 'border-l border-slate-200' : ''}
                              ${active
                                ? 'bg-white text-slate-900'
                                : 'bg-slate-50 text-slate-400 hover:text-slate-700'
                              }`}
                          >
                            {label} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Top Match card ── */}
                    {job.topMatch && (
                      <TopMatchCard app={job.topMatch} onClick={() => openCandidateDetail(job.topMatch, job)} />
                    )}

                    {/* ── Interview tab: table ── */}
                    {currentTab === 'interview' && (
                      <div className="space-y-2">
                        {/* section label */}
                        <div className="flex items-center gap-2 py-1">
                          <span className="w-6 h-6 rounded-full bg-[#fef9c3] border border-[#fef08a] flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-[#a16207]" />
                          </span>
                          <span className="text-[13px] font-black text-slate-800">Interviews</span>
                        </div>

                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                          {/* header */}
                          <div className="grid grid-cols-5 px-5 py-2.5 bg-slate-50 border-b border-slate-100">
                            {['Name of Applicant', 'Interview Schedule', 'Date Applied', 'Rating', 'Action'].map(h => (
                              <span key={h} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{h}</span>
                            ))}
                          </div>

                          {tabApps.length === 0 ? (
                            <div className="px-5 py-10 text-center text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                              No applicants in this stage
                            </div>
                          ) : (
                            tabApps.map((app: any, idx: number) => {
                              const interview = interviewByAppId[app.id] || null;
                              const name = app.fullName || 'Anonymous';
                              return (
                                <div
                                  key={app.id || idx}
                                  className={`grid grid-cols-5 items-center px-5 py-4 transition-colors border-b border-slate-50 last:border-0
                                    ${idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                                >
                                  <div
                                    onClick={() => openCandidateDetail(app, job)}
                                    className="cursor-pointer hover:text-blue-600 transition-colors"
                                  >
                                    <p className="text-[13px] font-black text-slate-900">{name}</p>
                                    <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                      {app.phone || app.metadata?.phone || app.email || '—'}
                                    </p>
                                  </div>
                                  <div>
                                    <InterviewScheduleCell interview={interview} />
                                  </div>
                                  <div>
                                    <p className="text-[12px] font-bold text-slate-700">{fmtDate(app.createdAt) || '—'}</p>
                                  </div>
                                  <div>
                                    <RatingBadge score={app.avgSkillRating} />
                                  </div>
                                  <div>
                                    {interview?.status === 'completed' && (
                                      sentOfferEmails.has((app.email || '').toLowerCase()) ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-[10px] font-black text-emerald-700 rounded-lg">
                                          <CheckCircle className="w-3 h-3" /> Offer Sent
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleSendOffer(app, job)}
                                          className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-black text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                          <Send className="w-3 h-3" /> Send Offer
                                        </button>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Shortlisted tab: grid cards ── */}
                    {currentTab === 'shortlisted' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 py-1">
                          <span className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                          </span>
                          <span className="text-[13px] font-black text-slate-800">Shortlist</span>
                        </div>

                        {tabApps.length === 0 ? (
                          <div className="rounded-xl border border-slate-100 px-5 py-10 text-center text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                            No shortlisted candidates
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {tabApps.map((app: any) => (
                              <CandidateGridCard
                                key={app.id}
                                app={app}
                                onClick={() => openCandidateDetail(app, job)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Waitlisted tab: grid cards ── */}
                    {currentTab === 'waitlisted' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 py-1">
                          <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 text-white" />
                          </span>
                          <span className="text-[13px] font-black text-slate-800">Waitlist</span>
                        </div>

                        {tabApps.length === 0 ? (
                          <div className="rounded-xl border border-slate-100 px-5 py-10 text-center text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                            No waitlisted candidates
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {tabApps.map((app: any) => (
                              <CandidateGridCard
                                key={app.id}
                                app={app}
                                onClick={() => openCandidateDetail(app, job)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* ── Modals ── */}
      <CandidateDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        candidate={selectedCandidate}
        jobTitle={selectedJob?.title || ''}
        onScheduleInterview={handleOpenScheduler}
        onShortlist={handleShortlist}
        onReject={handleReject}
      />

      <ScheduleInterviewModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onBackToApplication={() => { setShowScheduleModal(false); setShowDetailModal(true); }}
        candidateName={selectedCandidate?.fullName || selectedCandidate?.metadata?.fullName || ''}
        jobTitle={selectedJob?.title || ''}
        jobApplicationId={selectedCandidate?.id || ''}
        onSchedule={handleScheduleInterview}
        isLoading={scheduleMutation.isPending}
      />

      <OfferLetterModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        candidateName={selectedCandidate?.fullName || selectedCandidate?.metadata?.fullName || ''}
        positionTitle={selectedJob?.title || ''}
        showAlert={showAlert}
      />

      {/* ── Send Offer modal (OfferLetterCreateModal) ── */}
      {showOfferCreateModal && selectedCandidate && selectedJob && (
        <OfferLetterCreateModal
          isOpen={showOfferCreateModal}
          onClose={() => { setShowOfferCreateModal(false); setSelectedCandidate(null); setSelectedJob(null); }}
          showAlert={showAlert}
          initialData={{
            candidateName:  selectedCandidate.fullName || selectedCandidate.metadata?.fullName || '',
            candidateEmail: selectedCandidate.email,
            candidatePhone: selectedCandidate.phone || selectedCandidate.metadata?.phone,
            // Pre-fill from job opening metadata where available
            departmentId:   '', // let HR pick from dropdown
            positionId:     '', // let HR pick from dropdown
            roleId:         '', // let HR pick from dropdown
            // Pass the job title so {{positionTitle}} / {{positionName}} resolves in preview
            positionName:   selectedJob.title || '',
            positionTitle:  selectedJob.title || '',
            departmentName: selectedJob.metadata?.department || selectedJob.department || '',
            salary:         selectedCandidate.metadata?.expectedSalary || '',
            startDate:      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            employmentType: selectedJob.employmentType || 'Full-time',
            workLocation:   '',
            reportingManager: '',
          }}
          onSuccess={() => {
            setShowOfferCreateModal(false);
            setSelectedCandidate(null);
            setSelectedJob(null);
            showAlert('Offer letter sent successfully', 'success');
          }}
        />
      )}
    </div>
  );
}
