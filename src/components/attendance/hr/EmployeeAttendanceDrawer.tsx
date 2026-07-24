import React from "react";
import {
  CheckCircle2,
  MapPin,
  ShieldAlert,
  X,
} from "lucide-react";
import type { AttendanceHrDailyRow } from "../../../api/types";
import { useAttendanceHrEmployee } from "../../../hooks/useAttendanceHrEmployee";
import {
  getIssueSummary,
  getSimpleAttendanceStatus,
  rowNeedsAttention,
} from "./AttendanceTable";

interface EmployeeAttendanceDrawerProps {
  open: boolean;
  employeeId: string | null;
  date: string;
  attendanceRow?: AttendanceHrDailyRow | null;
  onClose: () => void;
}

interface AttendanceEventCardProps {
  key?: React.Key;
  event: any;
  timezone: string;
}

export default function EmployeeAttendanceDrawer({
  open,
  employeeId,
  date,
  attendanceRow,
  onClose,
}: EmployeeAttendanceDrawerProps) {
  const query = useAttendanceHrEmployee(
    open ? employeeId : null,
    { date },
  );

  const timezone =
    query.data?.data?.timezone || "UTC";

  const employee = query.data?.data?.employee;
  const lunch = (query.data as any)?.data?.lunch;
  const events = query.data?.data?.events || [];

  if (!open) {
    return null;
  }

  const simpleStatus = attendanceRow
    ? getSimpleAttendanceStatus(attendanceRow)
    : null;

  const issue = attendanceRow
    ? getIssueSummary(attendanceRow)
    : null;

  const needsAttention = attendanceRow
    ? rowNeedsAttention(attendanceRow)
    : false;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
        aria-label="Close employee attendance drawer"
      />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-slate-100 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Employee attendance
            </p>

            <h2 className="mt-1 truncate text-[15px] font-black text-slate-900">
              {employee?.fullName ||
                attendanceRow?.employeeName ||
                "—"}
            </h2>

            <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
              {date} • {timezone}
              {employee?.department?.name
                ? ` • ${employee.department.name}`
                : attendanceRow?.department?.name
                  ? ` • ${attendanceRow.department.name}`
                  : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {attendanceRow && simpleStatus ? (
            <AttendanceSummary
              row={attendanceRow}
              status={simpleStatus}
            />
          ) : null}

          {attendanceRow &&
          needsAttention &&
          issue ? (
            <AttendanceIssueDetails
              row={attendanceRow}
              issue={issue}
              status={
                simpleStatus || "Needs review"
              }
            />
          ) : attendanceRow ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <span className="rounded-lg border border-emerald-200 bg-white p-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-xs font-black text-emerald-900">
                    No attendance issue detected
                  </p>

                  <p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-700">
                    This employee&apos;s attendance
                    record does not currently require
                    HR review.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {query.isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[12px] font-semibold text-slate-600">
              Loading attendance details…
            </div>
          ) : query.isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] font-semibold text-red-700">
              Failed to load employee attendance.
            </div>
          ) : (
            <>
              {lunch ? (
                <LunchSettingsCard lunch={lunch} />
              ) : null}

              <section className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-3">
                  <h3 className="text-xs font-black text-slate-900">
                    Check-in activity
                  </h3>

                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    Recorded attendance events for the
                    selected date.
                  </p>
                </div>

                {events.length === 0 ? (
                  <div className="p-4 text-[12px] font-semibold text-slate-600">
                    No attendance events for this day.
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {events.map(
                      (event: any, index: number) => (
                        <AttendanceEventCard
                          key={
                            event.id ||
                            `${event.type}-${event.timestampUtc}-${index}`
                          }
                          event={event}
                          timezone={timezone}
                        />
                      ),
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceSummary({
  row,
  status,
}: {
  row: AttendanceHrDailyRow;
  status: string;
}) {
  const checkInCount = [
    row.events.checkInAtUtc,
    row.events.lunchOutAtUtc,
    row.events.lunchInAtUtc,
    row.events.checkOutAtUtc,
  ].filter(Boolean).length;

  return (
    <section className="grid grid-cols-3 gap-2">
      <SummaryItem
        label="Status"
        value={status}
        tone={statusTone(status)}
      />

      <SummaryItem
        label="Worked"
        value={formatMinutes(row.workedMinutes)}
        tone="neutral"
      />

      <SummaryItem
        label="Events"
        value={`${checkInCount}/4`}
        tone="neutral"
      />
    </section>
  );
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone:
    | "green"
    | "blue"
    | "amber"
    | "red"
    | "neutral";
}) {
  const className =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "blue"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : tone === "red"
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div
      className={`rounded-xl border px-3 py-3 ${className}`}
    >
      <p className="text-[9px] font-black uppercase tracking-wider opacity-70">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-black">
        {value}
      </p>
    </div>
  );
}

function AttendanceIssueDetails({
  row,
  issue,
  status,
}: {
  row: AttendanceHrDailyRow;
  issue: {
    title: string;
    detail: string;
  };
  status: string;
}) {
  const issueDetails = buildIssueDetails(row);

  return (
    <section className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50/50">
      <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3">
        <span className="rounded-lg border border-amber-200 bg-white p-2 text-amber-700">
          <ShieldAlert className="h-4 w-4" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-black text-slate-950">
              Attendance issue
            </h3>

            <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[9px] font-black text-amber-900">
              {status}
            </span>
          </div>

          <p className="mt-1 text-xs font-black text-slate-800">
            {issue.title}
          </p>

          <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-600">
            {issue.detail}
          </p>
        </div>
      </div>

      <div className="space-y-2 p-3">
        {issueDetails.map((detail) => (
          <div
            key={detail.label}
            className="flex items-start justify-between gap-4 rounded-lg border border-amber-100 bg-white px-3 py-2.5"
          >
            <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              {detail.label}
            </span>

            <span className="text-right text-[11px] font-black text-slate-800">
              {detail.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildIssueDetails(
  row: AttendanceHrDailyRow,
): Array<{
  label: string;
  value: string;
}> {
  const details: Array<{
    label: string;
    value: string;
  }> = [];

  if (row.lateByMinutes) {
    details.push({
      label: "Late by",
      value: formatMinutes(row.lateByMinutes),
    });
  }

  if (row.penaltyMinutes) {
    details.push({
      label: "Possible deduction",
      value: friendlyPenalty(row.penaltyMinutes),
    });
  }

  if (
    row.latenessReasonCredit &&
    typeof row.latenessReasonCredit.remaining ===
      "number"
  ) {
    details.push({
      label: "Lateness credits",
      value: `${row.latenessReasonCredit.remaining} remaining`,
    });
  }

  if (row.noReasonPenaltyMessageEligible) {
    details.push({
      label: "Penalty message",
      value: "Eligible to send",
    });
  }

  if (!row.events.checkInAtUtc) {
    details.push({
      label: "Check-in",
      value: "Not recorded",
    });
  }

  if (
    row.events.checkInAtUtc &&
    !row.events.checkOutAtUtc
  ) {
    details.push({
      label: "Check-out",
      value: "Not recorded",
    });
  }

  if (details.length === 0) {
    details.push({
      label: "Review",
      value: "Manual HR review required",
    });
  }

  return details;
}

function LunchSettingsCard({
  lunch,
}: {
  lunch: any;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Lunch settings
      </p>

      <p className="mt-1 text-[12px] font-extrabold text-slate-900">
        {lunch.lunchBreakEnabled
          ? `${lunch.lunchMode} mode`
          : "Lunch disabled"}
      </p>

      {lunch.lunchMode === "FIXED" &&
      lunch.fixedLunchStartTime &&
      lunch.fixedLunchEndTime ? (
        <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
          Fixed window: {lunch.fixedLunchStartTime} –{" "}
          {lunch.fixedLunchEndTime}
        </p>
      ) : null}

      <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
        Multiple breaks:{" "}
        {lunch.allowMultipleLunchBreaks
          ? "Allowed"
          : "Not allowed"}
      </p>
    </section>
  );
}

function AttendanceEventCard({
  event,
  timezone,
}: AttendanceEventCardProps) {
  const eventLabel =
    event.type === "LUNCH_OUT"
      ? "Check Out for Lunch"
      : event.type === "LUNCH_IN"
        ? "Return from Lunch"
        : String(event.type).replace(/_/g, " ");

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-[12px] font-extrabold text-slate-900">
          {formatEventTimestamp(
            event.timestampUtc,
            timezone,
          )}
        </p>

        <p className="text-[11px] font-semibold text-slate-600">
          {eventLabel}
        </p>
      </div>

      <div className="text-right">
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <MapPin className="h-3.5 w-3.5" />

          <span>
            {Math.round(
              Number(event.distanceMeters || 0),
            )}{" "}
            m
          </span>
        </div>

        <div className="mt-1 text-[10px] font-extrabold">
          {event.withinAllowedRadius ? (
            <span className="text-emerald-700">
              Inside radius
            </span>
          ) : (
            <span className="text-rose-700">
              Outside radius
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function formatEventTimestamp(
  timestampUtc: string | null | undefined,
  timezone: string,
): string {
  if (!timestampUtc) {
    return "Time not available";
  }

  const date = new Date(timestampUtc);

  if (Number.isNaN(date.getTime())) {
    return "Invalid time";
  }

  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusTone(
  status: string,
):
  | "green"
  | "blue"
  | "amber"
  | "red"
  | "neutral" {
  if (
    status === "Present" ||
    status === "Completed" ||
    status === "Remote"
  ) {
    return "green";
  }

  if (status === "Still Working") {
    return "blue";
  }

  if (status === "Late") {
    return "amber";
  }

  if (
    status === "Absent" ||
    status === "Incomplete"
  ) {
    return "red";
  }

  return "neutral";
}

function formatMinutes(minutes: number): string {
  const safeMinutes = Number(minutes || 0);
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours <= 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function friendlyPenalty(minutes: number): string {
  if (minutes >= 7 * 60) {
    return "1 workday";
  }

  return formatMinutes(minutes);
}
