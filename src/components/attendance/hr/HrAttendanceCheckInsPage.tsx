import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useAttendanceHrDaily } from "../../../hooks/useAttendanceHrDaily";
import { useAttendanceHrSummary } from "../../../hooks/useAttendanceHrSummary";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { useFixManualAttendanceTimes, useSubmitAttendanceRequest } from "../../../hooks/useAttendanceRequests";
import type { AttendanceHrDailyRow } from "../../../api/types";
import AttendanceFilters, { type AttendanceFiltersValue } from "./AttendanceFilters";
import AttendanceTable, {
  getAttendanceTab,
  getIssueSummary,
  getSimpleAttendanceStatus,
  rowNeedsAttention,
  type AttendanceViewTab,
} from "./AttendanceTable";
import EmployeeAttendanceDrawer from "./EmployeeAttendanceDrawer";
import {
  downloadAttendanceDailyReportExport,
  downloadAttendanceMonthlyReportExport,
  downloadAttendanceWeeklyReportExport,
  removeAutoAddedAttendance,
  sendLateNoReasonPenaltyMessage,
} from "../../../api/attendanceHr";
import { InfoAlert, LoadingSpinner } from "@/components/ui/blih";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock3, Download, RefreshCw, UserX } from "lucide-react";

type ExportPeriod = "day" | "week" | "month" | "custom";

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

function utcToLocalTimeInputValue(value: string | null | undefined, timeZone: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value || "09";
  const minute = parts.find((part) => part.type === "minute")?.value || "00";
  return `${hour}:${minute}`;
}

