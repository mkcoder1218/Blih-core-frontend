# Exit & Offboarding — Implementation Reference

**Module:** `exit` / `hr`
**Last reviewed:** June 2026

---

## 1. Overview

The Exit & Offboarding module handles the full employee departure lifecycle — from resignation submission through clearance and final employment status update. It lives inside the `hr` backend module (no standalone module folder) and is surfaced in the frontend under the `exit` sidebar section.

Two distinct user personas interact with this module:

| Persona | What they can do |
|---|---|
| **Employee** (`exit.self`) | Submit a resignation letter, track their own clearance |
| **HR Admin / Business Admin** (`hr.read`, `hr.write`) | View all resignations, approve or request revision, manage offboarding pipeline |

---

## 2. Backend

### 2.1 Database Model — `ExitProcess`

**File:** `src/models/ExitProcess.ts`  
**Table:** `hr_exit_processes`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, auto-generated (UUIDv4) |
| `businessId` | UUID | Tenant scope |
| `employeeUserId` | UUID | The departing employee |
| `initiatedByUserId` | UUID | Who submitted (usually the employee) |
| `exitType` | STRING(50) | `resignation` \| `termination` \| `redundancy` |
| `reason` | TEXT | Optional freeform reason |
| `effectiveDate` | DATE | Last working day |
| `status` | STRING(50) | `pending` → `in_progress` → `completed` \| `cancelled` |
| `clearanceData` | JSONB | `{ letterHtml, noticePeriodDays }` |
| `finalPayData` | JSONB | Reserved for final pay settlement info |
| `createdAt` / `updatedAt` | TIMESTAMP | Auto-managed |
| `deletedAt` | TIMESTAMP | Soft delete (`paranoid: true`) |

**Associations:**
- `belongsTo Business`
- `belongsTo User as 'employee'`
- `belongsTo User as 'initiator'`

---

### 2.2 API Routes

All routes live under `/api/v1/hr/` and require the `hr` module to be active (`requireActiveModule("hr")`).

| Method | Path | Permission | Handler | Description |
|---|---|---|---|---|
| `POST` | `/exit/resign` | authenticated (any) | `submitResignation` | Employee submits an offboarding request |
| `GET` | `/exit` | `hr.read` OR `hr.write` | `listExitProcesses` | HR admin fetches all exit requests |
| `PATCH` | `/exit/:id/status` | `hr.write` | `updateExitStatus` | HR approves, requests revision, or marks complete |

---

### 2.3 Controller (`performance.controller.ts`)

The exit endpoints are implemented inside `HRPerformanceController` alongside performance and disciplinary features.

#### `submitResignation` — `POST /hr/exit/resign`

**Request body:**
```json
{
  "effectiveDate": "2026-07-31",
  "reason": "Better career opportunity",
  "letterHtml": "<p>Dear Manager…</p>",
  "noticePeriodDays": 30
}
```

**What it does:**
1. Validates `effectiveDate` is present (400 if missing).
2. Creates an `ExitProcess` record with `exitType: 'resignation'` and `status: 'pending'`. The letter and notice period are stored inside `clearanceData` JSONB.
3. Logs an audit event: `SUBMIT_RESIGNATION` on the `hr_exit_processes` table.
4. Queries all `active` users with role `BUSINESS_ADMIN` or `HR_MANAGER` and fires an in-app notification via `InternalNotifier.sendBulk` with type `exit_submitted` and priority `high`.

---

#### `listExitProcesses` — `GET /hr/exit`

**Query params:** `?status=pending|in_progress|completed|cancelled`, `?limit=`, `?offset=`

**What it returns:**  
Paginated `{ rows, count }` with deep includes:
- `employee` → `fullName`, `email`, `BusinessUserProfile` → `Department.name`, `Position.title`
- `initiator` → `fullName`, `email`

---

#### `updateExitStatus` — `PATCH /hr/exit/:id/status`

**Request body:**
```json
{
  "status": "in_progress",
  "employeeUserId": "<uuid>"
}
```

Delegates to `service.processExit()` and logs `UPDATED_EXIT_PROCESS` audit event.

> ⚠️ **Known issue:** The frontend currently only sends `{ status }` in the PATCH body, not `employeeUserId`. The service looks up the record by `{ id, businessId, employeeUserId }` and will throw if `employeeUserId` is missing. This should be verified and fixed.

---

### 2.4 Service (`performance.service.ts`)

#### `processExit(businessId, employeeUserId, exitId, status)`

