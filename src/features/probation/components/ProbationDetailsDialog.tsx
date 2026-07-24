import { BarChart3, CalendarDays, CheckCircle2, Clock3, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionCard } from "@/components/ui/blih";
import type { EmployeeProbationRecord } from "../../../api/employeeProbation";

interface Props {
  probation: EmployeeProbationRecord | null;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString();
}

function decisionLabel(value?: string | null) {
  return value ? value.replaceAll("_", " ").toLowerCase() : "Not submitted";
}

export function ProbationDetailsDialog({ probation, onClose }: Props) {
  const criteria = probation?.criteria || [];
  const history = probation?.metadata?.history || [];

  return (
    <Dialog open={Boolean(probation)} onOpenChange={(open) => !open && onClose()}>
      {probation ? (
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-950">{probation.employee?.fullName || "Employee probation"}</DialogTitle>
            <DialogDescription>{probation.department?.name || "Unassigned"} · {probation.position?.title || "No position"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <SectionCard title="Lifecycle summary" icon={<CalendarDays className="h-4 w-4" />} padding="sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Detail label="Status" value={probation.status.replaceAll("_", " ")} />
                <Detail label="Start date" value={formatDate(probation.startDate)} />
                <Detail label="Expected end" value={formatDate(probation.expectedEndDate)} />
                <Detail label="Final score" value={probation.finalScore == null ? "—" : `${Number(probation.finalScore).toFixed(2)}%`} />
              </div>
            </SectionCard>

            <SectionCard title="Ownership and decisions" icon={<UserRound className="h-4 w-4" />} padding="sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Detail label="Manager" value={probation.manager?.fullName || "—"} />
                <Detail label="Final approver" value={probation.finalApprover?.fullName || "Not assigned"} />
                <Detail label="Manager recommendation" value={decisionLabel(probation.managerRecommendation)} />
                <Detail label="HR recommendation" value={decisionLabel(probation.hrRecommendation)} />
                <Detail label="Final decision" value={decisionLabel(probation.finalDecision)} />
                <Detail label="Acknowledged" value={probation.employeeAcknowledgedAt ? formatDate(probation.employeeAcknowledgedAt) : "No"} />
              </div>
            </SectionCard>

            <SectionCard title="Competency scores" icon={<BarChart3 className="h-4 w-4" />} padding="sm">
              <div className="space-y-2">
                {criteria.map((criterion) => (
                  <article key={criterion.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-slate-900">{criterion.name}</p>
                        <p className="mt-1 text-[10px] font-medium text-slate-500">{criterion.description || "No description"}</p>
                      </div>
                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black text-blue-700">{Number(criterion.weight).toFixed(2)}%</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <Score label="Manager" value={criterion.managerScore} />
                      <Score label="HR" value={criterion.hrScore} />
                      <Score label="Final" value={criterion.finalScore} />
                    </div>
                    {(criterion.managerComment || criterion.hrComment) ? (
                      <div className="mt-3 space-y-1 text-[10px] font-medium text-slate-500">
                        {criterion.managerComment ? <p><strong>Manager:</strong> {criterion.managerComment}</p> : null}
                        {criterion.hrComment ? <p><strong>HR:</strong> {criterion.hrComment}</p> : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Timeline" icon={<Clock3 className="h-4 w-4" />} padding="sm">
              <div className="space-y-2">
                <TimelineItem icon={<CheckCircle2 className="h-3.5 w-3.5" />} title="Probation initialized" date={probation.createdAt} />
                {history.map((event, index) => (
                  <TimelineItem key={`${event.type}-${event.at}-${index}`} icon={<Clock3 className="h-3.5 w-3.5" />} title={event.type.replaceAll("_", " ").toLowerCase()} date={event.at} detail={event.comments || event.recommendation || event.decision} />
                ))}
              </div>
            </SectionCard>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-xs font-black capitalize text-slate-900">{value}</p></div>;
}

function Score({ label, value }: { label: string; value?: number | string | null }) {
  return <div className="rounded-lg bg-slate-50 p-2 text-center"><p className="text-[9px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-xs font-black text-slate-900">{value == null ? "—" : `${Number(value).toFixed(2)}%`}</p></div>;
}

function TimelineItem({ icon, title, date, detail }: { icon: ReactNode; title: string; date?: string | null; detail?: ReactNode }) {
  return <div className="flex gap-3 rounded-xl border border-slate-100 p-3"><div className="mt-0.5 text-blue-600">{icon}</div><div><p className="text-xs font-black capitalize text-slate-800">{title}</p><p className="mt-0.5 text-[10px] font-semibold text-slate-400">{date ? new Date(date).toLocaleString() : "—"}</p>{detail ? <p className="mt-1 text-[10px] font-medium text-slate-500">{String(detail).replaceAll("_", " ")}</p> : null}</div></div>;
}
