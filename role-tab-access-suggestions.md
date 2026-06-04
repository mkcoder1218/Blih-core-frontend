# Blih ERP — Role-Based Tab Access Suggestions

**Document Type:** Design Recommendation  
**Date:** June 4, 2026  
**Scope:** Frontend tab/module visibility and backend permission alignment

---

## Overview

The Blih ERP currently has four user-facing roles and one platform-level role. This document maps every module and tab to the appropriate role(s), flags gaps in the current implementation, and provides reasoning for each access decision.

### Roles in Scope

| Role Key | Display Name | Scope |
|---|---|---|
| `PLATFORM_SUPER_ADMIN` | Super Admin | Cross-tenant platform administration |
| `BUSINESS_ADMIN` | Business Admin | Full access within a single business tenant |
| `HR_MANAGER` | HR Manager | HR operations within a business tenant |
| `FINANCE_MANAGER` | Finance Manager | Finance operations (backend exists, no frontend role yet) |
| `DEPARTMENT_HEAD` | Department Head | Approval authority within a department |
| *(base)* | Employee | Self-service only |

> **Note:** `FINANCE_MANAGER` and `DEPARTMENT_HEAD` currently exist only in the backend (`requireRole` checks). The frontend has no sidebar variant for them. Recommendations for how to integrate them are included below.

---

## Module & Tab Access Matrix

### Legend
| Symbol | Meaning |
|---|---|
| ✅ | Full access — can view and take action |
| 👁 | Read-only access |
| ❌ | No access — tab should be hidden |
| ⚠️ | Partial access — limited to own data or scoped subset |
| 🔴 | Currently missing in implementation — needs to be added |

---

## 1. Recruitment & Hiring

**Who should see this module:** Business Admin, HR Manager. Department Heads should have read access to requests affecting their department.

| Tab | Super Admin | Business Admin | HR Manager | Dept Head | Employee |
|---|---|---|---|---|---|
| Overview | ❌ | ✅ | ✅ | 👁 | ❌ |
| Requests | ❌ | ✅ | ✅ | ⚠️ Own dept only | ❌ |
| Ready to Post | ❌ | ✅ | ✅ | ❌ | ❌ |
| Active Posting | ❌ | ✅ | ✅ | 👁 | ❌ |
| Ongoing Recruitment | ❌ | ✅ | ✅ | ❌ | ❌ |
| My Interviews | ❌ | ✅ | ✅ | ✅ | ✅ (if assigned as interviewer) |
| Offers | ❌ | ✅ | ✅ | ❌ | ❌ |
| Closed Posts | ❌ | ✅ | ✅ | ❌ | ❌ |
| Applicant Forms | ❌ | ✅ | ✅ | ❌ | ❌ |

**Rationale:**
- Department Heads often initiate or review job requests for their teams. The Requests tab scoped to their department is a common real-world workflow.
- My Interviews is the one tab that makes sense for Employees who are assigned as interviewers internally — this is a valid use case (peer interviews, technical evaluations).
- Super Admin manages platform health, not individual business hiring pipelines.

**Current Gap 🔴:** The Requests tab shows all requests with no department-scoped filter for non-HR roles. A `DEPARTMENT_HEAD` role variant for the sidebar and a department filter on the Requests view needs to be added.

---

## 2. Onboarding & Probation

**Who should see this module:** Business Admin, HR Manager. New employees during their own onboarding.

| Tab | Super Admin | Business Admin | HR Manager | Dept Head | Employee |
|---|---|---|---|---|---|
| Overview | ❌ | ✅ | ✅ | 👁 | ❌ |
| Contract | ❌ | ✅ | ✅ | ❌ | ⚠️ Own contract only |
| Progress | ❌ | ✅ | ✅ | 👁 Own dept | ⚠️ Own progress only |
| Probation | ❌ | ✅ | ✅ | 👁 Own dept | ⚠️ Own probation status |
| Checklists | ❌ | ✅ | ✅ | ❌ | ⚠️ Own checklists |

**Rationale:**
- Employees actively onboarding or on probation should see their own contract, progress, and checklist items — this is a self-service workflow.
- Department Heads benefit from visibility into onboarding progress within their team, but should not manage templates or other departments.