function SummaryCard({
  label,
  value,
  icon,
  active,
  onClick,
  tone,
  detail,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone: "green" | "blue" | "amber" | "red";
  detail?: string;
}) {
  const toneClass =
    tone === "green"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : tone === "blue"
        ? "text-blue-700 bg-blue-50 border-blue-100"
        : tone === "amber"
          ? "text-amber-700 bg-amber-50 border-amber-100"
          : "text-rose-700 bg-rose-50 border-rose-100";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[74px] rounded-lg border bg-white px-4 py-3 text-left transition hover:bg-slate-50 ${
        active ? "border-slate-300" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{label}</p>
          <p className="mt-0.5 text-xl font-semibold text-slate-950">{value}</p>
          {detail ? <p className="mt-0.5 text-[11px] font-medium text-slate-500">{detail}</p> : null}
        </div>
        <span className={`rounded-md border p-1.5 ${toneClass}`}>{icon}</span>
      </div>
    </button>
  );
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
  const [correctionTypes, setCorrectionTypes] = React.useState<string[]>(["CHECK_IN"]);
  const [correctionTimes, setCorrectionTimes] = React.useState<Record<string, string>>({
    CHECK_IN: "09:00",
    LUNCH_OUT: "12:30",
    LUNCH_IN: "13:30",
    CHECK_OUT: "17:00",
  });
  const [correctionReason, setCorrectionReason] = React.useState("");
  const [penaltyMessageEmployeeId, setPenaltyMessageEmployeeId] = React.useState<string | null>(null);
  const [penaltyMessageStatus, setPenaltyMessageStatus] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const [removeAutoAttendanceEmployeeId, setRemoveAutoAttendanceEmployeeId] = React.useState<string | null>(null);
  const [removeAutoAttendanceRow, setRemoveAutoAttendanceRow] = React.useState<AttendanceHrDailyRow | null>(null);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportPeriod, setExportPeriod] = React.useState<ExportPeriod>("day");
  const [exportStartDate, setExportStartDate] = React.useState(today);
  const [exportEndDate, setExportEndDate] = React.useState(today);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState<AttendanceViewTab>("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  const summary = useAttendanceHrSummary({ date: filters.date, departmentId: filters.departmentId || undefined });
  const daily = useAttendanceHrDaily({
    date: filters.date,
    departmentId: filters.departmentId || undefined,
    status: filters.status || undefined,
    search: filters.search || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    page,
    size: pageSize,
  });

  const tz = daily.data?.data?.timezone || summary.data?.data?.timezone || "UTC";
  const rows: AttendanceHrDailyRow[] = daily.data?.data?.rows || [];
  const totalRows = daily.data?.data?.total ?? rows.length;
  const totalPages = daily.data?.data?.totalPages ?? 1;
  const counts = React.useMemo(() => {
    const attention = rows.filter(rowNeedsAttention).length;
    const absent = rows.filter((row) => getSimpleAttendanceStatus(row) === "Absent").length;
    const working = rows.filter((row) => getSimpleAttendanceStatus(row) === "Still Working").length;
    const present = rows.filter((row) => ["Present", "Completed", "Remote"].includes(getSimpleAttendanceStatus(row))).length;
    const late = rows.filter((row) => getSimpleAttendanceStatus(row) === "Late").length;
    const incomplete = rows.filter((row) => getSimpleAttendanceStatus(row) === "Incomplete").length;
    return { attention, absent, working, present, late, incomplete, all: rows.length };
  }, [rows]);

  React.useEffect(() => {
    setActiveTab("all");
  }, [filters.date, filters.departmentId, filters.search, filters.status]);

  const visibleRows = React.useMemo(() => {
    if (activeTab === "all") return rows;
    if (activeTab === "attention") return rows.filter(rowNeedsAttention);
    return rows.filter((row) => getAttendanceTab(row) === activeTab);
  }, [activeTab, rows]);
  React.useEffect(() => {
    setPage(1);
  }, [filters.date, filters.departmentId, filters.search, filters.sortBy, filters.sortOrder, filters.status]);

  React.useEffect(() => {
    if (page > totalPages) setPage(Math.max(totalPages, 1));
  }, [page, totalPages]);
  const attentionRows: AttendanceHrDailyRow[] = [];

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

  const removeAutoAttendance = useMutation({
    mutationFn: ({ employeeId, date, eventTypes }: { employeeId: string; date: string; eventTypes: string[] }) =>
      removeAutoAddedAttendance(employeeId, { date, eventTypes }),
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
      exportPeriod === "week"
        ? await downloadAttendanceWeeklyReportExport({
            ...commonParams,
            startDate: selectedWeek.startDate,
            endDate: selectedWeek.endDate,
          })
        : exportPeriod === "month"
          ? await downloadAttendanceMonthlyReportExport({
              ...commonParams,
              month: filters.date.slice(0, 7),
            })
          : await downloadAttendanceDailyReportExport({
              ...commonParams,
              date: filters.date,
              ...(exportPeriod === "custom"
                ? {
                    enableDateFilter: true,
                    startDate: exportStartDate,
                    endDate: exportEndDate,
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
      `attendance-${exportPeriod}-${filters.date}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const handleFixManualTimes = async () => {
    await fixManualTimes.mutateAsync({ date: filters.date });
    await Promise.all([daily.refetch(), summary.refetch()]);
  };

  const handleSubmitCorrection = async () => {
    if (!correctionRow) return;
    await Promise.all(correctionTypes.map((type) =>
      submitCorrection.mutateAsync({
        requestType: "check_in_correction",
        employeeUserId: correctionRow.employeeId,
        category: type,
        title: `Manual ${type.replace(/_/g, " ").toLowerCase()} correction`,
        reason: correctionReason,
        fromAt: `${filters.date}T${correctionTimes[type] || "09:00"}:00`,
      })
    ));
    setCorrectionRow(null);
    setCorrectionReason("");
    setCorrectionTypes(["CHECK_IN"]);
    await Promise.all([daily.refetch(), summary.refetch()]);
  };

  const openCorrectionModal = (row: AttendanceHrDailyRow) => {
    setCorrectionTimes({
      CHECK_IN: utcToLocalTimeInputValue(row.events.checkInAtUtc, tz) || correctionTimes.CHECK_IN || "09:00",
      LUNCH_OUT: utcToLocalTimeInputValue(row.events.lunchOutAtUtc, tz) || correctionTimes.LUNCH_OUT || "12:30",
      LUNCH_IN: utcToLocalTimeInputValue(row.events.lunchInAtUtc, tz) || correctionTimes.LUNCH_IN || "13:30",
      CHECK_OUT: utcToLocalTimeInputValue(row.events.checkOutAtUtc, tz) || correctionTimes.CHECK_OUT || "17:00",
    });
    setCorrectionTypes(["CHECK_IN"]);
    setCorrectionReason("");
    setCorrectionRow(row);
  };

  const handleCorrectionTimeChange = (type: string, event: React.FormEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
    const value = (event.target as HTMLInputElement | null)?.value ?? "";
    setCorrectionTimes((current) => ({ ...current, [type]: value }));
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

  const handleRemoveAutoAddedAttendance = async (row: AttendanceHrDailyRow) => {
    setRemoveAutoAttendanceRow(row);
  };

  const confirmRemoveAutoAddedAttendance = async () => {
    if (!removeAutoAttendanceRow) return;
    const eventTypes = [
      removeAutoAttendanceRow.events.checkInAtUtc ? "CHECK_IN" : null,
      removeAutoAttendanceRow.events.lunchOutAtUtc ? "LUNCH_OUT" : null,
      removeAutoAttendanceRow.events.lunchInAtUtc ? "LUNCH_IN" : null,
      removeAutoAttendanceRow.events.checkOutAtUtc ? "CHECK_OUT" : null,
    ].filter(Boolean) as string[];
    if (!eventTypes.length) {
      setPenaltyMessageStatus({ type: "error", message: "There are no recorded attendance entries to remove for this row." });
      setRemoveAutoAttendanceRow(null);
      return;
    }

    setRemoveAutoAttendanceEmployeeId(removeAutoAttendanceRow.employeeId);
    setPenaltyMessageStatus(null);
    try {
      const result = await removeAutoAttendance.mutateAsync({ employeeId: removeAutoAttendanceRow.employeeId, date: filters.date, eventTypes });
      setPenaltyMessageStatus({
        type: "success",
        message: result.data?.message || `Auto-added attendance reviewed for ${removeAutoAttendanceRow.employeeName}.`,
      });
      setRemoveAutoAttendanceRow(null);
      await Promise.all([daily.refetch(), summary.refetch()]);
    } catch (error: any) {
      setPenaltyMessageStatus({
        type: "error",
        message: error?.response?.data?.message || error?.message || "Failed to remove auto-added attendance.",
      });
    } finally {
      setRemoveAutoAttendanceEmployeeId(null);
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

  const exportDateRangeInvalid =
    exportPeriod === "custom" &&
    (!exportStartDate || !exportEndDate || exportStartDate > exportEndDate);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-medium text-slate-500">HR / Attendance</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Check-ins Monitoring</h1>
          <p className="mt-1 text-sm text-slate-500">Review today's attendance, exceptions, and employee requests. Selected date: {filters.date}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canFixManualTimes && (
            <Button
              onClick={handleFixManualTimes}
              disabled={fixManualTimes.isPending}
              className="h-9 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fixManualTimes.isPending ? "animate-spin" : ""}`} />
              {fixManualTimes.isPending ? "Reviewing..." : "Review manual entries"}
            </Button>
          )}
          <Button
            onClick={() => setExportOpen(true)}
            variant="outline"
            className="h-9 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </header>

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Present" value={counts.present} icon={<CheckCircle2 className="h-4 w-4" />} active={activeTab === "present"} onClick={() => setActiveTab("present")} tone="green" />
        <SummaryCard label="Still Working" value={counts.working} icon={<Clock3 className="h-4 w-4" />} active={activeTab === "working"} onClick={() => setActiveTab("working")} tone="blue" />
        <SummaryCard
          label="Needs review"
          value={counts.attention}
          icon={<AlertTriangle className="h-4 w-4" />}
          active={activeTab === "attention"}
          onClick={() => setActiveTab("attention")}
          tone="amber"
          detail={`${counts.late} late arrivals · ${counts.incomplete} incomplete check-outs`}
        />
        <SummaryCard label="Absent" value={counts.absent} icon={<UserX className="h-4 w-4" />} active={activeTab === "absent"} onClick={() => setActiveTab("absent")} tone="red" />
      </div>

      <AttendanceFilters value={filters} onChange={setFilters} />

      {attentionRows.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-950">Needs Your Attention</h3>
              <p className="text-xs font-semibold text-slate-500">Employees with attendance items HR should review first.</p>
            </div>
            <Button variant="outline" className="h-8 rounded-xl bg-white text-xs font-black" onClick={() => setActiveTab("attention")}>
              View all
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {attentionRows.map((row) => {
              const issue = getIssueSummary(row);
              return (
                <button
                  key={row.employeeId}
                  onClick={() => setSelectedEmployeeId(row.employeeId)}
                  className="rounded-xl border border-amber-100 bg-white p-3 text-left shadow-sm hover:border-amber-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{row.employeeName}</p>
                      <p className="text-xs font-semibold text-slate-500">{row.department?.name || "Unassigned"} · {filters.date}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">{getSimpleAttendanceStatus(row)}</span>
                  </div>
                  <p className="mt-2 text-xs font-black text-slate-800">{issue.title}</p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{issue.detail}</p>
                  <p className="mt-3 text-xs font-black text-blue-600">Review attendance</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {daily.isError && (
        <InfoAlert variant="error" message="Failed to load daily attendance." />
      )}

      {daily.isLoading ? (
        <LoadingSpinner label="Loading attendance…" />
      ) : (
        <>
          <div className="flex flex-wrap gap-6 border-b border-slate-200 bg-white">
            {[
              { key: "all" as const, label: "All employees", count: counts.all },
              { key: "attention" as const, label: "Needs review", count: counts.attention },
              { key: "present" as const, label: "Present", count: counts.present },
              { key: "working" as const, label: "Still working", count: counts.working },
              { key: "absent" as const, label: "Absent", count: counts.absent },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 px-0 py-3 text-sm font-semibold transition ${
                  activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label} <span className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">{tab.count}</span>
              </button>
            ))}
          </div>
          <AttendanceTable
            rows={visibleRows}
            timezone={tz}
            title={activeTab === "attention" ? "Employees requiring review" : "Employee attendance"}
            subtitle={`${visibleRows.length} shown on this page · ${totalRows} total records`}
            onSelectEmployee={setSelectedEmployeeId}
            onRequestCorrection={canRequestCorrection ? openCorrectionModal : undefined}
            onSendPenaltyMessage={handleSendPenaltyMessage}
            onRemoveAutoAddedAttendance={handleRemoveAutoAddedAttendance}
            sendingPenaltyEmployeeId={penaltyMessageEmployeeId}
            removingAutoAttendanceEmployeeId={removeAutoAttendanceEmployeeId}
            selectedEmployeeIds={selectedEmployeeIds}
            onToggleEmployeeSelection={handleToggleEmployeeSelection}
            onToggleAllVisible={handleToggleAllVisible}
          />
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500">
              Page {daily.data?.data?.page ?? page} of {totalPages} · {totalRows} attendance records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || daily.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || daily.isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <EmployeeAttendanceDrawer
        open={Boolean(selectedEmployeeId)}
        employeeId={selectedEmployeeId}
        date={filters.date}
        onClose={() => setSelectedEmployeeId(null)}
      />

      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-950">Export attendance</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Export check-ins, scheduled days, paid days off, missed time, penalties, and approved leave.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { key: "day" as const, label: "Selected day", detail: filters.date },
                { key: "week" as const, label: "This week", detail: `${weekRangeFromDate(filters.date).startDate} to ${weekRangeFromDate(filters.date).endDate}` },
                { key: "month" as const, label: "This month", detail: filters.date.slice(0, 7) },
                { key: "custom" as const, label: "Custom date range", detail: "Choose start and end dates" },
              ].map((option) => (
                <label
                  key={option.key}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    exportPeriod === option.key ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="attendance-export-period"
                      value={option.key}
                      checked={exportPeriod === option.key}
                      onChange={(event) => setExportPeriod((event.currentTarget?.value || "day") as ExportPeriod)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-600"
                    />
                    <span className="font-semibold">{option.label}</span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-slate-500">{option.detail}</p>
                </label>
              ))}
            </div>

            {exportPeriod === "custom" && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">Start date</span>
                  <input
                    type="date"
                    value={exportStartDate ?? ""}
                    onChange={(event) => setExportStartDate(event.currentTarget?.value ?? "")}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">End date</span>
                  <input
                    type="date"
                    value={exportEndDate ?? ""}
                    onChange={(event) => setExportEndDate(event.currentTarget?.value ?? "")}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              </div>
            )}

            {exportDateRangeInvalid ? (
              <p className="mt-3 text-xs font-semibold text-red-600">Choose a valid custom export date range.</p>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" className="h-9 rounded-lg" onClick={() => setExportOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={exportDateRangeInvalid}
                className="h-9 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700"
                onClick={handleExport}
              >
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      )}

      {removeAutoAttendanceRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <div>
              <h3 className="text-base font-semibold text-slate-950">Remove auto-added attendance?</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This will remove the recorded attendance entries shown for{" "}
                <span className="font-semibold text-slate-900">{removeAutoAttendanceRow.employeeName}</span> on{" "}
                <span className="font-semibold text-slate-900">{filters.date}</span>.
              </p>
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                Only recorded entries visible in this row will be removed. Missing punches are ignored.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-lg"
                disabled={removeAutoAttendance.isPending}
                onClick={() => setRemoveAutoAttendanceRow(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-9 rounded-lg bg-rose-600 px-4 text-white hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400"
                disabled={removeAutoAttendance.isPending}
                onClick={confirmRemoveAutoAddedAttendance}
              >
                {removeAutoAttendance.isPending ? "Removing..." : "Remove entries"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <span className="text-[11px] font-black uppercase text-slate-400">Times to correct</span>
                <div className="mt-2 space-y-2">
                  {[
                    ["CHECK_IN", "Check-in"],
                    ["LUNCH_OUT", "Lunch out"],
                    ["LUNCH_IN", "Lunch in"],
                    ["CHECK_OUT", "Check-out"],
                  ].map(([type, label]) => {
                    const checked = correctionTypes.includes(type);
                    return (
                      <label key={type} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${checked ? "border-blue-200 bg-blue-50" : "border-slate-200"}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const nextChecked = event.currentTarget.checked;
                            setCorrectionTypes((current) => {
                              if (nextChecked) return Array.from(new Set([...current, type]));
                              const next = current.filter((item) => item !== type);
                              return next.length ? next : current;
                            });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                        />
                        <span className="w-24 text-xs font-black text-slate-700">{label}</span>
                        <input
                          type="time"
                          value={correctionTimes[type] || "09:00"}
                          disabled={!checked}
                          onInput={(event) => handleCorrectionTimeChange(type, event)}
                          onChange={(event) => handleCorrectionTimeChange(type, event)}
                          className="ml-auto h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
              <label className="block">
                <span className="text-[11px] font-black uppercase text-slate-400">Reason</span>
                <textarea value={correctionReason} onChange={(e) => setCorrectionReason(e.currentTarget.value)} required rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold" placeholder="Explain why this manual correction is needed." />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCorrectionRow(null)}>Cancel</Button>
              <Button type="button" disabled={!correctionReason.trim() || correctionTypes.length === 0 || submitCorrection.isPending} className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleSubmitCorrection}>
                Submit for approval
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
