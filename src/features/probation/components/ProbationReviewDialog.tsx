import React from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import type {
  EmployeeProbationDecision,
  EmployeeProbationRecord,
  ProbationReviewPayload,
} from "../../../api/employeeProbation";

interface Props {
  open: boolean;
  mode: "manager" | "hr";
  probation: EmployeeProbationRecord | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: ProbationReviewPayload) => void;
}

const recommendations: Array<{ value: EmployeeProbationDecision; label: string }> = [
  { value: "CONFIRM_EMPLOYMENT", label: "Confirm employment" },
  { value: "EXTEND_PROBATION", label: "Extend probation" },
  { value: "TERMINATE_EMPLOYMENT", label: "Terminate employment" },
  { value: "REQUEST_MORE_INFORMATION", label: "Request more information" },
];

export function ProbationReviewDialog({ open, mode, probation, loading, onClose, onSubmit }: Props) {
  const [recommendation, setRecommendation] = React.useState<EmployeeProbationDecision>("CONFIRM_EMPLOYMENT");
  const [comments, setComments] = React.useState("");
  const [scores, setScores] = React.useState<Record<string, { score: string; comment: string }>>({});
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open || !probation) return;
    const next: Record<string, { score: string; comment: string }> = {};
    for (const criterion of probation.criteria || []) {
      const existingScore = mode === "manager" ? criterion.managerScore : criterion.hrScore;
      const existingComment = mode === "manager" ? criterion.managerComment : criterion.hrComment;
      next[criterion.id] = {
        score: existingScore == null ? "" : String(existingScore),
        comment: existingComment || "",
      };
    }
    setScores(next);
    setRecommendation(mode === "manager" ? probation.managerRecommendation || "CONFIRM_EMPLOYMENT" : probation.hrRecommendation || "CONFIRM_EMPLOYMENT");
    setComments("");
    setError("");
  }, [open, probation, mode]);

  if (!open || !probation) return null;

  const submit = () => {
    const criteria = probation.criteria || [];
    const payloadScores = criteria.map((criterion) => ({
      criterionId: criterion.id,
      score: Number(scores[criterion.id]?.score),
      comment: scores[criterion.id]?.comment.trim() || null,
    }));
    if (!criteria.length) {
      setError("No probation criteria are available.");
      return;
    }
    if (payloadScores.some((item) => !Number.isFinite(item.score) || item.score < 0 || item.score > 100)) {
      setError("Enter a score between 0 and 100 for every criterion.");
      return;
    }
    setError("");
    onSubmit({ recommendation, comments: comments.trim() || null, scores: payloadScores });
  };

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-black text-slate-950">{mode === "manager" ? "Manager evaluation" : "HR review"}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">{probation.employee?.fullName}</p>
          </div>
          <button onClick={onClose} disabled={loading} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error ? <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700"><AlertCircle className="h-4 w-4" />{error}</div> : null}
          {(probation.criteria || []).map((criterion) => (
            <section key={criterion.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-slate-900">{criterion.name}</p>
                  <p className="mt-1 text-[11px] font-medium text-slate-500">{criterion.description || "No description"}</p>
                </div>
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">{Number(criterion.weight).toFixed(2)}%</span>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Score / 100</span>
                  <input type="number" min={0} max={100} step="0.01" value={scores[criterion.id]?.score || ""} onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: { score: event.target.value, comment: current[criterion.id]?.comment || "" } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-500" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Comment</span>
                  <input value={scores[criterion.id]?.comment || ""} onChange={(event) => setScores((current) => ({ ...current, [criterion.id]: { score: current[criterion.id]?.score || "", comment: event.target.value } }))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500" placeholder="Optional evidence or context" />
                </label>
              </div>
            </section>
          ))}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400">Recommendation</span>
              <select value={recommendation} onChange={(event) => setRecommendation(event.target.value as EmployeeProbationDecision)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-500">
                {recommendations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-400">Overall comments</span>
              <textarea rows={3} value={comments} onChange={(event) => setComments(event.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500" />
            </label>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600">Cancel</button>
          <button onClick={submit} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit review
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
