# Implementation Plan

- [ ] 1. Write bug condition exploration tests (BEFORE implementing any fix)
  - **Property 1: Bug Condition** - Weekend PAID_DAY_OFF Deducted & WFH Day Marked Absent
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the test or the code when it fails**
  - **GOAL**: Surface counterexamples that demonstrate both bugs exist
  - **Scoped PBT Approach**: Scope each property to concrete failing cases for reproducibility

  - **Property 1a — Bug 1 (Weekend PAID_DAY_OFF):**
    - File: `tests/salaryDeductionWeekendWfh.test.ts`
    - Test: Given `saturdayWorkMode = "PAID_DAY_OFF"`, `attendanceEnabled = true`, a Saturday date, and no punch events for an employee, assert that `attendanceReportDeductionInputs` produces zero deduction amount for that Saturday date
    - Bug condition from design: `saturdayWorkMode = "PAID_DAY_OFF"` AND date is Saturday AND no punch AND `attendanceEnabled = true`
    - Expected behavior from design: `missedDayDeductionForDate = 0`
    - Run on UNFIXED code — **EXPECTED OUTCOME: FAILS** (proves the bug: deduction > 0 when it should be 0)
    - Document the counterexample (e.g., "Saturday 2026-07-05, PAID_DAY_OFF, deducted 466.67 ETB when it should be 0")

  - **Property 1b — Bug 1 (Weekend HALF_WORKING_DAY):**
    - Test: Given `saturdayWorkMode = "HALF_WORKING_DAY"`, a Saturday date, and no punch events, assert that the deduction equals `dayRate × 0.5` (not `dayRate × 1`)
    - Run on UNFIXED code — **EXPECTED OUTCOME: FAILS** (full day deducted instead of half)

  - **Property 1c — Bug 2 (Approved WFH Marked Absent):**
    - File: `tests/attendanceDailyReport.service.test.ts` (add new describe block)
    - Test: Given an approved `work_from_home` AttendanceRequest with `category = "Full Day"` overlapping a weekday, and no physical punches for that day, assert that `LatenessStatus = "ApprovedLeave"` and `DeductionApplied = false`
    - Bug condition from design: employee has approved WFH request AND no physical punch
    - Expected behavior from design: `LatenessStatus = "ApprovedLeave"`, `ApprovedLeaveDays = 1`
    - Run on UNFIXED code — **EXPECTED OUTCOME: FAILS** (LatenessStatus = "Absent" instead of "ApprovedLeave")

  - **Property 1d — Bug 2 (Partial Day WFH):**
    - Test: Given an approved WFH request with `category = "Partial Day"` and no punch, assert `ApprovedLeaveDays = 0.5`
    - Run on UNFIXED code — **EXPECTED OUTCOME: FAILS**

  - Mark task complete when all four tests are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Regular Weekday Absent, Approved Leave, Non-Approved WFH
  - **IMPORTANT**: Follow observation-first methodology — run on UNFIXED code first and verify PASS
  - **GOAL**: Capture baseline behavior that must not regress after the fix

  - **Property 2a — Regular weekday absent (no punch, no leave, no WFH):**
    - File: `tests/attendanceDailyReport.service.test.ts` (verify existing "marks scheduled employee absent" test still passes — it already covers this)
    - Additional: add a salary-level test in `tests/salaryDeductionWeekendWfh.test.ts` asserting that for a regular Monday with no punch and no leave, deduction = `dayRate × 1`
    - Observe on unfixed code: `LatenessStatus = "Absent"`, deduction = full day rate
    - Run on UNFIXED code — **EXPECTED OUTCOME: PASSES**

  - **Property 2b — Approved leave on regular weekday (unchanged):**
    - Verify existing test "does not mark absent or deduct when scheduled employee has approved leave" still passes unchanged
    - Observe: `LatenessStatus = "ApprovedLeave"`, `DeductionApplied = false`
    - Run on UNFIXED code — **EXPECTED OUTCOME: PASSES**

  - **Property 2c — WFH request with non-approved status does not exempt:**
    - Test: Given a pending WFH request (status = "pending") and no punch, assert `LatenessStatus = "Absent"` and `DeductionApplied = true`
    - Test: Given a rejected WFH request (status = "rejected") and no punch, assert same
    - Observe on unfixed code: these cases correctly produce "Absent" (no WFH fetch, so non-approved is automatically ignored — passes before and after fix)
    - Run on UNFIXED code — **EXPECTED OUTCOME: PASSES**

  - **Property 2d — FULL_WORKING_DAY Saturday absent deducts full day:**
    - Test in `tests/salaryDeductionWeekendWfh.test.ts`: Given `saturdayWorkMode = "FULL_WORKING_DAY"`, Saturday date, no punch, assert deduction = `dayRate × 1`
    - Observe on unfixed code: full day deducted (correct behavior, should still pass after fix)
    - Run on UNFIXED code — **EXPECTED OUTCOME: PASSES**

  - **Property 2e — Late/incomplete deductions on weekdays unaffected:**
    - Verify existing `tests/attendanceDeduction.service.test.ts` tests all pass (no regressions)
    - Run on UNFIXED code — **EXPECTED OUTCOME: PASSES** (these tests don't touch WFH or weekend mode)

  - Mark task complete when all preservation tests are written, run, and confirmed passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 3. Fix Bug 2 — Approved WFH days counted as worked days

  - [ ] 3.1 Fetch approved WFH requests in `AttendanceDailyReportService.generate()`
    - File: `src/services/attendanceDailyReport.service.ts`
    - Add `db.AttendanceRequest.findAll` for `requestType: "work_from_home"` and `status: "approved"` to the existing `Promise.all` fetch block (alongside the existing leaves, notices, corrections fetches)
    - Filter by `businessId`, `employeeUserId: employeeWhere`, and within the report date range (use same `dateRangeWhere` pattern or filter on `fromAt`/`toAt` overlap with the report period)
    - _Bug_Condition: employee has approved WFH request overlapping the date AND no physical punches_
    - _Expected_Behavior: LatenessStatus = "ApprovedLeave", ApprovedLeaveDays = 1 (full) or 0.5 (partial), DeductionApplied = false_
    - _Requirements: 1.4, 1.5, 2.4, 2.5_

  - [ ] 3.2 Build `wfhByEmployee` map and pass WFH data into `buildRow()`
    - After the Promise.all, build a `Map<string, any[]>` from `wfh.employeeUserId` to WFH records, mirroring the `leavesByEmployee` pattern
    - Add `wfhRequests: any[]` parameter to `buildRow()` params type
    - Pass `wfhRequests: wfhByEmployee.get(roster.employeeId) || []` in the `buildRow()` call inside `Promise.all(rosterRows.map(...))`
    - _Requirements: 2.4, 2.5_

  - [ ] 3.3 Apply WFH exemption in `buildRow()` absence classification
    - File: `src/services/attendanceDailyReport.service.ts` — `buildRow()` method
    - After computing `hasApprovedLeave`, add:
      ```typescript
      const hasApprovedWfh = wfhRequests.some((wfh) => requestOverlapsDate(wfh, roster.dateYmd));
      const approvedWfh = wfhRequests.find((wfh) => requestOverlapsDate(wfh, roster.dateYmd));
      const wfhIsPartialDay = approvedWfh
        ? String(approvedWfh.category || "").toLowerCase().includes("partial")
        : false;
      ```
    - Update the absence classification branch: add `else if (!hasAnyPunch && hasApprovedWfh)` before the `Absent` branch, setting `latenessStatus = "ApprovedLeave"`
    - Set `ApprovedLeaveDays` in the return object: `wfhIsPartialDay ? 0.5 : 1` when a WFH day is active and no physical punch exists (and no leave already covers it)
    - Ensure WFH exemption does not override an already-present physical punch (WFH only applies when `!hasAnyPunch`)
    - _Bug_Condition: isBugCondition — no punch AND approved WFH overlaps date_
    - _Expected_Behavior: LatenessStatus = "ApprovedLeave", ApprovedLeaveDays = 1 or 0.5_
    - _Preservation: existing leave logic in the same branch chain is unchanged; WFH only added as a new else-if_
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.4, 3.5_

- [ ] 4. Fix Bug 1 — Weekend work mode respected in salary deduction

  - [ ] 4.1 Expose `latenessStatus` and `scheduledDayUnits` from `AttendanceHrService.report()`
    - File: `src/modules/attendanceHr/attendanceHr.service.ts` — `report()` method
    - The `report()` method builds rows from roster + events + attendance calculation. The daily-report `LatenessStatus` is available via `reportByEmployee` (already fetched inside `buildDaily`; the `report()` method has a similar parallel structure)
    - Add `latenessStatus` (from the daily-report row, lower-cased to match `LatenessStatus`) to each output row in `report()`
    - Add `scheduledDayUnits` from the roster-based schedule: `attendanceScheduleForDate(dateForRow, settings).scheduledDayUnits`
    - These additions are read-only extensions — no existing fields are changed
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 4.2 Guard `PAID_DAY_OFF` rows in `attendanceReportDeductionInputs()`
    - File: `src/modules/finance/salaryDeduction.service.ts` — `attendanceReportDeductionInputs()` method
    - At the top of the `for (const row of report.rows || [])` loop, add a guard:
      ```typescript
      const latenessStatus = String(row.latenessStatus || "").toLowerCase();
      if (latenessStatus === "paidday" || latenessStatus === "paiddayoff" || latenessStatus === "paid_day_off") continue;
      ```
    - This ensures `PAID_DAY_OFF` weekend days produce zero deduction regardless of `attendanceEnabled`
    - _Bug_Condition: saturdayWorkMode = "PAID_DAY_OFF" AND date is Saturday AND no punch AND attendanceEnabled=true_
    - _Expected_Behavior: missedDayDeductionForDate = 0_
    - _Requirements: 2.3, 3.5, 3.7_

  - [ ] 4.3 Apply `scheduledDayUnits` for `HALF_WORKING_DAY` missed-day deduction
    - File: `src/modules/finance/salaryDeduction.service.ts` — `attendanceReportDeductionInputs()` method
    - For the `isMissed` branch, replace `dayRate * Math.max(1 - leaveUnit, 0)` with:
      ```typescript
      const scheduledDayUnits = Number(row.scheduledDayUnits ?? 1);
      const amount = money(dayRate * Math.max(scheduledDayUnits - leaveUnit, 0));
      ```
    - This produces `dayRate × 0.5` for `HALF_WORKING_DAY` and `dayRate × 1` for `FULL_WORKING_DAY` and regular weekdays
    - _Bug_Condition: saturdayWorkMode = "HALF_WORKING_DAY" AND date is Saturday AND no punch_
    - _Expected_Behavior: missedDayDeductionForDate = dayRate × 0.5_
    - _Preservation: regular weekday absent still deducts dayRate × 1 (scheduledDayUnits = 1 by default)_
    - _Requirements: 2.1, 2.2, 3.1, 3.6_

- [ ] 5. Verify bug condition exploration tests now pass (after fix)

  - [ ] 5.1 Re-run Property 1a — Weekend PAID_DAY_OFF no longer deducted
    - **Property 1: Expected Behavior** - PAID_DAY_OFF Saturday produces zero deduction
    - **IMPORTANT**: Re-run the SAME test from task 1 (Property 1a) — do NOT write a new test
    - Run: `npx jest tests/salaryDeductionWeekendWfh.test.ts --testNamePattern "Bug1.*PAID_DAY_OFF" --no-coverage`
    - **EXPECTED OUTCOME: PASSES** (confirms bug 1a is fixed)
    - _Requirements: 2.3_

  - [ ] 5.2 Re-run Property 1b — HALF_WORKING_DAY Saturday deducts half rate
    - **Property 1: Expected Behavior** - HALF_WORKING_DAY Saturday deducts dayRate × 0.5
    - Run: `npx jest tests/salaryDeductionWeekendWfh.test.ts --testNamePattern "Bug1.*HALF_WORKING_DAY" --no-coverage`
    - **EXPECTED OUTCOME: PASSES** (confirms bug 1b is fixed)
    - _Requirements: 2.2_

  - [ ] 5.3 Re-run Property 1c — Full Day WFH no longer marked Absent
    - **Property 1: Expected Behavior** - Approved full-day WFH sets LatenessStatus = "ApprovedLeave"
    - Run: `npx jest tests/attendanceDailyReport.service.test.ts --testNamePattern "WFH.*full" --no-coverage`
    - **EXPECTED OUTCOME: PASSES** (confirms bug 2 full-day is fixed)
    - _Requirements: 2.4_

  - [ ] 5.4 Re-run Property 1d — Partial Day WFH deducts half rate
    - **Property 1: Expected Behavior** - Approved partial WFH sets ApprovedLeaveDays = 0.5
    - Run: `npx jest tests/attendanceDailyReport.service.test.ts --testNamePattern "WFH.*partial" --no-coverage`
    - **EXPECTED OUTCOME: PASSES** (confirms bug 2 partial-day is fixed)
    - _Requirements: 2.5_

  - [ ] 5.5 Re-run Property 2 — All preservation tests still pass
    - **Property 2: Preservation** - No regressions in weekday absent, leave, non-approved WFH, late deductions
    - Run: `npx jest tests/attendanceDailyReport.service.test.ts tests/attendanceDeduction.service.test.ts tests/salaryDeductionWeekendWfh.test.ts --no-coverage`
    - **EXPECTED OUTCOME: ALL PASS** (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 6. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npx jest --no-coverage` from `Blih-ERP-backend`
  - Confirm zero test failures and zero regressions in existing attendance, deduction, and roster tests
  - Ask the user if any questions arise about edge cases (e.g., WFH + partial leave overlap, WFH on a HALF_WORKING_DAY Saturday)
  - Verify TypeScript compiles cleanly: `npx tsc -p tsconfig.json --noEmit`
