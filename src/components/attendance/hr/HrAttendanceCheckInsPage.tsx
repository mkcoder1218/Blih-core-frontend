import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useAttendanceHrDaily } from "../../../hooks/useAttendanceHrDaily";
import { useAttendanceHrSummary } from "../../../hooks/useAttendanceHrSummary";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { useFixManualAttendanceTimes, useSubmitAttendanceRequest } from "../../../hooks/useAttendanceRequests";
import type { AttendanceHrDailyRow } from "../../../api/types";
import AttendanceSummaryCards from "./AttendanceSummaryCards";
import AttendanceFilters, { type AttendanceFiltersValue } from "./AttendanceFilters";
import AttendanceTable from "./AttendanceTable";
import EmployeeAttendanceDrawer from "./EmployeeAttendanceDrawer";
import {
  downloadAttendanceDailyReportExport,
  downloadAttendanceMonthlyReportExport,
  downloadAttendanceWeeklyReportExport,
  sendLateNoReasonPenaltyMessage,
} from "../../../api/attendanceHr";
import { PageHeader, InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function weekRangeFromDate(dateYmd: string) {
  const date = new Date(`${dateYmd}T00:00:00.000Z`);
  const day = date.getUTCDay() || 7;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() - day + 1);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function HrAttendanceCheckInsPage() {
  const perms = useMyPermissions();
  const canRequestCorrection = perms.hasAny("attendance.checkin_correction.request", "attendance.manage");
  const canFixManualTimes = perms.hasAny("attendance.read", "attendance.manage", "attendance.checkin_correction.request", "attendance.checkin_correction.approve");
  const submitCorrection = useSubmitAttendanceRequest();
  const fixManualTimes = useFixManualAttendanceTimes();
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
  const [penaltyMessageEmployeeId, setPenaltyMessageEmployeeId] = React.useState<string | null>(null);
  const [penaltyMessageStatus, setPenaltyMessageStatus] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [useCustomExportDateRange, setUseCustomExportDateRange] = React.useState(false);
  const [dailyExportStartDate, setDailyExportStartDate] = React.useState(today);
  const [dailyExportEndDate, setDailyExportEndDate] = React.useState(today);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<string>>(new Set());

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
  const rows: AttendanceHrDailyRow[] = daily.data?.data?.rows || [];

  React.useEffect(() => {
    const visibleEmployeeIds = new Set(rows.map((row) => row.employeeId));
    setSelectedEmployeeIds((current) => {
      const next = new Set(Array.from(current).filter((employeeId) => visibleEmployeeIds.has(employeeId)));
      return next.size === current.size ? current : next;
    });
  }, [rows]);

  const penaltyMessage = useMutation({
    mutationFn: ({ employeeId, date }: { employeeId: string; date: string }) =>
      sendLateNoReasonPenaltyMessage(employeeId, { date }),
  });

  const handleExport = async () => {
    const selectedWeek = weekRangeFromDate(filters.date);
    const selectedEmployeeIdParam = selectedEmployeeIds.size ? Array.from(selectedEmployeeIds).join(",") : undefined;
    const commonParams = {
      departmentId: filters.departmentId || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined,
      employeeIds: selectedEmployeeIdParam,
      format: "csv" as const,
    };
    const res =
      filters.range === "weekly"
        ? await downloadAttendanceWeeklyReportExport({
            ...commonParams,
            startDate: selectedWeek.startDate,
            endDate: selectedWeek.endDate,
          })
        : filters.range === "monthly"
          ? await downloadAttendanceMonthlyReportExport({
              ...commonParams,
              month: filters.date.slice(0, 7),
            })
          : await downloadAttendanceDailyReportExport({
              ...commonParams,
              date: filters.date,
              ...(useCustomExportDateRange
                ? {
                    enableDateFilter: true,
                    startDate: dailyExportStartDate,
                    endDate: dailyExportEndDate,
                  }
                : {}),
            });
    const contentType = res.headers["content-type"];
    const blob = new Blob([res.data], { type: typeof contentType === "string" ? contentType : "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const contentDisposition = res.headers["content-disposition"];
    const headerFilename = typeof contentDisposition === "string"
      ? contentDisposition.match(/filename=\"?([^\";]+)\"?/i)?.[1]
      : undefined;
    const filename =
      headerFilename ||
      `attendance-${filters.range}-${filters.date}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleFixManualTimes = async () => {
    await fixManualTimes.mutateAsync({ date: filters.date });
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

  const handleSendPenaltyMessage = async (row: AttendanceHrDailyRow) => {
    setPenaltyMessageEmployeeId(row.employeeId);
    setPenaltyMessageStatus(null);
    try {
      await penaltyMessage.mutateAsync({ employeeId: row.employeeId, date: filters.date });
      setPenaltyMessageStatus({ type: "success", message: `Penalty message sent for ${row.employeeName}.` });
    } catch (error: any) {
      setPenaltyMessageStatus({
        type: "error",
        message: error?.response?.data?.message || error?.message || "Failed to send penalty message.",
      });
    } finally {
      setPenaltyMessageEmployeeId(null);
    }
  };

  const handleToggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds((current) => {
      const next = new Set(current);
      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }
      return next;
    });
  };

  const handleToggleAllVisible = () => {
    setSelectedEmployeeIds((current) => {
      const visibleEmployeeIds = rows.map((row) => row.employeeId);
      const allVisibleSelected = visibleEmployeeIds.length > 0 && visibleEmployeeIds.every((employeeId) => current.has(employeeId));
      if (allVisibleSelected) return new Set();
      return new Set(visibleEmployeeIds);
    });
  };

  const dailyExportDateFilterInvalid =
    filters.range === "daily" &&
    useCustomExportDateRange &&
    (!dailyExportStartDate || !dailyExportEndDate || dailyExportStartDate > dailyExportEndDate);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="HR Attendance"
        title="Check-ins Monitoring"
        description="Monitor attendance per employee for the selected day."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canFixManualTimes && (
              <Button
                onClick={handleFixManualTimes}
                disabled={fixManualTimes.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 h-9 rounded-xl disabled:bg-slate-200 disabled:text-slate-400"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fixManualTimes.isPending ? "animate-spin" : ""}`} />
                {fixManualTimes.isPending ? "Fixing..." : "Fix manual times"}
              </Button>
            )}
            <Button
              onClick={handleExport}
              disabled={dailyExportDateFilterInvalid}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 h-9 rounded-xl"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export CSV
            </Button>
          </div>
        }
      />

      {fixManualTimes.isSuccess && (
        <InfoAlert
          variant="success"
          message={`Fixed manual times for selected date. Updated ${fixManualTimes.data.updated}, created ${fixManualTimes.data.created}.`}
        />
      )}
      {penaltyMessageStatus && (
        <InfoAlert variant={penaltyMessageStatus.type} message={penaltyMessageStatus.message} />
      )}

      {summary.isError && (
        <InfoAlert variant="error" message="Failed to load summary." />
      )}
      <AttendanceSummaryCards data={summary.data?.data} />

      <AttendanceFilters value={filters} onChange={setFilters} />

      {filters.range === "daily" && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
            <div className="lg:col-span-4">
              <h3 className="text-xs font-black text-slate-700">Export Options</h3>
            </div>
            <label className="lg:col-span-4 inline-flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <input
                type="checkbox"
                checked={useCustomExportDateRange}
                onChange={(e) => setUseCustomExportDateRange(e.currentTarget.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              Use custom export date range
            </label>
            {useCustomExportDateRange && (
              <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Export start date</label>
                  <input
                    type="date"
                    value={dailyExportStartDate}
                    onChange={(e) => setDailyExportStartDate(e.currentTarget.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Export end date</label>
                  <input
                    type="date"
                    value={dailyExportEndDate}
                    onChange={(e) => setDailyExportEndDate(e.currentTarget.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
                  />
                </div>
              </div>
            )}
          </div>
          {dailyExportDateFilterInvalid && (
            <p className="mt-2 text-xs font-semibold text-red-600">Choose a valid export date range.</p>
          )}
        </div>
      )}

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
          onSendPenaltyMessage={handleSendPenaltyMessage}
          sendingPenaltyEmployeeId={penaltyMessageEmployeeId}
          selectedEmployeeIds={selectedEmployeeIds}
          onToggleEmployeeSelection={handleToggleEmployeeSelection}
          onToggleAllVisible={handleToggleAllVisible}
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
                <select value={correctionType} onChange={(e) => setCorrectionType(e.currentTarget.value)} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold">
                  <option value="CHECK_IN">Check in</option>
                  <option value="LUNCH_OUT">Lunch out</option>
                  <option value="LUNCH_IN">Lunch in</option>
                  <option value="CHECK_OUT">Check out</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase text-slate-400">Time</span>
                <input type="time" value={correctionTime} onChange={(e) => setCorrectionTime(e.currentTarget.value)} className="mt-1 w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold" />
              </label>
              <label className="block">
                <span className="text-[11px] font-black uppercase text-slate-400">Reason</span>
                <textarea value={correctionReason} onChange={(e) => setCorrectionReason(e.currentTarget.value)} required rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" placeholder="Explain why this manual correction is needed." />
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
