import React, { useState } from "react";
import { Calendar, FileText, Paperclip, Upload, X } from "lucide-react";
import { useLeaveTemplates, useMyLeaveBalances, useSubmitLeaveRequest } from "../../../hooks/useLeave";
import { api } from "../../../api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"]);
const ALLOWED_EVIDENCE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".pdf"];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatEvidenceFileName(fileName: string) {
  if (fileName.length <= 32) return fileName;

  const dotIndex = fileName.lastIndexOf(".");
  const extension = dotIndex > 0 ? fileName.slice(dotIndex) : "";
  const baseName = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;

  if (baseName.length <= 24) return fileName;
  return `${baseName.slice(0, 12)}…${baseName.slice(-8)}${extension}`;
}

function hasAllowedEvidenceExtension(fileName: string) {
  const normalized = fileName.toLowerCase();
  return ALLOWED_EVIDENCE_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

function countWorkingDaysInclusive(startDate: string, endDate: string) {
  if (!startDate || !endDate || endDate < startDate) return 0;

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
}

export function SubmitModal({
  onClose,
  showAlert,
}: {
  onClose: () => void;
  showAlert: (m: string, t?: "success" | "error") => void;
}) {
  const submit = useSubmitLeaveRequest();
  const { data: activeTemplates = [] } = useLeaveTemplates(true);
  const { data: balances = [] } = useMyLeaveBalances();

  const [form, setForm] = useState({
    leaveTemplateId: "",
    durationType: "FULL_DAY" as "FULL_DAY" | "HALF_DAY",
    halfDayPeriod: null as "MORNING" | "AFTERNOON" | null,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    reason: "",
    evidenceUrl: "",
    evidenceNote: "",
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  const selectedTemplate = activeTemplates.find((template) => template.id === form.leaveTemplateId);
  const isAnnualLeave = selectedTemplate
    ? selectedTemplate.leaveType === "annual" || selectedTemplate.name.toLowerCase().trim() === "annual leave"
    : false;
  const isSickLeave = selectedTemplate
    ? selectedTemplate.leaveType === "sick" || selectedTemplate.name.toLowerCase().trim() === "sick leave"
    : false;
  const balance = balances.find((item) => item.leaveType === selectedTemplate?.leaveType);
  const effectiveEndDate = isAnnualLeave && form.durationType === "HALF_DAY" ? form.startDate : form.endDate;
  const requestedDays =
    isAnnualLeave && form.durationType === "HALF_DAY"
      ? countWorkingDaysInclusive(form.startDate, form.startDate) > 0
        ? 0.5
        : 0
      : countWorkingDaysInclusive(form.startDate, effectiveEndDate);
  const availableDays = selectedTemplate?.hasAmount !== false
    ? Number(balance?.remainingDays ?? selectedTemplate?.totalDays ?? 0)
    : null;
  const remainingAfterRequest = availableDays === null ? null : availableDays - requestedDays;

  const handleEvidenceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    const validType = ALLOWED_EVIDENCE_MIME_TYPES.has(file.type) || hasAllowedEvidenceExtension(file.name);
    if (!validType) {
      event.target.value = "";
      showAlert("Please upload a PNG, JPG, JPEG, or PDF file", "error");
      return;
    }

    if (file.size > MAX_EVIDENCE_FILE_SIZE) {
      event.target.value = "";
      showAlert("Medical evidence must be 10 MB or smaller", "error");
      return;
    }

    setEvidenceFile(file);
  };

  const uploadEvidenceFile = async (file: File) => {
    const body = new FormData();
    body.append("moduleKey", "leave");
    body.append("file", file);

    const response = await api.post("/api/v1/files/upload", body);

    const uploaded = response.data?.file;
    if (!uploaded?.id || !uploaded?.downloadUrl) {
      throw new Error("The medical evidence upload did not return a valid file reference");
    }

    return {
      id: String(uploaded.id),
      downloadUrl: `/api/v1/files/${uploaded.id}/download`,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const durationType = isAnnualLeave ? form.durationType : "FULL_DAY";
    const halfDayPeriod = isAnnualLeave && durationType === "HALF_DAY" ? form.halfDayPeriod : null;
    const endDate = isAnnualLeave && durationType === "HALF_DAY" ? form.startDate : form.endDate;

    if (!form.leaveTemplateId) {
      showAlert("Please select a leave type", "error");
      return;
    }
    if (!form.reason.trim()) {
      showAlert("Please provide a reason", "error");
      return;
    }
    if (endDate < form.startDate) {
      showAlert("End date cannot be before start date", "error");
      return;
    }
    if (durationType === "HALF_DAY" && !halfDayPeriod) {
      showAlert("Please select morning or afternoon for half-day leave", "error");
      return;
    }
    if (durationType === "HALF_DAY" && form.startDate !== endDate) {
      showAlert("Half-day leave must start and end on the same date", "error");
      return;
    }
    if (requestedDays <= 0) {
      showAlert("The selected interval contains no working leave days", "error");
      return;
    }
    if (availableDays !== null && requestedDays > availableDays) {
      showAlert(
        `Insufficient leave balance. You have ${availableDays} day(s) available but selected ${requestedDays} day(s).`,
        "error",
      );
      return;
    }

    if (isSickLeave && selectedTemplate?.requiresEvidence && !evidenceFile) {
      showAlert("Please upload a medical certificate or medical evidence", "error");
      return;
    }

    if (
      !isSickLeave &&
      selectedTemplate?.requiresEvidence &&
      !form.evidenceUrl.trim() &&
      !form.evidenceNote.trim()
    ) {
      showAlert("Please provide evidence for this leave type", "error");
      return;
    }

    let uploadedFileId: string | null = null;

    try {
      let evidenceUrl = form.evidenceUrl.trim();

      if (isSickLeave && evidenceFile) {
        setIsUploadingEvidence(true);
        const uploaded = await uploadEvidenceFile(evidenceFile);
        uploadedFileId = uploaded.id;
        evidenceUrl = uploaded.downloadUrl;
      }

      await submit.mutateAsync({
        ...form,
        evidenceUrl,
        durationType,
        halfDayPeriod,
        endDate,
      });

      showAlert("Leave request submitted successfully", "success");
      onClose();
    } catch (err: any) {
      if (uploadedFileId) {
        try {
          await api.delete(`/api/v1/files/${uploadedFileId}`);
        } catch {
          // Best-effort cleanup only. The original leave submission error is more important to show.
        }
      }

      showAlert(err?.response?.data?.message || err?.message || "Failed to submit", "error");
    } finally {
      setIsUploadingEvidence(false);
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Template</label>
            {activeTemplates.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-[11px] text-amber-700 font-semibold">
                No active leave types available. Please contact HR.
              </div>
            ) : (
              <Select
                value={form.leaveTemplateId}
                onValueChange={(value) => {
                  const nextTemplate = activeTemplates.find((template) => template.id === value);
                  const nextIsAnnual = nextTemplate
                    ? nextTemplate.leaveType === "annual" || nextTemplate.name.toLowerCase().trim() === "annual leave"
                    : false;

                  setEvidenceFile(null);
                  setForm((previous) => ({
                    ...previous,
                    leaveTemplateId: value,
                    durationType: nextIsAnnual ? previous.durationType : "FULL_DAY",
                    halfDayPeriod:
                      nextIsAnnual && previous.durationType === "HALF_DAY"
                        ? previous.halfDayPeriod ?? "MORNING"
                        : null,
                    endDate:
                      nextIsAnnual && previous.durationType === "HALF_DAY"
                        ? previous.startDate
                        : previous.endDate,
                    evidenceUrl: "",
                    evidenceNote: "",
                  }));
                }}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold h-9">
                  <SelectValue placeholder="Select leave template..." />
                </SelectTrigger>
                <SelectContent className="min-w-[var(--radix-select-trigger-width)] w-[min(92vw,360px)]">
                  {activeTemplates.map((template) => {
                    const templateBalance = balances.find((item) => item.leaveType === template.leaveType);
                    const usesAmount = template.hasAmount !== false;
                    const remaining = templateBalance?.remainingDays ?? template.totalDays;
                    const exhausted = usesAmount && remaining <= 0;

                    return (
                      <SelectItem key={template.id} value={template.id} disabled={exhausted} className="py-2 pr-8">
                        <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                          <span className="min-w-0 whitespace-normal break-words text-xs font-semibold leading-snug">
                            {template.name}
                          </span>
                          <div className="flex flex-shrink-0 flex-wrap justify-end gap-1">
                            {!usesAmount && (
                              <span className="whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                No balance
                              </span>
                            )}
                            {template.requiresEvidence && (
                              <span className="whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                Evidence
                              </span>
                            )}
                            <span
                              className={cn(
                                "whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded",
                                exhausted ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700",
                              )}
                            >
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
                  onValueChange={(value) =>
                    setForm((previous) => ({
                      ...previous,
                      durationType: value as "FULL_DAY" | "HALF_DAY",
                      halfDayPeriod: value === "HALF_DAY" ? previous.halfDayPeriod ?? "MORNING" : null,
                      endDate: value === "HALF_DAY" ? previous.startDate : previous.endDate,
                    }))
                  }
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
                    onValueChange={(value) =>
                      setForm((previous) => ({
                        ...previous,
                        halfDayPeriod: value as "MORNING" | "AFTERNOON",
                      }))
                    }
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
              <Input
                type="date"
                required
                value={form.startDate}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    startDate: event.target.value,
                    endDate:
                      isAnnualLeave && previous.durationType === "HALF_DAY"
                        ? event.target.value
                        : previous.endDate,
                  }))
                }
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
                onChange={(event) => setForm((previous) => ({ ...previous, endDate: event.target.value }))}
                className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold disabled:text-slate-400"
              />
            </div>
          </div>

          {selectedTemplate && form.startDate && effectiveEndDate && effectiveEndDate >= form.startDate && (
            <div
              className={cn(
                "flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5",
                requestedDays > 0 && (availableDays === null || requestedDays <= availableDays)
                  ? "border-blue-100 bg-blue-50"
                  : "border-red-200 bg-red-50",
              )}
            >
              <div className="flex min-w-0 items-start gap-2">
                <Calendar
                  className={cn(
                    "mt-0.5 h-3.5 w-3.5 flex-shrink-0",
                    requestedDays > 0 && (availableDays === null || requestedDays <= availableDays)
                      ? "text-blue-600"
                      : "text-red-500",
                  )}
                />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[11px] font-black",
                      requestedDays > 0 && (availableDays === null || requestedDays <= availableDays)
                        ? "text-blue-800"
                        : "text-red-700",
                    )}
                  >
                    {requestedDays} {requestedDays === 1 ? "leave day" : "leave days"}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                    {form.durationType === "HALF_DAY" && isAnnualLeave
                      ? "Half-day request"
                      : "Calculated from the selected interval; Saturday and Sunday are excluded."}
                  </p>
                </div>
              </div>

              {remainingAfterRequest !== null && requestedDays > 0 && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">After request</p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-black",
                      remainingAfterRequest >= 0 ? "text-emerald-700" : "text-red-600",
                    )}
                  >
                    {Math.max(0, remainingAfterRequest)}d left
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reason</label>
            <Textarea
              required
              rows={3}
              value={form.reason}
              onChange={(event) => setForm((previous) => ({ ...previous, reason: event.target.value }))}
              placeholder="Describe the reason for your leave..."
              className="bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold resize-none"
            />
          </div>

          {(isSickLeave || selectedTemplate?.requiresEvidence || form.evidenceUrl || form.evidenceNote) && (
            <div className="space-y-3">
              {isSickLeave ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Medical Evidence {selectedTemplate?.requiresEvidence ? "" : "(optional)"}
                  </label>

                  {!evidenceFile ? (
                    <label
                      htmlFor="sick-leave-evidence"
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 transition hover:border-blue-400 hover:bg-blue-50/40"
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-blue-600">
                        <Upload className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700">Upload medical certificate</p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                          PNG, JPG, JPEG or PDF · max 10 MB
                        </p>
                      </div>
                      <input
                        id="sick-leave-evidence"
                        type="file"
                        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                        className="hidden"
                        onChange={handleEvidenceFileChange}
                      />
                    </label>
                  ) : (
                    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-emerald-200 text-emerald-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <p
                          title={evidenceFile.name}
                          className="block max-w-full truncate text-xs font-bold text-slate-700"
                        >
                          {formatEvidenceFileName(evidenceFile.name)}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                          {formatFileSize(evidenceFile.size)} · ready to upload
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setEvidenceFile(null)}
                        className="h-8 w-8 flex-shrink-0 rounded-lg text-slate-400 hover:bg-white hover:text-red-500"
                        aria-label="Remove medical evidence"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Evidence Link {selectedTemplate?.requiresEvidence ? "" : "(optional)"}
                  </label>
                  <Input
                    value={form.evidenceUrl}
                    onChange={(event) => setForm((previous) => ({ ...previous, evidenceUrl: event.target.value }))}
                    placeholder="Paste document or evidence link..."
                    className="bg-slate-50 border-slate-200 rounded-xl text-xs h-9 font-semibold"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Evidence Note (optional)
                </label>
                <Textarea
                  rows={2}
                  value={form.evidenceNote}
                  onChange={(event) => setForm((previous) => ({ ...previous, evidenceNote: event.target.value }))}
                  placeholder="Reference number, document description, or additional note..."
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
              disabled={submit.isPending || isUploadingEvidence}
              className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submit.isPending || isUploadingEvidence || activeTemplates.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs h-9 rounded-xl"
            >
              {isUploadingEvidence ? "Uploading…" : submit.isPending ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