Controls the employment status side-effects when an exit record is updated:

| New Status | Side Effect |
|---|---|
| `in_progress` | Sets `EmployeeRecord.employmentStatus` → `INACTIVE_EMPLOYMENT_STATUS` |
| `completed` | Sets `EmployeeRecord.employmentStatus` → `TERMINATED_EMPLOYMENT_STATUS` |
| `cancelled` | No employment status change |

Returns the updated `ExitProcess` record.

#### `provisionForms(businessId)`

Seeds the following `FormDefinition` records for a business on first setup:

| Key | Form Name |
|---|---|
| `employee_resignation` | Employee Resignation Form |
| `exit_interview` | Exit Interview Form |
| `offboarding_checklist` | Offboarding Checklist Form |
| `asset_return_clearance` | Asset Return & Clearance Form |
| `experience_letter` | Experience Letter & Final Pay Request Form |

These are idempotent — existing records are skipped.

---

## 3. Frontend

### 3.1 React Query Hooks (`src/hooks/useHrRecords.ts`)

| Hook | HTTP | Endpoint | Cache Key |
|---|---|---|---|
| `useExitRequests()` | GET | `/api/v1/hr/exit` | `["exit-requests"]` |
| `useSubmitExitRequest()` | POST | `/api/v1/hr/exit/resign` | invalidates `["exit-requests"]` |
| `useUpdateExitStatus()` | PATCH | `/api/v1/hr/exit/:id/status` | invalidates `["exit-requests"]` |

`useExitRequests` normalises the API response to always return a flat array, handling both `{ rows }` and plain array shapes.

---

### 3.2 Components

#### `ExitOffboardingView.tsx` (`src/components/offboarding/`)

Main container. Receives `currentTab` as a prop and renders a different section for each value.

```ts
interface ExitOffboardingViewProps {
  currentTab: 'overview' | 'resign' | 'interviews' | 'documents' | 'clearance' | 'forms' | 'offboarding';
  onDraftAiSuggestion: (ctx: string) => void;
  showAlert: (msg: string, type: 'success' | 'error') => void;
}
```

| Tab | Description | Live Data? |
|---|---|---|
| `overview` | StatCards, active resignation notification list, exit reasons bar chart, monthly turnover line chart, department attrition rate table | ❌ Mock only |
| `resign` | `<ResignationsTab>` — HR admin list of all resignation letters | ✅ Live API |
| `offboarding` | `<OffboardingSubmitTab>` — Employee submission form + admin review | ✅ Live API |
| `interviews` | Upcoming/completed exit interview cards, log interview modal | ❌ Mock only |
| `documents` | Per-employee document checklist (clearance letter, ID card, emergency contact, guarantor info, experience letter) + template downloads | ❌ Mock only |
| `clearance` | 6-step clearance pipeline per employee with progress tracking and certificate generation | ❌ Mock only |
| `forms` | Exit Interview Form and Resignation Letter Template management UI | ❌ Mock only |

---

#### `ResignationsTab.tsx` (`src/components/offboarding/tabs/`)

HR admin view. Shows all received resignation requests from the live API.

**Features:**
- Stats row derived from API data: Total Received, Pending Approval, Approved, This Month
- Per-request card: employee name, department, role, submitted date, last working day, notice period, reason, resignation letter HTML (collapsible/expandable)
- Status labels: `pending` → "Pending", `in_progress` → "Approved", `cancelled` → "Revision Requested", `completed` → "Completed"
- **"Approve & Respond"** → `PATCH /exit/:id/status { status: 'in_progress' }` — only active when status is `pending`
- **"Request Revision"** → `PATCH /exit/:id/status { status: 'cancelled' }` — only active when status is `pending`

---

#### `OffboardingSubmitTab.tsx` (`src/components/offboarding/tabs/`)

Dual-mode component. Detects role via `useMe()` and renders either the employee form or the admin list.

**Mode detection:**
```ts
const isAdmin = me?.roles?.some(r => ['BUSINESS_ADMIN', 'HR_MANAGER'].includes(r.key));
```

**Employee mode — form fields:**

| Field | Type | Required |
|---|---|---|
| Last Working Day | `date` input (min: today) | ✅ |
| Notice Period | Select: 14 / 30 / 60 / 90 days | — |
| Reason for Leaving | Select with predefined options | — |
| Resignation Letter | Rich text editor (Bold, Italic, List, Align, H1/H2/H3 via `document.execCommand`) | ✅ |

