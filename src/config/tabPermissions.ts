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

  /** If true, super admin always sees this tab */
  superAdminOnly?: boolean;
};

// ─── Recruitment & Hiring ────────────────────────────────────────────────────

export const RECRUITMENT_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "job.manage",
      "job.post",
      "applicant.manage",
    ],
  },

  requests: {
    requires: [
      "job.manage",
      "job.post",
    ],
  },

  ready_to_post: {
    requires: [
      "job.manage",
      "job.post",
    ],
  },

  active_posting: {
    requires: [
      "job.manage",
      "job.post",
      "applicant.manage",
    ],
  },

  ongoing_recruitment: {
    requires: [
      "job.manage",
      "applicant.manage",
    ],
  },

  my_interviews: {
    requires: [
      "interview.schedule",
      "interview.feedback",
    ],
  },

  offers: {
    requires: [
      "offer.create",
      "offer.approve",
    ],
  },

  offer_templates: {
    requires: [
      "offer.create",
      "offer.approve",
    ],
  },

  closed_posts: {
    requires: [
      "job.archive",
      "job.manage",
    ],
  },

  applicant_forms: {
    requires: [
      "job_template.read",
      "job_template.manage",
    ],
  },
};

// ─── Onboarding & Probation ──────────────────────────────────────────────────

export const ONBOARDING_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "onboarding.read",
      "onboarding.manage",
    ],
  },

  contract: {
    requires: [
      "onboarding.manage",
      "hr.write",
      "onboarding.self",
    ],
  },

  progress: {
    requires: [
      "onboarding.read",
      "onboarding.manage",
      "onboarding.self",
    ],
  },

  probation: {
    requires: [
      "onboarding.read",
      "onboarding.manage",
      "onboarding.self",
    ],
  },

  policy: {
    requires: [
      "onboarding.read",
      "onboarding.manage",
      "onboarding.self",
    ],
  },

  checklists: {
    requires: [
      "onboarding.read",
      "onboarding.manage",
      "onboarding.self",
    ],
  },
};

// ─── People Profiles ─────────────────────────────────────────────────────────

export const PROFILES_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  create: {
    requires: ["hr.write"],
  },

  bulk_create: {
    requires: ["hr.write"],
  },

  organogram: {
    requires: [
      "profiles.read",
      "hr.read",
      "hr.write",
      "department.create",
      "department.update",
      "position.create",
      "position.update",
    ],
  },

  directory: {
    requires: [
      "profiles.read",
      "hr.read",
    ],
  },

  interns: {
    requires: [
      "profiles.read",
      "hr.read",
    ],
  },

  organization: {
    requires: [
      "department.create",
      "department.update",
      "position.create",
      "position.update",
    ],
  },

  devices: {
    requires: [
      "device.read",
      "device.approve",
    ],
  },

  events: {
    requires: [
      "profiles.read",
      "hr.read",
      "profiles.self",
    ],
  },

  archive: {
    requires: ["hr.write"],
  },

  pending_registrations: {
    requires: [
      "hr.read",
      "hr.write",
    ],
  },

  exemption_requests: {
    requires: [
      "hr.read",
      "hr.write",
      "user.update",
      "attendance.manage",
    ],
  },
};

// ─── Attendance & Leave ──────────────────────────────────────────────────────

export const ATTENDANCE_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "attendance.read",
      "attendance.manage",
    ],
  },

  calendar: {
    requires: [
      "profiles.read",
      "hr.read",
      "profiles.self",
      "attendance.self",
      "attendance.read",
      "attendance.manage",
    ],
  },

  "check-in": {
    requires: [
      "attendance.manage",
    ],
  },

  "check-me-in": {
    requires: [
      "attendance.self",
    ],
  },

  history: {
    requires: [
      "attendance.self",
      "attendance.read",
    ],
  },

  "my-lateness-reason": {
    requires: [
      "attendance.self",
    ],
  },

  "manual-lateness-reason": {
    requires: [
      "attendance.manage",
      "attendance.checkin_correction.approve",
    ],
  },

  "late-reasons": {
    requires: [
      "attendance.late_reason.read",
      "attendance.manage",
    ],
  },

  requests: {
    requires: [
      "attendance.self",
      "attendance.manage",
      "leave.read",
      "leave.approve",
      "attendance.checkin_correction.approve",
    ],
  },

  timesheet: {
    requires: [
      "attendance.read",
      "attendance.manage",
    ],
  },

  leaves: {
    requires: [
      "leave.read",
      "leave.approve",
      "attendance.self",
    ],
  },

  overtime: {
    requires: [
      "leave.read",
      "leave.approve",
      "attendance.self",
    ],
  },

  "special-request": {
    requires: [
      "attendance.self",
      "attendance.manage",
    ],
  },

  unavailable: {
    requires: [
      "attendance.self",
      "attendance.manage",
      "attendance.checkin_correction.approve",
    ],
  },

  "memo-log": {
    requires: [
      "attendance.manage",
    ],
  },

  "work-from-home": {
    requires: [
      "attendance.self",
      "leave.approve",
    ],
  },

  "exit-request": {
    requires: [
      "exit.self",
      "attendance.self",
    ],
  },
};

// ─── Performance ─────────────────────────────────────────────────────────────

export const PERFORMANCE_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "performance.read",
      "performance.manage",
    ],
  },

  performance_review: {
    requires: [
      "performance.read",
      "performance.manage",
    ],
  },

  okrs: {
    requires: [
      "performance.read",
      "performance.manage",
      "performance.self",
    ],
  },

  kpis: {
    requires: [
      "performance.read",
      "performance.manage",
      "performance.self",
    ],
  },

  discipline: {
    requires: [
      "performance.self",
      "performance.read",
      "performance.manage",
      "hr.write",
    ],
  },

  evaluation_form: {
    requires: [
      "performance.read",
      "performance.manage",
      "performance.self",
    ],
  },
};

