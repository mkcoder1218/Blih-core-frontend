import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  Inbox,
  ChevronLeft,
  ChevronRight,
  X,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  CheckSquare,
  LayoutTemplate,
  Paperclip,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  useLeaveTemplates,
  useCreateLeaveTemplate,
  useUpdateLeaveTemplate,
  useToggleLeaveTemplate,
  useDeleteLeaveTemplate,
  useMyLeaveRequests,
  usePendingLeaveRequests,
  useAllLeaveRequests,
  useSubmitLeaveRequest,
  useApproveLeave,
  useRejectLeave,
  useCancelLeave,
  useMyLeaveBalances,
  type LeaveRequest,
  type LeaveTemplate,
  type LeaveType,
} from "../../hooks/useLeave";
import { useLegacyUser } from "../../api/legacyUserStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyPermissions } from "../../hooks/usePermissions";
import { useMe } from "../../hooks/useMe";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "annual",    label: "Annual Leave" },
  { value: "sick",      label: "Sick Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "casual",    label: "Casual Leave" },
  { value: "unpaid",    label: "Unpaid Leave" },
  { value: "custom",    label: "Custom" },
];

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  dept_head:  { label: "Dept Head Review", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  admin:      { label: "Admin Review",     color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200" },
  approved:   { label: "Approved",         color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  rejected:   { label: "Rejected",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  cancelled:  { label: "Cancelled",        color: "text-slate-500",   bg: "bg-slate-100",  border: "border-slate-200" },
};

const PIPELINE_STEPS = [
  { key: "dept_head", label: "Dept Head" },
  { key: "admin",     label: "Admin / HR" },
  { key: "approved",  label: "Approved"   },
];

// ── Small reusable pieces ─────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_CONFIG[stage] ?? STAGE_CONFIG.cancelled;
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
      cfg.bg, cfg.color, cfg.border
    )}>
      {cfg.label}
    </span>
  );
}

function Pipeline({ current }: { current: string }) {
  const idx = PIPELINE_STEPS.findIndex((s) => s.key === current);
  const isRejected = current === "rejected" || current === "cancelled";
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PIPELINE_STEPS.map((step, i) => {
        const done   = idx > i || current === "approved";
        const active = !isRejected && step.key === current;
        return (
          <React.Fragment key={step.key}>
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all",
              isRejected          ? "bg-slate-50 border-slate-200 text-slate-400" :
              done                ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
              active              ? "bg-blue-50 border-blue-300 text-blue-700" :
                                    "bg-white border-slate-200 text-slate-400"
            )}>
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

function LeaveTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    annual:    "bg-blue-600",
    sick:      "bg-amber-500",
    maternity: "bg-pink-500",
    paternity: "bg-cyan-500",
    casual:    "bg-purple-500",
    unpaid:    "bg-slate-500",
    custom:    "bg-emerald-600",
  };
  return (
    <span className={cn(
      "text-[9px] font-bold text-white py-0.5 px-2 rounded uppercase font-mono",
      colors[type] ?? "bg-slate-500"
    )}>
      {type}
    </span>
  );
}

// ── Request Card ──────────────────────────────────────────────────────────────

