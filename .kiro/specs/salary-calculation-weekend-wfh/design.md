# Design Document — Salary Calculation: Weekend Work Mode & WFH

## Overview

Two bugs in the backend attendance/salary pipeline cause incorrect salary deductions. Both are pure backend issues. This document covers root-cause analysis, fix design, and correctness specifications used by the task plan.

---

## Glossary

| Term | Definition |
|---|---|
| `PAID_DAY_OFF` | Weekend work mode: the day is off, no salary deduction applies |
| `HALF_WORKING_DAY` | Weekend work mode: 0.5 day is expected, deduction = dayRate × 0.5 |
| `FULL_WORKING_DAY` | Weekend work mode: full day is expected, deduction = dayRate × 1 |
| `LatenessStatus` | Per-day classification produced by `AttendanceDailyReportService.buildRow()` |
| `ApprovedLeaveDays` | Units offset against a missed-day deduction (1 = full day, 0.5 = half day) |
| WFH | Work From Home — `AttendanceRequest` with `requestType = "work_from_home"` |
| `scheduledDayUnits` | Fractional working-day weight for a given date (1 = full, 0.5 = half, 0 = paid off) |

---

## Bug Details

### Bug 1 — Weekend Work Mode Not Respected

The system stores `saturdayWorkMode` / `sundayWorkMode` per business (`PAID_DAY_OFF`, `HALF_WORKING_DAY`, or `FULL_WORKING_DAY`). The `AttendanceDailyReportService` correctly sets `LatenessStatus = "PaidDayOff"` for `PAID_DAY_OFF` days. However, `SalaryDeductionService.attendanceReportDeductionInputs()` calls `AttendanceHrService.report()` which applies this override:

```typescript
// attendanceHr.service.ts — report()
finalStatus = finalCalculation.currentStatus === "NOT_STARTED" && settings.attendanceEnabled
  ? "MISSED"
  : finalCalculation.currentStatus;
```

When `attendanceEnabled = true`, `PAID_DAY_OFF` days without punches are calculated as `NOT_STARTED` by `calculateAttendanceDay()` and then promoted to `MISSED`. The salary deduction service then applies a full-day deduction. Additionally, `HALF_WORKING_DAY` misses are deducted at full rate because `attendanceReportDeductionInputs` hardcodes `1 - leaveUnit` rather than reading the actual scheduled day fraction.

### Bug 2 — Approved WFH Days Not Counted as Worked Days

`AttendanceDailyReportService.generate()` fetches leave, lateness notices, corrections, overtime, and late explanations — but **never fetches `work_from_home` attendance requests**. In `buildRow()`, the absence check is:

```typescript
if (!hasAnyPunch && hasApprovedLeave) { latenessStatus = "ApprovedLeave"; }
else if (!hasAnyPunch && !hasApprovedLeave) { latenessStatus = "Absent"; }  // WFH employee hits this
```

With no WFH data present, an employee with an approved WFH request and no physical punch is classified `Absent` → `DeductionApplied = true` → full-day salary deduction.

---

## Hypothesized Root Cause

**Bug 1:** `attendanceReportDeductionInputs()` in `salaryDeduction.service.ts` does not read the per-day schedule mode from the HR report rows. It assumes all missed days are full-day deductions (`1 - leaveUnit`) and has no guard for `PAID_DAY_OFF` days.

**Bug 2:** `AttendanceDailyReportService.generate()` does not include `work_from_home` in its `Promise.all` data fetch. The absence classification in `buildRow()` has no WFH-aware branch.

---

## Expected Behavior

**Bug 1 corrections:**

| Scenario | Before fix | After fix |
|---|---|---|
| `PAID_DAY_OFF` Saturday, no punch, `attendanceEnabled=true` | Full day deducted | Zero deduction |
| `HALF_WORKING_DAY` Saturday, no punch | Full day deducted | Half-day deduction |
| `FULL_WORKING_DAY` Saturday, no punch | Full day deducted | Full day deducted (unchanged) |

**Bug 2 corrections:**

| Scenario | Before fix | After fix |
|---|---|---|
| Approved full-day WFH, no punch | `LatenessStatus=Absent`, full deduction | `LatenessStatus=ApprovedLeave`, zero deduction |
| Approved partial-day WFH, no punch | `LatenessStatus=Absent`, full deduction | `ApprovedLeaveDays=0.5`, half deduction |

---

## Fix Implementation

### Architecture Context

```
SalaryDeductionService.syncForPayrollLink()
  └─► attendanceReportDeductionInputs()
        └─► AttendanceHrService.report()
              └─► AttendanceRosterResolver.resolveExpectedEmployees()
              └─► AttendanceDailyReportService.generate()   ← Bug 2 fix here
                    └─► buildRow()
                          └─► attendanceScheduleForDate()   ← schedule units source
```

### Fix for Bug 2 — `attendanceDailyReport.service.ts`

**Step 1** — Add WFH fetch to `Promise.all`:
```typescript
const [..., wfhRequests] = await Promise.all([
  // ... existing fetches ...
  db.AttendanceRequest.findAll({
    where: {
      businessId,
      employeeUserId: employeeWhere,
      requestType: "work_from_home",
      status: "approved",
    },
  }),
]);
```

**Step 2** — Build `wfhByEmployee` map (same pattern as `leavesByEmployee`):
```typescript
const wfhByEmployee = new Map<string, any[]>();
for (const wfh of wfhRequests) {
  const rows = wfhByEmployee.get(wfh.employeeUserId) || [];
  rows.push(wfh);
  wfhByEmployee.set(wfh.employeeUserId, rows);
}
```

