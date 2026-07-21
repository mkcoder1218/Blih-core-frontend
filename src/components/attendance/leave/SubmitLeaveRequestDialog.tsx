import React, { useState } from "react";
import { AlertTriangle, Calendar, FileText, Paperclip, X } from "lucide-react";
import { useLeaveTemplates, useMyLeaveBalances, useSubmitLeaveRequest } from "../../../hooks/useLeave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function SubmitModal({
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
    durationType: "FULL_DAY" as "FULL_DAY" | "HALF_DAY",
    halfDayPeriod: null as "MORNING" | "AFTERNOON" | null,
    startDate: new Date().toISOString().slice(0, 10),
    endDate:   new Date().toISOString().slice(0, 10),
    reason: "",
    evidenceUrl: "",
    evidenceNote: "",
  });

  const selectedTemplate = activeTemplates.find((t) => t.id === form.leaveTemplateId);
  const isAnnualLeave = selectedTemplate
    ? selectedTemplate.leaveType === "annual" || selectedTemplate.name.toLowerCase().trim() === "annual leave"
    : false;
  const balance = balances.find((b) => b.leaveType === selectedTemplate?.leaveType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const durationType = isAnnualLeave ? form.durationType : "FULL_DAY";
    const halfDayPeriod = isAnnualLeave && durationType === "HALF_DAY" ? form.halfDayPeriod : null;
    const endDate = isAnnualLeave && durationType === "HALF_DAY" ? form.startDate : form.endDate;
    if (!form.leaveTemplateId) { showAlert("Please select a leave type", "error"); return; }
    if (!form.reason.trim())   { showAlert("Please provide a reason", "error"); return; }
    if (endDate < form.startDate) { showAlert("End date cannot be before start date", "error"); return; }
    if (durationType === "HALF_DAY" && !halfDayPeriod) {
      showAlert("Please select morning or afternoon for half-day leave", "error");
      return;
    }
    if (durationType === "HALF_DAY" && form.startDate !== endDate) {
      showAlert("Half-day leave must start and end on the same date", "error");
      return;
    }
    if (selectedTemplate?.requiresEvidence && !form.evidenceUrl.trim() && !form.evidenceNote.trim()) {
      showAlert("Please provide evidence for this leave type", "error");
      return;
    }
    try {
      await submit.mutateAsync({
        ...form,
        durationType,
        halfDayPeriod,
        endDate,
      });
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Template</label>
            {activeTemplates.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[11px] text-amber-700 font-semibold">
                No active leave types available. Please contact HR.
              </div>
            ) : (
              <Select
                value={form.leaveTemplateId}
                onValueChange={(val) => {
                  const nextTemplate = activeTemplates.find((tpl) => tpl.id === val);
                  const nextIsAnnual = nextTemplate
                    ? nextTemplate.leaveType === "annual" || nextTemplate.name.toLowerCase().trim() === "annual leave"
                    : false;
                  setForm((p) => ({
                    ...p,
                    leaveTemplateId: val,
                    durationType: nextIsAnnual ? p.durationType : "FULL_DAY",
                    halfDayPeriod: nextIsAnnual && p.durationType === "HALF_DAY" ? p.halfDayPeriod ?? "MORNING" : null,
                    endDate: nextIsAnnual && p.durationType === "HALF_DAY" ? p.startDate : p.endDate,
                  }));
                }}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                  <SelectValue placeholder="Select leave template..." />
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

          {isAnnualLeave && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</label>
                <Select
                  value={form.durationType}
                  onValueChange={(val) => setForm((p) => ({
                    ...p,
                    durationType: val as "FULL_DAY" | "HALF_DAY",
                    halfDayPeriod: val === "HALF_DAY" ? p.halfDayPeriod ?? "MORNING" : null,
                    endDate: val === "HALF_DAY" ? p.startDate : p.endDate,
                  }))}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_DAY">Full day</SelectItem>
                    <SelectItem value="HALF_DAY">Half day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.durationType === "HALF_DAY" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Period</label>
                  <Select
                    value={form.halfDayPeriod ?? ""}
                    onValueChange={(val) => setForm((p) => ({ ...p, halfDayPeriod: val as "MORNING" | "AFTERNOON" }))}
                  >
                    <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                      <SelectValue placeholder="Select period..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">Morning</SelectItem>
                      <SelectItem value="AFTERNOON">Afternoon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                onChange={(e) => setForm((p) => ({
                  ...p,
                  startDate: e.target.value,
                  endDate: isAnnualLeave && p.durationType === "HALF_DAY" ? e.target.value : p.endDate,
                }))}
                className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
              <Input
                type="date"
                required
                disabled={isAnnualLeave && form.durationType === "HALF_DAY"}
                min={form.startDate}
                value={form.endDate}
                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold disabled:text-slate-400"
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