function LeaveCard({
  req,
  isApprover,
  onApprove,
  onReject,
  onCancel,
  currentUserId,
}: {
  req: LeaveRequest;
  isApprover: boolean;
  onApprove: (id: string) => void;
  onReject:  (id: string) => void;
  onCancel:  (id: string) => void;
  currentUserId: string;
  key?: string;
}) {
  const isOwn     = req.employeeUserId === currentUserId;
  const isPending = req.status === "pending";
  const initials  = req.employee?.fullName?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-4 relative overflow-hidden">
      {/* Leave type badge */}
      <div className="absolute top-4 right-4">
        <LeaveTypeBadge type={req.leaveType} />
      </div>

      {/* Employee */}
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
          {initials}
        </span>
        <div>
          <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">
            {req.employee?.fullName ?? "Employee"}
          </h4>
          <span className="text-[9.5px] font-medium text-slate-400 block mt-0.5">
            {req.employee?.email ?? ""}
          </span>
        </div>
      </div>

      {/* Pipeline */}
      <Pipeline current={req.approvalStage} />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 text-[10.5px]">
        <div>
          <span className="text-slate-400 font-medium block">Start</span>
          <span className="text-slate-700 font-bold font-mono text-[9.5px]">{req.startDate}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">End</span>
          <span className="text-slate-700 font-bold font-mono text-[9.5px]">{req.endDate}</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Duration</span>
          <span className="text-blue-600 font-black text-[11px]">{req.totalDays}d</span>
        </div>
        <div>
          <span className="text-slate-400 font-medium block">Template</span>
          <span className="text-slate-600 font-semibold text-[9.5px]">{req.template?.name ?? req.leaveType}</span>
        </div>
      </div>

      {/* Reason */}
      <div>
        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Reason</span>
        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-semibold">{req.reason}</p>
      </div>

      {(req.evidenceUrl || req.evidenceNote || req.template?.requiresEvidence) && (
        <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
          <Paperclip className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
              Evidence {req.template?.requiresEvidence ? "Required" : "Provided"}
            </span>
            {req.evidenceUrl ? (
              <a
                href={req.evidenceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10.5px] font-bold text-blue-600 hover:underline break-all"
              >
                {req.evidenceUrl}
              </a>
            ) : null}
            {req.evidenceNote ? (
              <p className="text-[10.5px] text-slate-600 font-semibold leading-relaxed break-words">
                {req.evidenceNote}
              </p>
            ) : null}
            {!req.evidenceUrl && !req.evidenceNote ? (
              <p className="text-[10.5px] text-amber-600 font-semibold">No evidence attached yet.</p>
            ) : null}
          </div>
        </div>
      )}

      {/* Stage */}
      <StageBadge stage={req.approvalStage} />

      {/* Rejection note */}
      {req.rejectionReason && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-600 font-semibold leading-relaxed">{req.rejectionReason}</p>
        </div>
      )}

      {/* Actions */}
      {isApprover && isPending && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          <Button
            onClick={() => onApprove(req.id)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 rounded-xl"
          >
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => onReject(req.id)}
            className="flex-1 border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-600 font-bold text-xs h-8 rounded-xl"
          >
            Reject
          </Button>
        </div>
      )}
      {isOwn && isPending && !isApprover && (
        <Button
          variant="outline"
          onClick={() => onCancel(req.id)}
          className="w-full border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 font-bold text-xs h-8 rounded-xl"
        >
          <X className="w-3 h-3 mr-1.5" /> Cancel Request
        </Button>
      )}
    </div>
  );
}

// ── Submit Leave Modal ────────────────────────────────────────────────────────

