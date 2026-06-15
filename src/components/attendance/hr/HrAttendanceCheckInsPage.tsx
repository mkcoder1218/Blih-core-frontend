import React from "react";
import { useAttendanceHrDaily } from "../../../hooks/useAttendanceHrDaily";
import { useAttendanceHrSummary } from "../../../hooks/useAttendanceHrSummary";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { useSubmitAttendanceRequest, useSyncApprovedAttendanceCorrections } from "../../../hooks/useAttendanceRequests";
import type { AttendanceHrDailyRow } from "../../../api/types";
import AttendanceSummaryCards from "./AttendanceSummaryCards";
import AttendanceFilters, { type AttendanceFiltersValue } from "./AttendanceFilters";
import AttendanceTable from "./AttendanceTable";
import EmployeeAttendanceDrawer from "./EmployeeAttendanceDrawer";
import { downloadAttendanceHrExport } from "../../../api/attendanceHr";
import { PageHeader, InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

export default function HrAttendanceCheckInsPage() {
  const perms = useMyPermissions();
  const canRequestCorrection = perms.hasAny("attendance.checkin_correction.request", "attendance.manage");
  const canSyncCorrections = perms.hasAny("attendance.manage", "attendance.checkin_correction.approve");
  const submitCorrection = useSubmitAttendanceRequest();
  const syncCorrections = useSyncApprovedAttendanceCorrections();
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
  const [correctionRow, setCorrectionRow] = React.useState<AttendanceHrDailyRow | null>(null);
  const [correctionType, setCorrectionType] = React.useState("CHECK_IN");
  const [correctionTime, setCorrectionTime] = React.useState("09:00");
  const [correctionReason, setCorrectionReason] = React.useState("");

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

  const handleSyncNow = async () => {
    await syncCorrections.mutateAsync({ date: filters.date });
    await Promise.all([daily.refetch(), summary.refetch()]);
  };

  const handleSubmitCorrection = async () => {
    if (!correctionRow) return;
    await submitCorrection.mutateAsync({
      requestType: "check_in_correction",
      employeeUserId: correctionRow.employeeId,
      category: correctionType,
      title: `Manual ${correctionType.replace(/_/g, " ").toLowerCase()} correction`,
      reason: correctionReason,
      fromAt: `${filters.date}T${correctionTime}:00`,
    });
    setCorrectionRow(null);
    setCorrectionReason("");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="HR Attendance"
        title="Check-ins Monitoring"
        description="Monitor attendance per employee for the selected day."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canSyncCorrections && (
              <Button
                onClick={handleSyncNow}
                disabled={syncCorrections.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 h-9 rounded-xl disabled:bg-slate-200 disabled:text-slate-400"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncCorrections.isPending ? "animate-spin" : ""}`} />
                {syncCorrections.isPending ? "Syncing..." : "Sync now"}
              </Button>
            )}
            <Button
              onClick={handleExport}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 h-9 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        }
      />

      {syncCorrections.isSuccess && (
        <InfoAlert
          variant="success"
          message={`Synced approved corrections. Updated ${syncCorrections.data.updated}, created ${syncCorrections.data.created}.`}
        />
      )}

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
        <AttendanceTable
          rows={rows}
          timezone={tz}
          onSelectEmployee={setSelectedEmployeeId}
          onRequestCorrection={canRequestCorrection ? setCorrectionRow : undefined}
        />
      )}

      <EmployeeAttendanceDrawer
        open={Boolean(selectedEmployeeId)}
        employeeId={selectedEmployeeId}
        date={filters.date}
        onClose={() => setSelectedEmployeeId(null)}
      />

      {correctionRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-950">Request check-in correction</h3>
              <p className="text-[11px] font-semibold text-slate-500 mt-1">
                This will wait for Business Admin approval before changing {correctionRow.employeeName}'s attendance.
              </p>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[11px] font-black uppercase text-slate-400">Correction type</span>
                <select value={correctionType} onChange={(e) => setCorrectionType(e.target.value)} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold">
                  <option value="CHECK_IN">Check in</option>
                  <option value="LUNCH_OUT">Lunch out</option>
                  <option value="LUNCH_IN">Lunch in</option>
                  <option value="CHECK_OUT">Check out</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase text-slate-400">Time</span>
                <input type="time" value={correctionTime} onChange={(e) => setCorrectionTime(e.target.value)} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold" />
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase text-slate-400">Reason</span>
                <textarea value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} required rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" placeholder="Explain why this manual correction is needed." />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCorrectionRow(null)}>Cancel</Button>
              <Button type="button" disabled={!correctionReason.trim() || submitCorrection.isPending} className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleSubmitCorrection}>
                Submit for approval
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
