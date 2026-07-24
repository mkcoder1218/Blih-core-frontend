import type { ReactNode } from "react";
import { CalendarDays, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { useAcknowledgeProbationDecision, useMyEmployeeProbation } from "../../hooks/useEmployeeProbation";

export function MyProbationPanel() {
  const query = useMyEmployeeProbation();
  const acknowledge = useAcknowledgeProbationDecision();

  if (query.isLoading) return <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-6 text-xs font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading your probation...</div>;
  if (!query.data) return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-xs font-semibold text-slate-500">You do not have a probation lifecycle.</div>;

  const probation = query.data;
  const daysRemaining = Math.ceil((new Date(`${probation.expectedEndDate}T00:00:00`).getTime() - Date.now()) / 86400000);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card icon={<Clock3 className="h-4 w-4" />} label="Status" value={probation.status.replaceAll("_", " ")} />
        <Card icon={<CalendarDays className="h-4 w-4" />} label="Expected end" value={new Date(`${probation.expectedEndDate}T00:00:00`).toLocaleDateString()} />
        <Card icon={<CheckCircle2 className="h-4 w-4" />} label="Days remaining" value={daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : String(daysRemaining)} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-black text-slate-900">Evaluation criteria</h3>
        <div className="mt-3 space-y-2">
          {(probation.criteria || []).map((criterion) => (
            <div key={criterion.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <div><p className="text-xs font-black text-slate-800">{criterion.name}</p><p className="mt-1 text-[10px] font-medium text-slate-500">{criterion.description || "No description"}</p></div>
              <div className="text-right"><p className="text-[10px] font-black text-blue-700">{Number(criterion.weight).toFixed(2)}%</p><p className="mt-1 text-xs font-black text-slate-900">{criterion.finalScore == null ? "Pending" : `${Number(criterion.finalScore).toFixed(2)}%`}</p></div>
            </div>
          ))}
        </div>
      </div>

      {probation.finalDecision && !probation.employeeAcknowledgedAt ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-black text-blue-950">Final decision: {probation.finalDecision.replaceAll("_", " ")}</p><p className="mt-1 text-[11px] font-medium text-blue-700">Acknowledge that you have seen the final probation decision.</p></div>
          <button onClick={() => acknowledge.mutate(probation.id)} disabled={acknowledge.isPending} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{acknowledge.isPending ? "Saving..." : "Acknowledge"}</button>
        </div>
      ) : null}
    </div>
  );
}

function Card({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-blue-600">{icon}</div><p className="mt-3 text-[10px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-black capitalize text-slate-900">{value}</p></div>;
}
