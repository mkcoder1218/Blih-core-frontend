import React from "react";
import { X, MapPin } from "lucide-react";
import { useAttendanceHrEmployee } from "../../../hooks/useAttendanceHrEmployee";

export default function EmployeeAttendanceDrawer({
  open,
  employeeId,
  date,
  onClose,
}: {
  open: boolean;
  employeeId: string | null;
  date: string;
  onClose: () => void;
}) {
  const q = useAttendanceHrEmployee(open ? employeeId : null, { date });
  const tz = q.data?.data?.timezone || "UTC";
  const employee = q.data?.data?.employee;
  const lunch = (q.data as any)?.data?.lunch;
  const events = q.data?.data?.events || [];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white border-l border-slate-100 shadow-2xl flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Employee attendance</div>
            <div className="text-[15px] font-black text-slate-900 mt-1 truncate">{employee?.fullName || "—"}</div>
            <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
              {date} • {tz} {employee?.department?.name ? `• ${employee.department.name}` : ""}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {q.isLoading ? (
            <div className="text-[12px] text-slate-600 font-semibold">Loading…</div>
          ) : q.isError ? (
            <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">Failed to load employee attendance.</div>
          ) : events.length === 0 ? (
            <div className="text-[12px] text-slate-600 font-semibold">No attendance events for this day.</div>
          ) : (
            <div className="space-y-2">
              {lunch ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lunch settings</div>
                  <div className="text-[12px] font-extrabold text-slate-900 mt-1">
                    {lunch.lunchBreakEnabled ? `${lunch.lunchMode} mode` : "Lunch disabled"}
                  </div>
                  {lunch.lunchMode === "FIXED" && lunch.fixedLunchStartTime && lunch.fixedLunchEndTime ? (
                    <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      Fixed window: {lunch.fixedLunchStartTime} – {lunch.fixedLunchEndTime}
                    </div>
                  ) : null}
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    Multiple breaks: {lunch.allowMultipleLunchBreaks ? "Allowed" : "Not allowed"}
                  </div>
                </div>
              ) : null}
              {events.map((e: any) => (
                <div key={e.id} className="flex items-start justify-between bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-[12px] font-extrabold text-slate-900">
                      {new Intl.DateTimeFormat(undefined, { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(new Date(e.timestampUtc))}
                    </div>
                    <div className="text-[11px] text-slate-600 font-semibold">
                      {e.type === "LUNCH_OUT" ? "Check Out for Lunch" : e.type === "LUNCH_IN" ? "Return from Lunch" : String(e.type).replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 font-bold inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{Math.round(Number(e.distanceMeters || 0))} m</span>
                    </div>
                    <div className="text-[10px] font-extrabold mt-1">
                      {e.withinAllowedRadius ? (
                        <span className="text-emerald-700">Inside radius</span>
                      ) : (
                        <span className="text-rose-700">Outside radius</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
