import React from "react";
import { Clock3, CheckCircle2, AlertTriangle, UserCheck, Activity } from "lucide-react";
import type { AttendanceHrSummaryResponse } from "../../../api/types";

export default function AttendanceSummaryCards({ data }: { data: AttendanceHrSummaryResponse | null | undefined }) {
  const cards = data?.cards;
  const items = [
    { label: "In Progress", value: cards?.inProgress ?? 0, icon: <Activity className="w-4 h-4" />, tone: "blue" },
    { label: "Total Check-Ins", value: cards?.totalCheckIns ?? 0, icon: <UserCheck className="w-4 h-4" />, tone: "slate" },
    { label: "Completed", value: cards?.completed ?? 0, icon: <CheckCircle2 className="w-4 h-4" />, tone: "emerald" },
    { label: "Missed/Absent", value: cards?.missed ?? 0, icon: <AlertTriangle className="w-4 h-4" />, tone: "amber" },
    { label: "Late Arrivals", value: cards?.lateArrivals ?? 0, icon: <Clock3 className="w-4 h-4" />, tone: "rose" },
  ] as const;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {items.map((c) => (
        <div key={c.label} className={`bg-white rounded-2xl border border-slate-100 shadow-xs p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{c.value}</div>
            </div>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconTone(c.tone)}`}>{c.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function iconTone(tone: string) {
  if (tone === "blue") return "bg-blue-50 text-blue-700 border border-blue-100";
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (tone === "amber") return "bg-amber-50 text-amber-700 border border-amber-100";
  if (tone === "rose") return "bg-rose-50 text-rose-700 border border-rose-100";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

