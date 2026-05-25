/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Brain,
  Search,
  UserPlus,
  UserCheck,
  Users,
  Calendar,
  TrendingUp,
  GraduationCap,
  LogOut,
  CircleDollarSign,
  ChevronRight,
  Sparkles,
  Building2
} from 'lucide-react';
import { MainModule, RecruitmentTab } from '../../types';

interface SidebarProps {
  currentModule: MainModule;
  setCurrentModule: (module: MainModule) => void;
  currentRecruitmentTab: RecruitmentTab;
  setCurrentRecruitmentTab: (tab: RecruitmentTab) => void;
  currentProfilesTab: string;
  setCurrentProfilesTab: (tab: any) => void;
  currentAttendanceTab: string;
  setCurrentAttendanceTab: (tab: any) => void;
  currentTalentTab: 'overview' | 'career' | 'training' | 'culture';
  setCurrentTalentTab: (tab: 'overview' | 'career' | 'training' | 'culture') => void;
  currentExitTab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms';
  setCurrentExitTab: (tab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms') => void;
  currentFinanceTab: 'overview' | 'salary' | 'payroll' | 'budget' | 'expense' | 'benefits';
  setCurrentFinanceTab: (tab: 'overview' | 'salary' | 'payroll' | 'budget' | 'expense' | 'benefits') => void;
  currentOnboardingTab: 'overview' | 'contract' | 'progress' | 'probation' | 'checklists';
  setCurrentOnboardingTab: (tab: 'overview' | 'contract' | 'progress' | 'probation' | 'checklists') => void;
  currentPerformanceTab: 'overview' | 'performance_review' | 'okrs' | 'kpis' | 'discipline' | 'evaluation_form';
  setCurrentPerformanceTab: (tab: 'overview' | 'performance_review' | 'okrs' | 'kpis' | 'discipline' | 'evaluation_form') => void;
  isDetailedView: boolean;
  setIsDetailedView: (val: boolean) => void;
  user?: { name: string; email: string; role: string } | null;
  onLogout?: () => void;
}

export default function Sidebar({
  currentModule,
  setCurrentModule,
  currentRecruitmentTab,
  setCurrentRecruitmentTab,
  currentProfilesTab,
  setCurrentProfilesTab,
  currentAttendanceTab,
  setCurrentAttendanceTab,
  currentTalentTab,
  setCurrentTalentTab,
  currentExitTab,
  setCurrentExitTab,
  currentFinanceTab,
  setCurrentFinanceTab,
  currentOnboardingTab,
  setCurrentOnboardingTab,
  currentPerformanceTab,
  setCurrentPerformanceTab,
  isDetailedView,
  setIsDetailedView,
  user,
  onLogout,
}: SidebarProps) {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'CO';
  };
  const mainModules = [
    { id: 'recruitment', label: 'Recruitment & Hiring', icon: UserPlus, badge: 4 },
    { id: 'onboarding', label: 'Onboarding & Probation', icon: UserCheck, badge: 3 },
    { id: 'profiles', label: 'People Profiles', icon: Users, badge: 0 },
    { id: 'attendance', label: 'Attendance & Leave', icon: Calendar, badge: 0 },
    { id: 'performance', label: 'Performance', icon: TrendingUp, badge: 0 },
    { id: 'talent', label: 'Career Management', icon: GraduationCap, badge: 0 },
    { id: 'exit', label: 'Exit & Off boarding', icon: LogOut, badge: 0 },
    { id: 'finance', label: 'Workforce Finance', icon: CircleDollarSign, badge: 0 },
    ...(user?.role === 'Super Admin' ? [{ id: 'businesses', label: 'Businesses', icon: Building2, badge: 0 }] : []),
  ] as any[];

  const businessesTabs = [
    { id: 'overview', label: 'Overview', badge: 0 },
    { id: 'integrations', label: 'Integrations', badge: 0 },
    { id: 'security', label: 'Security & SSO', badge: 0 },
  ] as const;

