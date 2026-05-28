/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Users, 
  Clock, 
  Loader2,
  TrendingUp
} from 'lucide-react';
import OfferLetterModal from './OfferLetterModal';
import CandidateDetailModal from './CandidateDetailModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import { useJobApplications, useJobRequests, useScheduleInterview, useAdvanceCandidate } from '../../hooks/useJobRequests';

interface RecrutimentOngoingProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function RecruitmentOngoingRecruitment({ onDraftAiSuggestion, showAlert }: RecrutimentOngoingProps) {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests({ includePublished: true });
  const { data: applications, isLoading: loadingApps } = useJobApplications();
  const scheduleMutation = useScheduleInterview();
  const advanceMutation = useAdvanceCandidate();

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, 'interview' | 'shortlisted' | 'waitlisted'>>({});

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const ongoingData = useMemo(() => {
    if (!jobRequests?.rows || !applications) return [];

    return jobRequests.rows.map(job => {
        const jobApps = applications.filter(app => app.jobOpeningId === job.id);
        const topMatch = jobApps.length > 0 ? [...jobApps].sort((a,b) => (b.score || 0) - (a.score || 0))[0] : null;

        return {
            ...job,
            apps: jobApps,
            topMatch,
            interviewCount: jobApps.filter(a => !a.stage || a.stage === 'interview' || a.stage === 'applied').length,
            shortlistedCount: jobApps.filter(a => a.stage === 'shortlisted').length,
            waitlistedCount: jobApps.filter(a => a.stage === 'waitlisted').length,
        };
    }).filter(j => j.apps.length > 0); 
  }, [jobRequests, applications]);

  const openCandidateDetail = (candidate: any, job: any) => {
    setSelectedCandidate(candidate);
    setSelectedJob(job);
    setShowDetailModal(true);
    setShowScheduleModal(false);
  };

  const handleOpenScheduler = () => {
    // Force immediate transition
    setShowDetailModal(false);
    // Use a tiny timeout to ensure the detail modal is considered "closing" before the scheduler opens
    setTimeout(() => {
        setShowScheduleModal(true);
    }, 50);
  };

  const handleShortlist = () => {
    if (!selectedCandidate) return;
    advanceMutation.mutate({ id: selectedCandidate.id, stage: 'shortlisted' }, {
      onSuccess: () => {
        setShowDetailModal(false);
        showAlert(`${selectedCandidate.fullName || 'Candidate'} shortlisted successfully`, 'success');
      },
      onError: (e: any) => showAlert(`Failed: ${e.message}`, 'error')
    });
  };

  const handleReject = () => {
    if (!selectedCandidate) return;
    advanceMutation.mutate({ id: selectedCandidate.id, stage: 'rejected' }, {
      onSuccess: () => {
        setShowDetailModal(false);
        showAlert(`${selectedCandidate.fullName || 'Candidate'} rejected`, 'error');
      },
      onError: (e: any) => showAlert(`Failed: ${e.message}`, 'error')
    });
  };

  const handleScheduleInterview = (data: any) => {
    scheduleMutation.mutate(data, {
      onSuccess: () => {
        setShowScheduleModal(false);
        showAlert(`Interview scheduled successfully`, 'success');
      },
      onError: (e: any) => showAlert(`Failed: ${e.message}`, 'error')
    });
  };

  if (loadingJobs || loadingApps) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse font-sans">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center text-slate-500">Recruitment dashboard loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-3xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Interviews and Schedules</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Track candidates and coordinate the recruitment pipeline</p>
        </div>
        <button
          onClick={() => { onDraftAiSuggestion('Suggest evaluation matrix.'); showAlert('Fetching AI Insights', 'info'); }}
          className="px-4.5 py-2.5 bg-[#eff6ff] text-[#1a56db] rounded-2xl text-xs font-black flex items-center gap-1.5 border border-blue-200/50 hover:bg-blue-100 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 fill-[#1a56db]" />
          <span>AI Insight Matrix</span>
        </button>
      </div>