// ─── Career Management ───────────────────────────────────────────────────────

export const TALENT_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "performance.read",
      "performance.manage",
      "career.self",
    ],
  },

  training: {
    requires: [
      "performance.read",
      "performance.manage",
      "career.self",
    ],
  },

  culture: {
    requires: [
      "profiles.read",
      "hr.read",
      "career.self",
    ],
  },

  development: {
    requires: [
      "career.self",
      "performance.read",
      "performance.manage",
    ],
  },
};

// ─── Exit & Offboarding ──────────────────────────────────────────────────────

export const EXIT_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  "my-exit": {
    requires: [
      "exit.self",
    ],
  },

  requests: {
    requires: [
      "hr.read",
      "hr.write",
    ],
  },

  clearance: {
    requires: [
      "hr.read",
      "hr.write",
    ],
  },

  reasons: {
    requires: [
      "hr.write",
    ],
  },
};

// ─── Workforce Finance ───────────────────────────────────────────────────────

export const FINANCE_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "finance.read",
      "finance.manage",
    ],
  },

  employee_salary: {
    requires: [
      "salary_employee_read",
      "finance.manage",
    ],
  },

  salary_payroll: {
    requires: [
      "finance.read",
      "finance.manage",
    ],
  },

  payroll_template: {
    requires: [
      "finance.manage",
    ],
  },

  budget: {
    requires: [
      "finance.read",
      "finance.manage",
    ],
  },

  exports: {
    requires: [
      "finance.read",
      "finance.manage",
    ],
  },

  my_payslip: {
    requires: [
      "finance.mine",
    ],
  },

  benefits: {
    requires: [
      "finance.read",
      "finance.manage",
      "benefits.read",
      "finance.mine",
    ],
  },
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const PROJECTS_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "project.read",
      "project.manage",
    ],
  },

  all: {
    requires: [
      "project.read",
      "project.manage",
    ],
  },

  mine: {
    requires: [
      "project.read",
      "project.manage",
      "project.self",
    ],
  },

  "my-tasks": {
    requires: [
      "project.read",
      "project.manage",
      "project.self",
      "project.task",
    ],
  },

  board: {
    requires: [
      "project.read",
      "project.manage",
      "project.self",
      "project.task",
    ],
  },
};

// ─── Businesses / Platform Settings ──────────────────────────────────────────

export const BUSINESSES_TAB_PERMISSIONS: Record<
  string,
  TabPermissionEntry
> = {
  overview: {
    requires: [
      "settings.read",
      "settings.update",
    ],
    superAdminOnly: true,
  },

  plans: {
    requires: [
      "module.manage",
    ],
    superAdminOnly: true,
  },

  sector_focus: {
    requires: [
      "settings.update",
    ],
    superAdminOnly: true,
  },

  smtp_providers: {
    requires: [
      "settings.update",
    ],
    superAdminOnly: true,
  },

  integrations: {
    requires: [
      "settings.update",
    ],
    superAdminOnly: true,
  },

  security: {
    requires: [
      "settings.update",
    ],
    superAdminOnly: true,
  },

  audit_logs: {
    requires: [
      "settings.read",
    ],
    superAdminOnly: true,
  },

  notifications: {
    requires: [
      "settings.update",
    ],
    superAdminOnly: true,
  },
};

// ─── Top-level module visibility ─────────────────────────────────────────────

export const MODULE_PERMISSIONS: Record<
  string,
  string[]
> = {
  recruitment: [
    "job.manage",
    "job.post",
    "applicant.manage",
    "interview.schedule",
    "interview.feedback",
    "offer.create",
    "offer.approve",
    "job_template.manage",
  ],

  onboarding: [
    "onboarding.read",
    "onboarding.manage",
    "onboarding.self",
  ],

  profiles: [
    "hr.read",
    "hr.write",
    "profiles.read",
    "profiles.self",
    "department.create",
    "department.update",
    "position.create",
    "position.update",
    "device.read",
    "device.approve",
  ],

  attendance: [
    "attendance.read",
    "attendance.manage",
    "attendance.self",
    "attendance.late_reason.read",
    "attendance.checkin_correction.request",
    "attendance.checkin_correction.approve",
    "leave.read",
  ],

  performance: [
    "performance.read",
    "performance.manage",
    "performance.self",
  ],

  talent: [
    "job.manage",
    "job.post",
    "applicant.manage",
    "interview.schedule",
    "interview.feedback",
    "offer.create",
    "offer.approve",
    "job_template.manage",

    "onboarding.read",
    "onboarding.manage",
    "onboarding.self",

    "hr.read",
    "hr.write",
    "profiles.read",
    "profiles.self",

    "department.create",
    "department.update",
    "position.create",
    "position.update",

    "device.read",
    "device.approve",

    "performance.read",
    "performance.manage",
    "career.self",

    "exit.self",
  ],

  exit: [
    "hr.read",
    "hr.write",
    "exit.self",
  ],

  finance: [
    "finance.read",
    "finance.manage",
    "finance.mine",
    "salary_employee_read",
  ],

  projects: [
    "project.read",
    "project.manage",
    "project.self",
    "project.task",
  ],

  "subscription-settings": [
    "settings.read",
    "settings.update",
  ],

  settings: [
    "settings.read",
    "settings.update",
  ],

  businesses: [],

  permissions: [],
};