function SubmitModal({
  onClose,
  showAlert,
}: {
  onClose: () => void;
  showAlert: (m: string, t?: "success" | "error") => void;
}) {
  const submit    = useSubmitLeaveRequest();
  const { data: activeTemplates = [] } = useLeaveTemplates(true);
  const { data: balances = [] } = useMyLeaveBalances();

  const [form, setForm] = useState({
    leaveTemplateId: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate:   new Date().toISOString().slice(0, 10),
    reason: "",
    evidenceUrl: "",
    evidenceNote: "",
  });

  const selectedTemplate = activeTemplates.find((t) => t.id === form.leaveTemplateId);
  const balance = balances.find((b) => b.leaveType === selectedTemplate?.leaveType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTemplateId) { showAlert("Please select a leave type", "error"); return; }
    if (!form.reason.trim())   { showAlert("Please provide a reason", "error"); return; }
    if (form.endDate < form.startDate) { showAlert("End date cannot be before start date", "error"); return; }
    if (selectedTemplate?.requiresEvidence && !form.evidenceUrl.trim() && !form.evidenceNote.trim()) {
      showAlert("Please provide evidence for this leave type", "error");
      return;
    }
    try {
      await submit.mutateAsync(form);
      showAlert("Leave request submitted successfully", "success");
      onClose();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed to submit", "error");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 space-y-5">
        <DialogHeader>
          <DialogTitle className="text-sm font-black text-slate-900">New Leave Request</DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            Select an active leave type and fill in the details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</label>
            {activeTemplates.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[11px] text-amber-700 font-semibold">
                No active leave types available. Please contact HR.
              </div>
            ) : (
              <Select
                value={form.leaveTemplateId}
              onValueChange={(val) => setForm((p) => ({ ...p, leaveTemplateId: val }))}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                  <SelectValue placeholder="Select leave type..." />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-[min(92vw,360px)]">
                  {activeTemplates.map((tpl) => {
                    const bal = balances.find((b) => b.leaveType === tpl.leaveType);
                    const usesAmount = tpl.hasAmount !== false;
                    const remaining = bal?.remainingDays ?? tpl.totalDays;
                    const exhausted = usesAmount && remaining <= 0;
                    return (
                      <SelectItem key={tpl.id} value={tpl.id} disabled={exhausted} className="py-2 pr-8">
                        <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                          <span className="min-w-0 whitespace-normal break-words text-xs font-semibold leading-snug">
                            {tpl.name}
                          </span>
                          <div className="flex flex-shrink-0 flex-wrap justify-end gap-1">
                            {!usesAmount && (
                              <span className="whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                No balance
                              </span>
                            )}
                            {tpl.requiresEvidence && (
                              <span className="whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                Evidence
                              </span>
                            )}
                            <span className={cn(
                              "whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded",
                              exhausted ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                            )}>
                              {exhausted ? "Exhausted" : usesAmount ? `${remaining}d left` : "Open"}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Balance info */}
          {selectedTemplate && selectedTemplate.hasAmount !== false && balance && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-[11px] text-blue-700 font-semibold flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {balance.remainingDays} of {balance.totalDays} days remaining for {selectedTemplate.name}
            </div>
          )}

          {selectedTemplate?.requiresEvidence && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 text-[11px] text-amber-700 font-semibold flex items-start gap-2">
              <Paperclip className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Evidence is required for {selectedTemplate.name}.
                {selectedTemplate.evidenceInstructions ? ` ${selectedTemplate.evidenceInstructions}` : ""}
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
              <Input
                type="date"
                required
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold"
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</label>
            <Textarea
              required
              rows={3}
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Describe the reason for your leave..."
              className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold resize-none"
            />
          </div>

          {(selectedTemplate?.requiresEvidence || form.evidenceUrl || form.evidenceNote) && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Evidence Link {selectedTemplate?.requiresEvidence ? "" : "(optional)"}
                </label>
                <Input
                  value={form.evidenceUrl}
                  onChange={(e) => setForm((p) => ({ ...p, evidenceUrl: e.target.value }))}
                  placeholder="Paste document, image, or medical certificate link..."
                  className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Evidence Note {selectedTemplate?.requiresEvidence ? "" : "(optional)"}
                </label>
                <Textarea
                  rows={2}
                  value={form.evidenceNote}
                  onChange={(e) => setForm((p) => ({ ...p, evidenceNote: e.target.value }))}
                  placeholder="Reference number, document description, or handover note..."
                  className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold resize-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submit.isPending || activeTemplates.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs h-9 rounded-xl"
            >
              {submit.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────

function RejectModal({
  requestId,
  onClose,
  showAlert,
}: {
  requestId: string;
  onClose: () => void;
  showAlert: (m: string, t?: "success" | "error") => void;
}) {
  const reject = useRejectLeave();
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-5 space-y-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 rounded-xl text-red-600">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-black text-slate-900">Reject Request</DialogTitle>
              <DialogDescription className="text-[11px] text-slate-400">Provide a reason for rejection</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="State the rejection reason..."
          className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold resize-none"
        />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            disabled={reject.isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs h-9 rounded-xl"
          >
            {reject.isPending ? "Rejecting…" : "Confirm Reject"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Template Management Modal (HR/Admin only) ─────────────────────────────────

function TemplateModal({
  editTarget,
  onClose,
  showAlert,
}: {
  editTarget?: LeaveTemplate;
  onClose: () => void;
  showAlert: (m: string, t?: "success" | "error") => void;
}) {
  const create = useCreateLeaveTemplate();
  const update = useUpdateLeaveTemplate();

  const [form, setForm] = useState({
    name:        editTarget?.name ?? "",
    leaveType:   (editTarget?.leaveType ?? "annual") as LeaveType,
    hasAmount:   editTarget?.hasAmount ?? true,
    totalDays:   editTarget?.totalDays ?? 15,
    description: editTarget?.description ?? "",
    requiresEvidence: editTarget?.requiresEvidence ?? false,
    evidenceInstructions: editTarget?.evidenceInstructions ?? "",
    isActive:    editTarget?.isActive ?? false,
  });

  const isEditing = Boolean(editTarget);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim())   { showAlert("Please enter a template name", "error"); return; }
    if (form.hasAmount && form.totalDays <= 0) { showAlert("Total days must be greater than 0", "error"); return; }
    try {
      const payload = { ...form, totalDays: form.hasAmount ? form.totalDays : 0 };
      if (isEditing && editTarget) {
        await update.mutateAsync({ id: editTarget.id, ...payload });
        showAlert("Template updated successfully", "success");
      } else {
        await create.mutateAsync(payload);
        showAlert("Template created successfully", "success");
      }
      onClose();
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed", "error");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6 space-y-5">
        <DialogHeader>
          <DialogTitle className="text-sm font-black text-slate-900">
            {isEditing ? "Edit Leave Template" : "Create Leave Template"}
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-400">
            {isEditing
              ? "Update this leave type's configuration"
              : "Define a new leave type for your organization"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Template Name</label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Annual Leave 2025"
              className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</label>
              <Select
                value={form.leaveType}
                onValueChange={(val) => setForm((p) => ({ ...p, leaveType: val as LeaveType }))}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Days</label>
              <Input
                type="number"
                required={form.hasAmount}
                disabled={!form.hasAmount}
                min={0.5}
                step={0.5}
                value={form.hasAmount ? form.totalDays : 0}
                onChange={(e) => setForm((p) => ({ ...p, totalDays: parseFloat(e.target.value) || 0 }))}
                className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold disabled:text-slate-400"
              />
            </div>
          </div>

          <div
            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer"
            onClick={() => setForm((p) => ({ ...p, hasAmount: !p.hasAmount }))}
          >
            <div>
              <p className="text-xs font-bold text-slate-700">Has Leave Amount</p>
              <p className="text-[10px] text-slate-400 font-medium">Uses a balance and deducts days when approved</p>
            </div>
            {form.hasAmount ? (
              <ToggleRight className="w-7 h-7 text-emerald-500 flex-shrink-0" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-slate-300 flex-shrink-0" />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description (optional)</label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Who is eligible for this leave, any conditions..."
              className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold resize-none"
            />
          </div>

          <div
            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer"
            onClick={() => setForm((p) => ({ ...p, requiresEvidence: !p.requiresEvidence }))}
          >
            <div>
              <p className="text-xs font-bold text-slate-700">Require Evidence</p>
              <p className="text-[10px] text-slate-400 font-medium">Employees must provide proof for this leave type</p>
            </div>
            {form.requiresEvidence ? (
              <ToggleRight className="w-7 h-7 text-blue-500 flex-shrink-0" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-slate-300 flex-shrink-0" />
            )}
          </div>

          {form.requiresEvidence && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evidence Instructions</label>
              <Textarea
                rows={2}
                value={form.evidenceInstructions}
                onChange={(e) => setForm((p) => ({ ...p, evidenceInstructions: e.target.value }))}
                placeholder="Example: attach a medical certificate or official appointment letter..."
                className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold resize-none"
              />
            </div>
          )}

          {/* Active toggle */}
          <div
            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 cursor-pointer"
            onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
          >
            <div>
              <p className="text-xs font-bold text-slate-700">Make Active</p>
              <p className="text-[10px] text-slate-400 font-medium">Active templates appear for employees to request</p>
            </div>
            {form.isActive ? (
              <ToggleRight className="w-7 h-7 text-emerald-500 flex-shrink-0" />
            ) : (
              <ToggleLeft className="w-7 h-7 text-slate-300 flex-shrink-0" />
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs h-9 rounded-xl"
            >
              {isPending ? "Saving…" : isEditing ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Templates Panel (HR/Admin view) ──────────────────────────────────────────

function TemplatesPanel({ showAlert }: { showAlert: (m: string, t?: "success" | "error") => void }) {
  const { data: templates = [], isLoading, refetch } = useLeaveTemplates(false);
  const toggleMut  = useToggleLeaveTemplate();
  const deleteMut  = useDeleteLeaveTemplate();
  const [showCreate, setShowCreate]       = useState(false);
  const [editTarget, setEditTarget]       = useState<LeaveTemplate | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleToggle = async (id: string) => {
    try {
      await toggleMut.mutateAsync(id);
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      showAlert("Template deleted", "success");
      setConfirmDelete(null);
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed", "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div>
          <span className="bg-violet-50 border border-violet-100 text-violet-700 text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            Template Management
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Leave Templates</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Create and activate leave types for your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 h-9 w-9 rounded-xl bg-slate-100 border-0 hover:bg-slate-200 text-slate-600"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 h-9 rounded-xl"
          >
            <Plus className="w-3.5 h-3.5" />
            New Template
          </Button>
        </div>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 text-slate-300 mx-auto animate-spin" />
          <p className="text-sm text-slate-500 mt-3 font-semibold">Loading templates…</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100">
          <LayoutTemplate className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-500 mt-3">No leave templates yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-3 text-xs text-blue-600 font-bold hover:underline"
          >
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col gap-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <LeaveTypeBadge type={tpl.leaveType} />
                  <h4 className="text-[12px] font-extrabold text-slate-900 mt-2 leading-tight">{tpl.name}</h4>
                  {tpl.requiresEvidence && (
                    <div className="inline-flex items-center gap-1 mt-2 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                      <Paperclip className="w-3 h-3" />
                      Evidence required
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditTarget(tpl)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(tpl.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-slate-50 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Total Days</span>
                  <span className="text-lg font-black text-blue-600">{tpl.hasAmount === false ? "No amount" : tpl.totalDays}</span>
                </div>
                {tpl.description && (
                  <p className="text-[10px] text-slate-500 font-medium max-w-[120px] text-right line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                )}
              </div>

              <Separator />

              {/* Active toggle */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleToggle(tpl.id)}
              >
                <span className="text-xs font-bold text-slate-600">
                  {tpl.isActive ? "Active" : "Inactive"}
                </span>
                {tpl.isActive ? (
                  <div className="flex items-center gap-1">
                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 font-bold">Employees can request</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <ToggleLeft className="w-6 h-6 text-slate-300" />
                    <span className="text-[10px] text-slate-400 font-bold">Not available</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Dialog open onOpenChange={(open) => !open && setConfirmDelete(null)}>
          <DialogContent className="max-w-sm rounded-2xl p-5 space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 rounded-xl text-red-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-black text-slate-900">Delete Template</DialogTitle>
                  <DialogDescription className="text-[11px] text-slate-400">This cannot be undone</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <p className="text-xs text-slate-600 font-medium">
              Are you sure you want to delete this template? Templates with pending requests cannot be deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl">
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteMut.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold text-xs h-9 rounded-xl"
              >
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AnimatePresence>
        {(showCreate || editTarget) && (
          <TemplateModal
            editTarget={editTarget}
            onClose={() => { setShowCreate(false); setEditTarget(undefined); }}
            showAlert={showAlert}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main LeavePage Component ──────────────────────────────────────────────────

interface LeavePageProps {
  showAlert: (title: string, type?: "success" | "info" | "error") => void;
}

export default function LeavePage({ showAlert }: LeavePageProps) {
  const legacyUser = useLegacyUser();
  const perms = useMyPermissions();
  const { data: meRes } = useMe();
  const currentRoles = new Set((meRes?.data?.roles || []).map((role) => role.toUpperCase()));
  const role = legacyUser?.role || "Employee";
  const legacyIsHrAdmin = role === "HR Manager" || role === "Business Admin" || role === "Super Admin";
  const legacyIsDeptHead = role === "Department Head";
  const isHrAdmin =
    legacyIsHrAdmin ||
    perms.hasAny("leave.read", "leave.approve") ||
    currentRoles.has("HR_MANAGER") ||
    currentRoles.has("BUSINESS_ADMIN");
  const isApprover =
    isHrAdmin ||
    legacyIsDeptHead ||
    perms.hasAny("self_department_leave_read", "self_department_leave_manage") ||
    currentRoles.has("DEPARTMENT_HEAD") ||
    currentRoles.has("DEPT_HEAD");
  const currentUserId = meRes?.data?.user?.id ?? (legacyUser as any)?.id ?? "";

  // Tab: "my" (everyone), "on-request" (approvers only), "sent" (hr/admin only), "templates" (hr/admin only)
  type TabId = "my" | "on-request" | "sent" | "templates";
  const [view, setView] = useState<TabId>("my");
  const [page, setPage] = useState(1);
  const [showSubmit,  setShowSubmit]  = useState(false);
  const [rejectId,    setRejectId]    = useState<string | null>(null);

  const approve   = useApproveLeave();
  const cancelMut = useCancelLeave();

  const myQuery      = useMyLeaveRequests(     { page, size: 9 });
  const pendingQuery = usePendingLeaveRequests( { page, size: 9 });
  const allQuery     = useAllLeaveRequests(    { page, size: 9 });
  const balancesQuery = useMyLeaveBalances();

  const activeQuery =
    view === "my"         ? myQuery :
    view === "on-request" ? pendingQuery :
    view === "sent"       ? allQuery : myQuery;

  const data        = activeQuery.data;
  const rows: LeaveRequest[] = data?.rows ?? [];
  const totalPages  = data?.totalPages ?? 1;
  const total       = data?.total ?? 0;
  const pendingCount = pendingQuery.data?.total ?? 0;

  // KPIs (from My requests)
  const myRows     = myQuery.data?.rows ?? [];
  const approved   = myRows.filter((r) => r.status === "approved").length;
  const pending    = myRows.filter((r) => r.status === "pending").length;
  const totalDaysUsed = myRows
    .filter((r) => r.status === "approved")
    .reduce((s, r) => s + r.totalDays, 0);

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync({ id });
      showAlert("Leave request approved and moved to next stage", "success");
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed to approve", "error");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelMut.mutateAsync(id);
      showAlert("Leave request cancelled", "info");
    } catch (err: any) {
      showAlert(err?.response?.data?.message || err?.message || "Failed to cancel", "error");
    }
  };

  // ── Templates tab ─────────────────────────────────────────────────────────
  if (view === "templates") {
    return (
      <div className="space-y-5">
        {/* Tab strip */}
        <TabStrip
          view={view}
          setView={(v) => { setView(v as TabId); setPage(1); }}
          isHrAdmin={isHrAdmin}
          isApprover={isApprover}
          pendingCount={pendingCount}
        />
        <TemplatesPanel showAlert={showAlert} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_5px_22px_rgba(0,0,0,0.015)]">
        <div className="space-y-1">
          <span className="bg-blue-50 border border-blue-100 text-blue-700 text-[9.5px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase">
            2-Stage Approval Workflow
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">Leave Requests</h1>
          <p className="text-xs text-slate-400 font-medium">
            Dept Head → Admin / HR
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => activeQuery.refetch()}
            disabled={activeQuery.isFetching}
            className="p-2 h-9 w-9 rounded-xl bg-slate-100 border-0 hover:bg-slate-200 text-slate-600 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", activeQuery.isFetching && "animate-spin")} />
          </Button>
          {view === "my" && (
            <Button
              onClick={() => setShowSubmit(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 h-9 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" />
              New Leave Request
            </Button>
          )}
          {isHrAdmin && (
            <Button
              onClick={() => { setView("templates"); }}
              variant="outline"
              className="flex items-center gap-2 border-slate-200 text-slate-600 font-bold text-xs px-4 h-9 rounded-xl hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700"
            >
              <LayoutTemplate className="w-3.5 h-3.5" />
              Templates
            </Button>
          )}
        </div>
      </div>

      {/* KPIs — only on My tab */}
      {view === "my" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests",  val: total,         icon: FileText,    color: "text-slate-600",   bg: "bg-slate-50"   },
            { label: "Pending",         val: pending,       icon: Clock,       color: "text-amber-600",   bg: "bg-amber-50"   },
            { label: "Approved",        val: approved,      icon: CheckCircle2,color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Days Used",       val: `${totalDaysUsed}d`, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50"   },
          ].map(({ label, val, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{val}</div>
              </div>
              <div className={cn("p-2 rounded-xl", bg, color)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance cards — only on My tab */}
      {view === "my" && (balancesQuery.data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {balancesQuery.data!.map((bal) => (
            <div key={bal.id} className="bg-white border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <LeaveTypeBadge type={bal.leaveType} />
                <span className="text-[9px] font-bold text-slate-400">{bal.year}</span>
              </div>
              <div className="flex items-end gap-1 mt-3">
                <span className="text-2xl font-black text-blue-600">{bal.remainingDays}</span>
                <span className="text-[10px] text-slate-400 font-bold pb-0.5">/ {bal.totalDays} days left</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (bal.usedDays / bal.totalDays) * 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 font-medium mt-1">{bal.usedDays} used</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab strip */}
      <TabStrip
        view={view}
        setView={(v) => { setView(v as TabId); setPage(1); }}
        isHrAdmin={isHrAdmin}
        isApprover={isApprover}
        pendingCount={pendingCount}
      />

      {/* Approver stage info */}
      {view === "on-request" && pendingQuery.data?.stage && (
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
          <p className="text-sm text-slate-500 mt-3 font-semibold">Loading leave requests…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-500 mt-3">
            {view === "on-request" ? "No requests awaiting your approval" : "No leave requests found"}
          </p>
          {view === "my" && (
            <button
              onClick={() => setShowSubmit(true)}
              className="mt-3 text-xs text-blue-600 font-bold hover:underline"
            >
              Submit your first leave request
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((req) => (
            <LeaveCard
              key={req.id}
              req={req}              isApprover={view === "on-request"}
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
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </Button>
          <span className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-3 h-9 rounded-xl border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} showAlert={showAlert} />}
        {rejectId   && <RejectModal requestId={rejectId} onClose={() => setRejectId(null)} showAlert={showAlert} />}
      </AnimatePresence>
    </div>
  );
}

// ── Tab Strip (shared) ────────────────────────────────────────────────────────

function TabStrip({
  view,
  setView,
  isHrAdmin,
  isApprover,
  pendingCount,
}: {
  view: string;
  setView: (v: string) => void;
  isHrAdmin: boolean;
  isApprover: boolean;
  pendingCount: number;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      <button
        onClick={() => setView("my")}
        className={cn(
          "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
          view === "my" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        My Requests
      </button>

      {isApprover && (
        <button
          onClick={() => setView("on-request")}
          className={cn(
            "relative px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            view === "on-request" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          On Request
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </button>
      )}

      {isHrAdmin && (
        <>
          <button
            onClick={() => setView("sent")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
              view === "sent" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Leave Request Sent
          </button>
          <button
            onClick={() => setView("templates")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-colors",
              view === "templates" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Templates
          </button>
        </>
      )}
    </div>
  );
}
