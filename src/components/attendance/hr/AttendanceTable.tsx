import React from "react";
import type { AttendanceHrDailyRow } from "../../../api/types";
import AttendanceStatusBadge from "./AttendanceStatusBadge";

export default function AttendanceTable({
  rows,
  timezone,
  onSelectEmployee,
}: {
  rows: AttendanceHrDailyRow[];
  timezone: string;
  onSelectEmployee: (employeeId: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="text-[12px] font-extrabold text-slate-900">Daily check-ins</div>
        <div className="text-[11px] text-slate-600 font-semibold mt-0.5">{rows.length} employees</div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1050px] w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Morning</th>
              <th className="px-4 py-3">Lunch Out</th>
              <th className="px-4 py-3">Lunch In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Total Worked</th>
              <th className="px-4 py-3">Break</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-6 text-[12px] text-slate-600 font-semibold">
                  No employees match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.employeeId}
                  onClick={() => onSelectEmployee(r.employeeId)}
                  className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.employeeName} />
                      <div className="min-w-0">
                        <div className="text-[12px] font-extrabold text-slate-900 truncate">{r.employeeName}</div>
                        <div className="text-[11px] text-slate-500 font-semibold truncate">{r.employeeEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-700 font-semibold">{r.department?.name || "—"}</td>
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events.checkInAtUtc, timezone)}</td>
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events.lunchOutAtUtc, timezone)}</td>
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events.lunchInAtUtc, timezone)}</td>
                  <td className="px-4 py-3 text-[12px] font-bold text-slate-800">{fmt(r.events.checkOutAtUtc, timezone)}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-700 font-extrabold">{formatMinutes(r.workedMinutes)}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-700 font-extrabold">{formatMinutes(r.breakMinutes)}</td>
                  <td className="px-4 py-3">
                    <AttendanceStatusBadge status={r.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black shadow-xs">
      {initials || "U"}
    </div>
  );
}

function fmt(tsUtc: string | null, tz: string) {
  if (!tsUtc) return "—";
  return new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(tsUtc));
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

