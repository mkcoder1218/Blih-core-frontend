import React from "react";
import type { AttendanceHrDailyRow } from "../../../api/types";
import { DataTable, UserAvatar } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  "Select",
  "Employee",
  "Department",
  "Attendance",
  "Worked",
  "Status",
  "Issue",
  "Action",
];

export type AttendanceViewTab = "attention" | "present" | "working" | "absent" | "all";

export function getSimpleAttendanceStatus(row: AttendanceHrDailyRow) {
  const status = String(row.status || "").toUpperCase();
  if (status === "REMOTE") return "Remote";
  if (status === "PAID_DAY_OFF") return "Paid Day Off";
  if (status === "ON_LEAVE") return "On Approved Leave";
  if (["MISSED", "NOT_STARTED", "ABSENT"].includes(status)) return "Absent";
  if (status === "IN_PROGRESS" || status === "ON_BREAK") return "Still Working";
  if (row.isLate || status === "LATE") return "Late";
  if (status === "COMPLETED") return "Completed";
  if (!row.events.checkOutAtUtc && row.events.checkInAtUtc) return "Incomplete";
  return "Present";
}

export function rowNeedsAttention(row: AttendanceHrDailyRow) {
  const simpleStatus = getSimpleAttendanceStatus(row);
  return (
    simpleStatus === "Absent" ||
    simpleStatus === "Late" ||
    simpleStatus === "Incomplete" ||
    Boolean(row.noReasonPenaltyMessageEligible) ||
    Boolean(row.penaltyMinutes)
  );
}

export function getAttendanceTab(row: AttendanceHrDailyRow): AttendanceViewTab {
  if (rowNeedsAttention(row)) return "attention";
  const simpleStatus = getSimpleAttendanceStatus(row);
  if (simpleStatus === "Absent") return "absent";
  if (simpleStatus === "Still Working") return "working";
  if (["Completed", "Present", "Late", "Remote"].includes(simpleStatus)) return "present";
  return "all";
}

export function getIssueSummary(row: AttendanceHrDailyRow) {
  const status = getSimpleAttendanceStatus(row);
  if (status === "Absent") {
    return {
      title: "Absent without approved attendance",
      detail: row.penaltyMinutes ? `Possible deduction: ${friendlyPenalty(row.penaltyMinutes)}` : "Review whether leave was approved.",
    };
  }
  if (status === "Late") {
    return {
      title: "Late arrival",
      detail: row.lateByMinutes ? `${formatMinutes(row.lateByMinutes)} late.` : `${row.latenessReasonCredit?.remaining ?? 0} leave credits remaining.`,
    };
  }
  if (status === "Incomplete") {
    return {
      title: "Missing check-out",
      detail: "Ask the employee to confirm the correct time.",
    };
  }
  if (row.noReasonPenaltyMessageEligible) {
    return {
      title: "Penalty notice pending",
      detail: "Review before sending a notification.",
    };
  }
  return {
    title: "No issue",
    detail: "Attendance looks complete.",
  };
}

