import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ArrowRight, Clock3, Coffee } from "lucide-react";
import { useMyAttendanceToday } from "../../hooks/useMyAttendanceToday";

/**
 * Compact attendance summary card for the attendance overview tab.
 *
 * Shows today's status, worked-time progress, and a link to the check-in page.
 * Placed only in the attendance overview tab (employee view) via AttendanceView.tsx.
 */
export default function AttendanceShortcutCard() {
  const today = useMyAttendanceToday();

  const data = today.data?.data as any;
  const settings = data?.settings;
  const disabledReason: string | null = data?.disabledReason || null;
  const nextAllowed: string[] = data?.nextAllowed || [];
  const calculation: any = data?.calculation;
  const timeline: any[] = data?.timeline || [];

  const currentStatus: string = calculation?.currentStatus || "NOT_STARTED";
  const workedMins: number = calculation?.totalWorkedMinutes || 0;
  const breakMins: number = calculation?.totalBreakMinutes || 0;
  const expectedMins: number = settings?.expectedDailyMinutes || 480;
  const progressPct = Math.min(100, Math.round((workedMins / expectedMins) * 100));

  const isDayComplete = nextAllowed.length === 0 && !disabledReason && timeline.length > 0;
  const nextActionLabel = nextAllowed.length > 0 ? toActionLabel(nextAllowed[0]) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Attendance
          </div>
          <div className="text-[15px] font-black text-slate-900 mt-1">Today</div>
        </div>
        <StatusBadge status={currentStatus} disabled={Boolean(disabledReason)} />
      </div>

      {/* Skeleton while loading */}
      {today.isLoading ? (
        <div className="mt-4 space-y-2">
          <div className="h-2 bg-slate-100 rounded-full animate-pulse" />
          <div className="h-8 bg-slate-50 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
              <span>{fmtMins(workedMins)} worked</span>
              <span>of {fmtMins(expectedMins)}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDayComplete || progressPct >= 100
                    ? "bg-emerald-500"
                    : currentStatus === "ON_BREAK"
                      ? "bg-amber-400"
                      : "bg-[#1a56db]"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Break info row */}
          {breakMins > 0 ? (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
              <Coffee className="w-3.5 h-3.5" />
              <span>Break: {fmtMins(breakMins)}</span>
            </div>
          ) : null}

          {/* Status message */}
          <div className="mt-3">
            {disabledReason ? (
              <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {disabledReason}
              </div>
            ) : isDayComplete ? (
              <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Day complete — well done!
              </div>
            ) : nextActionLabel ? (
              <div className="text-[11px] text-slate-500 font-semibold">
                Next action:{" "}
                <span className="font-extrabold text-slate-900">{nextActionLabel}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 font-semibold">
                No attendance data yet today.
              </div>
            )}
          </div>

          {/* Navigation button — links to check-in page */}
          <Link
            to="/employee/attendance"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl py-2.5 transition-all"
          >
            <Clock3 className="w-3.5 h-3.5" />
            Go to Check-In
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function toActionLabel(type: string): string {
  if (type === "CHECK_IN") return "Check In";
  if (type === "LUNCH_OUT") return "Check Out for Lunch";
  if (type === "LUNCH_IN") return "Return from Lunch";
  if (type === "CHECK_OUT") return "Check Out for the Day";
  return type;
}

function StatusBadge({ status, disabled }: { status: string; disabled: boolean }) {
  if (disabled)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
        Disabled
      </span>
    );

  const map: Record<string, { cls: string; label: string }> = {
    NOT_STARTED: { cls: "bg-slate-100 text-slate-500 border-slate-200", label: "Not started" },
    IN_PROGRESS:  { cls: "bg-blue-50 text-blue-700 border-blue-100",    label: "Working" },
    ON_BREAK:     { cls: "bg-amber-50 text-amber-700 border-amber-100", label: "On break" },
    LATE:         { cls: "bg-rose-50 text-rose-700 border-rose-100",    label: "Late" },
    COMPLETED:    { cls: "bg-emerald-50 text-emerald-700 border-emerald-100", label: "Completed" },
    MISSED:       { cls: "bg-rose-50 text-rose-700 border-rose-100",    label: "Missed" },
  };

  const { cls, label } = map[status] ?? map["NOT_STARTED"];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cls}`}
    >
      {label}
    </span>
  );
}
