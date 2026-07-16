import { useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { ChevronRight, Loader2, Navigation, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ATTENDANCE_TAB_PERMISSIONS,
  BUSINESSES_TAB_PERMISSIONS,
  EXIT_TAB_PERMISSIONS,
  FINANCE_TAB_PERMISSIONS,
  MODULE_PERMISSIONS,
  ONBOARDING_TAB_PERMISSIONS,
  PERFORMANCE_TAB_PERMISSIONS,
  PROFILES_TAB_PERMISSIONS,
  PROJECTS_TAB_PERMISSIONS,
  RECRUITMENT_TAB_PERMISSIONS,
  TALENT_TAB_PERMISSIONS,
} from '../../config/tabPermissions';
import { useMyPermissions } from '../../hooks/usePermissions';

type SearchUser = {
  role: string;
  employmentType?: string | null;
} | null | undefined;

type SearchVariant = 'sidebar' | 'rail';

type GlobalSubtabSearchProps = {
  user?: SearchUser;
  variant?: SearchVariant;
  onSelect?: () => void;
};

type CatalogTab = {
  id: string;
  label: string;
  parent: string;
  moduleId: string;
  permissionMap: Record<string, { requires: string[] }>;
  path: (roleSegment: string) => string;
  internAllowed?: boolean;
};

const BATCH_SIZE = 12;

const recruitmentTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'requests', label: 'Requests' },
  { id: 'ready_to_post', label: 'Ready to Post' },
  { id: 'active_posting', label: 'Active Posts' },
  { id: 'ongoing_recruitment', label: 'Applicants' },
  { id: 'my_interviews', label: 'Interviews' },
  { id: 'offers', label: 'Offers' },
  { id: 'offer_templates', label: 'Offer Templates' },
  { id: 'closed_posts', label: 'Closed Posts' },
  { id: 'applicant_forms', label: 'Forms' },
].map((tab) => ({
  ...tab,
  parent: 'Talent Management / Recruitment',
  moduleId: 'talent',
  permissionMap: RECRUITMENT_TAB_PERMISSIONS,
  path: (role: string) => `/${role}/talent/recruitment-${tab.id}`,
}));

const onboardingTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'contract', label: 'Contracts' },
  { id: 'progress', label: 'Progress' },
  { id: 'probation', label: 'Probation' },
  { id: 'policy', label: 'Policies' },
  { id: 'checklists', label: 'Checklists' },
].map((tab) => ({
  ...tab,
  parent: 'Talent Management / Onboarding',
  moduleId: 'talent',
  permissionMap: ONBOARDING_TAB_PERMISSIONS,
  path: (role: string) => `/${role}/talent/onboarding-${tab.id}`,
}));

const profilesTabs = [
  { id: 'create', label: 'Create Profile' },
  { id: 'directory', label: 'Profiles' },
  { id: 'pending_registrations', label: 'Pending Registrations' },
  { id: 'exemption_requests', label: 'Exemption Requests' },
].map((tab) => ({
  ...tab,
  parent: 'Talent Management / People',
  moduleId: 'talent',
  permissionMap: PROFILES_TAB_PERMISSIONS,
  path: (role: string) => `/${role}/talent/profiles-${tab.id}`,
  internAllowed: tab.id === 'events',
}));

const extendedProfilesTabs = [
  { id: 'organogram', label: 'Organogram' },
  { id: 'interns', label: 'Interns' },
  { id: 'organization', label: 'Departments & Positions' },
  { id: 'devices', label: 'Devices' },
  { id: 'events', label: 'Events', internAllowed: true },
  { id: 'archive', label: 'Archive' },
].map((tab) => ({
  ...tab,
  parent: 'People Profiles',
  moduleId: 'profiles',
  permissionMap: PROFILES_TAB_PERMISSIONS,
  path: (role: string) => `/${role}/profiles/${tab.id}`,
}));

const attendanceGroupLabels: Record<string, string> = {
  overview: 'Dashboard',
  calendar: 'Dashboard',
  'check-in': 'Time & Records',
  'check-me-in': 'Time & Records',
  history: 'Time & Records',
  timesheet: 'Time & Records',
  'my-lateness-reason': 'Time & Records',
  'manual-lateness-reason': 'Time & Records',
  'late-reasons': 'Time & Records',
  'memo-log': 'Time & Records',
  requests: 'Requests & Leave',
  leaves: 'Requests & Leave',
  overtime: 'Requests & Leave',
  'special-request': 'Requests & Leave',
  unavailable: 'Requests & Leave',
  'work-from-home': 'Requests & Leave',
  'exit-request': 'Requests & Leave',
};

const internAttendanceTabs = new Set([
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
]);

const attendanceTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'check-in', label: 'Check-ins' },
  { id: 'check-me-in', label: 'Check me in' },
  { id: 'history', label: 'History' },
  { id: 'my-lateness-reason', label: 'My Lateness' },
  { id: 'manual-lateness-reason', label: 'Manual Lateness' },
  { id: 'late-reasons', label: 'Late Reasons' },
  { id: 'requests', label: 'Punctuality' },
  { id: 'timesheet', label: 'Timesheet' },
  { id: 'leaves', label: 'Leaves' },
  { id: 'overtime', label: 'Overtime' },
  { id: 'special-request', label: 'Special Request' },
  { id: 'unavailable', label: 'Unavailable' },
  { id: 'memo-log', label: 'Memo Log' },
  { id: 'work-from-home', label: 'Work-from-Home' },
  { id: 'exit-request', label: 'Exit Request' },
].map((tab) => ({
  ...tab,
  parent: `Attendance & Leave / ${attendanceGroupLabels[tab.id]}`,
  moduleId: 'attendance',
  permissionMap: ATTENDANCE_TAB_PERMISSIONS,
  path: (role: string) => `/${role}/attendance/${tab.id}`,
  internAllowed: internAttendanceTabs.has(tab.id),
}));

const otherTabs: CatalogTab[] = [
  ...[
    { id: 'overview', label: 'Overview' },
    { id: 'performance_review', label: 'Performance Review' },
    { id: 'okrs', label: 'OKRs' },
    { id: 'kpis', label: 'KPIs' },
    { id: 'discipline', label: 'Discipline' },
    { id: 'evaluation_form', label: 'Evaluation Form' },
  ].map((tab) => ({
    ...tab,
    parent: 'Performance',
    moduleId: 'performance',
    permissionMap: PERFORMANCE_TAB_PERMISSIONS,
    path: (role: string) => `/${role}/performance/${tab.id}`,
  })),
  ...[
    { id: 'offboarding', label: 'My Offboarding' },
    { id: 'resign', label: 'Resignation Requests' },
    { id: 'interviews', label: 'Exit Interviews' },
    { id: 'forms', label: 'Template Creation' },
    { id: 'documents', label: 'Process Documents' },
    { id: 'clearance', label: 'Process Execution' },
  ].map((tab) => ({
    ...tab,
    parent: 'Exit & Offboarding',
    moduleId: 'exit',
    permissionMap: EXIT_TAB_PERMISSIONS,
    path: (role: string) => `/${role}/exit/${tab.id}`,
  })),
  ...[
    { id: 'overview', label: 'Overview' },
    { id: 'employee_salary', label: 'Employee Salary' },
    { id: 'salary_payroll', label: 'Salary & Payroll' },
    { id: 'payroll_template', label: 'Pay Templates' },
    { id: 'budget', label: 'Budget' },
    { id: 'exports', label: 'Exports' },
    { id: 'my_payslip', label: 'My Payslip' },
    { id: 'benefits', label: 'Benefits' },
  ].map((tab) => ({
    ...tab,
    parent: 'Workforce Finance',
    moduleId: 'finance',
    permissionMap: FINANCE_TAB_PERMISSIONS,
    path: (role: string) => `/${role}/finance/${tab.id}`,
  })),
  ...[
    { id: 'overview', label: 'Overview', path: () => '/projects' },
    { id: 'all', label: 'All Projects', path: () => '/projects/all' },
    { id: 'mine', label: 'My Projects', path: () => '/projects/my-projects' },
    { id: 'my-tasks', label: 'My Tasks', path: () => '/projects/my-tasks' },
    { id: 'board', label: 'Task Board', path: () => '/projects/board' },
  ].map((tab) => ({
    ...tab,
    parent: 'Projects',
    moduleId: 'projects',
    permissionMap: PROJECTS_TAB_PERMISSIONS,
  })),
  ...[
    { id: 'general', label: 'Business Settings' },
    { id: 'attendance', label: 'Attendance Settings' },
    { id: 'smtp', label: 'SMTP Settings' },
    { id: 'punctuality-messages', label: 'Punctuality Messages' },
    { id: 'subscription', label: 'Subscription' },
  ].map((tab) => ({
    ...tab,
    parent: 'Subscription & Settings',
    moduleId: 'subscription-settings',
    permissionMap: { [tab.id]: { requires: MODULE_PERMISSIONS.settings } },
    path: (role: string) => `/${role}/settings/${tab.id}`,
  })),
  ...[
    { id: 'overview', label: 'Overview' },
    { id: 'plans', label: 'Plans' },
    { id: 'sector_focus', label: 'Sector Focus' },
    { id: 'smtp_providers', label: 'SMTP Providers' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'security', label: 'Security & SSO' },
    { id: 'audit_logs', label: 'Audit Logs' },
    { id: 'notifications', label: 'Notifications' },
  ].map((tab) => ({
    ...tab,
    parent: 'Businesses',
    moduleId: 'businesses',
    permissionMap: BUSINESSES_TAB_PERMISSIONS,
    path: (role: string) => `/${role}/businesses/${tab.id}`,
  })),
];

