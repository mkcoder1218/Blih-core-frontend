import React from "react";
import { useAttendanceHrDaily } from "../../../hooks/useAttendanceHrDaily";
import { useAttendanceHrSummary } from "../../../hooks/useAttendanceHrSummary";
import AttendanceSummaryCards from "./AttendanceSummaryCards";
import AttendanceFilters, { type AttendanceFiltersValue } from "./AttendanceFilters";
import AttendanceTable from "./AttendanceTable";
import EmployeeAttendanceDrawer from "./EmployeeAttendanceDrawer";
import { downloadAttendanceHrExport } from "../../../api/attendanceHr";
import { PageHeader, InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

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

  const handleExport = async () => {
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
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="HR Attendance"
        title="Check-ins Monitoring"
        description="Monitor attendance per employee for the selected day."
        actions={
          <Button
            onClick={handleExport}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 h-9 rounded-xl"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      {summary.isError && (
        <InfoAlert variant="error" message="Failed to load summary." />
      )}
      <AttendanceSummaryCards data={summary.data?.data} />

      <AttendanceFilters value={filters} onChange={setFilters} />

      {daily.isError && (
        <InfoAlert variant="error" message="Failed to load daily attendance." />
      )}

      {daily.isLoading ? (
        <LoadingSpinner label="Loading attendance…" />
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
