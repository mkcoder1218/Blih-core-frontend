import React from "react";

export default function AttendanceStatusBadge({ status }: { status: string }) {
  const { cls, label } = mapStatus(status);
  return <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-extrabold border ${cls}`}>{label}</span>;
}

function mapStatus(status: string) {
  switch (status) {
    case "COMPLETED":
      return { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    case "ON_BREAK":
      return { label: "On Break", cls: "bg-amber-50 text-amber-700 border-amber-100" };
    case "IN_PROGRESS":
      return { label: "In Progress", cls: "bg-blue-50 text-blue-700 border-blue-100" };
    case "LATE":
      return { label: "Late", cls: "bg-rose-50 text-rose-700 border-rose-100" };
    case "MISSED":
      return { label: "Missed", cls: "bg-slate-100 text-slate-600 border-slate-200" };
    case "NOT_STARTED":
      return { label: "Not Started", cls: "bg-slate-50 text-slate-600 border-slate-200" };
    case "OUTSIDE_RADIUS_ATTEMPT":
      return { label: "Outside Radius", cls: "bg-violet-50 text-violet-700 border-violet-100" };
    default:
      return { label: status.replace(/_/g, " "), cls: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

