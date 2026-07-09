import React from "react";
import type { AttendanceHrDailyRow } from "../../../api/types";
import { DataTable, UserAvatar, StatusBadge } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  "Select",
  "Employee",
  "Department",
  "Morning",
  "Lunch Out",
  "Lunch In",
  "Check Out",
  "Total Worked",
  "Reason Credit Left",
  "Penalty",
  "Break",
  "Status",
  "Actions",
];

export default function AttendanceTable({
  rows,
  timezone,
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
  onSelectEmployee: (employeeId: string) => void;
  onRequestCorrection?: (row: AttendanceHrDailyRow) => void;
  onSendPenaltyMessage?: (row: AttendanceHrDailyRow) => void | Promise<void>;
  sendingPenaltyEmployeeId?: string | null;
  selectedEmployeeIds?: Set<string>;
  onToggleEmployeeSelection?: (employeeId: string) => void;
  onToggleAllVisible?: () => void;
}) {
  const selectedCount = rows.filter((row) => selectedEmployeeIds?.has(row.employeeId)).length;
  const allVisibleSelected = rows.length > 0 && selectedCount === rows.length;

  return (
    <DataTable
      title="Daily check-ins"
      subtitle={selectedCount ? `${selectedCount} of ${rows.length} selected` : `${rows.length} employees`}
      columns={COLUMNS}
      rows={rows}
      emptyMessage="No employees match the current filters."
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
      renderRow={(r) => (
        <tr
          key={r.employeeId}
          onClick={() => onSelectEmployee(r.employeeId)}
          className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer"
        >
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(selectedEmployeeIds?.has(r.employeeId))}
              onChange={(e) => {
                e.stopPropagation();
                onToggleEmployeeSelection?.(r.employeeId);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
          </td>
          <td className="px-4 py-3">
            <UserAvatar
              name={r.employeeName}
              subtitle={r.employeeEmail}
              size="sm"
            />
          </td>
          <td className="px-4 py-3 text-[12px] text-slate-700 font-semibold">
            {r.department?.name || "—"}
          </td>
          <td className="px-4 py-3 text-[12px] font-bold text-slate-800">
            {fmt(r.events.checkInAtUtc, timezone)}
          </td>
          <td className="px-4 py-3 text-[12px] font-bold text-slate-800">
            {fmt(r.events.lunchOutAtUtc, timezone)}
          </td>
          <td className="px-4 py-3 text-[12px] font-bold text-slate-800">
            {fmt(r.events.lunchInAtUtc, timezone)}
          </td>
          <td className="px-4 py-3 text-[12px] font-bold text-slate-800">
            {fmt(r.events.checkOutAtUtc, timezone)}
          </td>
          <td className="px-4 py-3 text-[12px] text-slate-700 font-extrabold">
            {formatMinutes(r.workedMinutes)}
          </td>
          <td className="px-4 py-3 text-[12px] text-slate-700 font-extrabold">
            {isMissedOrAbsent(r.status) ? (
              <div className="min-w-[120px]">
                <div className="text-amber-700">Leave only</div>
                <div className="mt-0.5 max-w-[180px] text-[10px] font-bold text-slate-400 leading-tight">
                  Absence does not use late credit
                </div>
              </div>
            ) : (
              <div className="min-w-[120px]">
                <div className={r.latenessReasonCredit?.remaining ? "text-emerald-700" : "text-rose-700"}>
                  {r.latenessReasonCredit?.remaining ?? 0}/{r.latenessReasonCredit?.limit ?? 0}
                </div>
                {r.latenessReasonCredit?.mode === "GLOBAL_POOL" ? (
                  <div className="mt-0.5 max-w-[180px] text-[10px] font-bold text-slate-400 leading-tight">
                    Shared pool used {r.latenessReasonCredit?.used ?? 0}/{r.latenessReasonCredit?.limit ?? 0}
                  </div>
                ) : r.latenessReasonCredit?.reasons?.length ? (
                  <div className="mt-0.5 max-w-[180px] text-[10px] font-bold text-slate-400 leading-tight">
                    {r.latenessReasonCredit.reasons
                      .map((reason) => `${reason.label}: ${reason.remainingThisMonth}/${reason.monthlyLimit}`)
                      .join(" • ")}
                  </div>
                ) : (
                  <div className="mt-0.5 text-[10px] font-bold text-slate-400">No active credit</div>
                )}
              </div>
            )}
          </td>
          <td className="px-4 py-3 text-[12px] text-slate-700 font-extrabold">
            {r.penaltyMinutes ? (
              <div>
                <div className="text-red-600">{formatMinutes(r.penaltyMinutes)}</div>
                {r.penaltyReason ? <div className="max-w-[180px] text-[10px] font-bold text-slate-400 leading-tight">{r.penaltyReason}</div> : null}
              </div>
            ) : (
              <span className="text-slate-400">0m</span>
            )}
          </td>
          <td className="px-4 py-3 text-[12px] text-slate-700 font-extrabold">
            {formatMinutes(r.breakMinutes)}
          </td>
          <td className="px-4 py-3">
            <StatusBadge status={r.status} />
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {onSendPenaltyMessage && r.noReasonPenaltyMessageEligible && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-xl border-amber-200 bg-amber-50 text-[11px] font-extrabold text-amber-800 hover:bg-amber-100"
                  disabled={sendingPenaltyEmployeeId === r.employeeId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendPenaltyMessage(r);
                  }}
                >
                  {sendingPenaltyEmployeeId === r.employeeId ? "Sending..." : "Send penalty msg"}
                </Button>
              )}
              {onRequestCorrection && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 rounded-xl text-[11px] font-extrabold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestCorrection(r);
                  }}
                >
                  Request edit
                </Button>
              )}
            </div>
          </td>
        </tr>
      )}
    />
  );
}

function fmt(tsUtc: string | null, tz: string) {
  if (!tsUtc) return "—";
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

function isMissedOrAbsent(status: string) {
  return ["MISSED", "NOT_STARTED", "ABSENT"].includes(String(status || "").toUpperCase());
}
