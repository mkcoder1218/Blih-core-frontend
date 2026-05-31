import React from "react";
import { useAttendanceHrDaily } from "../../../hooks/useAttendanceHrDaily";
import { useAttendanceHrSummary } from "../../../hooks/useAttendanceHrSummary";
import AttendanceSummaryCards from "./AttendanceSummaryCards";
import AttendanceFilters, { type AttendanceFiltersValue } from "./AttendanceFilters";
import AttendanceTable from "./AttendanceTable";
import EmployeeAttendanceDrawer from "./EmployeeAttendanceDrawer";
import { downloadAttendanceHrExport } from "../../../api/attendanceHr";

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export default function HrAttendanceCheckInsPage() {
  const today = todayYmd();
  const [filters, setFilters] = React.useState<AttendanceFiltersValue>({
    date: today,
    startDate: today,
    endDate: today,
    departmentId: "",
    status: "",
    search: "",
    sortBy: "name",
    sortOrder: "asc",
    range: "daily",
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null);

  const summary = useAttendanceHrSummary({ date: filters.date, departmentId: filters.departmentId || undefined });
  const daily = useAttendanceHrDaily({
    date: filters.date,
    departmentId: filters.departmentId || undefined,
    status: filters.status || undefined,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const tz = daily.data?.data?.timezone || summary.data?.data?.timezone || "UTC";
  const rows = daily.data?.data?.rows || [];

  const exportParams = React.useMemo(() => {
    const startDate = filters.range === "daily" ? filters.date : filters.startDate;
    const endDate = filters.range === "daily" ? filters.date : filters.endDate;
    return {
      startDate,
      endDate,
      departmentId: filters.departmentId || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      format: "csv" as const,
    };
  }, [filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">HR Attendance</div>
          <div className="text-[18px] font-black text-slate-900 tracking-tight mt-1">Check-ins monitoring</div>
          <div className="text-[12px] text-slate-600 font-semibold mt-1">Monitor attendance per employee for the selected day.</div>
        </div>
        <button
          onClick={async () => {
            const res = await downloadAttendanceHrExport(exportParams);
            const blob = new Blob([res.data], { type: res.headers["content-type"] || "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const filename =
              (res.headers["content-disposition"] as string | undefined)?.match(/filename=\"?([^\";]+)\"?/i)?.[1] ||
              `attendance-${exportParams.startDate}-to-${exportParams.endDate}.csv`;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
          className="text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl cursor-pointer"
        >
          Export CSV
        </button>
      </div>

      {summary.isError ? (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">Failed to load summary.</div>
      ) : null}
      <AttendanceSummaryCards data={summary.data?.data} />

      <AttendanceFilters value={filters} onChange={setFilters} />

      {daily.isError ? (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">Failed to load daily attendance.</div>
      ) : null}

      {daily.isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5 text-[12px] text-slate-600 font-semibold">Loading attendance…</div>
      ) : (
        <AttendanceTable rows={rows} timezone={tz} onSelectEmployee={setSelectedEmployeeId} />
      )}

      <EmployeeAttendanceDrawer
        open={Boolean(selectedEmployeeId)}
        employeeId={selectedEmployeeId}
        date={filters.date}
        onClose={() => setSelectedEmployeeId(null)}
      />
    </div>
  );
}
