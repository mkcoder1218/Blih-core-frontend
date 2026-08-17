import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip } from "lucide-react";
import { api } from "../../../api/client";
import type {
  CreateEmploymentChangePayload,
  EmploymentChangeContext,
  EmploymentChangeRequest,
  TitleChangeType,
  UpdateEmploymentChangePayload,
} from "../../../api/employmentChanges";
import {
  useCreateEmploymentChange,
  useUpdateEmploymentChange,
} from "../../../hooks/useEmploymentChanges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const labelClass = "mb-1.5 block text-[11px] font-bold text-slate-600";

type RequestMode = "TITLE" | "SALARY" | "COMBINED";
type TitleInputMode = "POSITION" | "CUSTOM";
type SalaryInputMode = "NEW_SALARY" | "PERCENT";

type Props = {
  open: boolean;
  request?: EmploymentChangeRequest | null;
  context?: EmploymentChangeContext;
  onOpenChange: (open: boolean) => void;
  onSaved: (request: EmploymentChangeRequest) => void;
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
};

export function EmploymentRequestFormDialog({
  open,
  request,
  context,
  onOpenChange,
  onSaved,
  showAlert,
}: Props) {
  const editing = Boolean(request);
  const createMutation = useCreateEmploymentChange();
  const updateMutation = useUpdateEmploymentChange();

  const [requestMode, setRequestMode] = useState<RequestMode>("TITLE");
  const [titleInputMode, setTitleInputMode] = useState<TitleInputMode>("POSITION");
  const [salaryInputMode, setSalaryInputMode] = useState<SalaryInputMode>("NEW_SALARY");
  const [titleChangeType, setTitleChangeType] = useState<TitleChangeType>("PROMOTION");
  const [targetPositionId, setTargetPositionId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [increasePercent, setIncreasePercent] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const positions = context?.positions || [];
  const departments = context?.departments || [];
  const current = context?.current;

  useEffect(() => {
    if (!open) return;

    const mode = (request?.requestKind || "TITLE") as RequestMode;
    setRequestMode(mode);
    setTitleInputMode(request?.targetPositionId ? "POSITION" : request ? "CUSTOM" : "POSITION");
    setSalaryInputMode("NEW_SALARY");
    setTitleChangeType(request?.titleChangeType || "PROMOTION");
    setTargetPositionId(request?.targetPositionId || "");
    setCustomTitle(request?.targetPositionId ? "" : request?.targetTitle || "");
    setTargetDepartmentId(request?.targetDepartmentId || current?.departmentId || "");
    setNewSalary(request?.requestedSalary != null ? String(request.requestedSalary) : "");
    setIncreasePercent("");
    setEffectiveDate(request?.effectiveDate || new Date().toISOString().slice(0, 10));
    setReason(request?.reason || "");
    setAttachment(null);
  }, [open, request, current?.departmentId]);

  const selectedPosition = useMemo(
    () => positions.find((position) => position.id === targetPositionId),
    [positions, targetPositionId],
  );

  const salaryBase = Number(request?.currentSalary ?? current?.salary ?? 0);
  const requestedSalary = useMemo(() => {
    if (requestMode === "TITLE") return null;
    if (salaryInputMode === "NEW_SALARY") {
      const value = Number(newSalary);
      return Number.isFinite(value) && value > 0 ? value : null;
    }
    const percentage = Number(increasePercent);
    if (salaryBase <= 0 || !Number.isFinite(percentage) || percentage <= 0) return null;
    return salaryBase * (1 + percentage / 100);
  }, [increasePercent, newSalary, requestMode, salaryBase, salaryInputMode]);

  const uploadAttachment = async () => {
    if (!attachment) return undefined;
    const form = new FormData();
    form.append("moduleKey", "hr");
    form.append("file", attachment);
    const response = await api.post("/api/v1/files/upload", form);
    const file = response.data?.file || response.data?.data?.file;
    if (!file?.id) throw new Error("Attachment upload failed.");
    return `/api/v1/files/${file.id}/download`;
  };

  const validate = () => {
    const hasTitle = requestMode !== "SALARY";
    const hasSalary = requestMode !== "TITLE";

    if (hasTitle && titleInputMode === "POSITION" && !targetPositionId) {
      showAlert("Select a target position.", "error");
      return false;
    }
    if (hasTitle && titleInputMode === "CUSTOM" && !customTitle.trim()) {
      showAlert("Enter the new title.", "error");
      return false;
    }
    if (hasSalary && !requestedSalary) {
      showAlert("Enter a valid salary increase.", "error");
      return false;
    }
    if (hasSalary && requestedSalary != null && requestedSalary <= salaryBase) {
      showAlert("Requested salary must be greater than the current salary.", "error");
      return false;
    }
    if (!reason.trim()) {
      showAlert("Reason is required.", "error");
      return false;
    }
    if (!effectiveDate) {
      showAlert("Effective date is required.", "error");
      return false;
    }
    if (attachment && attachment.size > MAX_ATTACHMENT_SIZE) {
      showAlert("Attachment must be 10 MB or smaller.", "error");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;

    const hasTitle = requestMode !== "SALARY";
    const hasSalary = requestMode !== "TITLE";

    try {
      setUploading(Boolean(attachment));
      const attachmentUrl = await uploadAttachment();
      const common = {
        titleChangeType: hasTitle ? titleChangeType : undefined,
        targetPositionId:
          hasTitle && titleInputMode === "POSITION" ? targetPositionId : undefined,
        targetTitle:
          hasTitle && titleInputMode === "CUSTOM" ? customTitle.trim() : undefined,
        targetDepartmentId: hasTitle
          ? selectedPosition?.departmentId || targetDepartmentId || current?.departmentId || undefined
          : undefined,
        requestedSalary:
          hasSalary && salaryInputMode === "NEW_SALARY" ? Number(newSalary) : undefined,
        increasePercent:
          hasSalary && salaryInputMode === "PERCENT" ? Number(increasePercent) : undefined,
        reason: reason.trim(),
        effectiveDate,
      };

      let saved: EmploymentChangeRequest;
      if (request) {
        const payload: UpdateEmploymentChangePayload = {
          ...common,
          ...(attachmentUrl ? { attachmentUrl } : {}),
        };
        saved = await updateMutation.mutateAsync({ id: request.id, payload });
        showAlert("Request updated successfully.", "success");
      } else {
        const payload: CreateEmploymentChangePayload = {
          ...common,
          ...(attachmentUrl ? { attachmentUrl } : {}),
          source: "SELF_SERVICE",
        } as CreateEmploymentChangePayload;
        saved = await createMutation.mutateAsync(payload);
        showAlert("Request submitted successfully.", "success");
      }

      onSaved(saved);
      onOpenChange(false);
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          error?.message ||
          `Could not ${editing ? "update" : "submit"} the request.`,
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  const pending = createMutation.isPending || updateMutation.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[760px] overflow-x-hidden rounded-2xl p-0 sm:max-w-[760px]">
        <div className="max-h-[92vh] overflow-y-auto overflow-x-hidden p-5 sm:p-6">
          <DialogHeader className="pr-7">
            <DialogTitle className="text-lg">
              {editing ? "Update Request" : "New Request"}
            </DialogTitle>
            <DialogDescription className="max-w-xl text-sm leading-5">
              {editing
                ? "Update the pending request before it moves through approval. The change will be recorded in History."
                : "Choose the employment change and submit it through the approval workflow."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 min-w-0 space-y-5">
            <div className="grid min-w-0 grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {(["TITLE", "SALARY", "COMBINED"] as RequestMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={editing}
                  onClick={() => setRequestMode(mode)}
                  className={`min-w-0 rounded-lg px-2 py-2.5 text-[11px] font-bold transition sm:px-3 sm:text-xs ${
                    requestMode === mode
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500"
                  } ${editing ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  {mode === "TITLE" ? "Title" : mode === "SALARY" ? "Salary" : "Title + Salary"}
                </button>
              ))}
            </div>

            {requestMode !== "SALARY" && (
              <section className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Change Type</label>
                    <Select value={titleChangeType} onValueChange={(value) => setTitleChangeType(value as TitleChangeType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROMOTION">Promotion</SelectItem>
                        <SelectItem value="LATERAL_TITLE_CHANGE">Lateral Title Change</SelectItem>
                        <SelectItem value="DEMOTION">Demotion</SelectItem>
                        <SelectItem value="CORRECTION">Correction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={labelClass}>New Title Source</label>
                    <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                      {(["POSITION", "CUSTOM"] as TitleInputMode[]).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setTitleInputMode(mode)}
                          className={`rounded-md px-2 py-2 text-[11px] font-bold ${
                            titleInputMode === mode ? "bg-white shadow-sm" : "text-slate-500"
                          }`}
                        >
                          {mode === "POSITION" ? "Position" : "Free Text"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {titleInputMode === "POSITION" ? (
                  <div>
                    <label className={labelClass}>New Position</label>
                    <Select
                      value={targetPositionId}
                      onValueChange={(value) => {
                        setTargetPositionId(value);
                        const position = positions.find((item) => item.id === value);
                        if (position?.departmentId) setTargetDepartmentId(position.departmentId);
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select new position" /></SelectTrigger>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position.id} value={position.id}>{position.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className={labelClass}>New Title</label>
                      <Input value={customTitle} onChange={(event) => setCustomTitle(event.currentTarget.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>Department</label>
                      <Select value={targetDepartmentId} onValueChange={setTargetDepartmentId}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          {departments.map((department) => (
                            <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </section>
            )}

            {requestMode !== "TITLE" && (
              <section className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Salary Input</label>
                    <Select value={salaryInputMode} onValueChange={(value) => setSalaryInputMode(value as SalaryInputMode)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW_SALARY">New Base Salary</SelectItem>
                        <SelectItem value="PERCENT">Increase Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {salaryInputMode === "NEW_SALARY" ? "Requested Base Salary" : "Increase Percentage"}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={salaryInputMode === "NEW_SALARY" ? newSalary : increasePercent}
                      onChange={(event) =>
                        salaryInputMode === "NEW_SALARY"
                          ? setNewSalary(event.currentTarget.value)
                          : setIncreasePercent(event.currentTarget.value)
                      }
                    />
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  Base salary is used by payroll. Career request summaries display the payroll-calculated net salary.
                </p>
              </section>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Effective Date</label>
                <Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.currentTarget.value)} />
              </div>
              <div>
                <label className={labelClass}>Attachment (optional)</label>
                <label className="flex h-10 cursor-pointer items-center gap-2 overflow-hidden rounded-md border border-input px-3 text-xs font-semibold text-slate-600">
                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    {attachment?.name || (editing && request?.attachmentUrl ? "Current attachment kept" : "Attach file")}
                  </span>
                  <input
                    className="hidden"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={(event) => setAttachment(event.currentTarget.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>Reason</label>
              <Textarea
                className="min-h-28 resize-y"
                rows={4}
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => void submit()} disabled={pending} className="bg-blue-600 hover:bg-blue-700">
                {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {editing ? "Update Request" : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