On successful submission, renders a confirmation screen with a "HR has been notified" message.

**Admin mode:** Same layout as `ResignationsTab` (the two components duplicate the admin UI across two separate tab entry points).

---

### 3.3 Tab Permission Config (`src/config/tabPermissions.ts`)

```ts
export const EXIT_TAB_PERMISSIONS = {
  overview:    { requires: ["hr.read", "hr.write"] },
  offboarding: { requires: ["hr.read", "hr.write"] },
  resign:      { requires: ["hr.write", "exit.self"] },
  interviews:  { requires: ["hr.read", "hr.write"] },
  documents:   { requires: ["hr.write", "exit.self"] },
  clearance:   { requires: ["hr.write", "exit.self"] },
  forms:       { requires: ["hr.read", "hr.write", "exit.self"] },
};
```

`exit.self` allows employees to access the `resign`, `documents`, `clearance`, and `forms` tabs. The `overview` and `interviews` tabs are HR-admin only.

Module-level visibility requires at least one of: `hr.read`, `hr.write`, `exit.self`.

---

### 3.4 Permissions (`permissions.seed.ts`)

| Permission Key | Description |
|---|---|
| `exit.self` | Submit resignation, track own clearance checklist, and access exit documents |
| `career.self` | View own career path, request training, access culture content |
| `hr.read` | View all HR data (used for admin exit tabs) |
| `hr.write` | Create/update HR data (used for approving resignations) |

---

## 4. End-to-End Data Flow

```
1. Employee opens "Offboarding" tab (exit.self permission required)
   └─ Sees OffboardingSubmitTab in employee mode

2. Employee fills form → submits
   └─ POST /api/v1/hr/exit/resign
   └─ ExitProcess created: status = 'pending', clearanceData = { letterHtml, noticePeriodDays }
   └─ Audit log: SUBMIT_RESIGNATION
   └─ In-app notification sent to all BUSINESS_ADMIN + HR_MANAGER users (priority: high)

3. HR Admin opens "Resign" or "Offboarding" tab
   └─ GET /api/v1/hr/exit → list all ExitProcess records
   └─ Sees resignation card with employee info + letter

4. HR clicks "Approve & Respond"
   └─ PATCH /api/v1/hr/exit/:id/status { status: 'in_progress' }
   └─ service.processExit() → EmployeeRecord.employmentStatus = INACTIVE
   └─ Audit log: UPDATED_EXIT_PROCESS

5. HR clicks "Request Revision"
   └─ PATCH /api/v1/hr/exit/:id/status { status: 'cancelled' }
   └─ No employment status change

6. Process completed (e.g. all clearance steps done)
   └─ PATCH /api/v1/hr/exit/:id/status { status: 'completed' }
   └─ service.processExit() → EmployeeRecord.employmentStatus = TERMINATED
```

---

## 5. Clearance Checklist (UI Definition)

The 6-step clearance pipeline is defined in the frontend only (mock data). No backend endpoint currently stores per-step clearance progress.

| Step | Title |
|---|---|
| 1 | Resignation Letter Received & Signed |
| 2 | Exit Interview Completed |
| 3 | Assets & Credentials Returned |
| 4 | Last Payment Settled |
| 5 | Experience Letter Issued |
| 6 | Recommendation Letter (if applicable) |

Each step tracks: `completed`, `completedDate`, `completedBy`.

---

## 6. Known Gaps & Recommended Next Steps

| # | Issue | Recommendation |
|---|---|---|
| 1 | **`updateExitStatus` bug** — frontend sends `{ status }` only, but service requires `employeeUserId` in the lookup | Either include `employeeUserId` in the PATCH body, or change the service to look up by `{ id, businessId }` only |
| 2 | **Clearance, Interviews, Documents, Forms tabs are mock data** | Wire to backend: add dedicated routes for clearance step updates, exit interview logging, document checklist tracking |
| 3 | **`ResignationsTab` and `OffboardingSubmitTab` duplicate the admin UI** | Consider extracting the shared admin list into a single `<ExitAdminList>` component |
| 4 | **No employee-facing status tracking** | After submitting, employees currently have no way to see the status of their request (approved / revision needed) |
| 5 | **`finalPayData` JSONB is unused** | Define a schema and wire it to finance/payroll settlement |
| 6 | **`termination` and `redundancy` exit types exist in the model** | No UI or API flow currently supports HR-initiated exits — only employee-initiated resignation is implemented |