**Current Gap 🔴:** The Onboarding module is currently hidden from Employees entirely. Self-service onboarding is handled through the public `CandidateOnboardingPage` (pre-login). Post-login onboarding views for active employees on probation are not yet surfaced in the main app shell.

---

## 3. People Profiles

**Who should see this module:** Business Admin, HR Manager manage it. Employees should access a read-only directory.

| Tab | Super Admin | Business Admin | HR Manager | Dept Head | Employee |
|---|---|---|---|---|---|
| Overview | ❌ | ✅ | ✅ | 👁 | ❌ |
| Create | ❌ | ✅ | ✅ | ❌ | ❌ |
| Bulk Create | ❌ | ✅ | ✅ | ❌ | ❌ |
| Organogram | ❌ | ✅ | ✅ | ✅ | ✅ |
| Directory | ❌ | ✅ | ✅ | ✅ | ✅ (read-only) |
| Events | ❌ | ✅ | ✅ | ✅ | ✅ |
| Archive | ❌ | ✅ | ✅ | ❌ | ❌ |

**Rationale:**
- Organogram, Directory, and Events are low-risk and improve internal transparency — all employees should see them.
- Create, Bulk Create, and Archive are HR-administrative actions. Restrict to HR Manager and above.
- Super Admin does not operate within a specific business's people data.

**Current Gap 🔴:** The Profiles module is not accessible to Employees at all in the current sidebar. Exposing read-only Directory, Organogram, and Events tabs for employees would add meaningful value without any security risk.

---

## 4. Attendance & Leave

This module already has a split implementation (HR view vs. Employee view) — the most developed role-based branching in the app. The table below confirms and extends the current logic.

| Tab | Super Admin | Business Admin | HR Manager | Dept Head | Employee |
|---|---|---|---|---|---|
| Overview (HR Check-ins dashboard) | ❌ | ✅ | ✅ | 👁 Own dept | ❌ |
| Check me in (self) | ❌ | ⚠️ (also HR) | ⚠️ (also HR) | ✅ | ✅ |
| History | ❌ | ✅ (all staff) | ✅ (all staff) | ⚠️ Own only | ✅ Own only |
| Late Reasons | ❌ | ✅ | ✅ | ❌ | ❌ |
| Requests | ❌ | ✅ | ✅ | ⚠️ Own dept | ✅ Own only |
| Timesheet | ❌ | ✅ | ✅ | ⚠️ Own dept | ❌ |
| Leaves | ❌ | ✅ | ✅ | ⚠️ Own dept approval | ✅ Own only |
| Overtime | ❌ | ✅ | ✅ | ⚠️ Own dept approval | ✅ Own only |
| Memo Log | ❌ | ✅ | ✅ | ❌ | ❌ |
| Work-from-Home | ❌ | ✅ | ✅ | ⚠️ Own dept approval | ✅ Own only |

**Rationale:**
- The current implementation correctly hides Late Reasons, Timesheet, and Memo Log from employees.
- Department Heads should be able to approve leave, overtime, and WFH for their own team — this is standard in most orgs and the backend already has `DEPARTMENT_HEAD` in expense approval routes. Extending this to attendance is a natural next step.

**Current Gap 🔴:** Department Heads have no attendance-related tab visibility in the frontend. Their approvals are currently only reachable through email/notification flows.

---

## 5. Performance

**Who should see this module:** HR Manager and Business Admin manage reviews. Employees see their own performance data. Department Heads participate in appraisals.

| Tab | Super Admin | Business Admin | HR Manager | Dept Head | Employee |
|---|---|---|---|---|---|
| Overview | ❌ | ✅ | ✅ | 👁 Own dept | ⚠️ Own data |
| Performance Review | ❌ | ✅ | ✅ | ✅ (participant) | ⚠️ Own reviews |
| OKRs | ❌ | ✅ | ✅ | ✅ Own dept | ✅ Own OKRs |
| KPIs | ❌ | ✅ | ✅ | ✅ Own dept | 👁 Own KPIs |
| Discipline | ❌ | ✅ | ✅ | 👁 Own dept | ❌ |
| Evaluation Form | ❌ | ✅ | ✅ | ✅ (fill in) | ✅ (fill in) |

**Rationale:**
- OKRs and Performance Reviews are most valuable when employees can see and update their own goals. Both HR and Employees should have access with scope differences.
- Discipline records are sensitive — employees should not have access even to their own through a table view. HR communicates discipline through formal letters and notifications.
- Evaluation Form needs to be accessible to anyone participating in a review cycle.

