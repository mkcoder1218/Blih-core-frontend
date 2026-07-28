export const ALL_RECRUITMENT_TABS = [
  { id: 'overview', label: 'Overview', badge: 0 },
  { id: 'requests', label: 'Requests', badge: 0 },
  { id: 'ready_to_post', label: 'Ready to Post', badge: 0 },
  { id: 'active_posting', label: 'Active Posting', badge: 0 },
  { id: 'ongoing_recruitment', label: 'Ongoing Recruitment', badge: 0 },
  { id: 'my_interviews', label: 'My Interviews', badge: 0 },
  { id: 'offers', label: 'Offers', badge: 0 },
  { id: 'offer_templates', label: 'Offer Templates', badge: 0 },
  { id: 'closed_posts', label: 'Closed Posts', badge: 0 },
  { id: 'applicant_forms', label: 'Applicant Forms', badge: 0 },
] as const;

export const ALL_ONBOARDING_TABS = [
  { id: 'overview', label: 'Overview', badge: 0 },
  { id: 'progress', label: 'Progress', badge: 0 },
  { id: 'probation', label: 'Probation', badge: 0 },
  { id: 'policy', label: 'Policies', badge: 0 },
  { id: 'checklists', label: 'Checklists', badge: 0 },
] as const;

export const ALL_PROFILES_TABS = [
  { id: 'create', label: 'Create', badge: 0 },
  { id: 'bulk_create', label: 'Bulk Create', badge: 0 },
  {
    id: 'contract_templates',
    label: 'Contract Templates',
    badge: 0,
  },
  { id: 'organogram', label: 'Organogram', badge: 0 },
  { id: 'directory', label: 'Directory', badge: 0 },
  { id: 'left', label: 'Left Employees', badge: 0 },
  { id: 'interns', label: 'Interns', badge: 0 },
  {
    id: 'organization',
    label: 'Departments & Positions',
    badge: 0,
  },
  { id: 'devices', label: 'Devices', badge: 0 },
  { id: 'events', label: 'Events', badge: 0 },
  { id: 'archive', label: 'Archive', badge: 0 },
  {
    id: 'pending_registrations',
    label: 'Pending Registrations',
    badge: 0,
  },
  {
    id: 'exemption_requests',
    label: 'Exemption Requests',
    badge: 0,
  },
] as const;

export const ALL_ATTENDANCE_TABS = [
  { id: 'calendar', label: 'Calendar', badge: 0 },
  { id: 'check-in', label: 'Check-ins', badge: 0 },
  { id: 'check-me-in', label: 'Check me in', badge: 0 },
  { id: 'history', label: 'History', badge: 0 },
  { id: 'my-lateness-reason', label: 'My Lateness Reason', badge: 0 },
  { id: 'manual-lateness-reason', label: 'Manual Lateness', badge: 0 },
  { id: 'late-reasons', label: 'Late Reasons', badge: 0 },
  { id: 'requests', label: 'Punctuality', badge: 0 },
  { id: 'timesheet', label: 'Timesheet', badge: 0 },
  { id: 'leaves', label: 'Leaves', badge: 0 },
  { id: 'overtime', label: 'Overtime', badge: 0 },
  { id: 'special-request', label: 'Special Request', badge: 0 },
  { id: 'unavailable', label: 'Unavailable', badge: 0 },
  { id: 'memo-log', label: 'Memo Log', badge: 0 },
  { id: 'work-from-home', label: 'Work-from-Home', badge: 0 },
  { id: 'exit-request', label: 'Exit Request', badge: 0 },
] as const;

export const ALL_TALENT_TABS = [
  { id: 'overview', label: 'Overview', badge: 0 },
  { id: 'career', label: 'Career', badge: 0 },
  { id: 'training', label: 'Training & Skills', badge: 0 },
  { id: 'culture', label: 'Culture', badge: 0 },
  { id: 'development', label: 'Development', badge: 0 },
] as const;

export const ALL_EXIT_TABS = [
  {
    id: 'my-exit',
    label: 'My Exit',
    badge: 0,
  },
  {
    id: 'requests',
    label: 'Exit Requests',
    badge: 0,
  },
  {
    id: 'clearance',
    label: 'Clearance',
    badge: 0,
  },
  {
    id: 'reasons',
    label: 'Exit Reasons',
    badge: 0,
  },
] as const;

export const ALL_FINANCE_TABS = [
  { id: 'overview', label: 'Overview', badge: 0 },
  { id: 'employee_salary', label: 'Employee Salary', badge: 0 },
  { id: 'salary_payroll', label: 'Salary & Payroll', badge: 0 },
  { id: 'payroll_template', label: 'Pay Templates', badge: 0 },
  { id: 'budget', label: 'Budget', badge: 0 },
  { id: 'exports', label: 'Exports', badge: 0 },
  { id: 'my_payslip', label: 'My Payslip', badge: 0 },
  { id: 'benefits', label: 'Benefits', badge: 0 },
] as const;

export const ALL_PROJECTS_TABS = [
  { id: 'overview', label: 'Overview', badge: 0 },
  { id: 'all', label: 'All Projects', badge: 0 },
  { id: 'mine', label: 'My Projects', badge: 0 },
  { id: 'my-tasks', label: 'My Tasks', badge: 0 },
  { id: 'board', label: 'Task Board', badge: 0 },
] as const;

export const createPerformanceTabs = (criticalDisciplineCount: number) =>
  [
    { id: 'overview', label: 'Overview', badge: 0 },
    { id: 'performance_review', label: 'Performance Review', badge: 0 },
    { id: 'okrs', label: 'OKRs', badge: 0 },
    { id: 'kpis', label: 'KPIs', badge: 0 },
    { id: 'discipline', label: 'Discipline', badge: criticalDisciplineCount },
    { id: 'evaluation_form', label: 'Evaluation Form', badge: 0 },
  ] as const;

export const ALL_BUSINESSES_TABS = [
  { id: 'overview', label: 'Overview', badge: 0 },
  { id: 'plans', label: 'Plans', badge: 0 },
  { id: 'sector_focus', label: 'Sector Focus', badge: 0 },
  { id: 'smtp_providers', label: 'SMTP Providers', badge: 0 },
  { id: 'integrations', label: 'Integrations', badge: 0 },
  { id: 'security', label: 'Security & SSO', badge: 0 },
  { id: 'audit_logs', label: 'Audit Logs', badge: 0 },
  { id: 'notifications', label: 'Notifications', badge: 0 },
] as const;

export const ALL_BRAIN_TABS = [
  { id: 'overview', label: 'Overview', badge: 0 },
  { id: 'categories', label: 'Categories', badge: 0 },
  { id: 'knowledge', label: 'Knowledge', badge: 0 },
  { id: 'procedures', label: 'Procedures', badge: 0 },
  { id: 'policies', label: 'Policies', badge: 0 },
] as const;
