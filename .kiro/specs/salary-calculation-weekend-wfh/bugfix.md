# Bugfix Requirements Document

## Introduction

Two related bugs exist in the salary calculation module that cause incorrect salary amounts to be computed for employees on the Employee Salary page.

**Bug 1 — Weekend work mode settings not respected:** The system stores a configurable `saturdayWorkMode` and `sundayWorkMode` setting per business (values: `PAID_DAY_OFF`, `HALF_WORKING_DAY`, or `FULL_WORKING_DAY`). The attendance daily report correctly reads these settings when determining per-day status. However, the salary deduction calculation (`SalaryDeductionService`) calls `attendanceReportDeductionInputs`, which relies on the attendance HR report — and that report's roster resolver only includes weekend days when the work mode is set. If the roster excludes those weekend days (e.g., due to an incorrect inclusion check), or if the deduction logic misinterprets `PAID_DAY_OFF` weekends as missed working days, the calculated salary will be wrong. The symptom is that weekend days treated as `FULL_WORKING_DAY` or `HALF_WORKING_DAY` may be deducted from salary as if they were absent days, or `PAID_DAY_OFF` weekends may not correctly exclude themselves from the worked-day count.

**Bug 2 — Approved WFH days not counted as worked days:** The attendance daily report service (`attendanceDailyReport.service.ts`) fetches leave requests, lateness notices, check-in corrections, overtime requests, and late explanations — but it does **not** fetch approved `work_from_home` attendance requests. As a result, on a day where an employee has an approved WFH request and no physical check-in events, the day is classified as `MISSED` or `NOT_STARTED`, triggering a full-day salary deduction in `attendanceReportDeductionInputs`. The employee worked from home (legitimately approved) but is penalised as absent.

Both bugs are in the backend salary/attendance calculation logic and manifest on the frontend Employee Salary page as incorrect net pay and incorrect deduction breakdowns.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a business sets `saturdayWorkMode` or `sundayWorkMode` to `FULL_WORKING_DAY` AND an employee has no check-in on that weekend day THEN the system applies a full-day missed-day salary deduction as if the setting were irrelevant

1.2 WHEN a business sets `saturdayWorkMode` or `sundayWorkMode` to `HALF_WORKING_DAY` AND an employee has no check-in on that weekend day THEN the system does not apply the correct half-day deduction reduction, resulting in an incorrect deduction amount

1.3 WHEN a business sets `saturdayWorkMode` or `sundayWorkMode` to `PAID_DAY_OFF` AND a weekend date falls within the salary calculation period THEN the system may include that date in the missed-working-day count, incorrectly reducing the employee's net pay

1.4 WHEN an employee has an approved `work_from_home` attendance request covering a specific date AND that employee has no physical check-in events for that date THEN the system classifies the day as `MISSED` or `NOT_STARTED` and applies a full-day salary deduction

1.5 WHEN an employee has an approved `work_from_home` attendance request with category `Half Day` covering a specific date AND that employee has no physical check-in events for that date THEN the system applies a full-day deduction rather than a half-day deduction

### Expected Behavior (Correct)

2.1 WHEN a business sets `saturdayWorkMode` or `sundayWorkMode` to `FULL_WORKING_DAY` AND an employee has no check-in on that weekend day THEN the system SHALL treat the day as a missed full working day using the same deduction logic as a regular weekday (not ignored, not double-deducted)

2.2 WHEN a business sets `saturdayWorkMode` or `sundayWorkMode` to `HALF_WORKING_DAY` AND an employee has no check-in on that weekend day THEN the system SHALL apply a half-day deduction (0.5 × day rate) consistent with the `HALF_WORKING_DAY` schedule units

2.3 WHEN a business sets `saturdayWorkMode` or `sundayWorkMode` to `PAID_DAY_OFF` THEN the system SHALL exclude those weekend dates from the missed-working-day count and SHALL NOT deduct salary for them

2.4 WHEN an employee has an approved `work_from_home` attendance request with category `Full Day` covering a specific date AND that employee has no physical check-in events for that date THEN the system SHALL treat that date as a worked full day and SHALL NOT apply any missed-day or absent deduction for it

2.5 WHEN an employee has an approved `work_from_home` attendance request with category `Half Day` covering a specific date AND that employee has no physical check-in events for that date THEN the system SHALL treat that date as a worked half day, applying at most a 0.5-unit deduction offset (consistent with how approved leave half-days are handled)

2.6 WHEN the Employee Salary page is loaded or recalculated THEN the system SHALL display net pay and deduction breakdowns that correctly reflect the business's weekend work mode settings and all approved WFH days for the selected period

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an employee has no check-in AND no approved leave AND no approved WFH request on a regular weekday THEN the system SHALL CONTINUE TO apply a full-day missed-day deduction for that date

3.2 WHEN an employee has an approved leave request covering a date THEN the system SHALL CONTINUE TO offset the missed-day deduction by the approved leave units for that date (no change to leave deduction logic)

3.3 WHEN an employee is late with no valid lateness notice on a regular weekday THEN the system SHALL CONTINUE TO apply the standard late-arrival deduction (quarter-day rate)

3.4 WHEN an employee has an incomplete punch (check-in but no check-out) on a regular weekday with no approved leave or WFH THEN the system SHALL CONTINUE TO apply the incomplete-attendance deduction

3.5 WHEN an employee has an approved WFH request that is `pending`, `rejected`, or `cancelled` THEN the system SHALL CONTINUE TO treat that date according to actual attendance events only — no deduction exemption is granted for non-approved WFH requests

3.6 WHEN the salary calculation period contains only regular weekdays THEN the system SHALL CONTINUE TO compute deductions identically to before this fix

3.7 WHEN a business has not configured weekend work mode (i.e., defaults apply) THEN the system SHALL CONTINUE TO default to `PAID_DAY_OFF` for both Saturday and Sunday, preserving existing behavior for businesses that have not touched this setting