export default function AttendanceTable({
  rows,
  timezone,
  title = "Employees",
  subtitle,
  onSelectEmployee,
  onRequestCorrection,
  onSendPenaltyMessage,
  sendingPenaltyEmployeeId,
  selectedEmployeeIds,
  onToggleEmployeeSelection,
  onToggleAllVisible,
}: {
  rows: AttendanceHrDailyRow[];
  timezone: string;
  title?: string;
  subtitle?: string;
  onSelectEmployee: (employeeId: string) => void;
  onRequestCorrection?: (row: AttendanceHrDailyRow) => void;
  onSendPenaltyMessage?: (row: AttendanceHrDailyRow) => void | Promise<void>;
  sendingPenaltyEmployeeId?: string | null;
  selectedEmployeeIds?: Set<string>;
  onToggleEmployeeSelection?: (employeeId: string) => void;
  onToggleAllVisible?: () => void;
}) {
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const selectedCount = rows.filter((row) => selectedEmployeeIds?.has(row.employeeId)).length;
  const allVisibleSelected = rows.length > 0 && selectedCount === rows.length;

  return (
    <DataTable
      title={title}
      subtitle={subtitle || (selectedCount ? `${selectedCount} of ${rows.length} selected` : `${rows.length} employees`)}
      columns={COLUMNS}
      rows={rows}
      emptyMessage="No employees match this view."
      headerAction={
        onToggleAllVisible ? (
          <label className="inline-flex items-center gap-2 text-[11px] font-extrabold text-slate-600">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={onToggleAllVisible}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            Select visible
          </label>
        ) : undefined
      }
      renderRow={(row) => {
        const simpleStatus = getSimpleAttendanceStatus(row);
        const issue = getIssueSummary(row);
        const primaryAction = getPrimaryAction(simpleStatus);
        return (
          <tr
            key={row.employeeId}
            onClick={() => onSelectEmployee(row.employeeId)}
            className="border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer"
          >
            <td className="px-4 py-3">
              <input
                type="checkbox"
                checked={Boolean(selectedEmployeeIds?.has(row.employeeId))}
                onChange={(event) => {
                  event.stopPropagation();
                  onToggleEmployeeSelection?.(row.employeeId);
                }}
                onClick={(event) => event.stopPropagation()}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
            </td>
            <td className="px-4 py-3">
              <UserAvatar name={row.employeeName} subtitle={row.employeeEmail} size="sm" />
            </td>
            <td className="px-4 py-3 text-[12px] text-slate-700 font-semibold">
              {row.department?.name || "Unassigned"}
            </td>
            <td className="px-4 py-3">
              <AttendanceTimeline row={row} timezone={timezone} />
            </td>
            <td className="px-4 py-3 text-[12px] text-slate-700 font-extrabold">
              {formatMinutes(row.workedMinutes)}
            </td>
            <td className="px-4 py-3">
              <SimpleStatusBadge status={simpleStatus} />
            </td>
            <td className="px-4 py-3">
              <div className="max-w-[220px]">
                <div className={issue.title === "No issue" ? "text-[12px] font-bold text-slate-500" : "text-[12px] font-black text-slate-800"}>
                  {issue.title}
                </div>
                <div className="mt-0.5 text-[11px] font-semibold text-slate-400 leading-tight">{issue.detail}</div>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="relative flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                <Button
                  type="button"
                  className="h-8 rounded-xl bg-blue-600 px-3 text-[11px] font-extrabold hover:bg-blue-700"
                  onClick={() => {
                    if (simpleStatus === "Incomplete" && onRequestCorrection) onRequestCorrection(row);
                    else onSelectEmployee(row.employeeId);
                  }}
                >
                  {primaryAction}
                </Button>
                <button
                  type="button"
                  onClick={() => setOpenMenuId(openMenuId === row.employeeId ? null : row.employeeId)}
                  className="h-8 rounded-xl border border-slate-200 px-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                  aria-label="More actions"
                >
                  ...
                </button>
                {openMenuId === row.employeeId && (
                  <div className="absolute right-0 top-9 z-20 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                    {onRequestCorrection && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          onRequestCorrection(row);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                      >
                        Request attendance edit
                      </button>
                    )}
                    {onSendPenaltyMessage && row.noReasonPenaltyMessageEligible && (
                      <button
                        type="button"
                        disabled={sendingPenaltyEmployeeId === row.employeeId}
                        onClick={() => {
                          setOpenMenuId(null);
                          onSendPenaltyMessage(row);
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                      >
                        {sendingPenaltyEmployeeId === row.employeeId ? "Sending..." : "Send penalty notice"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        onSelectEmployee(row.employeeId);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      View attendance details
                    </button>
                  </div>
                )}
              </div>
            </td>
          </tr>
        );
      }}
    />
  );
}

function AttendanceTimeline({ row, timezone }: { row: AttendanceHrDailyRow; timezone: string }) {
  const steps = [
    { label: "In", value: row.events.checkInAtUtc, missing: "Not recorded" },
    { label: "Lunch out", value: row.events.lunchOutAtUtc, missing: "Not recorded" },
    { label: "Lunch in", value: row.events.lunchInAtUtc, missing: "Not recorded" },
    {
      label: "Out",
      value: row.events.checkOutAtUtc,
      missing: row.events.checkInAtUtc && getSimpleAttendanceStatus(row) === "Still Working" ? "Working" : "Not recorded",
    },
  ];
  return (
    <div className="min-w-[300px]">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => {
          const hasValue = Boolean(step.value);
          const pending = step.missing === "Working";
          return (
            <div key={step.label} className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{step.label}</div>
              <div className={`mt-1 flex items-center gap-1.5 text-[11px] font-black ${hasValue ? "text-slate-800" : pending ? "text-blue-700" : "text-rose-600"}`}>
                <span className={`h-2 w-2 rounded-full ${hasValue ? "bg-emerald-500" : pending ? "border border-blue-500" : "bg-rose-500"}`} />
                <span className="truncate">{hasValue ? fmt(step.value, timezone) : step.missing}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleStatusBadge({ status }: { status: string }) {
  const cls =
    status === "Completed" || status === "Present" || status === "Remote"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "Still Working"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : status === "Late"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : status === "Absent" || status === "Incomplete"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : "bg-slate-100 text-slate-600 border-slate-200";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${cls}`}>{status}</span>;
}

function getPrimaryAction(status: string) {
  if (status === "Absent") return "Review absence";
  if (status === "Late") return "Review lateness";
  if (status === "Incomplete") return "Fix attendance";
  return "View details";
}

function fmt(tsUtc: string | null, tz: string) {
  if (!tsUtc) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(tsUtc));
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function friendlyPenalty(mins: number) {
  if (mins >= 7 * 60) return "1 workday";
  return formatMinutes(mins);
}
