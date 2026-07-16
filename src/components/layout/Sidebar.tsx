/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useMyPermissions } from '../../hooks/usePermissions';
import { useCriticalDisciplinaryCases } from '../../hooks/useDisciplinary';
import {
  RECRUITMENT_TAB_PERMISSIONS,
  ONBOARDING_TAB_PERMISSIONS,
  PROFILES_TAB_PERMISSIONS,
  ATTENDANCE_TAB_PERMISSIONS,
  PERFORMANCE_TAB_PERMISSIONS,
  TALENT_TAB_PERMISSIONS,
  EXIT_TAB_PERMISSIONS,
  FINANCE_TAB_PERMISSIONS,
  PROJECTS_TAB_PERMISSIONS,
  BUSINESSES_TAB_PERMISSIONS,
  MODULE_PERMISSIONS,
} from '../../config/tabPermissions';
import {
  Brain,
  UserPlus,
  UserCheck,
  Users,
  Calendar,
  TrendingUp,
  GraduationCap,
  LogOut,
  CircleDollarSign,
  Shield,
  Building2,
  BriefcaseBusiness,
  Settings,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BusinessesTab, MainModule, ProjectsTab, RecruitmentTab } from '../../types';
import GlobalSubtabSearch from './GlobalSubtabSearch';

interface SidebarProps {
  currentModule: MainModule;
  setCurrentModule: (module: MainModule) => void;
  currentRecruitmentTab: RecruitmentTab;
  setCurrentRecruitmentTab: (tab: RecruitmentTab) => void;
  currentProfilesTab: string;
  setCurrentProfilesTab: (tab: any) => void;
  currentAttendanceTab: string;
  setCurrentAttendanceTab: (tab: any) => void;
  currentTalentTab: string;
  setCurrentTalentTab: (tab: any) => void;
  currentExitTab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms' | 'offboarding';
  setCurrentExitTab: (tab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms' | 'offboarding') => void;
  currentFinanceTab: 'overview' | 'employee_salary' | 'salary_payroll' | 'payroll_template' | 'budget' | 'my_payslip' | 'benefits' | 'exports';
  setCurrentFinanceTab: (tab: 'overview' | 'employee_salary' | 'salary_payroll' | 'payroll_template' | 'budget' | 'my_payslip' | 'benefits' | 'exports') => void;
  currentProjectsTab?: ProjectsTab;
  setCurrentProjectsTab?: (tab: ProjectsTab) => void;
  currentOnboardingTab: 'overview' | 'contract' | 'progress' | 'probation' | 'checklists' | 'policy';
  setCurrentOnboardingTab: (tab: 'overview' | 'contract' | 'progress' | 'probation' | 'checklists' | 'policy') => void;
  currentPerformanceTab: 'overview' | 'performance_review' | 'okrs' | 'kpis' | 'discipline' | 'evaluation_form';
  setCurrentPerformanceTab: (tab: 'overview' | 'performance_review' | 'okrs' | 'kpis' | 'discipline' | 'evaluation_form') => void;
  currentBusinessesTab: BusinessesTab;
  setCurrentBusinessesTab: (tab: BusinessesTab) => void;
  isDetailedView: boolean;
  setIsDetailedView: (val: boolean) => void;
  user?: { name: string; email: string; role: string; positionTitle?: string | null; departmentName?: string | null; employmentType?: string | null; employmentStatus?: string | null } | null;
  onLogout?: () => void;
  onProfileClick?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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
  currentProjectsTab = 'overview',
  setCurrentProjectsTab = () => {},
  currentOnboardingTab,
  setCurrentOnboardingTab,
  currentPerformanceTab,
  setCurrentPerformanceTab,
  currentBusinessesTab,
  setCurrentBusinessesTab,
  isDetailedView,
  setIsDetailedView,
  user,
  onLogout,
  onProfileClick,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasAny, isSuperAdmin } = useMyPermissions();
  const { data: criticalDisciplineData } = useCriticalDisciplinaryCases();
  const criticalDisciplineCount = criticalDisciplineData?.total ?? criticalDisciplineData?.rows?.length ?? 0;
  const [openTalentGroups, setOpenTalentGroups] = useState<Record<string, boolean>>({
    Recruitment: true,
    Onboarding: false,
    People: false,
  });
  const [openAttendanceGroups, setOpenAttendanceGroups] = useState<Record<string, boolean>>({
    Dashboard: true,
    'Time & Records': false,
    'Requests & Leave': true,
  });