**Step 3** — Pass into `buildRow()` and classify:
```typescript
const hasApprovedWfh = wfhRequests.some((wfh) => requestOverlapsDate(wfh, roster.dateYmd));
const approvedWfh = wfhRequests.find((wfh) => requestOverlapsDate(wfh, roster.dateYmd));
const wfhIsPartialDay = approvedWfh
  ? String(approvedWfh.category || "").toLowerCase().includes("partial")
  : false;

// In absence classification:
} else if (!hasAnyPunch && hasApprovedWfh) {
  latenessStatus = "ApprovedLeave";
  // ApprovedLeaveDays = wfhIsPartialDay ? 0.5 : 1 in return object
}
```

### Fix for Bug 1 — `attendanceHr.service.ts` + `salaryDeduction.service.ts`

**Step 1** — Expose `latenessStatus` and `scheduledDayUnits` from `AttendanceHrService.report()` output rows, sourced from the daily-report row (`reportByEmployee`) and `attendanceScheduleForDate()`.

**Step 2** — In `attendanceReportDeductionInputs()`:
```typescript
// Guard PAID_DAY_OFF rows
const latenessStatus = String(row.latenessStatus || "").toLowerCase();
if (latenessStatus === "paiddayoff" || latenessStatus === "paid_day_off") continue;

// Use scheduledDayUnits for deduction amount
const scheduledDayUnits = Number(row.scheduledDayUnits ?? 1);
const amount = money(dayRate * Math.max(scheduledDayUnits - leaveUnit, 0));
```

### Files to Modify

| File | Change |
|---|---|
| `src/services/attendanceDailyReport.service.ts` | Fetch approved WFH; build `wfhByEmployee` map; pass to `buildRow()`; add WFH branch in absence classification; set `ApprovedLeaveDays` for WFH |
| `src/modules/attendanceHr/attendanceHr.service.ts` | Add `latenessStatus` and `scheduledDayUnits` to `report()` output rows |
| `src/modules/finance/salaryDeduction.service.ts` | Guard `PAID_DAY_OFF`; use `scheduledDayUnits` for missed-day amount |

No frontend changes required — the Employee Salary page will display correct values once the backend pipeline is fixed.

---

## Bug Condition Specification

### Bug 1

**isBugCondition(input):**
```
(input.saturdayWorkMode = "PAID_DAY_OFF" OR input.sundayWorkMode = "PAID_DAY_OFF")
AND input.date is that respective weekend day
AND input.employee has no check-in events on input.date
AND input.attendanceEnabled = true
```
OR
```
(input.saturdayWorkMode = "HALF_WORKING_DAY" OR input.sundayWorkMode = "HALF_WORKING_DAY")
AND input.date is that respective weekend day
AND input.employee has no check-in events on input.date
```

**expectedBehavior(result):**
```
IF workMode = "PAID_DAY_OFF":   result.deductionAmount = 0
IF workMode = "HALF_WORKING_DAY":  result.deductionAmount = dayRate × 0.5
IF workMode = "FULL_WORKING_DAY":  result.deductionAmount = dayRate × 1
```

### Bug 2

**isBugCondition(input):**
```
input.employee has AttendanceRequest where:
  requestType = "work_from_home"
  status = "approved"
  fromAt..toAt overlaps input.date
AND input.employee has no physical check-in events on input.date
```

**expectedBehavior(result):**
```
IF wfh.category = "Full Day":     result.latenessStatus = "ApprovedLeave", ApprovedLeaveDays = 1
IF wfh.category = "Partial Day":  result.latenessStatus = "ApprovedLeave", ApprovedLeaveDays = 0.5
```

---

## Correctness Properties

**P1 (Bug 1 — PAID_DAY_OFF):** For all weekend dates where `workMode = PAID_DAY_OFF`, no punch, and no leave, the salary deduction amount for that date is 0.

**P2 (Bug 1 — HALF_WORKING_DAY):** For all weekend dates where `workMode = HALF_WORKING_DAY` and no punch, the deduction equals `dayRate × 0.5` (reduced by any leave unit offset).

**P3 (Bug 2 — Full Day WFH):** For all dates with an approved full-day WFH request and no physical punch, `LatenessStatus = "ApprovedLeave"`, `ApprovedLeaveDays = 1`, and missed-day deduction = 0.

**P4 (Bug 2 — Partial Day WFH):** For all dates with an approved partial-day WFH request and no physical punch, `ApprovedLeaveDays = 0.5` and missed-day deduction = `dayRate × 0.5`.

**P5 (Preservation — Regular Weekday Absent):** For all regular weekday dates with no punch, no leave, no approved WFH: `LatenessStatus = "Absent"`, deduction = `dayRate × 1`.

**P6 (Preservation — Non-Approved WFH):** For dates where a WFH request exists with status ∈ {pending, rejected, cancelled}: no WFH exemption is applied — day classified by actual attendance events only.

**P7 (Preservation — Approved Leave Unchanged):** For all dates with an approved leave request: existing `leaveUnit` offset logic is unaffected.

---

## Testing Strategy

Tests are written as Jest unit tests matching the existing project pattern in `tests/`.

- **`tests/attendanceDailyReport.service.test.ts`** — Add a new `describe` block covering Bug 2: approved full-day WFH, partial-day WFH, and non-approved WFH preservation cases.
- **`tests/salaryDeductionWeekendWfh.test.ts`** — New test file covering Bug 1 end-to-end: `PAID_DAY_OFF` Saturday deduction, `HALF_WORKING_DAY` Saturday deduction, `FULL_WORKING_DAY` Saturday deduction (regression), and regular weekday absent regression.

All existing tests in `tests/attendanceDailyReport.service.test.ts` and `tests/attendanceDeduction.service.test.ts` must continue to pass unchanged.
