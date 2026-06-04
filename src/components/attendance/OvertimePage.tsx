import React, { useState } from "react";
import {
  Clock,
  CheckSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  RefreshCw,
  Inbox,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  useMyOvertimeRequests,
  useOvertimePending,
  useAllOvertimeRequests,
  useSubmitOvertimeRequest,
  useApproveOvertime,
  useRejectOvertime,
  useCancelOvertime,
  minutesToHours,
  type OvertimeRequest,
  type OvertimeType,
} from "../../hooks/useOvertimeRequests";
import { useLegacyUser } from "../../api/legacyUserStore";

// ── constants ──────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  department_head: { label: "Dept Head Review",  color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
  admin:           { label: "Admin / CEO Review", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
  finance:         { label: "Finance Review",     color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
  approved:        { label: "Fully Approved",     color: "text-emerald-700",bg: "bg-emerald-50 border-emerald-200" },
  rejected:        { label: "Rejected",           color: "text-red-700",    bg: "bg-red-50 border-red-200" },
  cancelled:       { label: "Cancelled",          color: "text-slate-500",  bg: "bg-slate-100 border-slate-200" },
};

const PIPELINE_STEPS = [
  { key: "department_head", label: "Dept Head" },
  { key: "admin",           label: "CEO / Admin" },
  { key: "finance",         label: "Finance" },
  { key: "approved",        label: "Approved" },
];

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_LABELS[stage] ?? STAGE_LABELS.cancelled;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function Pipeline({ current }: { current: string }) {
  const idx = PIPELINE_STEPS.findIndex((s) => s.key === current);
  const isRejected = current === "rejected" || current === "cancelled";
  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STEPS.map((step, i) => {
        const done  = idx > i || current === "approved";
        const active = !isRejected && step.key === current;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
              isRejected          ? "bg-slate-50 border-slate-200 text-slate-400" :
              done                ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
              active              ? "bg-blue-50 border-blue-300 text-blue-700" :
                                    "bg-white border-slate-200 text-slate-400"
            }`}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : active ? <Clock className="w-3 h-3" /> : null}
              {step.label}
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function OvertimeCard({
  ot,
  isApprover,
  onApprove,
  onReject,
  onCancel,
  currentUserId,
}: {
  ot: OvertimeRequest;
  isApprover: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  currentUserId: string;
}) {
  const isOwn   = ot.employeeUserId === currentUserId;
  const isPending = ot.status === "pending";
  const initials = ot.employee?.fullName?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-4 relative overflow-hidden">
      {/* Type badge */}
      <span className="text-[9px] font-bold bg-blue-600 text-white py-0.5 px-2 rounded uppercase absolute top-4 right-4 font-mono">
        {ot.overtimeType}
      </span>

      {/* Employee */}
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
          {initials}
        </span>
        <div>
          <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">
            {ot.employee?.fullName ?? "Employee"}
          </h4>
          <span className="text-[9.5px] font-medium text-slate-400 block mt-0.5">
            {ot.employee?.email ?? ""}
          </span>
        </div>
      </div>

      {/* Pipeline progress */}
      <div className="overflow-x-auto">
        <Pipeline current={ot.approvalStage} />
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 text-[10.5px]">
        <div>
          <span className="text-slate-400 font-medium block">Date</span>
          <span className="text-slate-700 font-bold font-mono text-[9.5px]">{ot.overtimeDate}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Duration</span>
          <span className="text-blue-600 font-black text-[11px] font-mono">{minutesToHours(ot.totalMinutes)}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Start</span>
          <span className="text-slate-700 font-bold font-mono text-[9.5px]">{ot.startTime}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">End</span>
          <span className="text-slate-700 font-bold font-mono text-[9.5px]">{ot.endTime}</span>
        </div>
      </div>

      {/* Reason */}
      <div>
        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Reason</span>
        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-semibold">{ot.reason}</p>
      </div>

      {/* Stage status */}
      <StageBadge stage={ot.approvalStage} />

      {/* Actions */}
      {isApprover && isPending && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => onApprove(ot.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => onReject(ot.id)}
            className="flex-1 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-600 font-bold text-xs px-3 py-2 rounded-xl transition-colors"
          >
            Reject
          </button>
        </div>
      )}
      {isOwn && isPending && !isApprover && (
        <button
          onClick={() => onCancel(ot.id)}
          className="w-full border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 font-bold text-xs px-3 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <X className="w-3 h-3" /> Cancel Request
        </button>
      )}
    </div>
  );
}

// ── Submit modal ────────────────────────────────────────────────────────────
function SubmitModal({ onClose, showAlert }: { onClose: () => void; showAlert: (m: string, t?: "success" | "error") => void }) {
  const submit = useSubmitOvertimeRequest();
  const [form, setForm] = useState({
    overtimeDate: new Date().toISOString().slice(0, 10),
    startTime: "17:00",
    endTime: "20:00",
    overtimeType: "Regular" as OvertimeType,
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) { showAlert("Please provide a reason", "error"); return; }
    try {
      await submit.mutateAsync(form);
      showAlert("Overtime request submitted successfully", "success");
      onClose();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed to submit", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-md mx-4 bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">New Overtime Request</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Submit for department head review</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overtime Date</label>
              <input
                type="date"
                required
                value={form.overtimeDate}
                onChange={(e) => setForm((p) => ({ ...p, overtimeDate: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Time</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Time</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overtime Type</label>
              <select
                value={form.overtimeType}
                onChange={(e) => setForm((p) => ({ ...p, overtimeType: e.target.value as OvertimeType }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="Regular">Regular</option>
                <option value="Weekend">Weekend</option>
                <option value="Public Holiday">Public Holiday</option>
              </select>
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</label>
              <textarea
                required
                rows={3}
                value={form.reason}
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Describe why overtime is needed..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submit.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
            >
              {submit.isPending ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Reject modal ────────────────────────────────────────────────────────────
function RejectModal({
  requestId,
  onClose,
  showAlert,
}: {
  requestId: string;
  onClose: () => void;
  showAlert: (m: string, t?: "success" | "error") => void;
}) {
  const reject = useRejectOvertime();
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!reason.trim()) { showAlert("Please provide a rejection reason", "error"); return; }
    try {
      await reject.mutateAsync({ id: requestId, reason });
      showAlert("Request rejected", "success");
      onClose();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-sm mx-4 bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 z-10 space-y-4"
      >
        <div className="flex items-center gap-2">
          <div className="p-2 bg-red-50 rounded-xl text-red-600">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Reject Request</h3>
            <p className="text-[11px] text-slate-400">Provide a reason for rejection</p>
          </div>
        </div>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State the rejection reason..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-red-400 resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={reject.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 rounded-xl"
          >
            {reject.isPending ? "Rejecting…" : "Confirm Reject"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
interface OvertimePageProps {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}

export default function OvertimePage({ showAlert }: OvertimePageProps) {
  const legacyUser = useLegacyUser();
  const role = legacyUser?.role || "Employee";
  const isHr = role === "HR Manager" || role === "Business Admin" || role === "Super Admin";
  const isDeptHead  = role === "Department Head" || role === "HR Manager" || role === "Business Admin";
  const isAdmin     = role === "Business Admin" || role === "CEO";
  const isFinance   = role === "Finance" || role === "Finance Manager" || role === "Business Admin";
  const isApprover  = isDeptHead || isAdmin || isFinance;

  const currentUserId = (legacyUser as any)?.id ?? "";

  const [view, setView] = useState<"my" | "inbox" | "all">("my");
  const [page, setPage] = useState(1);
  const [showSubmit, setShowSubmit] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const approve  = useApproveOvertime();
  const cancelMut = useCancelOvertime();

  const myQuery      = useMyOvertimeRequests({ page, size: 9 });
  const pendingQuery = useOvertimePending({ page, size: 9 });
  const allQuery     = useAllOvertimeRequests({ page, size: 9 });

  const activeQuery = view === "my" ? myQuery : view === "inbox" ? pendingQuery : allQuery;
  const data = activeQuery.data;
  const rows: OvertimeRequest[] = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync({ id });
      showAlert("Request approved and moved to next stage", "success");
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed to approve", "error");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMut.mutateAsync(id);
      showAlert("Request cancelled", "info");
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed to cancel", "error");
    }
  };

  const pendingCount = pendingQuery.data?.total ?? 0;

  // KPIs
  const allRows = allQuery.data?.rows ?? [];
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const pendingLocalCount = rows.filter((r) => r.status === "pending").length;
  const totalMinutes = rows.reduce((s, r) => s + r.totalMinutes, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            3-Stage Approval Workflow
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Overtime Requests</h1>
          <p className="text-xs text-slate-400 font-medium">
            Dept Head → CEO / Admin → Finance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => activeQuery.refetch()}
            disabled={activeQuery.isFetching}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${activeQuery.isFetching ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Overtime Request
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", val: total,              icon: Calendar,     color: "text-slate-600",  bg: "bg-slate-50" },
          { label: "Pending",        val: pendingLocalCount,  icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50" },
          { label: "Approved",       val: approvedCount,      icon: CheckCircle2, color: "text-emerald-600",bg: "bg-emerald-50" },
          { label: "Total OT Hours", val: minutesToHours(totalMinutes), icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ label, val, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
              <div className="text-xl font-black text-slate-900 mt-0.5">{val}</div>
            </div>
            <div className={`p-2 rounded-xl ${bg} ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => { setView("my"); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${view === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          My Requests
        </button>
        {isApprover && (
          <button
            onClick={() => { setView("inbox"); setPage(1); }}
            className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-colors ${view === "inbox" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Approval Inbox
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        )}
        {isHr && (
          <button
            onClick={() => { setView("all"); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${view === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            All Requests
          </button>
        )}
      </div>

      {/* Stage info for approver inbox */}
      {view === "inbox" && pendingQuery.data?.stage && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
          <Inbox className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">
            Showing requests awaiting your approval at stage:{" "}
            <span className="capitalize">{(pendingQuery.data.stage as string).replace("_", " ")}</span>
          </span>
        </div>
      )}

      {/* Cards grid */}
      {activeQuery.isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
          <p className="text-sm text-slate-500 mt-3 font-semibold">Loading overtime requests…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-500 mt-3">
            {view === "inbox" ? "No requests awaiting your approval" : "No overtime requests found"}
          </p>
          {view === "my" && (
            <button
              onClick={() => setShowSubmit(true)}
              className="mt-3 text-xs text-blue-600 font-bold hover:underline"
            >
              Submit your first request
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((ot) => (
            <OvertimeCard
              key={ot.id}
              ot={ot}
              isApprover={view === "inbox"}
              onApprove={handleApprove}
              onReject={setRejectId}
              onCancel={handleCancel}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <span className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} showAlert={showAlert} />}
        {rejectId && <RejectModal requestId={rejectId} onClose={() => setRejectId(null)} showAlert={showAlert} />}
      </AnimatePresence>
    </div>
  );
}
