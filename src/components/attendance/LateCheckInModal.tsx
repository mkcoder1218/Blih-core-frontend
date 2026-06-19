import React from "react";
import { X } from "lucide-react";
import { useHrLateReasons } from "../../hooks/useHrLateReasons";

export default function LateCheckInModal({
  open,
  lateByMinutes,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  lateByMinutes: number;
  onCancel: () => void;
  onSubmit: (payload: { lateReasonId?: string; customReason?: string }) => Promise<void>;
}) {
  const reasons = useHrLateReasons();
  const [lateReasonId, setLateReasonId] = React.useState<string>("");
  const [comment, setComment] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  const list = reasons.data?.data?.reasons || [];
  const active = list.filter((r: any) => r.isActive !== false && r.enabled !== false);
  const selected = active.find((r: any) => r.id === lateReasonId) || null;
  const requiresComment = Boolean(selected?.requiresComment);

  React.useEffect(() => {
    if (!open) return;
    setLateReasonId("");
    setComment("");
    setError("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onCancel} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 space-y-4">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Late check-in</div>
            <div className="text-[15px] font-black text-slate-900 mt-1">You are late by {lateByMinutes} minutes</div>
            <div className="text-[12px] text-slate-600 font-semibold mt-1">Please select a reason before checking in.</div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-xl hover:bg-slate-50 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div> : null}

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason</label>
          <select
            value={lateReasonId}
            onChange={(e) => setLateReasonId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          >
            <option value="">Select reason…</option>
            {active.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.label || r.name}
              </option>
            ))}
          </select>
          {reasons.isLoading ? <div className="text-[11px] text-slate-500 font-semibold">Loading reasons…</div> : null}
          {reasons.isError ? <div className="text-[11px] text-red-700 font-semibold">Failed to load reasons.</div> : null}
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Explanation {requiresComment ? "(required)" : "(optional)"}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            placeholder="Add a brief explanation…"
          />
        </div>

        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 text-slate-500 font-bold hover:bg-slate-50 leading-none py-2.5 rounded-xl text-xs"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setError("");
              if (!lateReasonId && !comment.trim()) {
                setError("Select a reason or provide a custom explanation.");
                return;
              }
              if (requiresComment && !comment.trim()) {
                setError("This reason requires an explanation.");
                return;
              }
              setSaving(true);
              try {
                await onSubmit({ lateReasonId: lateReasonId || undefined, customReason: comment.trim() || undefined });
              } catch (e: any) {
                setError(e?.response?.data?.message || e?.message || "Failed to check in");
              } finally {
                setSaving(false);
              }
            }}
            className="bg-[#1a56db] hover:bg-[#124bbf] disabled:bg-slate-200 disabled:text-slate-400 font-bold text-white shadow-sm leading-none py-2.5 px-5 rounded-xl text-xs"
          >
            Submit check-in
          </button>
        </div>
      </div>
    </div>
  );
}
