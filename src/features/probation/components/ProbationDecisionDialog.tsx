import React from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import type { EmployeeProbationRecord, ProbationFinalDecisionPayload } from "../../../api/employeeProbation";

interface Props {
  open: boolean;
  probation: EmployeeProbationRecord | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: ProbationFinalDecisionPayload) => void;
}

export function ProbationDecisionDialog({ open, probation, loading, onClose, onSubmit }: Props) {
  const [decision, setDecision] = React.useState<ProbationFinalDecisionPayload["decision"]>("CONFIRM_EMPLOYMENT");
  const [comments, setComments] = React.useState("");
  const [extensionMonths, setExtensionMonths] = React.useState(3);
  const [newExpectedEndDate, setNewExpectedEndDate] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setDecision("CONFIRM_EMPLOYMENT");
    setComments("");
    setExtensionMonths(3);
    setNewExpectedEndDate("");
    setError("");
  }, [open, probation?.id]);

  if (!open || !probation) return null;

  const submit = () => {
    if (decision === "EXTEND_PROBATION" && (!Number.isInteger(extensionMonths) || extensionMonths < 1 || extensionMonths > 12)) {
      setError("Extension duration must be between 1 and 12 months.");
      return;
    }
    setError("");
    onSubmit({
      decision,
      comments: comments.trim() || null,
      ...(decision === "EXTEND_PROBATION" ? { extensionMonths, newExpectedEndDate: newExpectedEndDate || undefined } : {}),
    });
  };

  return (
    <div className="fixed inset-0 z-[330] flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><h3 className="text-base font-black text-slate-950">Final probation decision</h3><p className="mt-1 text-xs font-semibold text-slate-500">{probation.employee?.fullName}</p></div>
          <button onClick={onClose} disabled={loading} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>
        <div className="space-y-4 p-6">
          {error ? <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700"><AlertCircle className="h-4 w-4" />{error}</div> : null}
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Decision</span>
            <select value={decision} onChange={(event) => setDecision(event.target.value as ProbationFinalDecisionPayload["decision"])} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-500">
              <option value="CONFIRM_EMPLOYMENT">Confirm employment</option>
              <option value="EXTEND_PROBATION">Extend probation</option>
              <option value="TERMINATE_EMPLOYMENT">Terminate employment</option>
            </select>
          </label>
          {decision === "EXTEND_PROBATION" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-[10px] font-black uppercase text-slate-400">Extension months</span><input type="number" min={1} max={12} value={extensionMonths} onChange={(event) => setExtensionMonths(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-500" /></label>
              <label className="space-y-1.5"><span className="text-[10px] font-black uppercase text-slate-400">Custom end date</span><input type="date" value={newExpectedEndDate} onChange={(event) => setNewExpectedEndDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-blue-500" /></label>
            </div>
          ) : null}
          <label className="block space-y-1.5"><span className="text-[10px] font-black uppercase text-slate-400">Decision comments</span><textarea rows={4} value={comments} onChange={(event) => setComments(event.target.value)} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500" /></label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600">Cancel</button>
          <button onClick={submit} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Complete decision</button>
        </footer>
      </motion.div>
    </div>
  );
}