**Current Gap 🔴:** The Performance module is currently accessible to HR/Admin only. Employee self-service views (own OKRs, own review participation) are not yet exposed in the sidebar.

---

## 6. Career Management (Talent)

| Tab | Super Admin | Business Admin | HR Manager | Dept Head | Employee |
|---|---|---|---|---|---|
| Overview | ❌ | ✅ | ✅ | 👁 | ⚠️ Own pending items |
| Career | ❌ | ✅ | ✅ | ✅ (nominate) | ✅ (view own path) |
| Training & Skills | ❌ | ✅ | ✅ | ✅ (approve dept) | ✅ (request training) |
| Culture | ❌ | ✅ | ✅ | ✅ | ✅ |

**Rationale:**
- Culture initiatives are company-wide communication — all employees should see them.
- Employees should be able to request training and view their career path. This is standard in any modern HRMS.
- Department Heads should be able to nominate direct reports for promotions and approve training within budget authority.

**Current Gap 🔴:** Career Management is HR-only in the current sidebar. Employees cannot request training or view career paths through the main app.

---

## 7. Exit & Offboarding

| Tab | Super Admin | Business Admin | HR Manager | Dept Head | Employee |
|---|---|---|---|---|---|
| Overview | ❌ | ✅ | ✅ | 👁 Own dept | ❌ |
| Offboarding Requests | ❌ | ✅ | ✅ | 👁 | ❌ |
| Resign | ❌ | ✅ | ✅ | ❌ | ✅ (submit own) |
| Interviews | ❌ | ✅ | ✅ | 👁 | ❌ |
| Documents | ❌ | ✅ | ✅ | ❌ | ⚠️ Own exit docs |
| Clearance Checklist | ❌ | ✅ | ✅ | ⚠️ Own dept steps | ⚠️ Own checklist status |
| Forms | ❌ | ✅ | ✅ | ❌ | ⚠️ Own assigned forms |

**Rationale:**
- Resign is a self-service action. Employees should be able to submit their own resignation directly from the app.
- During the exit process, the departing employee should see their clearance status and assigned exit documents. Hiding this entirely creates unnecessary back-and-forth with HR.
- Department Heads participate in the clearance workflow (asset return, handover steps).

**Current Gap 🔴:** The Exit module is completely hidden from Employees. At minimum, the Resign tab and a read-only Clearance Checklist status view should be accessible to them.

---

## 8. Workforce Finance

Finance is the most sensitive module. Access should be carefully scoped.

| Tab | Super Admin | Business Admin | HR Manager | Finance Manager | Dept Head | Employee |
|---|---|---|---|---|---|---|
| Overview | ❌ | ✅ | 👁 | ✅ | 👁 Own dept budget | ❌ |
| Salary | ❌ | ✅ | 👁 | ✅ | ⚠️ Own dept range | ❌ |
| Payroll | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Budget | ❌ | ✅ | ❌ | ✅ | ⚠️ Own dept budget | ❌ |
| Expense | ❌ | ✅ | ❌ | ✅ | ✅ (submit + approve dept) | ✅ (submit own) |
| Benefits | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ (view own) |

**Rationale:**
- Payroll is strictly Finance Manager / Business Admin. HR Manager should not process payroll cycles.
- HR Manager benefits from salary overview for workforce planning but should not see payroll processing data.
- Expense submission is appropriate for all employees — this is standard self-service.
- Benefits is safe to expose to all employees (read-only own benefits).
- Department Heads need budget visibility for their teams and the ability to approve department expenses (the backend `requireRole` already supports this).

**Current Gap 🔴:** Finance Manager, Department Head expense approval, and Employee expense submission/benefits views are entirely absent from the frontend.

---

## 9. Businesses (Platform Super Admin only)

| Tab | Super Admin | All Other Roles |
|---|---|---|
| Overview | ✅ | ❌ |
| Plans | ✅ | ❌ |
| Sector Focus | ✅ | ❌ |
| Integrations | ✅ | ❌ |
| Security & SSO | ✅ | ❌ |
| Audit Logs | ✅ | ❌ |
| Notifications | ✅ | ❌ |

