/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Check, 
  Clock, 
  Users, 
  UserCheck, 
  FileText, 
  Edit, 
  Printer, 
  Send, 
  X,
  Plus,
  Mail,
  DollarSign,
  Calendar,
  Briefcase
} from 'lucide-react';
import TopMatchCard from './TopMatchCard';
import OfferLetterModal from './OfferLetterModal';

interface RecrutimentOngoingProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

interface OngoingJob {
  id: string;
  title: string;
  department: string;
  isExpanded: boolean;
  activeSubTab: 'interview' | 'shortlisted' | 'waitlisted';
  interviewCount: number;
  shortlistedCount: number;
  waitlistedCount: number;
}

export default function RecruitmentOngoingRecruitment({ onDraftAiSuggestion, showAlert }: RecrutimentOngoingProps) {
  // Jobs under ongoing recruitment process
  const [jobs, setJobs] = useState<OngoingJob[]>([
    {
      id: 'ong-1',
      title: 'Senior Backend Engineer',
      department: 'TECHNICAL DEPT.',
      isExpanded: true,
      activeSubTab: 'interview',
      interviewCount: 2,
      shortlistedCount: 40,
      waitlistedCount: 20
    },
    {
      id: 'ong-2',
      title: 'Product Lead / Manager',
      department: 'TECHNICAL DEPT.',
      isExpanded: false,
      activeSubTab: 'interview',
      interviewCount: 5,
      shortlistedCount: 12,
      waitlistedCount: 8
    },
    {
      id: 'ong-3',
      title: 'UI/UX Visual Designer',
      department: 'CREATIVE DEPT.',
      isExpanded: false,
      activeSubTab: 'interview',
      interviewCount: 3,
      shortlistedCount: 15,
      waitlistedCount: 10
    }
  ]);

  // Form states for Generate Offer using the modular OfferLetterModal
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [selectedCandidate, setSelectedCandidate] = useState({ name: '', role: '' });

  // Toggling job card accordions
  const handleToggleJob = (id: string) => {
    setJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, isExpanded: !j.isExpanded } : j))
    );
  };

  // Changing internal tabs
  const handleSetSubTab = (jobId: string, subTab: 'interview' | 'shortlisted' | 'waitlisted') => {
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, activeSubTab: subTab } : j))
    );
  };

  // Click on any candidate to trigger offer letter generation modal
  const handleOpenDraftOffer = (candidateName: string, position: string) => {
    setSelectedCandidate({ name: candidateName, role: position });
    setShowOfferModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Upper Descriptive Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-3xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 font-sans">Interviews and Schedules</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Track candidates and handle custom offers through the pipeline</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onDraftAiSuggestion(`Suggest key interview scoring matrices for ongoing recruitment of senior tech roles.`);
              showAlert(`Requested AI Insight for Interviewing`, 'info');
            }}
            className="px-4.5 py-2.5 bg-[#eff6ff] hover:bg-blue-100 text-[#1a56db] rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-blue-200/50"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[#1a56db]" />
            <span>AI Evaluation Matrix</span>
          </button>
        </div>
      </div>

      {/* Main Accordions Area */}
      <div className="space-y-4">
        {jobs.map((job) => {
          return (
            <div 
              key={job.id} 
              className={`bg-white border transition-all rounded-3xl shadow-3xs overflow-hidden ${
                job.isExpanded ? 'border-blue-200 ring-4 ring-[#1a56db]/5' : 'border-slate-100'
              }`}
            >
              {/* Accordion Trigger Header */}
              <div 
                onClick={() => handleToggleJob(job.id)}
                className="p-5.5 flex items-center justify-between gap-4 cursor-pointer select-none border-b border-transparent hover:bg-slate-50/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-[14.5px] font-extrabold text-slate-800 leading-tight">{job.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-100/60 text-[#1a56db] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border border-blue-200/40">
                      Active Job
                    </span>
                    <span className="bg-[#fef9c3] text-[#a16207] border border-[#fef08a] px-2.5 py-0.5 rounded-full text-[10px] font-black">
                      {job.id === 'ong-1' ? '2' : job.id === 'ong-2' ? '5' : '3'} Interviewed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10.5px] font-extrabold text-slate-400 flex items-center gap-1">
                    {job.isExpanded ? (
                      <>
                        <span>Less</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>More</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Collapsible Content Area */}
              <AnimatePresence initial={false}>
                {job.isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-white"
                  >
                    <div className="border-t border-slate-100 p-5.5 space-y-6">
                      
                      {/* Top labels and dynamic action subtabs */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100/60 pb-5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg">
                          {job.department}
                        </span>

                        {/* Internal Pipeline Switching Subtabs */}
                        <div className="flex gap-1.5 bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
                          <button
                            onClick={() => handleSetSubTab(job.id, 'interview')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              job.activeSubTab === 'interview'
                                ? 'bg-white text-slate-850 shadow-3xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Interview ({job.interviewCount})
                          </button>
                          <button
                            onClick={() => handleSetSubTab(job.id, 'shortlisted')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              job.activeSubTab === 'shortlisted'
                                ? 'bg-white text-slate-850 shadow-3xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Shortlisted ({job.shortlistedCount})
                          </button>
                          <button
                            onClick={() => handleSetSubTab(job.id, 'waitlisted')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              job.activeSubTab === 'waitlisted'
                                ? 'bg-white text-slate-850 shadow-3xs border border-slate-200'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Waitlisted ({job.waitlistedCount})
                          </button>
                        </div>
                      </div>

                      {/* Render based on sub tab selection */}
                      {job.activeSubTab === 'interview' && (
                        <div className="animate-fade-in space-y-5">
                          {/* Top Match Card identical to Active Post but with different role parameters */}
                          <TopMatchCard className="max-w-2xl" />

                          {/* Section Header */}
                          <div className="flex items-center gap-2 select-none border-b border-slate-100 pb-2">
                            <div className="w-8 h-8 rounded-full bg-amber-150 flex items-center justify-center text-amber-700">
                              <Clock className="w-4 h-4 fill-amber-100" />
                            </div>
                            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">Interviews</h4>
                          </div>

                          {/* Candidate pipeline list */}
                          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-3xs">
                            {/* Table Headers */}
                            <div className="grid grid-cols-12 gap-2 bg-slate-50/80 p-4 text-[10.5px] font-extrabold text-[#1a56db] uppercase tracking-wider font-sans border-b border-slate-100 select-none">
                              <span className="col-span-4">Name of Applicant</span>
                              <span className="col-span-3">Interview Schedule</span>
                              <span className="col-span-3">Date Applied</span>
                              <span className="col-span-2 text-right">Rating</span>
                            </div>

                            {/* Table Rows mirroring Image 2 */}
                            <div className="divide-y divide-slate-100 recruitment-candidate-list">
                              {[
                                { name: 'Alex Johnson', phone: '+251 967 97 3799', isBadge: true, schedule: 'Interviewed', dateApplied: 'Feb 24, 2025', rating: 90 },
                                { name: 'Alex Johnson', phone: '+251 967 97 3799', isBadge: true, schedule: 'Interviewed', dateApplied: 'Feb 24, 2025', rating: 90 },
                                { name: 'Alex Johnson', phone: '+251 967 97 3799', isBadge: false, date: 'Feb 24, 2025', time: '10:00 AM', dateApplied: 'Feb 24, 2025', rating: 90 },
                                { name: 'Alex Johnson', phone: '+251 967 97 3799', isBadge: false, date: 'Feb 24, 2025', time: '10:00 AM', dateApplied: 'Feb 24, 2025', rating: 90 }
                              ].map((candidate, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => handleOpenDraftOffer(candidate.name, job.title)}
                                  className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-slate-50/70 transition-all cursor-pointer"
                                  title="Click to generate offer letter"
                                >
                                  {/* Avatar name profile */}
                                  <div className="col-span-4 flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[11px] border border-slate-200/50">
                                      AJ
                                    </div>
                                    <div>
                                      <h6 className="font-extrabold text-slate-800 leading-tight">{candidate.name}</h6>
                                      <p className="text-[10px] text-slate-400 font-medium leading-none mt-1 font-sans">{candidate.phone}</p>
                                    </div>
                                  </div>

                                  {/* Schedule State column */}
                                  <div className="col-span-3">
                                    {candidate.isBadge ? (
                                      <span className="bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-xl text-[10.5px] font-extrabold">
                                        {candidate.schedule}
                                      </span>
                                    ) : (
                                      <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-slate-700">{candidate.date}</p>
                                        <p className="text-[10px] text-slate-400 font-bold font-sans">{candidate.time}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Date applied */}
                                  <div className="col-span-3 text-slate-500 font-semibold font-sans text-xs">
                                    {candidate.dateApplied}
                                  </div>

                                  {/* Sparkle Match score */}
                                  <div className="col-span-2 text-right">
                                    <div className="inline-flex items-center gap-1 bg-blue-50/40 hover:bg-blue-50 border border-blue-200/80 text-blue-600 px-3 py-1.5 rounded-xl font-black text-[11px] transition-all shadow-3xs cursor-pointer">
                                      <span>✨</span>
                                      <span>{candidate.rating}%</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Shortlisted views mirroring Image 3 */}
                      {job.activeSubTab === 'shortlisted' && (
                        <div className="animate-fade-in space-y-5">
                          {/* Heading Banner */}
                          <div className="flex items-center gap-2 select-none border-b border-slate-100 pb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                              <Users className="w-4 h-4" />
                            </div>
                            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">Shortlist</h4>
                          </div>

                          {/* Sarah Williams bento double grid cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 8 }).map((_, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleOpenDraftOffer('Sarah Williams', job.title)}
                                className="border border-slate-100 hover:border-blue-300 hover:shadow-2xs p-4 rounded-2xl bg-white space-y-3.5 transition-all cursor-pointer group hover:bg-blue-50/5 relative"
                                title="Click to generate offer letter"
                              >
                                {/* Sparkle Badge at top-right */}
                                <div className="absolute top-4 right-4 bg-blue-50/70 border border-blue-200/80 text-blue-600 px-2 py-1 rounded-xl font-extrabold flex items-center gap-1 text-[10px]">
                                  <span>✨</span>
                                  <span>90%</span>
                                </div>

                                <div className="space-y-1">
                                  <h5 className="font-extrabold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                                    Sarah Williams
                                  </h5>
                                  <p className="text-[10px] text-slate-400 font-medium font-sans leading-none">
                                    +251 930 73 9847
                                  </p>
                                </div>

                                <div className="border-t border-slate-50 pt-3 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-450 font-semibold font-sans">
                                    Dec 15, 2025
                                  </span>
                                  <span className="text-[9.5px] font-black uppercase text-[#1a56db] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    <span>Offer</span>
                                    <span>&rarr;</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Waitlisted pipeline sub view */}
                      {job.activeSubTab === 'waitlisted' && (
                        <div className="animate-fade-in space-y-5">
                          {/* Heading Banner */}
                          <div className="flex items-center gap-2 select-none border-b border-slate-100 pb-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200/50">
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-wider">Waitlisted Candidates</h4>
                          </div>

                          {/* Waitlisted grid list */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { name: 'Michael Chang', phone: '+251 988 12 7392', skill: 'Express & Node.js specialist', matchScore: 84 },
                              { name: 'Evelyn Rodriguez', phone: '+251 922 45 8122', skill: 'React Expert', matchScore: 81 },
                              { name: 'Benjamin Lawson', phone: '+251 901 33 2818', skill: 'DB Architect & SQL expert', matchScore: 80 }
                            ].map((cand, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleOpenDraftOffer(cand.name, job.title)}
                                className="border border-slate-100 hover:border-slate-300 p-4 rounded-2xl bg-white flex items-center justify-between gap-4 transition-all cursor-pointer"
                                title="Click to generate offer letter"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs">
                                    {cand.name.split(' ').map(n=>n[0]).join('')}
                                  </div>
                                  <div>
                                    <h5 className="font-extrabold text-slate-800 leading-tight">{cand.name}</h5>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{cand.skill} &bull; {cand.phone}</p>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold bg-slate-50 border border-slate-200/50 px-2 py-1 rounded-xl text-slate-500 font-mono">
                                    {cand.matchScore}%
                                  </span>
                                  <button
                                    className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 group-hover:text-blue-500 transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
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

      {/* --- MODULAR GENERATE & PREVIEW OFFER LETTER MODAL --- */}
      <OfferLetterModal
        isOpen={showOfferModal}
        onClose={() => setShowOfferModal(false)}
        candidateName={selectedCandidate.name}
        positionTitle={selectedCandidate.role}
        showAlert={showAlert}
      />
    </div>
  );
}
