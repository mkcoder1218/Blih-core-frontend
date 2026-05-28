/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Check, 
  Clock,
  Briefcase,
  Users,
  Loader2,
  TrendingUp,
  MapPin,
  Calendar
} from 'lucide-react';
import { useJobApplications, useJobRequests, useScheduleInterview, useAdvanceCandidate } from '../../hooks/useJobRequests';
import CandidateDetailModal from './CandidateDetailModal';
import ScheduleInterviewModal from './ScheduleInterviewModal';

interface RecruitmentActivePostingProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function RecruitmentActivePosting({ onDraftAiSuggestion, showAlert }: RecruitmentActivePostingProps) {
  const { data: jobRequests, isLoading: loadingJobs } = useJobRequests({ includePublished: true });
  const { data: applications, isLoading: loadingApps } = useJobApplications();
  const scheduleMutation = useScheduleInterview();
  const advanceMutation = useAdvanceCandidate();

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, 'detail' | 'applicants' | 'analytics'>>({});

  // Modals
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const activeJobs = useMemo(() => {
    if (!jobRequests?.rows) return [];
    return jobRequests.rows.filter(j => j.isPosted).map(job => {
        const jobApps = applications?.filter(app => app.jobOpeningId === job.id) || [];
        return {
            ...job,
            applicantsCount: jobApps.length,
            apps: jobApps,
            viewsCount: Math.floor(Math.random() * 2000) + 500 // Mock views for now
        };
    });
  }, [jobRequests, applications]);