  // ── Helper: filter a tab list by the permission map ───────────────────────
  function allowedTabs<T extends { id: string }>(
    tabs: readonly T[],
    permMap: Record<string, { requires: string[] }>
  ): T[] {
    return tabs.filter((t) => {
      const entry = permMap[t.id];
      // If a tab has no entry in the map, deny it (safe default — add it to the map to expose it)
      if (!entry) return false;
      return hasAny(...entry.requires);
    });
  }

  const roleSegment =
    user?.role === 'Super Admin'
      ? 'super-admin'
      : user?.role === 'Business Admin'
      ? 'business-admin'
      : user?.role === 'HR Manager'
      ? 'hr-manager'
      : 'employee';
  const isInternUser = user?.employmentType === 'intern';
  const formatEmploymentType = (value?: string | null) =>
    value ? value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : '';
  const sidebarRoleLabel =
    user?.positionTitle ||
    (user?.role && user.role !== 'Employee' ? user.role : '') ||
    user?.departmentName ||
    formatEmploymentType(user?.employmentType) ||
    'Staff';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0] ? parts[0].slice(0, 2).toUpperCase() : 'CO';
  };

  // ── Module list: derived from permissions, not role strings ───────────────
  const ALL_MODULES = [
    { id: 'businesses',  label: 'Businesses',             icon: Building2,       badge: 0 },
    { id: 'permissions', label: 'Roles & Permissions',    icon: Shield,          badge: 0 },
    { id: 'talent',      label: 'Talent Management',      icon: UserPlus,        badge: 0 },
    { id: 'attendance',  label: 'Attendance & Leave',     icon: Calendar,        badge: 0 },
    { id: 'performance', label: 'Performance',            icon: TrendingUp,      badge: criticalDisciplineCount },
    { id: 'exit',        label: 'Exit & Offboarding',     icon: LogOut,          badge: 0 },
    { id: 'finance',     label: 'Workforce Finance',      icon: CircleDollarSign,badge: 0 },
    { id: 'projects',    label: 'Projects',               icon: BriefcaseBusiness,badge: 0 },
    { id: 'subscription-settings', label: 'Subscription & Settings', icon: SlidersHorizontal, badge: 0 },
  ] as const;

  const internModuleIds = new Set(['attendance']);
  const mainModules = ALL_MODULES.filter((m) => {
    if (isInternUser && !internModuleIds.has(m.id)) return false;
    if (m.id === 'subscription-settings') return user?.role === 'Business Admin' || user?.role === 'Super Admin' || hasAny(...MODULE_PERMISSIONS.settings);
    const required = MODULE_PERMISSIONS[m.id];
    if (!required) return false;
    return hasAny(...required);
  });

  // ── All possible tabs — filtered at render time via allowedTabs() ─────────

  const ALL_RECRUITMENT_TABS = [
    { id: 'overview',            label: 'Overview',            badge: 0 },
    { id: 'requests',            label: 'Requests',            badge: 0 },
    { id: 'ready_to_post',       label: 'Ready to Post',       badge: 0 },
    { id: 'active_posting',      label: 'Active Posting',      badge: 0 },
    { id: 'ongoing_recruitment', label: 'Ongoing Recruitment', badge: 0 },
    { id: 'my_interviews',       label: 'My Interviews',       badge: 0 },
    { id: 'offers',              label: 'Offers',              badge: 0 },
    { id: 'offer_templates',     label: 'Offer Templates',     badge: 0 },
    { id: 'closed_posts',        label: 'Closed Posts',        badge: 0 },
    { id: 'applicant_forms',     label: 'Applicant Forms',     badge: 0 },
  ] as const;

  const ALL_ONBOARDING_TABS = [
    { id: 'overview',   label: 'Overview',   badge: 0 },
    { id: 'contract',   label: 'Contract',   badge: 0 },
    { id: 'progress',   label: 'Progress',   badge: 0 },
    { id: 'probation',  label: 'Probation',  badge: 0 },
    { id: 'policy',     label: 'Policies',   badge: 0 },
    { id: 'checklists', label: 'Checklists', badge: 0 },
  ] as const;

  const ALL_PROFILES_TABS = [
    { id: 'create',                 label: 'Create',                badge: 0 },
    { id: 'bulk_create',            label: 'Bulk Create',           badge: 0 },
    { id: 'organogram',             label: 'Organogram',            badge: 0 },
    { id: 'directory',              label: 'Directory',             badge: 0 },
    { id: 'left',                   label: 'Left Employees',        badge: 0 },
    { id: 'interns',                label: 'Interns',               badge: 0 },
    { id: 'organization',           label: 'Departments & Positions', badge: 0 },
    { id: 'devices',                label: 'Devices',               badge: 0 },
    { id: 'events',                 label: 'Events',                badge: 0 },
    { id: 'archive',                label: 'Archive',               badge: 0 },
    { id: 'pending_registrations',  label: 'Pending Registrations', badge: 0 },
    { id: 'exemption_requests',     label: 'Exemption Requests',    badge: 0 },
  ] as const;

  const ALL_ATTENDANCE_TABS = [
    { id: 'overview',       label: 'Overview',          badge: 0 },
    { id: 'calendar',       label: 'Calendar',          badge: 0 },
    { id: 'check-in',       label: 'Check-ins',         badge: 0 },
    { id: 'check-me-in',    label: 'Check me in',       badge: 0 },
    { id: 'history',        label: 'History',           badge: 0 },
    { id: 'my-lateness-reason', label: 'My Lateness Reason', badge: 0 },
    { id: 'manual-lateness-reason', label: 'Manual Lateness', badge: 0 },
    { id: 'late-reasons',   label: 'Late Reasons',      badge: 0 },
    { id: 'requests',       label: 'Punctuality',       badge: 0 },
    { id: 'timesheet',      label: 'Timesheet',         badge: 0 },
    { id: 'leaves',         label: 'Leaves',            badge: 0 },
    { id: 'overtime',       label: 'Overtime',          badge: 0 },
    { id: 'special-request', label: 'Special Request',  badge: 0 },
    { id: 'unavailable',    label: 'Unavailable',       badge: 0 },
    { id: 'memo-log',       label: 'Memo Log',          badge: 0 },
    { id: 'work-from-home', label: 'Work-from-Home',    badge: 0 },
    { id: 'exit-request',   label: 'Exit Request',      badge: 0 },
  ] as const;

  const ALL_TALENT_TABS = [
    { id: 'overview',     label: 'Overview',          badge: 0 },
    { id: 'career',       label: 'Career',            badge: 0 },
    { id: 'training',     label: 'Training & Skills', badge: 0 },
    { id: 'culture',      label: 'Culture',           badge: 0 },
    { id: 'development',  label: 'Development',       badge: 0 },
  ] as const;

  const ALL_EXIT_TABS = [
    { id: 'offboarding', label: 'My Offboarding',       badge: 0 },
    { id: 'resign',      label: 'Resignation Requests', badge: 0 },
    { id: 'interviews',  label: 'Exit Interviews',      badge: 0 },
    { id: 'forms',       label: 'Template Creation',    badge: 0 },
    { id: 'documents',   label: 'Process Documents',    badge: 0 },
    { id: 'clearance',   label: 'Process Execution',    badge: 0 },
  ] as const;

  const ALL_FINANCE_TABS = [
    { id: 'overview',        label: 'Overview',         badge: 0 },
    { id: 'employee_salary', label: 'Employee Salary',  badge: 0 },
    { id: 'salary_payroll',  label: 'Salary & Payroll', badge: 0 },
    { id: 'payroll_template', label: 'Pay Templates',   badge: 0 },
    { id: 'budget',          label: 'Budget',           badge: 0 },
    { id: 'exports',         label: 'Exports',          badge: 0 },
    { id: 'my_payslip',      label: 'My Payslip',       badge: 0 },
    { id: 'benefits',        label: 'Benefits',         badge: 0 },
  ] as const;

  const ALL_PROJECTS_TABS = [
    { id: 'overview', label: 'Overview', badge: 0 },
    { id: 'all', label: 'All Projects', badge: 0 },
    { id: 'mine', label: 'My Projects', badge: 0 },
    { id: 'my-tasks', label: 'My Tasks', badge: 0 },
    { id: 'board', label: 'Task Board', badge: 0 },
  ] as const;

  const ALL_PERFORMANCE_TABS = [
    { id: 'overview',           label: 'Overview',           badge: 0 },
    { id: 'performance_review', label: 'Performance Review', badge: 0 },
    { id: 'okrs',               label: 'OKRs',               badge: 0 },
    { id: 'kpis',               label: 'KPIs',               badge: 0 },
    { id: 'discipline',         label: 'Discipline',         badge: criticalDisciplineCount },
    { id: 'evaluation_form',    label: 'Evaluation Form',    badge: 0 },
  ] as const;

  const ALL_BUSINESSES_TABS = [
    { id: 'overview',      label: 'Overview',      badge: 0 },
    { id: 'plans',         label: 'Plans',         badge: 0 },
    { id: 'sector_focus',  label: 'Sector Focus',  badge: 0 },
    { id: 'smtp_providers', label: 'SMTP Providers', badge: 0 },
    { id: 'integrations',  label: 'Integrations',  badge: 0 },
    { id: 'security',      label: 'Security & SSO',badge: 0 },
    { id: 'audit_logs',    label: 'Audit Logs',    badge: 0 },
    { id: 'notifications', label: 'Notifications', badge: 0 },
  ] as const;

  // ── Resolved tab arrays (filtered by user permissions) ────────────────────
  const recruitmentTabs   = allowedTabs(ALL_RECRUITMENT_TABS,  RECRUITMENT_TAB_PERMISSIONS);
  const onboardingTabs    = allowedTabs(ALL_ONBOARDING_TABS,   ONBOARDING_TAB_PERMISSIONS);
  const profilesTabs      = allowedTabs(ALL_PROFILES_TABS,     PROFILES_TAB_PERMISSIONS)
    .filter((tab) => !isInternUser || ['events'].includes(tab.id));
  const attendanceTabs    = allowedTabs(ALL_ATTENDANCE_TABS,   ATTENDANCE_TAB_PERMISSIONS)
    .filter((tab) => !isInternUser || ['calendar', 'check-me-in', 'history', 'requests', 'leaves', 'overtime', 'special-request', 'unavailable', 'work-from-home', 'exit-request'].includes(tab.id));
  type AttendanceTabId = typeof attendanceTabs[number]['id'];
  const attendanceTabById = new Map(attendanceTabs.map((tab) => [tab.id, tab]));
  const attendanceGroups  = ([
    {
      title: 'Dashboard',
      ids: ['overview', 'calendar'],
      labels: { overview: 'Overview', calendar: 'Calendar' },
    },
    {
      title: 'Time & Records',
      ids: ['check-in', 'check-me-in', 'history', 'timesheet', 'my-lateness-reason', 'manual-lateness-reason', 'late-reasons', 'memo-log'],
      labels: {
        'check-in': 'Check-ins',
        'check-me-in': 'Check me in',
        history: 'History',
        timesheet: 'Timesheet',
        'my-lateness-reason': 'My Lateness',
        'manual-lateness-reason': 'Manual Lateness',
        'late-reasons': 'Late Reasons',
        'memo-log': 'Memo Log',
      },
    },
    {
      title: 'Requests & Leave',
      ids: ['requests', 'leaves', 'overtime', 'special-request', 'unavailable', 'work-from-home', 'exit-request'],
      labels: {
        requests: 'Punctuality',
        leaves: 'Leaves',
        overtime: 'Overtime',
        'special-request': 'Special Request',
        unavailable: 'Unavailable',
        'work-from-home': 'Work-from-Home',
        'exit-request': 'Exit Request',
      },
    },
  ] as Array<{ title: string; ids: AttendanceTabId[]; labels: Partial<Record<AttendanceTabId, string>> }>).map((group) => ({
    title: group.title,
    items: group.ids
      .map((id) => {
        const tab = attendanceTabById.get(id);
        return tab ? { ...tab, label: group.labels[id] ?? tab.label } : null;
      })
      .filter(Boolean) as typeof attendanceTabs,
  })).filter((group) => group.items.length > 0);
  const talentGroups      = [
    {
      title: 'Recruitment',
      items: recruitmentTabs.map((tab) => ({
        ...tab,
        id: `recruitment-${tab.id}`,
        label: ({
          overview: 'Overview',
          requests: 'Requests',
          ready_to_post: 'Ready to Post',
          active_posting: 'Active Posts',
          closed_posts: 'Closed Posts',
          ongoing_recruitment: 'Applicants',
          my_interviews: 'Interviews',
          offers: 'Offers',
          offer_templates: 'Offer Templates',
          applicant_forms: 'Forms',
        } as Record<string, string>)[tab.id] ?? tab.label,
      })),
    },
    {
      title: 'Onboarding',
      items: onboardingTabs.map((tab) => ({
        ...tab,
        id: `onboarding-${tab.id}`,
        label: ({
          overview: 'Overview',
          contract: 'Contracts',
          progress: 'Progress',
          probation: 'Probation',
          checklists: 'Checklists',
          policy: 'Policies',
        } as Record<string, string>)[tab.id] ?? tab.label,
      })),
    },
    {
      title: 'People',
      items: profilesTabs
        .filter((tab) => ['create', 'directory', 'pending_registrations', 'exemption_requests'].includes(tab.id))
        .map((tab) => ({
          ...tab,
          id: `profiles-${tab.id}`,
          label: ({
            create: 'Create Profile',
            directory: 'Profiles',
            pending_registrations: 'Pending Registrations',
            exemption_requests: 'Exemption Requests',
          } as Record<string, string>)[tab.id] ?? tab.label,
        })),
    },
  ].filter((group) => group.items.length > 0);
  const exitTabs          = allowedTabs(ALL_EXIT_TABS,         EXIT_TAB_PERMISSIONS);
  const financeTabs       = allowedTabs(ALL_FINANCE_TABS,      FINANCE_TAB_PERMISSIONS);
  const projectsTabs      = allowedTabs(ALL_PROJECTS_TABS,     PROJECTS_TAB_PERMISSIONS);
  const performanceTabs   = allowedTabs(ALL_PERFORMANCE_TABS,  PERFORMANCE_TAB_PERMISSIONS);
  const businessesTabs    = allowedTabs(ALL_BUSINESSES_TABS,   BUSINESSES_TAB_PERMISSIONS);
  const settingsTabs = [
    { id: 'general', label: 'Business Settings', path: `/${roleSegment}/settings/general` },
    { id: 'attendance', label: 'Attendance Settings', path: `/${roleSegment}/settings/attendance` },
    { id: 'smtp', label: 'SMTP Settings', path: `/${roleSegment}/settings/smtp` },
    { id: 'punctuality-messages', label: 'Punctuality Messages', path: `/${roleSegment}/settings/punctuality-messages` },
    { id: 'subscription', label: 'Subscription', path: `/${roleSegment}/settings/subscription` },
  ] as const;
  const pathname = location.pathname;
  const isSubscriptionSettingsRoute = pathname.includes('/settings') || pathname.endsWith('/subscription');
  const activeSettingsTab =
    pathname.includes('/settings/attendance') ? 'attendance' :
    pathname.includes('/settings/smtp') ? 'smtp' :
    pathname.includes('/settings/punctuality-messages') ? 'punctuality-messages' :
    pathname.includes('/settings/subscription') || pathname.endsWith('/subscription') ? 'subscription' :
    'general';
  const displayModule = isSubscriptionSettingsRoute ? 'subscription-settings' : currentModule;

  const handleModuleClick = (moduleId: MainModule) => {
    setCurrentModule(moduleId);
    if (
      moduleId === 'attendance' || moduleId === 'talent' || moduleId === 'exit' ||
      moduleId === 'finance' || moduleId === 'projects' || moduleId === 'performance' || moduleId === 'businesses' ||
      moduleId === 'permissions'
      || moduleId === 'subscription-settings'
    ) {
      setIsDetailedView(true);
      if (moduleId === 'businesses') setCurrentBusinessesTab('overview');
      if (moduleId === 'talent') setCurrentTalentTab('recruitment-overview');
    } else {
      setIsDetailedView(false);
    }
    navigate(moduleId === 'subscription-settings' ? `/${roleSegment}/settings/general` : `/${roleSegment}/${moduleId}`);
    onMobileClose?.();
  };

  const handleProfileClick = () => {
    onProfileClick?.();
    navigate(`/${roleSegment}/my-profile`);
    onMobileClose?.();
  };

  // Helper: tab button class
  const tabCls = (isActive: boolean) =>
    `w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
      isActive
        ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-2.5'
        : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900'
    }`;

  const groupedChildCls = (isActive: boolean) =>
    `w-full flex items-center justify-between gap-2 py-2 pr-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer min-w-0 ${
      isActive
        ? 'bg-slate-50 text-slate-900 font-bold border-l-2 border-blue-600 pl-5'
        : 'text-slate-600 hover:bg-slate-50/50 hover:text-slate-900 pl-6'
    }`;

  const Badge = ({ count, tone = 'blue' }: { count: number; tone?: 'blue' | 'red' }) =>
    count > 0 ? (
      <span className={`${tone === 'red' ? 'bg-red-600' : 'bg-blue-600'} text-[10px] text-white font-semibold px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[18px]`}>
        {count}
      </span>
    ) : null;

  const portalTitle = isInternUser ? 'Intern Portal' : user?.departmentName ? `${user.departmentName} Portal` : `${user?.role || 'Employee'} Portal`;
  const defaultModule = user?.role === 'Employee' ? 'attendance' : 'talent';
  const defaultPath = user?.role === 'Employee' ? `/${roleSegment}/attendance/check-me-in` : `/${roleSegment}/talent/recruitment-overview`;

  // ─── State 1: Detailed two-column sidebar ───────────────────────────────────
  if (isDetailedView) {
    return (
      <div
        id="sidebar-container"
        className="flex h-screen border-r border-slate-100 flex-shrink-0 bg-white z-50 transition-transform duration-300 ease-in-out"
        data-mobile-open={mobileOpen ? 'true' : 'false'}
      >
        {/* Column 1: Icon rail */}
        <div className="w-[68px] bg-[#1a56db] flex flex-col items-center justify-between py-5 text-white flex-shrink-0">
          <div className="flex flex-col items-center gap-6 w-full">
            <button
              onClick={() => {
                setIsDetailedView(false);
                setCurrentModule(defaultModule as MainModule);
                navigate(defaultPath);
                onMobileClose?.();
              }}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Return to Home Dashboard"
            >
              <Brain className="w-7 h-7" />
            </button>

            <div className="mt-2">
              <GlobalSubtabSearch
                user={user}
                variant="rail"
                onSelect={() => {
                  setIsDetailedView(true);
                  onMobileClose?.();
                }}
              />
            </div>

            <div className="flex flex-col gap-3 w-full px-2 mt-4">
              {mainModules.map((m: any) => {
                const Icon = m.icon;
                const isActive = m.id === displayModule;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModuleClick(m.id)}
                    className={`relative p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      isActive ? 'bg-white text-[#1a56db] shadow-md' : 'text-white/85 hover:bg-white/10 hover:text-white'
                    }`}
                    title={m.label}
                  >
                    <Icon className="w-5 h-5" />
                    {m.badge > 0 && !isActive && (
                      <span className={`absolute top-1 right-1 w-2.5 h-2.5 ${m.id === 'performance' ? 'bg-red-400' : 'bg-sky-300'} rounded-full border-2 border-[#1a56db]`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleProfileClick}
            title="My Profile"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-semibold border border-white/20 transition-all cursor-pointer"
          >
            {user ? getInitials(user.name) : 'AY'}
          </button>
        </div>

        {/* Column 2: Sub-menu */}
        <div className="w-60 min-h-0 flex flex-col py-6 px-4 bg-white flex-shrink-0 h-full overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="mb-6 px-2">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                {displayModule === 'recruitment' ? portalTitle
                  : displayModule === 'profiles' ? 'People & Profiles'
                  : displayModule === 'attendance' ? 'Attendance'
                  : displayModule === 'talent' ? 'Talent Management'
                  : displayModule === 'exit' ? 'Exit & Offboarding'
                  : mainModules.find((m: any) => m.id === displayModule)?.label}
              </h2>
              <span className="text-[11px] font-medium text-blue-600 block leading-tight">{sidebarRoleLabel}</span>
            </div>

            <div className="flex flex-col gap-1">
              {displayModule === 'recruitment' && recruitmentTabs.map((tab) => (
                <button key={tab.id} onClick={() => { setCurrentRecruitmentTab(tab.id); navigate(tab.id === 'overview' ? `/${roleSegment}/recruitment` : `/${roleSegment}/recruitment/${tab.id}`); onMobileClose?.(); }} className={tabCls(currentRecruitmentTab === tab.id)}>
                  <span>{tab.label}</span>
                  <Badge count={tab.badge} />
                </button>
              ))}

              {displayModule === 'profiles' && profilesTabs.map((tab) => (
                <button key={tab.id} onClick={() => { setCurrentProfilesTab(tab.id); navigate(`/${roleSegment}/profiles/${tab.id}`); onMobileClose?.(); }} className={tabCls(currentProfilesTab === tab.id)}>
                  <span>{tab.label}</span>
                </button>
              ))}

              {displayModule === 'attendance' && attendanceGroups.map((group) => {
                const hasActiveChild = group.items.some((tab) => tab.id === currentAttendanceTab);
                const isOpen = hasActiveChild || openAttendanceGroups[group.title] !== false;
                const Chevron = isOpen ? ChevronDown : ChevronRight;

                return (
                  <div key={group.title} className="pt-1.5 first:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenAttendanceGroups((prev) => ({
                          ...prev,
                          [group.title]: !(prev[group.title] !== false),
                        }));
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors cursor-pointer ${
                        hasActiveChild ? 'text-slate-950 bg-slate-50/70' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{group.title}</span>
                      <Chevron className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </button>

                    <div className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'
                    }`}>
                      <div className="overflow-hidden">
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {group.items.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setCurrentAttendanceTab(tab.id);
                                navigate(tab.id === 'overview' ? `/${roleSegment}/attendance` : `/${roleSegment}/attendance/${tab.id}`);
                                onMobileClose?.();
                              }}
                              className={groupedChildCls(currentAttendanceTab === tab.id)}
                            >
                              <span className="truncate">{tab.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayModule === 'talent' && talentGroups.map((group) => {
                const hasActiveChild = group.items.some((tab) => tab.id === currentTalentTab);
                const isOpen = hasActiveChild || openTalentGroups[group.title] !== false;
                const Chevron = isOpen ? ChevronDown : ChevronRight;

                return (
                  <div key={group.title} className="pt-1.5 first:pt-0">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenTalentGroups((prev) => ({
                          ...prev,
                          [group.title]: !(prev[group.title] !== false),
                        }));
                      }}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors cursor-pointer ${
                        hasActiveChild ? 'text-slate-950 bg-slate-50/70' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{group.title}</span>
                      <Chevron className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </button>

                    <div className={`grid transition-[grid-template-rows,opacity] duration-150 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-70'
                    }`}>
                      <div className="overflow-hidden">
                        <div className="mt-0.5 flex flex-col gap-0.5">
                          {group.items.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setCurrentTalentTab(tab.id);
                                navigate(`/${roleSegment}/talent/${tab.id}`);
                                onMobileClose?.();
                              }}
                              className={groupedChildCls(currentTalentTab === tab.id)}
                            >
                              <span className="truncate">{tab.label}</span>
                              <Badge count={tab.badge} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayModule === 'exit' && exitTabs.map((tab) => (
                <button key={tab.id} onClick={() => { setCurrentExitTab(tab.id); navigate(tab.id === 'offboarding' ? `/${roleSegment}/exit` : `/${roleSegment}/exit/${tab.id}`); onMobileClose?.(); }} className={tabCls(currentExitTab === tab.id)}>
                  <span>{tab.label}</span>
                  <Badge count={tab.badge} />
                </button>
              ))}

              {displayModule === 'onboarding' && onboardingTabs.map((tab) => (
                <button key={tab.id} onClick={() => { setCurrentOnboardingTab(tab.id); navigate(tab.id === 'overview' ? `/${roleSegment}/onboarding` : `/${roleSegment}/onboarding/${tab.id}`); onMobileClose?.(); }} className={tabCls(currentOnboardingTab === tab.id)}>
                  <span>{tab.label}</span>
                </button>
              ))}

              {displayModule === 'finance' && financeTabs.map((tab) => (
                <button key={tab.id} onClick={() => { setCurrentFinanceTab(tab.id); navigate(tab.id === 'overview' ? `/${roleSegment}/finance` : `/${roleSegment}/finance/${tab.id}`); onMobileClose?.(); }} className={tabCls(currentFinanceTab === tab.id)}>
                  <span>{tab.label}</span>
                  <Badge count={tab.badge} />
                </button>
              ))}

              {displayModule === 'projects' && projectsTabs.map((tab) => (
                <button key={tab.id} onClick={() => {
                  setCurrentProjectsTab(tab.id);
                  const path = tab.id === 'overview' ? '/projects' : tab.id === 'all' ? '/projects/all' : tab.id === 'mine' ? '/projects/my-projects' : tab.id === 'my-tasks' ? '/projects/my-tasks' : '/projects/board';
                  navigate(path);
                  onMobileClose?.();
                }} className={tabCls(currentProjectsTab === tab.id)}>
                  <span>{tab.label}</span>
                </button>
              ))}

              {displayModule === 'performance' && performanceTabs.map((tab) => (
                <button key={tab.id} onClick={() => { setCurrentPerformanceTab(tab.id); navigate(tab.id === 'overview' ? `/${roleSegment}/performance` : `/${roleSegment}/performance/${tab.id}`); onMobileClose?.(); }} className={tabCls(currentPerformanceTab === tab.id)}>
                  <span>{tab.label}</span>
                  <Badge count={tab.badge} tone={tab.id === 'discipline' ? 'red' : 'blue'} />
                </button>
              ))}

              {displayModule === 'permissions' && (
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold bg-slate-50 text-slate-900 border-l-2 border-blue-600 pl-2.5 cursor-pointer">
                  <span>Manage Permissions</span>
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                </button>
              )}

              {displayModule === 'subscription-settings' && settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setCurrentModule('subscription-settings'); navigate(tab.path); onMobileClose?.(); }}
                  className={tabCls(activeSettingsTab === tab.id)}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'smtp' ? <Settings className="w-3.5 h-3.5 text-blue-600" /> : null}
                </button>
              ))}

              {displayModule === 'businesses' && businessesTabs.map((tab) => (
                <button key={tab.id} onClick={() => { setCurrentBusinessesTab(tab.id); navigate(tab.id === 'overview' ? `/${roleSegment}/businesses` : `/${roleSegment}/businesses/${tab.id}`); onMobileClose?.(); }} className={tabCls(currentBusinessesTab === tab.id)}>
                  <span>{tab.label}</span>
                </button>
              ))}

              {!['recruitment','profiles','attendance','talent','exit','onboarding','finance','projects','performance','permissions','businesses','subscription-settings'].includes(displayModule) && (
                <div className="py-2 text-slate-500 font-medium text-xs text-center border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  <span className="block mb-1">Standard Mode</span>
                  <button onClick={() => { setCurrentModule(defaultModule as MainModule); navigate(defaultPath); onMobileClose?.(); }} className="text-blue-600 hover:underline text-[11px] font-semibold">
                    Return to Portal Home
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* User block */}
          <div className="mt-3 flex flex-shrink-0 items-center justify-between gap-3 border-t border-slate-100 px-2 pt-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 border border-blue-100 shadow-xs">
                {user ? getInitials(user.name) : 'AY'}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-slate-950 truncate leading-none">{user ? user.name : 'Aytenew Y.'}</p>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">{user ? user.email : 'aytenew@blihmarketing.com'}</p>
              </div>
            </div>
            <button onClick={onLogout} title="Log Out" className="p-1 px-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── State 2: Full-width single-column sidebar ───────────────────────────────
  return (
    <div
      id="sidebar-container"
      className="w-68 bg-gradient-to-b from-[#1c64f2] to-[#124bbf] text-white flex flex-col justify-between py-6 px-4 flex-shrink-0 h-screen z-50 transition-transform duration-300 ease-in-out"
      data-mobile-open={mobileOpen ? 'true' : 'false'}
    >
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 mb-6 select-none animate-fade-in">
          <div className="p-1.5 bg-white/10 rounded-xl flex-shrink-0">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1.5 leading-none">
              <span className="font-cursive text-[30px] font-normal text-white tracking-wide antialiased">Blih</span>
              <span className="font-sans text-[19px] font-bold text-white tracking-wide uppercase opacity-95 antialiased">CORE</span>
            </div>
            <p className="text-[10px] text-blue-100 font-bold tracking-wider uppercase mt-1">HR Dashboard</p>
          </div>
        </div>

        <GlobalSubtabSearch
          user={user}
          onSelect={() => {
            setIsDetailedView(true);
            onMobileClose?.();
          }}
        />

        {/* Module list */}
        <div className="flex flex-col gap-1 px-1">
          {mainModules.map((m: any) => {
            const Icon = m.icon;
            const isActive = m.id === displayModule;
            return (
              <button
                key={m.id}
                onClick={() => handleModuleClick(m.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive ? 'bg-white text-[#1a56db] shadow-md' : 'text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#1a56db]' : 'text-blue-100/90'}`} />
                  <span className="tracking-tight">{m.label}</span>
                </div>
                {m.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center justify-center min-w-[20px] ${m.id === 'performance' ? 'bg-red-600 text-white' : isActive ? 'bg-[#1a56db] text-white' : 'bg-white text-[#1a56db]'}`}>
                    {m.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User block */}
      <div className="border-t border-white/10 pt-4 px-2 mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={handleProfileClick}
            title="My Profile"
            className="w-8 h-8 rounded-full bg-white text-[#1a56db] flex items-center justify-center text-xs font-bold leading-none shadow-sm flex-shrink-0 hover:ring-2 hover:ring-white/50 transition-all cursor-pointer"
          >
            {user ? getInitials(user.name) : 'AY'}
          </button>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-bold text-white truncate leading-none">{user ? user.name : 'Aytenew Y.'}</p>
            <p className="text-[10px] text-blue-100/70 truncate leading-tight mt-0.5">{user ? user.email : 'aytenew@blihmarketing.com'}</p>
          </div>
        </div>
        <button onClick={onLogout} title="Log Out" className="p-1 px-1.5 hover:bg-white/10 rounded-lg text-blue-100 hover:text-rose-300 transition-colors cursor-pointer flex-shrink-0">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
