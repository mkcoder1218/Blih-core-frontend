import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  DollarSign,
  Layers3,
  Loader2,
  TimerReset,
  UserCheck,
} from "lucide-react";

import { useEmploymentChangeAnalytics } from "../../../hooks/useEmploymentChanges";

interface CareerOverviewTabProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}

function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {hint}
            </p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function CareerOverviewTab({}: CareerOverviewTabProps) {
  const analytics = useEmploymentChangeAnalytics();

  if (analytics.isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center gap-2 text-xs font-bold text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics...
      </div>
    );
  }

  if (analytics.isError || !analytics.data) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
        Could not load Career Management analytics.
      </div>
    );
  }

  const data = analytics.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-950">
          Career Overview
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500">
          Employment-change analytics only. Requests are managed from the two request tabs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Requests"
          value={data.total}
          icon={Layers3}
          hint="Visible to your role"
        />
        <MetricCard
          label="Pending"
          value={data.pending}
          icon={Clock3}
          hint="Still in approval flow"
        />
        <MetricCard
          label="Awaiting My Approval"
          value={data.awaitingMyApproval}
          icon={UserCheck}
          hint="Action required from you"
        />
        <MetricCard
          label="Scheduled"
          value={data.scheduled}
          icon={TimerReset}
          hint="Approved for a future date"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Applied"
          value={data.applied}
          icon={CheckCircle2}
          hint={`${data.appliedThisMonth} applied this month`}
        />
        <MetricCard
          label="Title Changes"
          value={data.byType.title}
          icon={BriefcaseBusiness}
        />
        <MetricCard
          label="Salary Changes"
          value={data.byType.salary}
          icon={DollarSign}
        />
        <MetricCard
          label="Combined Changes"
          value={data.byType.combined}
          icon={Layers3}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Rejected
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{data.rejected}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Cancelled
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900">{data.cancelled}</p>
        </div>
      </div>
    </div>
  );
}
