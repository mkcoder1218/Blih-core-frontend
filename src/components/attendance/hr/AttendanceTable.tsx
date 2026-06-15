import React from "react";
import type { AttendanceHrDailyRow } from "../../../api/types";
import { DataTable, UserAvatar, StatusBadge } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  "Employee",
  "Department",
  "Morning",
  "Lunch Out",
  "Lunch In",
  "Check Out",
  "Total Worked",
  "Break",
  "Status",
  "Actions",
];

export default function AttendanceTable({
  rows,
  timezone,
  onSelectEmployee,
  onRequestCorrection,
  onSyncEmployee,
  syncingEmployeeId,
}: {
  rows: AttendanceHrDailyRow[];
  timezone: string;
  onSelectEmployee: (employeeId: string) => void;
  onRequestCorrection?: (row: AttendanceHrDailyRow) => void;
  onSyncEmployee?: (row: AttendanceHrDailyRow) => void;
  syncingEmployeeId?: string | null;
}) {
  return (
    <DataTable
      title="Daily check-ins"
      subtitle={`${rows.length} employees`}
      columns={COLUMNS}
      rows={rows}
      emptyMessage="No employees match the current filters."
      renderRow={(r) => (
        <tr
          key={r.employeeId}
          onClick={() => onSelectEmployee(r.employeeId)}
          className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer"
        >
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
            {formatMinutes(r.breakMinutes)}
          </td>
          <td className="px-4 py-3">
            <StatusBadge status={r.status} />
          </td>
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-2">
              {onSyncEmployee && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={syncingEmployeeId === r.employeeId}
                  className="h-8 rounded-xl text-[11px] font-extrabold"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncEmployee(r);
                  }}
                >
                  {syncingEmployeeId === r.employeeId ? "Syncing..." : "Sync"}
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
