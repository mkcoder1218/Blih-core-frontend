import React, { useState } from "react";
import { CheckSquare, LayoutTemplate, ToggleLeft, ToggleRight, X } from "lucide-react";
import { useCreateLeaveTemplate, useUpdateLeaveTemplate, type LeaveTemplate, type LeaveType } from "../../../hooks/useLeave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = [
  { value: "annual", label: "Annual Leave" },
  { value: "sick", label: "Sick Leave" },
  { value: "maternity", label: "Maternity Leave" },
  { value: "paternity", label: "Paternity Leave" },
  { value: "casual", label: "Casual Leave" },
  { value: "unpaid", label: "Unpaid Leave" },
  { value: "custom", label: "Custom" },
];

export function TemplateModal({
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