**Rationale:** This is a correct, well-implemented pattern. No changes needed.

**Current Gap 🔴 (minor):** Integrations and Security & SSO tabs are currently empty placeholders. These should either be implemented or hidden until ready to avoid confusion.

---

## 10. Roles & Permissions

| View | Super Admin | Business Admin | HR Manager | Others |
|---|---|---|---|---|
| Manage Permissions | ✅ (all businesses) | ✅ (own business only) | ❌ | ❌ |

**Rationale:** Permission management is correctly scoped. The `PermissionManagement` page already gates on `isSuperAdmin` for the business filter dropdown.

**Suggested Enhancement:** Business Admin should see only their own business's roles without the cross-tenant business selector. The selector is appropriate for Super Admin only. This is already enforced on the backend — it just needs a cleaner UI separation.

---

## Summary of Critical Gaps

| # | Gap | Affected Roles | Priority |
|---|---|---|---|
| 1 | Employees cannot submit resignations, view clearance status, or access exit documents | Employee | High |
| 2 | Employees cannot submit expenses or view their own benefits | Employee | High |
| 3 | Finance Manager role has no frontend sidebar variant | Finance Manager | High |
| 4 | Department Head role has no frontend sidebar or scoped access | Department Head | High |
| 5 | Employees have no read-only access to Directory, Organogram, or Events | Employee | Medium |
| 6 | Employees cannot view/set their own OKRs or participate in performance reviews | Employee | Medium |
| 7 | Employees cannot request training or view career path | Employee | Medium |
| 8 | Department Heads cannot view or approve attendance/leave for their teams | Department Head | Medium |
| 9 | Integrations and Security & SSO tabs are empty placeholders visible to Super Admin | Super Admin | Low |
| 10 | Onboarding module not accessible post-login for employees on probation | Employee | Low |

---

## Recommended Sidebar Configuration per Role

### Super Admin
- Businesses (all tabs)
- Roles & Permissions

### Business Admin
- Recruitment & Hiring (all tabs)
- Onboarding & Probation (all tabs)
- People Profiles (all tabs)
- Attendance & Leave (HR view — all tabs)
- Performance (all tabs)
- Career Management (all tabs)
- Exit & Offboarding (all tabs)
- Workforce Finance (all tabs)

### HR Manager
- Recruitment & Hiring (all tabs)
- Onboarding & Probation (all tabs)
- People Profiles (all tabs except Bulk Create)
- Attendance & Leave (HR view — all tabs)
- Performance (all tabs)
- Career Management (all tabs)
- Exit & Offboarding (all tabs)
- Workforce Finance (Overview read-only, Salary read-only, Benefits)

### Finance Manager *(new frontend role needed)*
- Workforce Finance (all tabs)
- People Profiles (Directory, Organogram — read-only)
- Attendance & Leave (Timesheet read-only — for payroll reconciliation)

### Department Head *(new frontend role needed)*
- Recruitment & Hiring (Requests — own dept, My Interviews)
- People Profiles (Directory, Organogram, Events)
- Attendance & Leave (Overview — own dept, Requests, Leaves, Overtime, WFH — approve own dept)
- Performance (Performance Review, OKRs, KPIs — own dept; Evaluation Form)
- Career Management (Career, Training & Skills, Culture)
- Exit & Offboarding (Clearance Checklist — own dept steps)
- Workforce Finance (Budget — own dept, Expense — submit + approve dept, Benefits)

### Employee
- People Profiles (Directory read-only, Organogram, Events)
- Attendance & Leave (Check me in, History, Requests, Leaves, Overtime, WFH)
- Performance (Performance Review — own, OKRs — own, Evaluation Form)
- Career Management (Career — own path, Training & Skills — request, Culture)
- Exit & Offboarding (Resign, Documents — own, Clearance — own status, Forms — own)
- Workforce Finance (Expense — submit own, Benefits — view own)

---

## Implementation Note

The recommended approach for driving sidebar visibility is to derive tab access from the user's **resolved permission keys** (e.g. `attendance.manage`, `finance.read`) rather than role name strings. The backend already issues permissions per role — the frontend just needs to consume them through the `/auth/me` or `/roles/my-domain` endpoint response. This gives finer-grained control and means adding a new role or adjusting access only requires a permission change in the backend, not a frontend code change.
