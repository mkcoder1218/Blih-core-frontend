/**
 * TAB PERMISSION MAP
 * ------------------
 * Every sidebar tab is mapped to one or more permission keys.
 * The Sidebar filters its tab arrays through `useMyPermissions().can()` so
 * that tabs appear or disappear based on what the logged-in user's role
 * actually has assigned — no hardcoded role-name checks needed.
 *
 * Adding access to a tab for a role = assign the matching permission key
 * to that role in the Permission Management UI.
 */

export type TabPermissionEntry = {
  /** Permission key(s) — user needs at least one */
  requires: string[];
  /** If true, super admin always sees this tab (default: true for all) */
  superAdminOnly?: boolean;
};

// ─── Recruitment & Hiring ────────────────────────────────────────────────────
export const RECRUITMENT_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:             { requires: ["job.read", "job.manage"] },
  requests:             { requires: ["job.read", "job.manage"] },
  ready_to_post:        { requires: ["job.manage", "job.post"] },
  active_posting:       { requires: ["job.read", "job.manage"] },
  ongoing_recruitment:  { requires: ["job.manage", "applicant.manage"] },
  my_interviews:        { requires: ["interview.schedule", "interview.feedback"] },
  offers:               { requires: ["offer.create", "offer.approve"] },
  closed_posts:         { requires: ["job.read", "job.archive", "job.manage"] },
  applicant_forms:      { requires: ["job_template.read", "job_template.manage"] },
};

// ─── Onboarding & Probation ──────────────────────────────────────────────────
export const ONBOARDING_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:    { requires: ["onboarding.read", "onboarding.manage"] },
  contract:    { requires: ["onboarding.manage", "hr.write", "onboarding.self"] },
  progress:    { requires: ["onboarding.read", "onboarding.manage", "onboarding.self"] },
  probation:   { requires: ["onboarding.read", "onboarding.manage", "onboarding.self"] },
  checklists:  { requires: ["onboarding.read", "onboarding.manage", "onboarding.self"] },
};

// ─── People Profiles ─────────────────────────────────────────────────────────
export const PROFILES_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:     { requires: ["hr.read", "hr.write"] },
  create:       { requires: ["hr.write"] },
  bulk_create:  { requires: ["hr.write"] },
  organogram:   { requires: ["profiles.read", "hr.read"] },
  directory:    { requires: ["profiles.read", "hr.read"] },
  events:       { requires: ["profiles.read", "hr.read"] },
  archive:      { requires: ["hr.write"] },
};

// ─── Attendance & Leave ──────────────────────────────────────────────────────
export const ATTENDANCE_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:       { requires: ["attendance.read", "attendance.manage"] },
  "check-in":     { requires: ["attendance.manage"] },           // HR check-in dashboard
  "check-me-in":  { requires: ["attendance.self"] },             // self check-in
  history:        { requires: ["attendance.self", "attendance.read"] },
  "late-reasons": { requires: ["attendance.manage"] },
  requests:       { requires: ["attendance.self", "leave.read", "leave.approve"] },
  timesheet:      { requires: ["attendance.read", "attendance.manage"] },
  leaves:         { requires: ["leave.read", "leave.approve", "attendance.self"] },
  overtime:       { requires: ["leave.read", "leave.approve", "attendance.self"] },
  "memo-log":     { requires: ["attendance.manage"] },
  "work-from-home": { requires: ["attendance.self", "leave.approve"] },
};

// ─── Performance ─────────────────────────────────────────────────────────────
export const PERFORMANCE_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:           { requires: ["performance.read", "performance.manage"] },
  performance_review: { requires: ["performance.read", "performance.manage"] },
  okrs:               { requires: ["performance.read", "performance.manage", "performance.self"] },
  kpis:               { requires: ["performance.read", "performance.manage", "performance.self"] },
  discipline:         { requires: ["performance.manage", "hr.write"] },
  evaluation_form:    { requires: ["performance.read", "performance.manage", "performance.self"] },
};

// ─── Career Management (Talent) ──────────────────────────────────────────────
export const TALENT_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview: { requires: ["performance.read", "performance.manage", "career.self"] },
  career:   { requires: ["performance.manage", "career.self"] },
  training: { requires: ["performance.read", "performance.manage", "career.self"] },
  culture:  { requires: ["profiles.read", "hr.read", "career.self"] },
};

// ─── Exit & Offboarding ──────────────────────────────────────────────────────
export const EXIT_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:     { requires: ["hr.read", "hr.write"] },
  offboarding:  { requires: ["hr.read", "hr.write"] },
  resign:       { requires: ["hr.write", "exit.self"] },
  interviews:   { requires: ["hr.read", "hr.write"] },
  documents:    { requires: ["hr.write", "exit.self"] },
  clearance:    { requires: ["hr.write", "exit.self"] },
  forms:        { requires: ["hr.read", "hr.write", "exit.self"] },
};

// ─── Workforce Finance ───────────────────────────────────────────────────────
export const FINANCE_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:         { requires: ["finance.read", "finance.manage"] },
  salary_payroll:   { requires: ["finance.read", "finance.manage", "payroll.read", "payroll.run"] },
  payroll_template: { requires: ["finance.manage", "payroll.run"] },
  budget:           { requires: ["finance.read", "finance.manage", "budget.read"] },
  expense:          { requires: ["finance.manage", "expense.submit"] },
  benefits:         { requires: ["finance.read", "finance.manage", "benefits.read"] },
};

// ─── Businesses (Super Admin) ─────────────────────────────────────────────────
export const BUSINESSES_TAB_PERMISSIONS: Record<string, TabPermissionEntry> = {
  overview:     { requires: ["settings.read", "settings.update"], superAdminOnly: true },
  plans:        { requires: ["module.manage"], superAdminOnly: true },
  sector_focus: { requires: ["settings.update"], superAdminOnly: true },
  integrations: { requires: ["settings.update"], superAdminOnly: true },
  security:     { requires: ["settings.update"], superAdminOnly: true },
  audit_logs:   { requires: ["settings.read"], superAdminOnly: true },
  notifications:{ requires: ["settings.update"], superAdminOnly: true },
};

// ─── Top-level module visibility ─────────────────────────────────────────────
// A module appears in the sidebar only if the user has at least one of these.
// Use an empty array `[]` to make a module super-admin-only (isSuperAdmin
// bypass in useMyPermissions will still grant it; regular users get nothing).
export const MODULE_PERMISSIONS: Record<string, string[]> = {
  recruitment: ["job.read", "job.manage", "applicant.read", "interview.schedule"],
  onboarding:  ["onboarding.read", "onboarding.manage", "onboarding.self"],
  profiles:    ["hr.read", "hr.write", "profiles.read"],
  attendance:  ["attendance.read", "attendance.manage", "attendance.self", "leave.read"],
  performance: ["performance.read", "performance.manage", "performance.self"],
  talent:      ["performance.read", "performance.manage", "career.self"],
  exit:        ["hr.read", "hr.write", "exit.self"],
  finance:     ["finance.read", "finance.manage", "payroll.read", "expense.submit", "benefits.read"],
  // Platform-level modules — super admin only. No regular permission key unlocks these.
  businesses:  [],
  permissions: [],
};