  const performanceTabs = [
    { id: 'overview', label: 'Overview', badge: 4 },
    { id: 'performance_review', label: 'Performance Review', badge: 4 },
    { id: 'okrs', label: 'OKRs', badge: 3 },
    { id: 'kpis', label: 'KPIs', badge: 0 },
    { id: 'discipline', label: 'Discipline', badge: 0 },
    { id: 'evaluation_form', label: 'Evaluation Form', badge: 0 },
  ] as const;

  const recruitmentTabs = [
    { id: 'overview', label: 'Overview', badge: 4 },
    { id: 'requests', label: 'Requests', badge: 4 },
    { id: 'ready_to_post', label: 'Ready to Post', badge: 2 },
    { id: 'active_posting', label: 'Active Posting', badge: 0 },
    { id: 'ongoing_recruitment', label: 'Ongoing Recruitment', badge: 0 },
    { id: 'offers', label: 'Offers', badge: 0 },
    { id: 'closed_posts', label: 'Closed Posts', badge: 0 },
    { id: 'applicant_forms', label: 'Applicant Forms', badge: 0 },
  ] as const;

  const onboardingTabs = [
    { id: 'overview', label: 'Overview', badge: 0 },
    { id: 'contract', label: 'Contract', badge: 0 },
    { id: 'progress', label: 'Progress', badge: 0 },
    { id: 'probation', label: 'Probation', badge: 0 },
    { id: 'checklists', label: 'Checklists', badge: 0 },
  ] as const;

  const profilesTabs = [
    { id: 'overview', label: 'Overview', badge: 0 },
    { id: 'create', label: 'Create', badge: 0 },
    { id: 'organogram', label: 'Organogram', badge: 0 },
    { id: 'directory', label: 'Directory', badge: 0 },
    { id: 'events', label: 'Events', badge: 0 },
    { id: 'archive', label: 'Archive', badge: 0 },
  ] as const;

  const attendanceTabs = [
    { id: 'overview', label: 'Overview', badge: 0 },
    { id: 'check-in', label: 'Check-in', badge: 0 },
    { id: 'requests', label: 'Requests', badge: 0 },
    { id: 'timesheet', label: 'Timesheet', badge: 0 },
    { id: 'leaves', label: 'Leaves', badge: 0 },
    { id: 'overtime', label: 'Overtime', badge: 0 },
    { id: 'memo-log', label: 'Memo Log', badge: 0 },
    { id: 'work-from-home', label: 'Work-from-Home', badge: 0 },
  ] as const;

  const talentTabs = [
    { id: 'overview', label: 'Overview', badge: 4 },
    { id: 'career', label: 'Career', badge: 4 },
    { id: 'training', label: 'Training & Skills', badge: 3 },
    { id: 'culture', label: 'Culture', badge: 0 },
  ] as const;

  const exitTabs = [
    { id: 'overview', label: 'Overview', badge: 1 },
    { id: 'resign', label: 'Resign', badge: 2 },
    { id: 'interviews', label: 'Interviews', badge: 2 },
    { id: 'documents', label: 'Documents', badge: 0 },
    { id: 'clearance', label: 'Clearance Checklist', badge: 0 },
    { id: 'forms', label: 'Related Forms', badge: 0 },
  ] as const;

  const financeTabs = [
    { id: 'overview', label: 'Overview', badge: 4 },
    { id: 'salary', label: 'Salary', badge: 4 },
    { id: 'payroll', label: 'Payroll', badge: 3 },
    { id: 'budget', label: 'Budget', badge: 0 },
    { id: 'expense', label: 'Expense', badge: 0 },
    { id: 'benefits', label: 'Benefits', badge: 0 },
  ] as const;

  const handleModuleClick = (moduleId: MainModule) => {
    setCurrentModule(moduleId);
    // Auto-enable detailed dual sidebar when clicking 'recruitment', 'onboarding', 'profiles', 'attendance', 'talent', 'exit' or 'finance' or 'performance' or 'businesses'
    if (moduleId === 'recruitment' || moduleId === 'onboarding' || moduleId === 'profiles' || moduleId === 'attendance' || moduleId === 'talent' || moduleId === 'exit' || moduleId === 'finance' || moduleId === 'performance' || moduleId === 'businesses') {
      setIsDetailedView(true);
    } else {
      setIsDetailedView(false);
    }
  };