      {/* Ongoing Jobs List */}
      <div className="space-y-4">
        {ongoingData.map((job) => {
          const currentTab = activeSubTab[job.id] || 'interview';
          const isExpanded = expandedJobId === job.id;
          const topMatch = job.topMatch;

          return (
            <div 
              key={job.id} 
              className={`bg-white border transition-all rounded-3xl shadow-3xs overflow-hidden ${
                isExpanded ? 'border-blue-200 ring-4 ring-blue-50' : 'border-slate-100'
              }`}
            >
              <div 
                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                className="p-5.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-[14.5px] font-extrabold text-slate-800 tracking-tight leading-none">{job.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100/60 text-[#1a56db] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border border-blue-200/40">Active</span>
                    <span className="bg-[#fef9c3] text-[#a16207] border border-[#fef08a] px-2.5 py-0.5 rounded-full text-[10px] font-black">
                      {job.apps.length} Applicants
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest">
                  {isExpanded ? 'Collapse' : 'Expand'}
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-50 p-5.5 space-y-6">
                      {/* Sub-Tabs */}
                      <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-lg">{job.department}</span>
                        <div className="flex gap-1.5 p-1 bg-slate-100/50 rounded-2xl border border-slate-100">
                          {(['interview', 'shortlisted', 'waitlisted'] as const).map(tabKey => (
                            <button
                              key={tabKey}
                              onClick={(e) => { e.stopPropagation(); setActiveSubTab(prev => ({ ...prev, [job.id]: tabKey })); }}
                              className={`px-4.5 py-1.5 rounded-xl text-xs font-black transition-all capitalize ${
                                currentTab === tabKey 
                                  ? 'bg-white text-blue-600 shadow-3xs border border-slate-200' 
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {tabKey} ({tabKey === 'interview' ? job.interviewCount : tabKey === 'shortlisted' ? job.shortlistedCount : job.waitlistedCount})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Top Match Card */}
                      {topMatch && (
                        <div 
                          onClick={() => openCandidateDetail(topMatch, job)}
                          className="max-w-xl bg-white border border-blue-200/60 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group cursor-pointer hover:shadow-blue-500/10 transition-all border-l-4 border-l-blue-600"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-[100px] -z-10" />
                          <div className="flex justify-between items-start mb-6">
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-2 border border-blue-100">
                              <TrendingUp className="w-3.5 h-3.5" /> AI Match
                            </span>
                            <div className="bg-[#fefce8] text-[#a16207] text-[11px] font-black px-3 py-1 rounded-full border border-[#fef08a] flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 fill-[#a16207]" /> {topMatch.score || 95}% Match
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{topMatch.fullName || 'Anonymous'}</h4>
                              <p className="text-xs text-slate-450 font-bold mt-1">{topMatch.email || topMatch.metadata?.email}</p>
                            </div>
                            <div className="flex flex-col justify-center">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Expected Salary</p>
                              <p className="text-sm font-black text-slate-800">{topMatch.metadata?.salaryExpectation || 'N/A'} ETB</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Candidate Grid/Table Simplified */}
                      <div className="border border-slate-100 rounded-[28px] overflow-hidden bg-white shadow-3xs">
                        {job.apps.filter(a => {
                          if (currentTab === 'interview') return !a.stage || a.stage === 'interview' || a.stage === 'applied';
                          return a.stage === currentTab;
                        }).map((app, idx) => {
                          const appName = app.fullName || app.metadata?.fullName || 'Anonymous';
                          return (
                            <div 
                              key={idx} 
                              onClick={() => openCandidateDetail(app, job)}
                              className="flex items-center justify-between p-4 hover:bg-slate-50/70 border-b border-slate-50 last:border-0 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-[11px] border border-slate-200/50 uppercase">{appName[0]}</div>
                                <div>
                                  <h6 className="font-black text-slate-800 text-[13px]">{appName}</h6>
                                  <p className="text-[10px] text-slate-450 font-bold">{app.email || app.metadata?.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 opacity-0 group-hover:opacity-100 transition-all">View Profile</span>
                                <span className="text-[11px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">{app.score || 92}% Rating</span>
                              </div>
                            </div>
                          );
                        })}
                        {job.apps.filter(a => {
                          if (currentTab === 'interview') return !a.stage || a.stage === 'interview' || a.stage === 'applied';
                          return a.stage === currentTab;
                        }).length === 0 && (
                          <div className="p-12 text-center text-slate-400 text-xs font-black uppercase tracking-widest">No candidates in this stage</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Modals rendered flatly with clear boolean flags */}
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
      />
      
      <OfferLetterModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        candidateName={selectedCandidate?.fullName || selectedCandidate?.metadata?.fullName || ''}
        positionTitle={selectedJob?.title || ''}
        showAlert={showAlert}
      />
    </div>
  );
}
