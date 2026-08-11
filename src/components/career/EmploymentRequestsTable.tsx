import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Paperclip,
  Plus,
  Search,
  X,
} from "lucide-react";

import { api } from "../../api/client";
import type {
  EmploymentChangeRequest,
  TitleChangeType,
} from "../../api/employmentChanges";
import {
  useApproveEmploymentChange,
  useCounterEmploymentChange,
  useCreateEmploymentChange,
  useEmploymentChangeContext,
  useEmploymentChangeHistory,
  useEmploymentChangePage,
  useRejectEmploymentChange,
} from "../../hooks/useEmploymentChanges";
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

interface Props {
  scope: "mine" | "visible";
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
}

type RequestMode = "TITLE" | "SALARY" | "COMBINED";
type TitleInputMode = "POSITION" | "CUSTOM";
type SalaryInputMode = "NEW_SALARY" | "PERCENT";
type DecisionMode = "APPROVE" | "REJECT" | "COUNTER" | null;

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

function nice(value?: string | null) {
  if (!value) return "—";
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: unknown, currency = "ETB") {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "—";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount)} ${currency}`;
}

function statusClass(status: string) {
  switch (status) {
    case "APPLIED":
      return "bg-emerald-50 text-emerald-700";
    case "APPROVED":
    case "SCHEDULED":
      return "bg-blue-50 text-blue-700";
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

function kindLabel(request: EmploymentChangeRequest) {
  if (request.requestKind === "COMBINED") return "Title + Salary";
  if (request.requestKind === "SALARY") return "Salary Increase";
  return "Title Change";
}

function changeSummary(request: EmploymentChangeRequest, currency = "ETB") {
  const parts: string[] = [];
  if (request.targetTitle) {
    parts.push(`${request.currentTitle || "Current title"} → ${request.targetTitle}`);
  }
  if (request.requestedSalary != null) {
    parts.push(
      `${money(request.currentSalary, currency)} → ${money(
        request.finalSalary ?? request.requestedSalary,
        currency,
      )}`,
    );
  }
  return parts.join(" · ") || "—";
}

function queryRequestId() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("employmentChangeRequestId");
}

export default function EmploymentRequestsTable({ scope, showAlert }: Props) {
  const isMine = scope === "mine";
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [requestKind, setRequestKind] = useState("ALL");
  const [approvalStage, setApprovalStage] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selectedRequest, setSelectedRequest] = useState<EmploymentChangeRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [decisionMode, setDecisionMode] = useState<DecisionMode>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [counterSalary, setCounterSalary] = useState("");

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

  const pageQuery = useEmploymentChangePage({
    scope,
    page,
    size,
    search: scope === "visible" && search.trim() ? search.trim() : undefined,
    status: status !== "ALL" ? status : undefined,
    requestKind: requestKind !== "ALL" ? requestKind : undefined,
    approvalStage:
      scope === "visible" && approvalStage !== "ALL" ? approvalStage : undefined,
    dateFrom: scope === "visible" && dateFrom ? dateFrom : undefined,
    dateTo: scope === "visible" && dateTo ? dateTo : undefined,
  });
  const context = useEmploymentChangeContext();
  const history = useEmploymentChangeHistory(selectedRequest?.id);
  const createMutation = useCreateEmploymentChange();
  const approveMutation = useApproveEmploymentChange();
  const rejectMutation = useRejectEmploymentChange();
  const counterMutation = useCounterEmploymentChange();

  const data = pageQuery.data;
  const rows = data?.rows ?? [];
  const pagination = data?.pagination ?? {
    page,
    size,
    total: 0,
    totalPages: 1,
  };
  const currency = context.data?.current.currency || "ETB";
  const positions = context.data?.positions || [];
  const departments = context.data?.departments || [];
  const current = context.data?.current;
  const selectedPosition = positions.find((position) => position.id === targetPositionId);

  useEffect(() => {
    setPage(1);
  }, [search, status, requestKind, approvalStage, dateFrom, dateTo, size, scope]);

  useEffect(() => {
    const deepLinkId = queryRequestId();
    if (!deepLinkId || selectedRequest) return;
    const match = rows.find((request) => request.id === deepLinkId);
    if (match) setSelectedRequest(match);
  }, [rows, selectedRequest]);

  const requestedSalary = useMemo(() => {
    if (requestMode === "TITLE") return null;
    if (salaryInputMode === "NEW_SALARY") {
      const value = Number(newSalary);
      return Number.isFinite(value) && value > 0 ? value : null;
    }
    const currentSalary = Number(current?.salary || 0);
    const percentage = Number(increasePercent);
    if (currentSalary <= 0 || !Number.isFinite(percentage) || percentage <= 0) return null;
    return currentSalary * (1 + percentage / 100);
  }, [current?.salary, increasePercent, newSalary, requestMode, salaryInputMode]);

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
    const form = new FormData();
    form.append("moduleKey", "hr");
    form.append("file", attachment);
    const response = await api.post("/api/v1/files/upload", form);
    const file = response.data?.file || response.data?.data?.file;
    if (!file?.id) throw new Error("Attachment upload failed.");
    return `/api/v1/files/${file.id}/download`;
  };

  const submitRequest = async () => {
    const hasTitle = requestMode !== "SALARY";
    const hasSalary = requestMode !== "TITLE";

    if (hasTitle && titleInputMode === "POSITION" && !targetPositionId) {
      showAlert("Select a target position.", "error");
      return;
    }
    if (hasTitle && titleInputMode === "CUSTOM" && !customTitle.trim()) {
      showAlert("Enter the new title.", "error");
      return;
    }
    if (hasSalary && !requestedSalary) {
      showAlert("Enter a valid salary increase.", "error");
      return;
    }
    if (!reason.trim()) {
      showAlert("Reason is required.", "error");
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
        attachmentUrl,
        source: "SELF_SERVICE",
      });
      setCreateOpen(false);
      resetCreate();
      showAlert("Request submitted successfully.", "success");
    } catch (error: any) {
      showAlert(error?.response?.data?.message || error?.message || "Could not submit request.", "error");
    } finally {
      setUploading(false);
    }
  };

  const submitDecision = async () => {
    if (!selectedRequest || !decisionMode) return;
    try {
      if (decisionMode === "APPROVE") {
        await approveMutation.mutateAsync({
          id: selectedRequest.id,
          comment: decisionComment.trim() || undefined,
        });
        showAlert("Request approved and moved to the next stage.", "success");
      } else if (decisionMode === "REJECT") {
        if (!decisionComment.trim()) {
          showAlert("Rejection reason is required.", "error");
          return;
        }
        await rejectMutation.mutateAsync({
          id: selectedRequest.id,
          reason: decisionComment.trim(),
        });
        showAlert("Request rejected.", "info");
      } else {
        if (!decisionComment.trim() || Number(counterSalary) <= 0) {
          showAlert("Recommended salary and comment are required.", "error");
          return;
        }
        await counterMutation.mutateAsync({
          id: selectedRequest.id,
          recommendedSalary: Number(counterSalary),
          comment: decisionComment.trim(),
        });
        showAlert("Recommended salary saved and forwarded.", "success");
      }
      setDecisionMode(null);
      setDecisionComment("");
      setCounterSalary("");
      setSelectedRequest(null);
    } catch (error: any) {
      showAlert(error?.response?.data?.message || "Could not update the request.", "error");
    }
  };

  const decisionPending =
    approveMutation.isPending || rejectMutation.isPending || counterMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            {isMine ? "My Requests" : "Requests"}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {isMine
              ? "Your title and salary change requests."
              : "Review employment changes and approve requests assigned to you."}
          </p>
        </div>
        {isMine && (
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        )}
      </div>

      {scope === "visible" && (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search employee, title or reason"
              className="pl-9"
            />
          </div>
          <Select value={requestKind} onValueChange={setRequestKind}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="TITLE">Title</SelectItem>
              <SelectItem value="SALARY">Salary</SelectItem>
              <SelectItem value="COMBINED">Title + Salary</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approvalStage} onValueChange={setApprovalStage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="FINANCE">Finance</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.currentTarget.value)} />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.currentTarget.value)} />
        </div>
      )}

      {isMine && (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={requestKind} onValueChange={setRequestKind}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="TITLE">Title</SelectItem>
              <SelectItem value="SALARY">Salary</SelectItem>
              <SelectItem value="COMBINED">Title + Salary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Effective Date</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs font-semibold text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" /> Loading requests...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-xs font-semibold text-slate-400">
                    No requests found.
                  </td>
                </tr>
              ) : (
                rows.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800">{request.employee?.fullName || "Employee"}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{request.employee?.email || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{kindLabel(request)}</td>
                    <td className="max-w-[310px] px-4 py-3">
                      <p className="truncate text-xs font-medium text-slate-600" title={changeSummary(request, currency)}>
                        {changeSummary(request, currency)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{request.effectiveDate}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">{nice(request.approvalStage)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(request.status)}`}>
                        {nice(request.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {request.canApprove && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDecisionMode("APPROVE");
                            }}
                            className="h-8 gap-1 bg-emerald-600 px-2.5 text-[11px] hover:bg-emerald-700"
                          >
                            <Check className="h-3.5 w-3.5" /> Approve
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setSelectedRequest(request)} className="h-8 gap-1 px-2.5 text-[11px]">
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium text-slate-500">
            {pagination.total === 0
              ? "0 requests"
              : `${(pagination.page - 1) * pagination.size + 1}-${Math.min(
                  pagination.page * pagination.size,
                  pagination.total,
                )} of ${pagination.total}`}
          </p>
          <div className="flex items-center gap-2">
            <Select value={String(size)} onValueChange={(value) => setSize(Number(value))}>
              <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-16 text-center text-[11px] font-bold text-slate-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((value) => Math.min(pagination.totalPages, value + 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreate(); }}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>New Request</DialogTitle>
            <DialogDescription>Choose the type of employment change and submit it through the approval workflow.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1">
              {(["TITLE", "SALARY", "COMBINED"] as RequestMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setRequestMode(mode)}
                  className={`rounded-lg px-3 py-2.5 text-xs font-bold transition ${requestMode === mode ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
                >
                  {mode === "TITLE" ? "Title" : mode === "SALARY" ? "Salary" : "Title + Salary"}
                </button>
              ))}
            </div>

            {(requestMode === "TITLE" || requestMode === "COMBINED") && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={titleChangeType} onValueChange={(value) => setTitleChangeType(value as TitleChangeType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROMOTION">Promotion</SelectItem>
                      <SelectItem value="LATERAL_TITLE_CHANGE">Lateral Title Change</SelectItem>
                      <SelectItem value="DEMOTION">Demotion</SelectItem>
                      <SelectItem value="CORRECTION">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                    <button type="button" onClick={() => setTitleInputMode("POSITION")} className={`rounded-md px-2 py-1.5 text-[11px] font-bold ${titleInputMode === "POSITION" ? "bg-white shadow-sm" : "text-slate-500"}`}>Position</button>
                    <button type="button" onClick={() => setTitleInputMode("CUSTOM")} className={`rounded-md px-2 py-1.5 text-[11px] font-bold ${titleInputMode === "CUSTOM" ? "bg-white shadow-sm" : "text-slate-500"}`}>Free Text</button>
                  </div>
                </div>

                {titleInputMode === "POSITION" ? (
                  <Select value={targetPositionId} onValueChange={(value) => {
                    setTargetPositionId(value);
                    const position = positions.find((item) => item.id === value);
                    if (position?.departmentId) setTargetDepartmentId(position.departmentId);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select new position" /></SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => <SelectItem key={position.id} value={position.id}>{position.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={customTitle} onChange={(event) => setCustomTitle(event.currentTarget.value)} placeholder="New title" />
                    <Select value={targetDepartmentId || current?.departmentId || ""} onValueChange={setTargetDepartmentId}>
                      <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {(requestMode === "SALARY" || requestMode === "COMBINED") && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-bold text-slate-700">Current salary: {money(current?.salary, currency)}</p>
                  <div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                    <button type="button" onClick={() => setSalaryInputMode("NEW_SALARY")} className={`rounded-md px-2 py-1.5 text-[11px] font-bold ${salaryInputMode === "NEW_SALARY" ? "bg-white shadow-sm" : "text-slate-500"}`}>New Salary</button>
                    <button type="button" onClick={() => setSalaryInputMode("PERCENT")} disabled={!current?.salary} className={`rounded-md px-2 py-1.5 text-[11px] font-bold disabled:opacity-40 ${salaryInputMode === "PERCENT" ? "bg-white shadow-sm" : "text-slate-500"}`}>Increase %</button>
                  </div>
                </div>
                {salaryInputMode === "NEW_SALARY" ? (
                  <Input type="number" min="0" value={newSalary} onChange={(event) => setNewSalary(event.currentTarget.value)} placeholder="Requested new salary" />
                ) : (
                  <Input type="number" min="0" value={increasePercent} onChange={(event) => setIncreasePercent(event.currentTarget.value)} placeholder="Increase percentage" />
                )}
                {requestedSalary && (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                    New salary: {money(requestedSalary, currency)}
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">Effective Date</label>
                <Input type="date" value={effectiveDate} onChange={(event) => setEffectiveDate(event.currentTarget.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">Attachment (optional)</label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input px-3 text-xs font-semibold text-slate-600">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span className="min-w-0 flex-1 truncate">{attachment?.name || "Attach file"}</span>
                  {attachment && <X className="h-3.5 w-3.5 text-slate-400" />}
                  <input className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Reason</label>
              <Textarea rows={4} value={reason} onChange={(event) => setReason(event.currentTarget.value)} placeholder="Why are you requesting this change?" />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={() => void submitRequest()} disabled={createMutation.isPending || uploading} className="bg-blue-600 hover:bg-blue-700">
                {(createMutation.isPending || uploading) && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => { if (!open) { setSelectedRequest(null); setDecisionMode(null); setDecisionComment(""); setCounterSalary(""); } }}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle>{kindLabel(selectedRequest)}</DialogTitle>
                <DialogDescription>{selectedRequest.employee?.fullName || "Employee"} · {nice(selectedRequest.status)}</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400">Change</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-800">
                    {selectedRequest.targetTitle ? <>{selectedRequest.currentTitle || "Current title"}<ArrowRight className="h-3.5 w-3.5" />{selectedRequest.targetTitle}</> : changeSummary(selectedRequest, currency)}
                  </p>
                  {selectedRequest.targetTitle && selectedRequest.requestedSalary != null && (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">{money(selectedRequest.currentSalary, currency)} → {money(selectedRequest.finalSalary ?? selectedRequest.requestedSalary, currency)}</p>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3 text-xs"><span className="text-slate-400">Stage</span><p className="mt-1 font-bold text-slate-700">{nice(selectedRequest.approvalStage)}</p></div>
                  <div className="rounded-xl border border-slate-200 p-3 text-xs"><span className="text-slate-400">Effective</span><p className="mt-1 font-bold text-slate-700">{selectedRequest.effectiveDate}</p></div>
                </div>
                <div><p className="text-xs font-black text-slate-700">Reason</p><p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{selectedRequest.reason}</p></div>

                {selectedRequest.canApprove && !decisionMode && (
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <Button size="sm" onClick={() => setDecisionMode("APPROVE")} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
                    {selectedRequest.canCounter && <Button size="sm" variant="outline" onClick={() => { setCounterSalary(String(selectedRequest.finalSalary ?? selectedRequest.requestedSalary ?? "")); setDecisionMode("COUNTER"); }}>Counter Salary</Button>}
                    <Button size="sm" variant="outline" className="border-red-200 text-red-600" onClick={() => setDecisionMode("REJECT")}>Reject</Button>
                  </div>
                )}

                {decisionMode && (
                  <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                    {decisionMode === "COUNTER" && <Input type="number" min="0" value={counterSalary} onChange={(event) => setCounterSalary(event.currentTarget.value)} placeholder="Recommended salary" />}
                    <Textarea rows={3} value={decisionComment} onChange={(event) => setDecisionComment(event.currentTarget.value)} placeholder={decisionMode === "APPROVE" ? "Comment (optional)" : "Comment / reason"} />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setDecisionMode(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => void submitDecision()} disabled={decisionPending}>{decisionPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}Confirm</Button>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-black text-slate-700">History</p>
                  {history.isLoading ? <p className="text-xs text-slate-400">Loading history...</p> : (
                    <div className="space-y-2">
                      {(history.data || []).map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                          <p className="text-xs font-bold text-slate-700">{nice(item.action)}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">{item.actor?.fullName || "System"} · {new Date(item.createdAt).toLocaleString()}</p>
                          {item.comment && <p className="mt-1 text-[11px] text-slate-500">{item.comment}</p>}
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
    </div>
  );
}