  // State 1: Detailed view (Image 1, 3, 4) with 2 columns
  if (isDetailedView) {
    return (
      <div id="sidebar-container" className="flex h-screen border-r border-slate-100 flex-shrink-0 bg-white">
        {/* Column 1: Micro Icon Rail */}
        <div id="sidebar-rail" className="w-[68px] bg-[#1a56db] flex flex-col items-center justify-between py-5 text-white flex-shrink-0">
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Logo */}
            <button
              onClick={() => {
                setIsDetailedView(false);
                setCurrentModule('recruitment');
              }}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Return to Home Dashboard"
            >
              <Brain className="w-7 h-7" />
            </button>

            {/* Micro search trigger */}
            <button className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-blue-100 mt-2">
              <Search className="w-5 h-5" />
            </button>

            {/* Rails Icons */}
            <div className="flex flex-col gap-3 w-full px-2 mt-4">
              {mainModules.map((m) => {
                const Icon = m.icon;
                const isActive = currentModule === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModuleClick(m.id)}
                    className={`relative p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#1a56db] shadow-md'
                        : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                    title={m.label}
                  >
                    <Icon className="w-5 h-5" />
                    {m.badge > 0 && !isActive && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-sky-300 rounded-full border-2 border-[#1a56db]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User initials circle */}
          <button
            onClick={() => setIsDetailedView(false)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-semibold border border-white/20 transition-all cursor-pointer"
          >
            {user ? getInitials(user.name) : 'AY'}
          </button>
        </div>

        {/* Column 2: Detailed options list */}
        <div id="sidebar-submenu" className="w-60 flex flex-col justify-between py-6 px-4 bg-white flex-shrink-0 h-full">
          <div>
            {/* Module Context Title */}
            <div className="mb-6 px-2">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                {currentModule === 'recruitment' 
                  ? 'Recruitment & Hiring' 
                  : currentModule === 'profiles' 
                  ? 'People & Profiles' 
                  : currentModule === 'attendance'
                  ? 'Attendance'
                  : currentModule === 'talent'
                  ? 'Career Management'
                  : currentModule === 'exit'
                  ? 'Exit & Offboarding'
                  : mainModules.find(m => m.id === currentModule)?.label}
              </h2>
              <span className="text-[11px] font-medium text-blue-600 block leading-tight">HR Dashboard</span>
            </div>

            {/* Dynamic Options depending on active module */}
            <div className="flex flex-col gap-1">
              {currentModule === 'recruitment' ? (
                recruitmentTabs.map((tab) => {
                  const isActive = currentRecruitmentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentRecruitmentTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="bg-blue-600 text-[10px] text-white font-semibold transform scale-90 px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[18px]">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : currentModule === 'profiles' ? (
                profilesTabs.map((tab) => {
                  const isActive = currentProfilesTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentProfilesTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })
              ) : currentModule === 'attendance' ? (
                attendanceTabs.map((tab) => {
                  const isActive = currentAttendanceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentAttendanceTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })
              ) : currentModule === 'talent' ? (
                talentTabs.map((tab) => {
                  const isActive = currentTalentTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentTalentTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="bg-blue-600 text-[10px] text-white font-semibold transform scale-90 px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[18px]">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : currentModule === 'exit' ? (
                exitTabs.map((tab) => {
                  const isActive = currentExitTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentExitTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="bg-blue-600 text-[10px] text-white font-semibold transform scale-90 px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[18px]">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : currentModule === 'onboarding' ? (
                onboardingTabs.map((tab) => {
                  const isActive = currentOnboardingTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentOnboardingTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })
              ) : currentModule === 'finance' ? (
                financeTabs.map((tab) => {
                  const isActive = currentFinanceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentFinanceTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="bg-blue-600 text-[10px] text-white font-semibold transform scale-90 px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[18px]">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : currentModule === 'performance' ? (
                performanceTabs.map((tab) => {
                  const isActive = currentPerformanceTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setCurrentPerformanceTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
                          : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.badge > 0 && (
                        <span className="bg-blue-600 text-[10px] text-white font-semibold transform scale-90 px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[18px]">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })
              ) : currentModule === 'businesses' ? (
                businessesTabs.map((tab) => {
                  return (
                    <button
                      key={tab.id}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        tab.id === 'overview'
                          ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-[#1a56db] pl-2.5'
                          : 'text-slate-400 cursor-not-allowed'
                      }`}
                      title={tab.id !== 'overview' ? 'Available under premium multi-tenant enterprise module' : ''}
                    >
                      <span>{tab.label}</span>
                    </button>
                  );
                })
              ) : (
                <div className="py-2 text-slate-500 font-medium text-xs text-center border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <span className="block mb-1">Standard Mode</span>
                  <button
                    onClick={() => handleModuleClick('recruitment')}
                    className="text-blue-600 hover:underline text-[11px] font-semibold"
                  >
                    Return to Recruitment Pipeline
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Employee signature block */}
          <div className="border-t border-slate-100 pt-4 px-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-blue-100 shadow-xs">
                {user ? getInitials(user.name) : 'AY'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-slate-950 truncate leading-none">{user ? user.name : 'Aytenew Y.'}</p>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{user ? user.email : 'aytenew@blihmarketing.com'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Log Out Central Workspace"
              className="p-1 px-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Big single menu sidebar (Image 2)
  return (
    <div
      id="sidebar-container"
      className="w-68 bg-gradient-to-b from-[#1c64f2] to-[#124bbf] text-white flex flex-col justify-between py-6 px-4 flex-shrink-0 h-screen"
    >
      <div>
        {/* Brand Logo Header */}
        <div className="flex items-center gap-3 px-3 mb-6 select-none animate-fade-in">
          <div className="p-1.5 bg-white/10 rounded-xl flex-shrink-0">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="font-cursive text-[30px] font-normal text-white tracking-wide antialiased">
                Blih
              </span>
              <span className="font-sans text-[19px] font-bold text-white tracking-wide uppercase opacity-95 antialiased">
                CORE
              </span>
            </div>
            <p className="text-[10px] text-blue-100 font-bold tracking-wider uppercase mt-1">HR Dashboard</p>
          </div>
        </div>

        {/* Global Search Field inside Sidebar */}
        <div className="relative px-2 mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100/70" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border-none rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-blue-100/60 focus:outline-none focus:ring-1.5 focus:ring-white/20 transition-all shadow-inner"
          />
        </div>

        {/* Flat Modules List */}
        <div className="flex flex-col gap-1 px-1">
          {mainModules.map((m) => {
            const Icon = m.icon;
            const isActive = currentModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModuleClick(m.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-[#1a56db] shadow-md transform scale-102'
                    : 'text-white hover:bg-white/8 hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#1a56db]' : 'text-blue-100/90'}`} />
                  <span className="tracking-tight">{m.label}</span>
                </div>
                {m.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center justify-center min-w-[20px] ${
                      isActive ? 'bg-[#1a56db] text-white' : 'bg-white text-[#1a56db]'
                    }`}
                  >
                    {m.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Signature label on bottom */}
      <div className="border-t border-white/10 pt-4 px-2 mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white text-[#1a56db] flex items-center justify-center text-xs font-bold leading-none shadow-sm flex-shrink-0">
            {user ? getInitials(user.name) : 'AY'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-bold text-white truncate leading-none">{user ? user.name : 'Aytenew Y.'}</p>
            <p className="text-[10px] text-blue-100/70 truncate leading-tight mt-0.5">{user ? user.email : 'aytenew@blihmarketing.com'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          title="Log Out Central Workspace"
          className="p-1 px-1.5 hover:bg-white/10 rounded-lg text-blue-100 hover:text-rose-300 transition-colors cursor-pointer flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
