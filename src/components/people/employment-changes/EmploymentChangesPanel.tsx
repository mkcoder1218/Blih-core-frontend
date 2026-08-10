import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Clock3,
  DollarSign,
  Eye,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  TrendingUp,
  UserRoundCheck,
  X,
} from "lucide-react";

import { api } from "@/api/client";
import type {
  EmploymentChangeRequest,
  TitleChangeType,
} from "@/api/employmentChanges";
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
import { useDepartments } from "@/hooks/useDepartments";
import {
  useApproveEmploymentChange,
  useCancelEmploymentChange,
  useCounterEmploymentChange,
  useCreateEmploymentChange,
  useEmploymentChangeHistory,
  useEmploymentChanges,
  useRejectEmploymentChange,
} from "@/hooks/useEmploymentChanges";
import { usePositions } from "@/hooks/usePositions";

interface Props {
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
  employeeUserId?: string;
  employeeName?: string;
  compact?: boolean;
}

type RequestMode = "TITLE" | "SALARY" | "COMBINED";
type SalaryInputMode = "NEW_SALARY" | "PERCENT";
type TitleInputMode = "POSITION" | "CUSTOM";
type ActionType = "APPROVE" | "REJECT" | "COUNTER" | "CANCEL";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

function money(value: unknown) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function niceStatus(status: string) {
  return String(status || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function statusClass(status: string) {
  switch (status) {
    case "APPLIED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "SCHEDULED":
    case "APPROVED":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-100";
    default:
      return "bg-amber-50 text-amber-700 border-amber-100";
  }
}

function requestKindLabel(request: EmploymentChangeRequest) {
  if (request.requestKind === "COMBINED") return "Title + Salary";
  if (request.requestKind === "TITLE") return "Title Change";
  return "Salary Increase";
}

function getProfilePayload(response: any) {
  return response?.data?.profile || response?.data?.data?.profile || response?.data?.data || null;
}

function getCurrentSalary(profile: any) {
  const record = profile?.employeeRecord || profile?.EmployeeRecord || {};
  return Number(
    record?.salaryInfo?.baseSalary ??
      record?.salaryInfo?.monthlySalary ??
      record?.salaryInfo?.salary ??
      0,
  );
}

export function EmploymentChangesPanel({
  showAlert,
  employeeUserId,
  employeeName,
  compact = false,
}: Props) {
  const [view, setView] = useState<"REQUESTS" | "APPROVALS">("REQUESTS");
  const [createOpen, setCreateOpen] = useState(false);
  const [requestMode, setRequestMode] = useState<RequestMode>("TITLE");
  const [titleInputMode, setTitleInputMode] = useState<TitleInputMode>("POSITION");
  const [salaryInputMode, setSalaryInputMode] = useState<SalaryInputMode>("NEW_SALARY");
  const [titleChangeType, setTitleChangeType] = useState<TitleChangeType>("PROMOTION");
  const [targetPositionId, setTargetPositionId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [increasePercent, setIncreasePercent] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EmploymentChangeRequest | null>(null);
  const [action, setAction] = useState<{ type: ActionType; request: EmploymentChangeRequest } | null>(null);
  const [actionComment, setActionComment] = useState("");
  const [counterSalary, setCounterSalary] = useState("");

  const requests = useEmploymentChanges(
    employeeUserId
      ? { employeeUserId, size: 100 }
      : { scope: "mine", size: 100 },
  );
  const approvals = useEmploymentChanges({ scope: "approvals", size: 100 });
  const history = useEmploymentChangeHistory(selectedRequest?.id);

  const createMutation = useCreateEmploymentChange();
  const approveMutation = useApproveEmploymentChange();
  const rejectMutation = useRejectEmploymentChange();
  const counterMutation = useCounterEmploymentChange();
  const cancelMutation = useCancelEmploymentChange();

  const positions = usePositions({ size: 1000 });
  const departments = useDepartments({ size: 1000 });

  const profileQuery = useQuery({
    queryKey: ["employment-change-profile-context", employeeUserId || "me"],
    queryFn: async () => {
      const response = await api.get(
        employeeUserId
          ? `/api/v1/profiles/user/${employeeUserId}`
          : "/api/v1/profiles/me",
      );
      return getProfilePayload(response);
    },
    staleTime: 30_000,
  });

  const profile = profileQuery.data;
  const currentTitle =
    profile?.position?.title ||
    profile?.employeeRecord?.position?.title ||
    profile?.EmployeeRecord?.position?.title ||
    "—";
  const currentSalary = getCurrentSalary(profile);
  const currentDepartmentId =
    profile?.department?.id ||
    profile?.employeeRecord?.departmentId ||
    profile?.EmployeeRecord?.departmentId ||
    "";

  const allPositions = positions.data?.positions || [];
  const allDepartments = departments.data?.departments || [];
  const selectedPosition = allPositions.find((position) => position.id === targetPositionId);

  const calculatedRequestedSalary = useMemo(() => {
    if (requestMode === "TITLE") return null;
    if (salaryInputMode === "NEW_SALARY") {
      const value = Number(newSalary);
      return Number.isFinite(value) && value > 0 ? value : null;
    }
    const pct = Number(increasePercent);
    if (!Number.isFinite(pct) || currentSalary <= 0) return null;
    return currentSalary * (1 + pct / 100);
  }, [currentSalary, increasePercent, newSalary, requestMode, salaryInputMode]);

  const rows = view === "APPROVALS" ? approvals.data || [] : requests.data || [];
  const loading = view === "APPROVALS" ? approvals.isLoading : requests.isLoading;

  const resetCreate = () => {
    setRequestMode("TITLE");
    setTitleInputMode("POSITION");
    setSalaryInputMode("NEW_SALARY");
    setTitleChangeType("PROMOTION");
    setTargetPositionId("");
    setCustomTitle("");
    setTargetDepartmentId("");
    setNewSalary("");
    setIncreasePercent("");
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setReason("");
    setAttachment(null);
  };

  const uploadAttachment = async () => {
    if (!attachment) return undefined;
    const body = new FormData();
    body.append("moduleKey", "hr");
    body.append("file", attachment);
    const response = await api.post("/api/v1/files/upload", body);
    const uploaded = response.data?.file;
    if (!uploaded?.id) throw new Error("Attachment upload did not return a file reference.");
    return `/api/v1/files/${uploaded.id}/download`;
  };

  const submitRequest = async () => {
    const hasTitle = requestMode === "TITLE" || requestMode === "COMBINED";
    const hasSalary = requestMode === "SALARY" || requestMode === "COMBINED";

    if (hasTitle && titleInputMode === "POSITION" && !targetPositionId) {
      showAlert("Select a target position or switch to Custom title.", "error");
      return;
    }
    if (hasTitle && titleInputMode === "CUSTOM" && !customTitle.trim()) {
      showAlert("Enter the new job title.", "error");
      return;
    }
    if (hasSalary && !calculatedRequestedSalary) {
      showAlert("Enter a valid new salary or increase percentage.", "error");
      return;
    }
    if (hasSalary && currentSalary > 0 && Number(calculatedRequestedSalary) <= currentSalary) {
      showAlert("The requested salary must be greater than the current salary.", "error");
      return;
    }
    if (!reason.trim()) {
      showAlert("Add a reason / justification.", "error");
      return;
    }
    if (!effectiveDate) {
      showAlert("Select an effective date.", "error");
      return;
    }
    if (attachment && attachment.size > MAX_ATTACHMENT_SIZE) {
      showAlert("Attachment must be 10 MB or smaller.", "error");
      return;
    }

    try {
      setUploading(Boolean(attachment));
      const attachmentUrl = await uploadAttachment();
      await createMutation.mutateAsync({
        employeeUserId,
        titleChangeType: hasTitle ? titleChangeType : undefined,
        targetPositionId: hasTitle && titleInputMode === "POSITION" ? targetPositionId : undefined,
        targetTitle: hasTitle && titleInputMode === "CUSTOM" ? customTitle.trim() : undefined,
        targetDepartmentId:
          hasTitle
            ? selectedPosition?.departmentId || targetDepartmentId || currentDepartmentId || undefined
            : undefined,
        requestedSalary:
          hasSalary && salaryInputMode === "NEW_SALARY"
            ? Number(newSalary)
            : undefined,
        increasePercent:
          hasSalary && salaryInputMode === "PERCENT"
            ? Number(increasePercent)
            : undefined,
        reason: reason.trim(),
        effectiveDate,
        attachmentUrl,
        source: employeeUserId ? "EMPLOYEE_PROFILE" : "SELF_SERVICE",
      });
      setCreateOpen(false);
      resetCreate();
      showAlert("Employment change request submitted and sent to the current approver.", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message || error?.message || "Could not submit employment change request.",
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  const runAction = async () => {
    if (!action) return;
    try {
      if (action.type === "APPROVE") {
        await approveMutation.mutateAsync({ id: action.request.id, comment: actionComment.trim() || undefined });
        showAlert("Approval recorded and the request moved to the next stage.", "success");
      } else if (action.type === "REJECT") {
        if (!actionComment.trim()) {
          showAlert("A rejection reason is required.", "error");
          return;
        }
        await rejectMutation.mutateAsync({ id: action.request.id, reason: actionComment.trim() });
        showAlert("Employment change request rejected.", "info");
      } else if (action.type === "COUNTER") {
        if (!actionComment.trim() || Number(counterSalary) <= 0) {
          showAlert("Enter a recommended salary and a comment.", "error");
          return;
        }
        await counterMutation.mutateAsync({
          id: action.request.id,
          recommendedSalary: Number(counterSalary),
          comment: actionComment.trim(),
        });
        showAlert("Recommended salary recorded and forwarded to the next approver.", "success");
      } else {
        await cancelMutation.mutateAsync({ id: action.request.id, reason: actionComment.trim() || undefined });
        showAlert("Employment change request cancelled.", "info");
      }
      setAction(null);
      setActionComment("");
      setCounterSalary("");
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Could not update the request.", "error");
    }
  };

  const actionPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    counterMutation.isPending ||
    cancelMutation.isPending;

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-950">Title & Salary Requests</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Request title changes, salary increases, or both through one approval chain.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" /> New request
        </Button>
      </div>

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setView("REQUESTS")}
          className={`rounded-lg px-3 py-2 text-xs font-bold transition ${view === "REQUESTS" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
          {employeeUserId ? `${employeeName || "Employee"} requests` : "My requests"}
        </button>
        <button
          type="button"
          onClick={() => setView("APPROVALS")}
          className={`rounded-lg px-3 py-2 text-xs font-bold transition ${view === "APPROVALS" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}
        >
          Approvals{approvals.data?.length ? ` (${approvals.data.length})` : ""}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-12 text-xs font-bold text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading employment changes...
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-10 text-center">
          <BriefcaseBusiness className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">
            {view === "APPROVALS" ? "No requests need your approval" : "No employment change requests yet"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {view === "APPROVALS" ? "Requests will appear here when you are the current approver." : "Create a title change, salary increase, or combined request."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((request) => (
            <div key={request.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {request.requestKind === "SALARY" ? (
                      <DollarSign className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : request.requestKind === "TITLE" ? (
                      <BriefcaseBusiness className="h-4 w-4 shrink-0 text-blue-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 shrink-0 text-violet-600" />
                    )}
                    <p className="truncate text-sm font-black text-slate-900">{requestKindLabel(request)}</p>
                  </div>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {request.employee?.fullName || "Employee"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass(request.status)}`}>
                  {niceStatus(request.status)}
                </span>
              </div>

              {request.targetTitle && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50/70 px-3 py-2 text-xs font-bold text-slate-700">
                  <span className="min-w-0 truncate">{request.currentTitle || "Current title"}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="min-w-0 truncate text-blue-700">{request.targetTitle}</span>
                </div>
              )}

              {request.requestedSalary != null && (
                <div className="mt-2 rounded-lg bg-emerald-50/70 px-3 py-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-500">Salary</span>
                    <span className="font-black text-emerald-700">
                      {money(request.currentSalary)} → {money(request.finalSalary ?? request.requestedSalary)}
                    </span>
                  </div>
                  {request.increasePercent != null && (
                    <p className="mt-1 text-right text-[10px] font-bold text-emerald-600">
                      +{Number(request.increasePercent).toFixed(1)}%
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500">
                <span className="rounded-lg bg-slate-50 px-2.5 py-2">Stage: <strong className="text-slate-700">{niceStatus(request.approvalStage)}</strong></span>
                <span className="rounded-lg bg-slate-50 px-2.5 py-2">Effective: <strong className="text-slate-700">{request.effectiveDate}</strong></span>
              </div>

              <p className="mt-3 line-clamp-2 text-xs font-medium text-slate-500">{request.reason}</p>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)} className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" /> Details
                </Button>
                {request.canApprove && (
                  <>
                    <Button size="sm" onClick={() => setAction({ type: "APPROVE", request })} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    {request.canCounter && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setCounterSalary(String(request.finalSalary ?? request.requestedSalary ?? ""));
                        setAction({ type: "COUNTER", request });
                      }}>
                        Counter salary
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setAction({ type: "REJECT", request })} className="border-red-200 text-red-600 hover:bg-red-50">
                      Reject
                    </Button>
                  </>
                )}
                {request.canCancel && (
                  <Button size="sm" variant="ghost" onClick={() => setAction({ type: "CANCEL", request })} className="text-red-500 hover:bg-red-50 hover:text-red-700">
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => {
        setCreateOpen(open);
        if (!open) resetCreate();
      }}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>New employment change</DialogTitle>
            <DialogDescription>
              Submit a title change, salary increase, or both. The system routes it to the correct approvers automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
              {(["TITLE", "SALARY", "COMBINED"] as RequestMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRequestMode(mode)}
                  className={`rounded-lg px-2 py-2.5 text-xs font-bold transition ${requestMode === mode ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                >
                  {mode === "TITLE" ? "Title" : mode === "SALARY" ? "Salary" : "Title + Salary"}
                </button>
              ))}
            </div>

            {(requestMode === "TITLE" || requestMode === "COMBINED") && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Title change</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">Current: {currentTitle}</p>
                  </div>
                  <Select value={titleChangeType} onValueChange={(value) => setTitleChangeType(value as TitleChangeType)}>
                    <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROMOTION">Promotion</SelectItem>
                      <SelectItem value="LATERAL_TITLE_CHANGE">Lateral title change</SelectItem>
                      <SelectItem value="DEMOTION">Demotion</SelectItem>
                      <SelectItem value="CORRECTION">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="inline-flex rounded-lg bg-slate-100 p-1">
                  <button type="button" onClick={() => setTitleInputMode("POSITION")} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${titleInputMode === "POSITION" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Existing position</button>
                  <button type="button" onClick={() => setTitleInputMode("CUSTOM")} className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${titleInputMode === "CUSTOM" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Free-text title</button>
                </div>

                {titleInputMode === "POSITION" ? (
                  <Select value={targetPositionId} onValueChange={(value) => {
                    setTargetPositionId(value);
                    const position = allPositions.find((item) => item.id === value);
                    if (position?.departmentId) setTargetDepartmentId(position.departmentId);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select target position" /></SelectTrigger>
                    <SelectContent>
                      {allPositions.map((position) => (
                        <SelectItem key={position.id} value={position.id}>{position.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={customTitle} onChange={(event) => setCustomTitle(event.currentTarget.value)} placeholder="e.g. Senior Backend Engineer" />
                    <Select value={targetDepartmentId || currentDepartmentId} onValueChange={setTargetDepartmentId}>
                      <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                      <SelectContent>
                        {allDepartments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {(requestMode === "SALARY" || requestMode === "COMBINED") && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-800">Salary increase</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">Current salary: {currentSalary > 0 ? money(currentSalary) : "Not available"}</p>
                  </div>
                  <div className="inline-flex rounded-lg bg-slate-100 p-1">
                    <button type="button" onClick={() => setSalaryInputMode("NEW_SALARY")} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold ${salaryInputMode === "NEW_SALARY" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>New salary</button>
                    <button type="button" disabled={currentSalary <= 0} onClick={() => setSalaryInputMode("PERCENT")} className={`rounded-md px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-40 ${salaryInputMode === "PERCENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Increase %</button>
                  </div>
                </div>

                {salaryInputMode === "NEW_SALARY" ? (
                  <Input type="number" min="0" value={newSalary} onChange={(event) => setNewSalary(event.currentTarget.value)} placeholder="Requested new salary" />
                ) : (
                  <Input type="number" value={increasePercent} onChange={(event) => setIncreasePercent(event.currentTarget.value)} placeholder="Increase percentage" />
                )}

                {calculatedRequestedSalary && (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                    Requested salary: <strong>{money(calculatedRequestedSalary)}</strong>
                    {currentSalary > 0 && (
                      <> · Increase: <strong>{money(Number(calculatedRequestedSalary) - currentSalary)}</strong></>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">Effective date</label>
                <Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.currentTarget.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">Attachment (optional)</label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-semibold text-slate-600">
                  <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate">{attachment?.name || "Attach document"}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx"
                    onChange={(event) => setAttachment(event.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Reason / justification</label>
              <Textarea rows={4} value={reason} onChange={(event) => setReason(event.currentTarget.value)} placeholder="Explain why this change is being requested..." />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending || uploading}>Cancel</Button>
              <Button onClick={() => void submitRequest()} disabled={createMutation.isPending || uploading} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                {(createMutation.isPending || uploading) && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{requestKindLabel(selectedRequest)}</DialogTitle>
                <DialogDescription>
                  {selectedRequest.employee?.fullName || "Employee"} · {niceStatus(selectedRequest.status)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedRequest.targetTitle && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Title</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{selectedRequest.currentTitle || "—"} → {selectedRequest.targetTitle}</p>
                    </div>
                  )}
                  {selectedRequest.requestedSalary != null && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Salary</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{money(selectedRequest.currentSalary)} → {money(selectedRequest.finalSalary ?? selectedRequest.requestedSalary)}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 p-3 text-xs text-slate-600">
                  <p><strong>Approval stage:</strong> {niceStatus(selectedRequest.approvalStage)}</p>
                  <p className="mt-1"><strong>Effective date:</strong> {selectedRequest.effectiveDate}</p>
                  <p className="mt-1"><strong>Requested by:</strong> {selectedRequest.requester?.fullName || "—"}</p>
                  <p className="mt-1"><strong>Current approver:</strong> {selectedRequest.currentApprover?.fullName || selectedRequest.currentApproverRoleKey || "—"}</p>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-800">Reason</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs font-medium text-slate-500">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.attachmentUrl && (
                  <Button variant="outline" size="sm" onClick={() => window.open(selectedRequest.attachmentUrl || "", "_blank") } className="gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Open attachment
                  </Button>
                )}

                <div>
                  <p className="mb-2 text-xs font-black text-slate-800">Employment history</p>
                  {history.isLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading history...</div>
                  ) : (
                    <div className="space-y-2">
                      {(history.data || []).map((item) => (
                        <div key={item.id} className="flex gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            {item.action === "REJECTED" || item.action === "CANCELLED" ? <X className="h-3 w-3" /> : item.action === "APPLIED" ? <UserRoundCheck className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-700">{niceStatus(item.action)}</p>
                            <p className="text-[10px] font-medium text-slate-400">{item.actor?.fullName || "System"} · {new Date(item.createdAt).toLocaleString()}</p>
                            {item.comment && <p className="mt-1 text-[11px] text-slate-500">{item.comment}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(action)} onOpenChange={(open) => {
        if (!open) {
          setAction(null);
          setActionComment("");
          setCounterSalary("");
        }
      }}>
        <DialogContent className="max-w-md rounded-2xl">
          {action && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {action.type === "APPROVE" ? "Approve employment change" : action.type === "REJECT" ? "Reject employment change" : action.type === "COUNTER" ? "Recommend a different salary" : "Cancel employment change"}
                </DialogTitle>
                <DialogDescription>
                  {action.type === "APPROVE" ? "Approval comments are optional." : action.type === "COUNTER" ? "The original requested salary is preserved in history." : "Add a reason for the action."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {action.type === "COUNTER" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-600">Recommended salary</label>
                    <Input type="number" min="0" value={counterSalary} onChange={(event) => setCounterSalary(event.currentTarget.value)} />
                  </div>
                )}
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    {action.type === "APPROVE" ? "Comment (optional)" : "Comment / reason"}
                  </label>
                  <Textarea rows={4} value={actionComment} onChange={(event) => setActionComment(event.currentTarget.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setAction(null)} disabled={actionPending}>Close</Button>
                  <Button
                    onClick={() => void runAction()}
                    disabled={actionPending}
                    className={action.type === "REJECT" || action.type === "CANCEL" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    {actionPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                    Confirm
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
