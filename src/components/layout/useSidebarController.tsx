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

import type { SidebarProps } from './sidebarTypes';
import {
  ALL_ATTENDANCE_TABS,
  ALL_BUSINESSES_TABS,
  ALL_EXIT_TABS,
  ALL_FINANCE_TABS,
  ALL_ONBOARDING_TABS,
  createPerformanceTabs,
  ALL_PROFILES_TABS,
  ALL_PROJECTS_TABS,
  ALL_RECRUITMENT_TABS,
  ALL_TALENT_TABS,
} from './sidebarTabs';

export function useSidebarController({
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
  const criticalDisciplineCount =
    criticalDisciplineData?.total ?? criticalDisciplineData?.rows?.length ?? 0;
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
    permMap: Record<string, { requires: string[] }>,
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
    { id: 'businesses', label: 'Businesses', icon: Building2, badge: 0 },
    { id: 'permissions', label: 'Roles & Permissions', icon: Shield, badge: 0 },
    { id: 'talent', label: 'Talent Management', icon: UserPlus, badge: 0 },
    { id: 'attendance', label: 'Attendance & Leave', icon: Calendar, badge: 0 },
    { id: 'performance', label: 'Performance', icon: TrendingUp, badge: criticalDisciplineCount },
    { id: 'exit', label: 'Exit & Offboarding', icon: LogOut, badge: 0 },
    { id: 'finance', label: 'Workforce Finance', icon: CircleDollarSign, badge: 0 },
    { id: 'projects', label: 'Projects', icon: BriefcaseBusiness, badge: 0 },
    {
      id: 'subscription-settings',
      label: 'Subscription & Settings',
      icon: SlidersHorizontal,
      badge: 0,
    },
  ] as const;

  const internModuleIds = new Set(['attendance']);
  const mainModules = ALL_MODULES.filter((m) => {
    if (isInternUser && !internModuleIds.has(m.id)) return false;
    if (m.id === 'subscription-settings')
      return (
        user?.role === 'Business Admin' ||
        user?.role === 'Super Admin' ||
        hasAny(...MODULE_PERMISSIONS.settings)
      );
    const required = MODULE_PERMISSIONS[m.id];
    if (!required) return false;
    return hasAny(...required);
  });

  // ── All possible tabs — filtered at render time via allowedTabs() ─────────

  const recruitmentTabs = allowedTabs(ALL_RECRUITMENT_TABS, RECRUITMENT_TAB_PERMISSIONS);
  const onboardingTabs = allowedTabs(ALL_ONBOARDING_TABS, ONBOARDING_TAB_PERMISSIONS);
  const profilesTabs = allowedTabs(ALL_PROFILES_TABS, PROFILES_TAB_PERMISSIONS).filter(
    (tab) => !isInternUser || ['events'].includes(tab.id),
  );
  const attendanceTabs = allowedTabs(ALL_ATTENDANCE_TABS, ATTENDANCE_TAB_PERMISSIONS).filter(
    (tab) =>
      !isInternUser ||
      [
        'calendar',
        'check-me-in',
        'history',
        'requests',
        'leaves',
        'overtime',
        'special-request',
        'unavailable',
        'work-from-home',
        'exit-request',
      ].includes(tab.id),
  );
  type AttendanceTabId = (typeof attendanceTabs)[number]['id'];
  const attendanceTabById = new Map(attendanceTabs.map((tab) => [tab.id, tab]));
  const attendanceGroups = (
    [
      {
        title: 'Dashboard',
        ids: ['overview', 'calendar'],
        labels: { overview: 'Overview', calendar: 'Calendar' },
      },
      {
        title: 'Time & Records',
        ids: [
          'check-in',
          'check-me-in',
          'history',
          'timesheet',
          'my-lateness-reason',
          'manual-lateness-reason',
          'late-reasons',
          'memo-log',
        ],
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
        ids: [
          'requests',
          'leaves',
          'overtime',
          'special-request',
          'unavailable',
          'work-from-home',
          'exit-request',
        ],
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
    ] as Array<{
      title: string;
      ids: AttendanceTabId[];
      labels: Partial<Record<AttendanceTabId, string>>;
    }>
  )
    .map((group) => ({
      title: group.title,
      items: group.ids
        .map((id) => {
          const tab = attendanceTabById.get(id);
          return tab ? { ...tab, label: group.labels[id] ?? tab.label } : null;
        })
        .filter(Boolean) as typeof attendanceTabs,
    }))
    .filter((group) => group.items.length > 0);
  const talentGroups = [
    {
      title: 'Recruitment',
      items: recruitmentTabs.map((tab) => ({
        ...tab,
        id: `recruitment-${tab.id}`,
        label:
          (
            {
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
            } as Record<string, string>
          )[tab.id] ?? tab.label,
      })),
    },
    {
      title: 'Onboarding',
      items: onboardingTabs.map((tab) => ({
        ...tab,
        id: `onboarding-${tab.id}`,
        label:
          (
            {
              overview: 'Overview',
              contract: 'Contracts',
              progress: 'Progress',
              probation: 'Probation',
              checklists: 'Checklists',
              policy: 'Policies',
            } as Record<string, string>
          )[tab.id] ?? tab.label,
      })),
    },
    {
      title: 'People',
      items: profilesTabs
        .filter((tab) =>
          ['create', 'directory', 'pending_registrations', 'exemption_requests'].includes(tab.id),
        )
        .map((tab) => ({
          ...tab,
          id: `profiles-${tab.id}`,
          label:
            (
              {
                create: 'Create Profile',
                directory: 'Profiles',
                pending_registrations: 'Pending Registrations',
                exemption_requests: 'Exemption Requests',
              } as Record<string, string>
            )[tab.id] ?? tab.label,
        })),
    },
  ].filter((group) => group.items.length > 0);
  const exitTabs = allowedTabs(ALL_EXIT_TABS, EXIT_TAB_PERMISSIONS);
  const financeTabs = allowedTabs(ALL_FINANCE_TABS, FINANCE_TAB_PERMISSIONS);
  const projectsTabs = allowedTabs(ALL_PROJECTS_TABS, PROJECTS_TAB_PERMISSIONS);
  const performanceTabs = allowedTabs(
    createPerformanceTabs(criticalDisciplineCount),
    PERFORMANCE_TAB_PERMISSIONS,
  );
  const businessesTabs = allowedTabs(ALL_BUSINESSES_TABS, BUSINESSES_TAB_PERMISSIONS);
  const settingsTabs = [
    { id: 'general', label: 'Business Settings', path: `/${roleSegment}/settings/general` },
    { id: 'attendance', label: 'Attendance Settings', path: `/${roleSegment}/settings/attendance` },
    { id: 'probation', label: 'Probation Settings', path: `/${roleSegment}/settings/probation` },
    { id: 'smtp', label: 'SMTP Settings', path: `/${roleSegment}/settings/smtp` },
    {
      id: 'punctuality-messages',
      label: 'Punctuality Messages',
      path: `/${roleSegment}/settings/punctuality-messages`,
    },
    { id: 'subscription', label: 'Subscription', path: `/${roleSegment}/settings/subscription` },
  ] as const;
  const pathname = location.pathname;
  const isSubscriptionSettingsRoute =
    pathname.includes('/settings') || pathname.endsWith('/subscription');
  const activeSettingsTab = pathname.includes('/settings/attendance')
    ? 'attendance'
    : pathname.includes('/settings/probation')
      ? 'probation'
      : pathname.includes('/settings/smtp')
        ? 'smtp'
        : pathname.includes('/settings/punctuality-messages')
          ? 'punctuality-messages'
          : pathname.includes('/settings/subscription') || pathname.endsWith('/subscription')
            ? 'subscription'
            : 'general';
  const displayModule = isSubscriptionSettingsRoute ? 'subscription-settings' : currentModule;

  const handleModuleClick = (moduleId: MainModule) => {
    setCurrentModule(moduleId);
    if (
      moduleId === 'attendance' ||
      moduleId === 'talent' ||
      moduleId === 'exit' ||
      moduleId === 'finance' ||
      moduleId === 'projects' ||
      moduleId === 'performance' ||
      moduleId === 'businesses' ||
      moduleId === 'permissions' ||
      moduleId === 'subscription-settings'
    ) {
      setIsDetailedView(true);
      if (moduleId === 'businesses') setCurrentBusinessesTab('overview');
      if (moduleId === 'talent') setCurrentTalentTab('recruitment-overview');
    } else {
      setIsDetailedView(false);
    }
    navigate(
      moduleId === 'subscription-settings'
        ? `/${roleSegment}/settings/general`
        : `/${roleSegment}/${moduleId}`,
    );
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

  const portalTitle = isInternUser
    ? 'Intern Portal'
    : user?.departmentName
      ? `${user.departmentName} Portal`
      : `${user?.role || 'Employee'} Portal`;
  const defaultModule = user?.role === 'Employee' ? 'attendance' : 'talent';
  const defaultPath =
    user?.role === 'Employee'
      ? `/${roleSegment}/attendance/check-me-in`
      : `/${roleSegment}/talent/recruitment-overview`;

  // ─── State 1: Detailed two-column sidebar ───────────────────────────────────
  return {
    activeSettingsTab,
    attendanceGroups,
    businessesTabs,
    currentAttendanceTab,
    currentBusinessesTab,
    currentExitTab,
    currentFinanceTab,
    currentModule,
    currentOnboardingTab,
    currentPerformanceTab,
    currentProfilesTab,
    currentProjectsTab,
    currentRecruitmentTab,
    currentTalentTab,
    defaultModule,
    defaultPath,
    displayModule,
    exitTabs,
    financeTabs,
    getInitials,
    groupedChildCls,
    handleModuleClick,
    handleProfileClick,
    isDetailedView,
    mainModules,
    mobileOpen,
    navigate,
    onLogout,
    onMobileClose,
    onboardingTabs,
    openAttendanceGroups,
    openTalentGroups,
    performanceTabs,
    portalTitle,
    profilesTabs,
    projectsTabs,
    recruitmentTabs,
    roleSegment,
    setCurrentAttendanceTab,
    setCurrentBusinessesTab,
    setCurrentExitTab,
    setCurrentFinanceTab,
    setCurrentModule,
    setCurrentOnboardingTab,
    setCurrentPerformanceTab,
    setCurrentProfilesTab,
    setCurrentProjectsTab,
    setCurrentRecruitmentTab,
    setCurrentTalentTab,
    setIsDetailedView,
    setOpenAttendanceGroups,
    setOpenTalentGroups,
    settingsTabs,
    sidebarRoleLabel,
    tabCls,
    talentGroups,
    user,
  };
}

export type SidebarController = ReturnType<typeof useSidebarController>;
