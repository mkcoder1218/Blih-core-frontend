import React from "react";
import { Clock3, CheckCircle2, AlertTriangle, UserCheck, Activity } from "lucide-react";
import { StatCard, StatCardGrid } from "@/components/ui/blih";
import type { AttendanceHrSummaryResponse } from "../../../api/types";

export default function AttendanceSummaryCards({
  data,
}: {
  data: AttendanceHrSummaryResponse | null | undefined;
}) {
  const cards = data?.cards;

  return (
    <StatCardGrid cols={5}>
      <StatCard label="In Progress"    value={cards?.inProgress  ?? 0} icon={<Activity className="w-4 h-4" />}     tone="blue" />
      <StatCard label="Total Check-Ins" value={cards?.totalCheckIns ?? 0} icon={<UserCheck className="w-4 h-4" />}  tone="slate" />
      <StatCard label="Completed"      value={cards?.completed   ?? 0} icon={<CheckCircle2 className="w-4 h-4" />} tone="emerald" />
      <StatCard label="Missed / Absent" value={cards?.missed     ?? 0} icon={<AlertTriangle className="w-4 h-4" />} tone="amber" />
      <StatCard label="Late Arrivals"  value={cards?.lateArrivals ?? 0} icon={<Clock3 className="w-4 h-4" />}      tone="rose" />
    </StatCardGrid>
  );
}
