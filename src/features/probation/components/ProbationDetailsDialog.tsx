import { BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionCard } from "@/components/ui/blih";
import type { ProbationDashboardRow } from "../types";
import { formatProbationDate } from "../utils";
import { ProbationScore } from "./ProbationScore";

interface ProbationDetailsDialogProps {
  row: ProbationDashboardRow | null;
  onClose: () => void;
}

export function ProbationDetailsDialog({ row, onClose }: ProbationDetailsDialogProps) {
  return (
    <Dialog open={Boolean(row)} onOpenChange={(open) => !open && onClose()}>
      {row ? (
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-950">{row.employeeName}</DialogTitle>
            <DialogDescription>
              {row.department?.name || "Unassigned"} · {row.position?.title || "No position"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <SectionCard title="Final assessment" icon={<BarChart3 className="h-4 w-4" />} padding="sm">
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Punctuality" value={`${row.punctualityScore}%`} />
                <Detail label="Attendance" value={`${row.attendanceScore}%`} />
                <Detail label="Performance review" value={`${row.performanceScore}%`} />
                <Detail label="Final score" value={`${row.finalScore}%`} />
              </div>
              <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                Formula: punctuality × {row.weights.punctualityWeight}% + attendance × {row.weights.attendanceWeight}% + performance × {row.weights.performanceWeight}%.
              </p>
            </SectionCard>

            <SectionCard title="Attendance breakdown" icon={<BarChart3 className="h-4 w-4" />} padding="sm">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Detail label="Scheduled days" value={row.attendanceBreakdown.scheduledDays} />
                <Detail label="Late arrivals" value={row.attendanceBreakdown.lateArrivals} />
                <Detail label="Absences" value={row.attendanceBreakdown.absences} />
                <Detail label="Missing check-outs" value={row.attendanceBreakdown.missingCheckouts} />
                <Detail label="Worked hours" value={`${Math.round(row.attendanceBreakdown.workedMinutes / 60)}h`} />
                <Detail label="Expected hours" value={`${Math.round(row.attendanceBreakdown.expectedMinutes / 60)}h`} />
              </div>
            </SectionCard>

            <SectionCard title="Performance reviews" icon={<BarChart3 className="h-4 w-4" />} padding="sm">
              <div className="space-y-2">
                {row.reviews.length ? row.reviews.map((review) => (
                  <article key={review.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-700">
                        {formatProbationDate(review.periodStart)} to {formatProbationDate(review.periodEnd)}
                      </p>
                      <ProbationScore value={review.score} emphasized />
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      Reviewer: {review.reviewerName || "Not assigned"} · {review.status}
                    </p>
                  </article>
                )) : (
                  <p className="text-xs font-semibold text-slate-500">No probation performance reviews recorded.</p>
                )}
              </div>
            </SectionCard>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
