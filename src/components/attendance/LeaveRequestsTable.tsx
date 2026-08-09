import { useState } from "react";
import { ExternalLink, Eye, FileText, Loader2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, UserAvatar } from "@/components/ui/blih";
import { cn } from "@/lib/utils";

import { api } from "../../api/client";

import type { LeaveRequest } from "../../hooks/useLeave";

interface LeaveRequestsTableProps {
  requests: LeaveRequest[];
  isLoading?: boolean;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  showEmployee?: boolean;
  isApprover?: boolean;
  currentUserId: string;
  selectedRequest: LeaveRequest | null;
  onSelectRequest: (request: LeaveRequest | null) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  isApproving?: boolean;
  isCancelling?: boolean;
  embedded?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  dept_head: "Dept Head Review",
  admin: "HR Final Review",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCreatedAt(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isLegacyAnnualHalfDay(request: LeaveRequest) {
  return (request.template?.name ?? "")
    .toLowerCase()
    .replace(/\s/g, "") === "annual(halfday)";
}

function getTemplateName(request: LeaveRequest) {
  if (isLegacyAnnualHalfDay(request)) return "Annual Leave";
  return request.template?.name ?? request.leaveType;
}

function getDuration(request: LeaveRequest) {
  const type = isLegacyAnnualHalfDay(request)
    ? "HALF_DAY"
    : request.durationType ?? "FULL_DAY";
  const days = Number(request.requestedDays ?? request.totalDays ?? 0);

  if (type === "HALF_DAY") {
    const period = request.halfDayPeriod
      ? ` · ${request.halfDayPeriod.toLowerCase()}`
      : "";
    return `Half day${period}`;
  }

  return `${days} ${days === 1 ? "day" : "days"}`;
}

function getInternalFileId(evidenceUrl: string) {
  const match = evidenceUrl.match(/\/api(?:\/v1)?\/files\/([^/?#]+)\/download/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase",
        STATUS_CLASSES[status] ?? STATUS_CLASSES.cancelled,
      )}
    >
      {status}
    </span>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-bold text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}

function ApprovalItem({
  label,
  value,
  complete,
}: {
  label: string;
  value: string;
  complete: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
        complete
          ? "border-emerald-100 bg-emerald-50"
          : "border-slate-100 bg-slate-50",
      )}
    >
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="text-right text-[11px] font-bold text-slate-700">
        {value}
      </span>
    </div>
  );
}

export default function LeaveRequestsTable({
  requests,
  isLoading = false,
  title,
  subtitle,
  emptyMessage = "No leave requests found.",
  showEmployee = true,
  isApprover = false,
  currentUserId,
  selectedRequest,
  onSelectRequest,
  onApprove,
  onReject,
  onCancel,
  isApproving = false,
  isCancelling = false,
  embedded = false,
}: LeaveRequestsTableProps) {
  const [openingEvidenceUrl, setOpeningEvidenceUrl] = useState<string | null>(null);

  const openEvidenceAttachment = async (evidenceUrl: string) => {
    const fileId = getInternalFileId(evidenceUrl);

    if (!fileId) {
      window.open(evidenceUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setOpeningEvidenceUrl(evidenceUrl);
    try {
      const tokenResponse = await api.get(`/api/v1/files/${fileId}/token`);
      const token = tokenResponse.data?.token || tokenResponse.data?.data?.token;
      if (!token) throw new Error("Failed to get evidence download token");

      const baseUrl = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
      const signedUrl = `${baseUrl}/api/v1/files/${encodeURIComponent(fileId)}/download?token=${encodeURIComponent(token)}`;
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningEvidenceUrl(null);
    }
  };

  const columns = [
    ...(showEmployee ? ["Employee"] : []),
    "Leave Type",
    "Date Range",
    "Duration",
    "Reason",
    "Stage",
    "Status",
    "",
  ];

  const request = selectedRequest;
  const isOwnRequest = request?.employeeUserId === currentUserId;
  const isPending = request?.status === "pending";
  const firstApprover =
    request?.deptHeadApprover ?? request?.businessAdminApprover;
  const firstApproverLabel = request?.businessAdminApprover
    ? "Business Admin"
    : "Dept Head";
  const firstStageComplete = Boolean(firstApprover) ||
    request?.approvalStage === "admin" ||
    request?.approvalStage === "approved";
  const finalStageComplete = Boolean(request?.adminApprover) ||
    request?.approvalStage === "approved";

  return (
    <>
      <DataTable
        title={title}
        subtitle={subtitle}
        columns={columns}
        rows={requests}
        loading={isLoading}
        emptyMessage={emptyMessage}
        emptyIcon={<FileText />}
        renderRow={(row) => (
          <tr
            key={row.id}
            onClick={() => onSelectRequest(row)}
            className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50/80"
          >
            {showEmployee && (
              <td className="px-4 py-3">
                <div className="flex min-w-[180px] items-center gap-3">
                  <UserAvatar
                    name={row.employee?.fullName ?? "Employee"}
                    size="sm"
                    color="blue"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {row.employee?.fullName ?? "Employee"}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {row.employee?.email ?? "-"}
                    </p>
                  </div>
                </div>
              </td>
            )}

            <td className="px-4 py-3">
              <p className="whitespace-nowrap text-xs font-bold text-slate-700">
                {getTemplateName(row)}
              </p>
              <p className="mt-0.5 text-[9px] font-black uppercase text-blue-600">
                {row.leaveType}
              </p>
            </td>

            <td className="px-4 py-3">
              <p className="whitespace-nowrap text-[11px] font-semibold text-slate-700">
                {formatDate(row.startDate)}
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-slate-400">
                to {formatDate(row.endDate)}
              </p>
            </td>

            <td className="px-4 py-3">
              <span className="whitespace-nowrap text-[11px] font-black text-blue-600">
                {getDuration(row)}
              </span>
            </td>

            <td className="max-w-[260px] px-4 py-3">
              <p className="truncate text-[11px] font-medium text-slate-600">
                {row.reason || "-"}
              </p>
            </td>

            <td className="px-4 py-3">
              <span className="whitespace-nowrap text-[10px] font-bold text-slate-600">
                {STAGE_LABELS[row.approvalStage] ?? row.approvalStage}
              </span>
            </td>

            <td className="px-4 py-3">
              <StatusBadge status={row.status} />
            </td>

            <td className="px-4 py-3 text-right">
              <button
                type="button"
                aria-label="View leave request"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectRequest(row);
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
              >
                <Eye className="h-4 w-4" />
              </button>
            </td>
          </tr>
        )}
      />

      <Dialog
        open={Boolean(request)}
        onOpenChange={(open) => {
          if (!open) onSelectRequest(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {request && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4 pr-7">
                  <div>
                    <DialogTitle className="text-lg font-black text-slate-900">
                      Leave Request Details
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Submitted {formatCreatedAt(request.createdAt)}
                    </DialogDescription>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4">
                  <UserAvatar
                    name={request.employee?.fullName ?? "Employee"}
                    size="md"
                    color="blue"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">
                      {request.employee?.fullName ?? "Employee"}
                    </p>
                    <p className="truncate text-[11px] font-medium text-slate-400">
                      {request.employee?.email ?? "-"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <DetailItem label="Leave type" value={getTemplateName(request)} />
                  <DetailItem label="Duration" value={getDuration(request)} />
                  <DetailItem label="Start date" value={formatDate(request.startDate)} />
                  <DetailItem label="End date" value={formatDate(request.endDate)} />
                  <DetailItem
                    label="Approval stage"
                    value={STAGE_LABELS[request.approvalStage] ?? request.approvalStage}
                  />
                  <DetailItem
                    label="Requested days"
                    value={`${Number(request.requestedDays ?? request.totalDays ?? 0)} day(s)`}
                  />
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Reason
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-6 text-slate-700">
                    {request.reason || "No reason provided."}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Approval flow
                  </p>
                  <ApprovalItem
                    label={firstApproverLabel}
                    value={
                      firstApprover?.fullName ??
                      (firstStageComplete ? "Approved" : "Waiting")
                    }
                    complete={firstStageComplete}
                  />
                  <ApprovalItem
                    label="HR Final Approval"
                    value={
                      request.adminApprover?.fullName ??
                      (finalStageComplete
                        ? "Approved"
                        : request.approvalStage === "admin"
                          ? "Waiting"
                          : "Not reached")
                    }
                    complete={finalStageComplete}
                  />
                </div>

                {(request.evidenceUrl || request.evidenceNote || request.template?.requiresEvidence) && (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-blue-600" />
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Evidence
                      </p>
                    </div>
                    {request.evidenceUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={openingEvidenceUrl === request.evidenceUrl}
                        onClick={() => void openEvidenceAttachment(request.evidenceUrl!)}
                        className="mt-2 h-auto justify-start gap-2 px-0 py-1 text-xs font-bold text-blue-600 hover:bg-transparent hover:text-blue-700"
                      >
                        {openingEvidenceUrl === request.evidenceUrl ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ExternalLink className="h-3.5 w-3.5" />
                        )}
                        {openingEvidenceUrl === request.evidenceUrl
                          ? "Opening evidence..."
                          : "Open evidence attachment"}
                      </Button>
                    )}
                    {request.evidenceNote && (
                      <p className="mt-2 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-600">
                        {request.evidenceNote}
                      </p>
                    )}
                    {!request.evidenceUrl && !request.evidenceNote && (
                      <p className="mt-2 text-xs font-semibold text-amber-600">
                        No evidence attached yet.
                      </p>
                    )}
                  </div>
                )}

                {(request.rejectionReason || request.deptHeadComment || request.adminComment) && (
                  <div className="rounded-2xl border border-slate-100 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Review notes
                    </p>
                    {request.rejectionReason && (
                      <p className="mt-2 text-xs font-semibold text-red-600">
                        {request.rejectionReason}
                      </p>
                    )}
                    {request.deptHeadComment && (
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        Dept Head: {request.deptHeadComment}
                      </p>
                    )}
                    {request.adminComment && (
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        HR/Admin: {request.adminComment}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                {isApprover && isPending && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        onSelectRequest(null);
                        onReject(request.id);
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </Button>
                    <Button
                      disabled={isApproving}
                      onClick={() => onApprove(request.id)}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {isApproving ? "Approving..." : "Approve"}
                    </Button>
                  </>
                )}

                {isOwnRequest && isPending && !isApprover && (
                  <Button
                    variant="outline"
                    disabled={isCancelling}
                    onClick={() => onCancel(request.id)}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Request"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
