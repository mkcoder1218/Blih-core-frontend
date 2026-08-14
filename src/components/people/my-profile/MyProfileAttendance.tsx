import React from "react";
import { AlertCircle, CalendarDays, Clock3 } from "lucide-react";
import type { AttendancePage } from "./types";
import {
  attendanceStatus,
  formatDate,
  formatMinutes,
  formatTime,
  statusClass,
} from "./utils";
import { EmptyState, Pagination } from "./ProfileCommon";

interface MyProfileAttendanceProps {
  data?: AttendancePage;
  loading: boolean;
  error: any;
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function MyProfileAttendance({
  data,
  loading,
  error,
  page,
  pages,
  onPageChange,
}: MyProfileAttendanceProps) {
  const rows = data?.rows || [];

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Attendance history</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Your recorded check-in, check-out and worked-time history.
          </p>
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {data?.count || 0} records
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {loading ? (
          <EmptyState
            icon={Clock3}
            title="Loading attendance"
            description="Fetching your attendance records."
          />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Attendance unavailable"
            description={
              error?.response?.data?.message ||
              error?.message ||
              "Could not load attendance history."
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No attendance records"
            description="Attendance records will appear here once check-ins are recorded."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-muted/50">
                  <tr className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Check In</th>
                    <th className="px-4 py-3">Check Out</th>
                    <th className="px-4 py-3">Worked</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const status = attendanceStatus(row);
                    return (
                      <tr
                        key={`${row.date || "row"}-${index}`}
                        className="border-t border-border text-xs"
                      >
                        <td className="px-4 py-3.5 font-semibold text-foreground">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatTime(row?.events?.checkInAtUtc)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatTime(row?.events?.checkOutAtUtc)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatMinutes(row?.calculation?.totalWorkedMinutes)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onPageChange={onPageChange} />
          </>
        )}
      </div>
    </div>
  );
}