const catalog: CatalogTab[] = [
  ...recruitmentTabs,
  ...onboardingTabs,
  ...profilesTabs,
  ...extendedProfilesTabs,
  ...attendanceTabs,
  ...otherTabs,
];

function roleSegmentFor(user: SearchUser) {
  if (user?.role === 'Super Admin') return 'super-admin';
  if (user?.role === 'Business Admin') return 'business-admin';
  if (user?.role === 'HR Manager') return 'hr-manager';
  return 'employee';
}

export default function GlobalSubtabSearch({ user, variant = 'sidebar', onSelect }: GlobalSubtabSearchProps) {
  const navigate = useNavigate();
  const { hasAny, isLoading } = useMyPermissions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const roleSegment = roleSegmentFor(user);
  const isInternUser = user?.employmentType === 'intern';

  const availableTabs = useMemo(() => {
    return catalog.filter((item) => {
      const modulePermissions = MODULE_PERMISSIONS[item.moduleId] ?? [];
      const permissionEntry = item.permissionMap[item.id];
      if (isInternUser && item.moduleId !== 'attendance' && !item.internAllowed) return false;
      if (isInternUser && item.moduleId === 'attendance' && !item.internAllowed) return false;
      if (!permissionEntry) return false;
      if (item.moduleId === 'subscription-settings') {
        const hasSettingsAccess =
          user?.role === 'Business Admin' ||
          user?.role === 'Super Admin' ||
          hasAny(...MODULE_PERMISSIONS.settings);
        return hasSettingsAccess;
      }
      return hasAny(...modulePermissions) && hasAny(...permissionEntry.requires);
    });
  }, [hasAny, isInternUser, user?.role]);

  const filteredTabs = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return availableTabs;
    return availableTabs.filter((item) =>
      `${item.label} ${item.parent} ${item.id}`.toLowerCase().includes(term)
    );
  }, [availableTabs, query]);

  const visibleTabs = filteredTabs.slice(0, visibleCount);
  const hasMore = visibleTabs.length < filteredTabs.length;

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open && variant === 'rail') {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open, variant]);

  const selectTab = (item: CatalogTab) => {
    navigate(item.path(roleSegment));
    setOpen(false);
    setQuery('');
    onSelect?.();
  };

  const onResultsScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 32 && hasMore) {
      setVisibleCount((count) => count + BATCH_SIZE);
    }
  };

  const dropdown = open ? (
    <div
      className={`absolute z-[120] overflow-hidden rounded-2xl border border-slate-100 bg-white text-slate-900 shadow-2xl ${
        variant === 'rail' ? 'left-16 top-0 w-[320px]' : 'left-2 right-2 top-[44px]'
      }`}
    >
      {variant === 'rail' && (
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search subtabs..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-9 text-xs font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="border-b border-slate-100 px-4 py-2.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Navigate to subtab</p>
      </div>

      <div className="max-h-[320px] overflow-y-auto py-1.5" onScroll={onResultsScroll}>
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs font-bold text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subtabs...
          </div>
        ) : availableTabs.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Navigation className="mx-auto mb-2 h-8 w-8 text-slate-200" />
            <p className="text-xs font-bold text-slate-500">No subtabs available</p>
          </div>
        ) : filteredTabs.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-slate-200" />
            <p className="text-xs font-bold text-slate-500">No results found</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">Try another subtab or parent section.</p>
          </div>
        ) : (
          <>
            {visibleTabs.map((item) => (
              <button
                key={`${item.parent}-${item.id}`}
                type="button"
                onClick={() => selectTab(item)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-blue-50/70 focus:bg-blue-50/70 focus:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-black text-slate-900">{item.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">{item.parent}</span>
                </span>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
              </button>
            ))}
            {hasMore && (
              <div className="px-4 py-2 text-center text-[11px] font-bold text-slate-400">
                Scroll for more results
              </div>
            )}
          </>
        )}
      </div>
    </div>
  ) : null;

  if (variant === 'rail') {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-blue-100"
          title="Search subtabs"
          aria-label="Search subtabs"
        >
          <Search className="w-5 h-5" />
        </button>
        {dropdown}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative px-2 mb-6">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-100/70" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.currentTarget.value);
          setOpen(true);
        }}
        placeholder="Search..."
        className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border-none rounded-xl py-2 pl-9 pr-9 text-xs text-white placeholder-blue-100/60 focus:outline-none transition-all shadow-inner"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
            setOpen(true);
          }}
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-blue-100/70 hover:bg-white/10 hover:text-white"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {dropdown}
    </div>
  );
}