  const handleToggleJob = (id: string) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const handleOpenScheduler = () => {
    setShowDetailModal(false);
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
        showAlert(`Interview invitation sent to ${selectedCandidate?.fullName}`, 'info');
      },
      onError: (e: any) => showAlert(`Failed to schedule: ${e.message}`, 'error')
    });
  };

  const handleSetSubTab = (jobId: string, subTab: 'detail' | 'applicants' | 'analytics') => {
    setActiveSubTab(prev => ({ ...prev, [jobId]: subTab }));
  };

  if (loadingJobs || loadingApps) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse font-sans">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">Syncing published vacancies...</span>
        </div>
    );
  }

  if (activeJobs.length === 0) {
    return (
        <div className="bg-white border border-slate-100 rounded-[32px] p-16 text-center space-y-6 shadow-3xs font-sans">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                <Briefcase className="w-10 h-10" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">No active postings</h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                    Once you publish a job request, it will appear here as an active posting on your careers portal.
                </p>
            </div>
        </div>
    );
  }

  return (
    <div id="active-posting-view-main" className="space-y-6 font-sans">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">Active Jobs</h3>
        <p className="text-[11px] text-slate-400 font-medium">View and manage active job posts</p>
      </div>

      <div className="space-y-4">
        {activeJobs.map((job) => {
          const isExpanded = expandedJobId === job.id;
          const currentTab = activeSubTab[job.id] || 'detail';

          return (
            <div 
              key={job.id} 
              className={`bg-white rounded-3xl border transition-all duration-250 overflow-hidden ${
                isExpanded 
                  ? 'border-blue-200 ring-4 ring-blue-50/40 shadow-sm' 
                  : 'border-slate-100/90 hover:border-slate-200 shadow-xs'
              }`}
            >
              <div 
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none ${
                  isExpanded ? 'bg-slate-50/40 border-b border-slate-100/70' : ''
                }`}
                onClick={() => handleToggleJob(job.id)}
              >
                <div className="flex flex-col space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[14px] font-black text-slate-800 tracking-tight">{job.title}</h4>
                    <span className="text-[10px] text-white bg-blue-600 font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        Active Post
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                    <span className="text-[#1a56db] font-bold tracking-tight bg-blue-50/70 px-2 py-0.5 rounded text-[10px]">
                      {job.department}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span>{job.type}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span>{job.positions} Position</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-center">
                    <span className="block text-[11px] font-bold text-slate-700 leading-none">
                      {job.applicantsCount} applicants
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-xl text-center">
                    <span className="block text-[11px] font-bold text-slate-700 leading-none">
                      {job.viewsCount} views
                    </span>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden bg-white"
                  >
                    <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50/70 border-b border-slate-100 rounded-t-3xl font-sans">
                      <button
                        onClick={() => handleSetSubTab(job.id, 'detail')}
                        className={`py-3.5 text-xs font-bold transition-all text-center rounded-2xl cursor-pointer ${
                          currentTab === 'detail' ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs' : 'bg-slate-100/50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        Job Detail
                      </button>
                      <button
                        onClick={() => handleSetSubTab(job.id, 'applicants')}
                        className={`py-3.5 text-xs font-bold transition-all text-center rounded-2xl cursor-pointer ${
                          currentTab === 'applicants' ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs' : 'bg-slate-100/50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        Applicants ({job.applicantsCount})
                      </button>
                      <button
                        onClick={() => handleSetSubTab(job.id, 'analytics')}
                        className={`py-3.5 text-xs font-bold transition-all text-center rounded-2xl cursor-pointer ${
                          currentTab === 'analytics' ? 'bg-white text-slate-900 border border-slate-200/90 shadow-2xs' : 'bg-slate-100/50 hover:bg-[#e2e8f0] text-slate-600'
                        }`}
                      >
                        Analytics
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {currentTab === 'detail' && (
                        <div className="space-y-6 animate-fade-in font-sans">
                          {/* Job Request Details Grid */}
                          <div className="bg-[#f8fafc] rounded-2xl border border-slate-100 p-5">
                            <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight mb-4">Role Specification</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Priority</span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold uppercase tracking-wider px-2 py-0.5 border border-blue-100 rounded">
                                  {job.priority}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Due Date</span>
                                <span className="text-xs text-slate-700 font-bold font-sans">{job.dueDate}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Expected Date</span>
                                <span className="text-xs text-slate-700 font-bold font-sans">{job.expectedDate}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Date Published</span>
                                <span className="text-xs text-slate-700 font-bold font-sans">{job.requestedDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-2">Job Overview</h5>
                                <p className="leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 font-medium">{job.overview}</p>
                              </div>
                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-2">Requirements</h5>
                                <ul className="space-y-1.5 pl-1.5">
                                  {job.requirements?.map((req: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                      <span className="leading-relaxed font-medium">{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-2">Qualifications</h5>
                                <ul className="space-y-1.5 pl-1.5">
                                  {job.qualifications?.map((qual: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                      <span className="leading-relaxed font-medium">{qual}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-extrabold text-slate-900 uppercase text-[10.5px] tracking-wider mb-1">Business Justification</h5>
                                <p className="leading-relaxed text-slate-500 italic bg-slate-50/30 p-2.5 rounded-lg border border-slate-100/30 font-medium">{job.importance}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentTab === 'applicants' && (
                        <div className="animate-fade-in space-y-4 font-sans">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 shadow-3xs">
                             <div className="flex items-center gap-3">
                               <Check className="w-4 h-4 text-blue-600" />
                               <span className="text-xs font-bold text-slate-700">All Applicants Syncing...</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <button className="px-4 py-2 bg-[#1a56db] text-white rounded-xl text-xs font-bold shadow-3xs">Bulk Actions</button>
                             </div>
                          </div>

                          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-3xs">
                            <div className="grid grid-cols-12 gap-2 bg-slate-50/80 p-4 text-[10.5px] font-extrabold text-[#1a56db] uppercase tracking-wider font-sans border-b border-slate-100 select-none">
                              <span className="col-span-1"></span>
                              <span className="col-span-4">Candidate</span>
                              <span className="col-span-3">Applied Date</span>
                              <span className="col-span-2 text-center">Score</span>
                              <span className="col-span-2 text-center">Actions</span>
                            </div>

                            <div className="divide-y divide-slate-100/70">
                              {job.apps.length > 0 ? job.apps.map((app, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => { setSelectedCandidate(app); setSelectedJob(job); setShowDetailModal(true); }}
                                  className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-slate-50/70 transition-all cursor-pointer font-sans"
                                >
                                  <div className="col-span-1 flex items-center justify-center">
                                    <div className="w-4 h-4 rounded border border-slate-300" />
                                  </div>
                                  <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[11px] border border-slate-200/50 uppercase">
                                      {(app.fullName || 'U')[0]}
                                    </div>
                                    <div>
                                      <h6 className="font-extrabold text-slate-800 leading-tight">{app.fullName || 'Anonymous'}</h6>
                                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{app.email}</p>
                                    </div>
                                  </div>
                                  <span className="col-span-3 text-slate-500 font-semibold">{new Date(app.createdAt).toLocaleDateString()}</span>
                                  <div className="col-span-2 text-center text-slate-600 font-extrabold font-mono">
                                    {app.score || 90}%
                                  </div>
                                  <div className="col-span-2 flex items-center justify-center">
                                    <button className="bg-blue-50/40 border border-blue-200/80 text-blue-600 px-3 py-1.5 rounded-xl font-black text-[11px]">✨ View</button>
                                  </div>
                                </div>
                              )) : (
                                <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No applicants yet</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {currentTab === 'analytics' && (
                        <div className="animate-fade-in p-12 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <h4 className="text-sm font-black text-slate-900 tracking-tight">Analytics Processing...</h4>
                            <p className="text-xs text-slate-500 font-medium mt-1">Real-time view tracking and application conversion rates will appear here soon.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

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
      />
    </div>
  );
}
