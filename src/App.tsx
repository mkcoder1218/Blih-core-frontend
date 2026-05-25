/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import RootDashboard from './components/dashboard/RootDashboard';
import RecruitmentOverview from './components/recruitment/RecruitmentOverview';
import RecruitmentRequests from './components/recruitment/RecruitmentRequests';
import RecruitmentReadyToPost from './components/recruitment/RecruitmentReadyToPost';
import RecruitmentClosedPosts from './components/recruitment/RecruitmentClosedPosts';
import RecruitmentApplicantForms from './components/recruitment/RecruitmentApplicantForms';
import RecruitmentOffers from './components/recruitment/RecruitmentOffers';
import RecruitmentActivePosting from './components/recruitment/RecruitmentActivePosting';
import RecruitmentOngoingRecruitment from './components/recruitment/RecruitmentOngoingRecruitment';
import OtherModulesView from './components/dashboard/OtherModulesView';
import PeopleProfilesView from './components/people/PeopleProfilesView';
import AttendanceView from './components/attendance/AttendanceView';
import CareerManagementView from './components/career/CareerManagementView';
import ExitOffboardingView from './components/offboarding/ExitOffboardingView';
import WorkforceFinanceView from './components/finance/WorkforceFinanceView';
import OnboardingView from './components/onboarding/OnboardingView';
import PerformanceView from './components/performance/PerformanceView';
import BusinessesView from './components/businesses/BusinessesView';
import AuthPage from './components/auth/AuthPage';
import { mockJobRequests, activeReadyToPostJob } from './mockData';
import { MainModule, RecruitmentTab, JobRequest } from './types';
import { X, Sparkles, Send, Loader2, CheckCircle, AlertCircle, PlusCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // User Authentication state
  const [activeUser, setActiveUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    try {
      const persisted = localStorage.getItem('blih_core_user');
      return persisted ? JSON.parse(persisted) : null;
    } catch {
      return null;
    }
  });

  // Navigation states
  const [currentModule, setCurrentModule] = useState<MainModule>('recruitment');
  const [currentRecruitmentTab, setCurrentRecruitmentTab] = useState<RecruitmentTab>('overview');
  const [currentProfilesTab, setCurrentProfilesTab] = useState<'overview' | 'create' | 'organogram' | 'directory' | 'events' | 'archive'>('overview');
  const [currentAttendanceTab, setCurrentAttendanceTab] = useState<'overview' | 'check-in' | 'requests' | 'timesheet' | 'leaves' | 'overtime' | 'memo-log' | 'work-from-home'>('overview');
  const [currentTalentTab, setCurrentTalentTab] = useState<'overview' | 'career' | 'training' | 'culture'>('overview');
  const [currentExitTab, setCurrentExitTab] = useState<'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms'>('overview');
  const [currentFinanceTab, setCurrentFinanceTab] = useState<'overview' | 'salary' | 'payroll' | 'budget' | 'expense' | 'benefits'>('overview');
  const [currentOnboardingTab, setCurrentOnboardingTab] = useState<'overview' | 'contract' | 'progress' | 'probation' | 'checklists'>('overview');
  const [currentPerformanceTab, setCurrentPerformanceTab] = useState<'overview' | 'performance_review' | 'okrs' | 'kpis' | 'discipline' | 'evaluation_form'>('overview');
  const [isDetailedView, setIsDetailedView] = useState<boolean>(true); // Start in detailed Recruitment tab to match Image 1/3/4

  // Jobs dynamic collection state
  const [jobs, setJobs] = useState<JobRequest[]>(mockJobRequests);

  // Ready to Post edit State
  const [editedReadyToPost, setEditedReadyToPost] = useState<JobRequest>(activeReadyToPostJob);

  // Modals / Overlays triggers
  const [aiPanel, setAiPanel] = useState<{
    isOpen: boolean;
    prompt: string;
    category: string;
    result: string;
    loading: boolean;
  }>({
    isOpen: false,
    prompt: '',
    category: '',
    result: '',
    loading: false,
  });

  const [newJobModal, setNewJobModal] = useState({
    isOpen: false,
    title: '',
    department: 'TECHNICAL DEPT.',
    type: 'Full-time' as any,
    positions: 1,
    priority: 'Medium' as any,
  });

  const [editJobModal, setEditJobModal] = useState<JobRequest | null>(null);

  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    type: 'success' | 'info' | 'error';
  }>({
    show: false,
    title: '',
    type: 'success',
  });

  // Success Celebration flag
  const [celebration, setCelebration] = useState<{
    show: boolean;
    jobTitle: string;
  }>({
    show: false,
    jobTitle: '',
  });

  // Helper to show momentary alerts
  const showAlert = (title: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ show: true, title, type });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  // --- ACTIONS HANDLERS ---
  const handleApproveJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: 'approved' } : j))
    );
    const approvedJob = jobs.find((j) => j.id === id);
    showAlert(`Approved ${approvedJob?.title || 'Job Requisition'} successfully!`, 'success');
  };

  // Triggering the server-side Gemini generation via /api/ai
  const handleTriggerAiGenerate = async (promptText: string, categoryText: string = 'general') => {
    setAiPanel({
      isOpen: true,
      prompt: promptText,
      category: categoryText,
      result: '',
      loading: true,
    });

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, category: categoryText }),
      });
      const data = await response.json();
      setAiPanel((prev) => ({
        ...prev,
        result: data.text || 'Error obtaining insights.',
        loading: false,
      }));
    } catch (err) {
      setAiPanel((prev) => ({
        ...prev,
        result: `Failed to connect to the assistant server. Pls check if server.ts is active.`,
        loading: false,
      }));
    }
  };

  const handleJustifyJob = (id: string) => {
    const job = jobs.find((j) => j.id === id);
    if (!job) return;
    const promptText = `Provide a strong corporate budget justification why the HR committee should approve hiring a ${job.positions} ${job.title} (${job.type}) under the ${job.department} department. Discuss strategic bottlenecks and return of investment.`;
    handleTriggerAiGenerate(promptText, 'recruitment');
  };

  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: JobRequest = {
      id: `req-${Date.now()}`,
      title: newJobModal.title || 'Untitled Consultant',
      department: newJobModal.department,
      type: newJobModal.type,
      positions: Number(newJobModal.positions) || 1,
      requestedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      priority: newJobModal.priority,
      status: 'pending',
    };

    setJobs((prev) => [newRequest, ...prev]);
    setNewJobModal((prev) => ({ ...prev, isOpen: false, title: '' }));
    showAlert(`Successfully requested position: ${newRequest.title}!`, 'success');
  };

  const handlePostSuccess = (jobTitle: string) => {
    setCelebration({ show: true, jobTitle });
    // Transfer from approved ready pile to simulation state or similar
    showAlert(`Published job posting for: ${jobTitle} live!`, 'success');
  };

  const handleEditJobSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJobModal) return;
    setEditedReadyToPost(editJobModal);
    setEditJobModal(null);
    showAlert('Updated job specifications successfully!', 'success');
  };

  const triggerGeneralAiHelp = (contextType: string) => {
    const promptText = `Formulate a comprehensive, highly detailed strategic alignment overview for a modern corporation operating an ERP, focus on the context of "${contextType}". Suggest guidelines to optimize HR, direct-deposit finance pipelines and presence compliance.`;
    handleTriggerAiGenerate(promptText, contextType);
  };

  if (!activeUser) {
    return (
      <AuthPage 
        onLoginSuccess={(u) => {
          setActiveUser(u);
          localStorage.setItem('blih_core_user', JSON.stringify(u));
        }}
      />
    );
  }

  return (
    <div id="app-window" className="flex h-screen w-screen bg-[#f8fafc] text-slate-800 overflow-hidden font-sans select-none antialiased">
      {/* Dynamic Sidebar Container */}
      <Sidebar
        user={activeUser}
        onLogout={() => {
          setActiveUser(null);
          localStorage.removeItem('blih_core_user');
        }}
        currentModule={currentModule}
        setCurrentModule={setCurrentModule}
        currentRecruitmentTab={currentRecruitmentTab}
        setCurrentRecruitmentTab={setCurrentRecruitmentTab}
        currentProfilesTab={currentProfilesTab}
        setCurrentProfilesTab={setCurrentProfilesTab}
        currentAttendanceTab={currentAttendanceTab}
        setCurrentAttendanceTab={setCurrentAttendanceTab}
        currentTalentTab={currentTalentTab}
        setCurrentTalentTab={setCurrentTalentTab}
        currentExitTab={currentExitTab}
        setCurrentExitTab={setCurrentExitTab}
        currentFinanceTab={currentFinanceTab}
        setCurrentFinanceTab={setCurrentFinanceTab}
        currentOnboardingTab={currentOnboardingTab}
        setCurrentOnboardingTab={setCurrentOnboardingTab}
        currentPerformanceTab={currentPerformanceTab}
        setCurrentPerformanceTab={setCurrentPerformanceTab}
        isDetailedView={isDetailedView}
        setIsDetailedView={setIsDetailedView}
      />

      {/* Main Work Space column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Modular Header */}
        <Header
          currentModule={currentModule}
          currentRecruitmentTab={currentRecruitmentTab}
          isDetailedView={isDetailedView}
          onOpenAiHelper={triggerGeneralAiHelp}
        />

        {/* Floating notifications */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-20 right-8 z-50 bg-slate-900 border border-slate-800 text-white shadow-xl px-4 py-3.5 rounded-xl flex items-center gap-3"
            >
              {notification.type === 'success' ? (
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-xs font-bold font-sans">{notification.title}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Context Canvas */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#fafbfc]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentModule}-${currentRecruitmentTab}-${isDetailedView}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {!isDetailedView ? (
                /* 1. Global High level ERP Dashboard (Image 2) */
                <RootDashboard
                  onNavigateToModule={(mod) => {
                    setCurrentModule(mod);
                    if (mod === 'recruitment' || mod === 'onboarding' || mod === 'profiles' || mod === 'attendance' || mod === 'talent' || mod === 'exit' || mod === 'finance' || mod === 'performance' || mod === 'businesses') {
                      setIsDetailedView(true);
                      if (mod === 'recruitment') setCurrentRecruitmentTab('overview');
                      if (mod === 'onboarding') setCurrentOnboardingTab('overview');
                      if (mod === 'profiles') setCurrentProfilesTab('overview');
                      if (mod === 'attendance') setCurrentAttendanceTab('overview');
                      if (mod === 'talent') setCurrentTalentTab('overview');
                      if (mod === 'exit') setCurrentExitTab('overview');
                      if (mod === 'finance') setCurrentFinanceTab('overview');
                      if (mod === 'performance') setCurrentPerformanceTab('overview');
                    } else {
                      setIsDetailedView(false);
                    }
                  }}
                />
              ) : currentModule === 'recruitment' ? (
                /* 2. Detailed Recruitment & Hiring Module subsections */
                currentRecruitmentTab === 'overview' ? (
                  <RecruitmentOverview onNavigateToTab={(tab) => setCurrentRecruitmentTab(tab as any)} />
                ) : currentRecruitmentTab === 'requests' ? (
                  <RecruitmentRequests
                    jobs={jobs}
                    onApproveJob={handleApproveJob}
                    onJustifyJob={handleJustifyJob}
                    onOpenNewJobModal={() =>
                      setNewJobModal((prev) => ({ ...prev, isOpen: true }))
                    }
                    onSuggestJustification={(title, dept) => {
                      const text = `Provide a professional justification to double headcount for a ${title} in the ${dept}.`;
                      handleTriggerAiGenerate(text, 'recruitment');
                    }}
                  />
                ) : currentRecruitmentTab === 'ready_to_post' ? (
                  <RecruitmentReadyToPost
                    onPostSuccess={handlePostSuccess}
                    onEditClick={(j) => setEditJobModal(j)}
                  />
                ) : currentRecruitmentTab === 'closed_posts' ? (
                  <RecruitmentClosedPosts
                    onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'recruitment')}
                    showAlert={showAlert}
                  />
                ) : currentRecruitmentTab === 'applicant_forms' ? (
                  <RecruitmentApplicantForms
                    onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'recruitment')}
                    showAlert={showAlert}
                  />
                ) : currentRecruitmentTab === 'offers' ? (
                  <RecruitmentOffers
                    onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'recruitment')}
                    showAlert={showAlert}
                  />
                ) : currentRecruitmentTab === 'active_posting' ? (
                  <RecruitmentActivePosting
                    onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'recruitment')}
                    showAlert={showAlert}
                  />
                ) : currentRecruitmentTab === 'ongoing_recruitment' ? (
                  <RecruitmentOngoingRecruitment
                    onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'recruitment')}
                    showAlert={showAlert}
                  />
                ) : (
                  /* Option Fallback Placeholders when clicking on unrequested Recruitment tabs */
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-4 shadow-xs mt-12">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                        {currentRecruitmentTab.replace(/_/g, ' ')} Module
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                        This view manages candidates pipelines, contract negotiations, offers registry and application tracking forms.
                      </p>
                    </div>
                    <button
                      onClick={() => handleTriggerAiGenerate(`Draft standard operating procedures for the '${currentRecruitmentTab}' pipeline state.`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer select-none transition-colors"
                    >
                      Draft SOP with Assistant
                    </button>
                  </div>
                )
              ) : currentModule === 'profiles' ? (
                /* 3. High Fidelity People & Profiles Tabs (Image 1 - 6) */
                <PeopleProfilesView
                  currentProfilesTab={currentProfilesTab}
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'profiles')}
                  showAlert={showAlert}
                />
              ) : currentModule === 'attendance' ? (
                /* 4. High Fidelity Attendance Tabs */
                <AttendanceView
                  currentAttendanceTab={currentAttendanceTab}
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'attendance')}
                  showAlert={showAlert}
                />
              ) : currentModule === 'talent' ? (
                /* 4b. High Fidelity Career Management tabs */
                <CareerManagementView
                  currentTab={currentTalentTab}
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'talent')}
                  showAlert={showAlert}
                />
              ) : currentModule === 'exit' ? (
                /* 4c. High Fidelity Exit & Offboarding tabs */
                <ExitOffboardingView
                  currentTab={currentExitTab}
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'exit')}
                  showAlert={showAlert}
                />
              ) : currentModule === 'onboarding' ? (
                /* Onboarding & Probation View Container */
                <OnboardingView
                  currentTab={currentOnboardingTab}
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'onboarding')}
                  showAlert={showAlert}
                />
              ) : currentModule === 'finance' ? (
                /* 4d. High Fidelity Workforce Finance tabs */
                <WorkforceFinanceView
                  currentTab={currentFinanceTab}
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'finance')}
                  showAlert={showAlert}
                />
              ) : currentModule === 'performance' ? (
                /* 4e. High Fidelity Performance & OKRs tabs */
                <PerformanceView
                  currentTab={currentPerformanceTab}
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'performance')}
                  showAlert={showAlert}
                />
              ) : currentModule === 'businesses' ? (
                /* 4f. Businesses Multi-tenant Management directory */
                <BusinessesView
                  onDraftAiSuggestion={(ctx) => handleTriggerAiGenerate(ctx, 'businesses')}
                  showAlert={showAlert}
                />
              ) : (
                /* 5. Auxiliary ERP Modules (Onboarding, Finance, etc.) */
                <OtherModulesView
                  module={currentModule as any}
                  onDraftAiSuggestion={(ctx) => triggerGeneralAiHelp(ctx)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* --- SIDE AI ASSISTANT DIALOG / EXPANSION DRAWER --- */}
      <AnimatePresence>
        {aiPanel.isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
            {/* Click backdrop to exit */}
            <div className="absolute inset-0" onClick={() => setAiPanel((prev) => ({ ...prev, isOpen: false }))} />

            <motion.div
              initial={{ x: 440 }}
              animate={{ x: 0 }}
              exit={{ x: 440 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-100 flex flex-col justify-between py-6 px-6 z-20"
            >
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 fill-blue-600" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-none">Blih CORE Copilot</h4>
                      <span className="text-[10px] text-blue-600 font-bold mt-0.5 block">Gemini 3.5 Assistant</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setAiPanel((prev) => ({ ...prev, isOpen: false }))}
                    className="p-1 px-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Directive</span>
                    <p className="text-[11px] text-slate-700 leading-normal bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1.5 font-medium">
                      {aiPanel.prompt}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Drafted Document Response</span>

                    {aiPanel.loading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
                        <span className="text-xs text-slate-400 font-bold tracking-tight animate-pulse">Running advanced calculations...</span>
                      </div>
                    ) : (
                      <div className="bg-blue-50/20 border border-blue-50 rounded-xl p-4 text-xs leading-relaxed text-slate-700 overflow-y-auto max-h-[380px] prose prose-sm font-medium">
                        {aiPanel.result.split('\n').map((line, i) => {
                          if (line.startsWith('###') || line.startsWith('**')) {
                            return (
                              <p key={i} className="font-extrabold text-slate-900 my-1 first:mt-0">
                                {line.replace(/###|\*\*/g, '').trim()}
                              </p>
                            );
                          }
                          if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
                            return (
                              <p key={i} className="pl-2 font-bold my-1 text-slate-850">
                                {line}
                              </p>
                            );
                          }
                          return <p key={i} className="my-1.5">{line}</p>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer actions */}
              <div className="border-t border-slate-100 pt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiPanel.result);
                    showAlert('Copied assistant response to clipboard!', 'success');
                  }}
                  disabled={aiPanel.loading || !aiPanel.result}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  Copy Document Content
                </button>
                <button
                  onClick={() => setAiPanel((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold py-3 rounded-xl cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CREATE NEW REQUEST MODAL --- */}
      <AnimatePresence>
        {newJobModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="absolute inset-0" onClick={() => setNewJobModal((prev) => ({ ...prev, isOpen: false }))} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/50 z-20 space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <PlusCircle className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-[13px] font-bold text-slate-900">Request New Position Requisition</h4>
                </div>
                <button
                  onClick={() => setNewJobModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-1 px-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateNewRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Designation Title</label>
                  <input
                    type="text"
                    required
                    value={newJobModal.title}
                    onChange={(e) => setNewJobModal((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Lead Technical Architect"
                    className="w-full bg-slate-50 hover:bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department Unit</label>
                    <select
                      value={newJobModal.department}
                      onChange={(e) => setNewJobModal((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="TECHNICAL DEPT.">Technical Dept.</option>
                      <option value="CREATIVE DEPT.">Creative Dept.</option>
                      <option value="DIGITAL MARKETING DEPT.">Digital Marketing Dept.</option>
                      <option value="HR DEPT.">HR Dept.</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Scope Type</label>
                    <select
                      value={newJobModal.type}
                      onChange={(e) => setNewJobModal((prev) => ({ ...prev, type: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Remote">Remote</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Allocated Headcount (Positions)</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={newJobModal.positions}
                      onChange={(e) => setNewJobModal((prev) => ({ ...prev, positions: Number(e.target.value) }))}
                      className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-150 focus:outline-none focus:border-blue-500 font-semibold text-xs text-slate-700 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority Rank</label>
                    <select
                      value={newJobModal.priority}
                      onChange={(e) => setNewJobModal((prev) => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-50 justify-end">
                  <button
                    type="button"
                    onClick={() => setNewJobModal((prev) => ({ ...prev, isOpen: false }))}
                    className="px-4 hover:bg-slate-50 text-slate-600 text-xs font-bold py-2.5 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl cursor-pointer"
                  >
                    File Requisition
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT JOB ADVERT MODAL --- */}
      <AnimatePresence>
        {editJobModal !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in">
            <div className="absolute inset-0" onClick={() => setEditJobModal(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-15 space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h4 className="text-[13px] font-bold text-slate-900">Modify Job Specifications</h4>
                <button onClick={() => setEditJobModal(null)} className="text-slate-400 hover:text-slate-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditJobSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Job Role Title</label>
                  <input
                    type="text"
                    required
                    value={editJobModal.title}
                    onChange={(e) => setEditJobModal({ ...editJobModal, title: e.target.value })}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Detailed Overview</label>
                  <textarea
                    rows={3}
                    required
                    value={editJobModal.overview}
                    onChange={(e) => setEditJobModal({ ...editJobModal, overview: e.target.value })}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-150 focus:border-blue-500 font-medium text-xs text-slate-700 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditJobModal(null)}
                    className="px-4 text-slate-500 text-xs font-bold py-2 rounded-xl cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Apply Specifications
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SUCCESS PUBLISHING OVERLAY CELEBRATION --- */}
      <AnimatePresence>
        {celebration.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm text-center mx-4 shadow-2xl border border-slate-100 flex flex-col items-center space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Job Position Posted!</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  The candidate specifications for <strong className="text-slate-800">{celebration.jobTitle}</strong> are now live across external talent networks, LinkedIn, and corporate portals.
                </p>
              </div>

              <button
                onClick={() => setCelebration({ show: false, jobTitle: '' })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
              >
                Return to Workspace
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
