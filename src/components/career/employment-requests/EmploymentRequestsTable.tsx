import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { EmploymentChangeRequest } from "../../../api/employmentChanges";
import {
  useDeleteEmploymentChange,
  useEmploymentChangeContext,
  useEmploymentChangePage,
} from "../../../hooks/useEmploymentChanges";
import { Button } from "@/components/ui/button";
import {
  EmploymentRequestFilters,
  type EmploymentRequestFiltersValue,
} from "./EmploymentRequestFilters";
import { EmploymentRequestFormDialog } from "./EmploymentRequestFormDialog";
import { EmploymentRequestDetailsDialog } from "./EmploymentRequestDetailsDialog";
import { EmploymentRequestTable } from "./EmploymentRequestTable";
import {
  canOwnerDelete,
  canOwnerUpdate,
} from "./employmentRequest.utils";

type Props = {
  scope: "mine" | "visible";
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
};

type DecisionMode = "APPROVE" | "REJECT" | "COUNTER" | null;

const INITIAL_FILTERS: EmploymentRequestFiltersValue = {
  search: "",
  status: "ALL",
  requestKind: "ALL",
  approvalStage: "ALL",
  dateFrom: "",
  dateTo: "",
};

function queryRequestId() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(
    "employmentChangeRequestId",
  );
}

export default function EmploymentRequestsTable({ scope, showAlert }: Props) {
  const isMine = scope === "mine";
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] =
    useState<EmploymentChangeRequest | null>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<EmploymentChangeRequest | null>(null);
  const [initialDecision, setInitialDecision] =
    useState<DecisionMode>(null);

  const context = useEmploymentChangeContext();
  const deleteMutation = useDeleteEmploymentChange();

  const pageQuery = useEmploymentChangePage({
    scope,
    page,
    size,
    search:
      scope === "visible" && filters.search.trim()
        ? filters.search.trim()
        : undefined,
    status: filters.status !== "ALL" ? filters.status : undefined,
    requestKind:
      filters.requestKind !== "ALL" ? filters.requestKind : undefined,
    approvalStage:
      scope === "visible" && filters.approvalStage !== "ALL"
        ? filters.approvalStage
        : undefined,
    dateFrom:
      scope === "visible" && filters.dateFrom
        ? filters.dateFrom
        : undefined,
    dateTo:
      scope === "visible" && filters.dateTo ? filters.dateTo : undefined,
  });

  const rows = pageQuery.data?.rows || [];
  const pagination = pageQuery.data?.pagination || {
    page,
    size,
    total: 0,
    totalPages: 1,
  };
  const currency = context.data?.current.currency || "ETB";
  const currentUserId = context.data?.employee?.id || "";

  useEffect(() => {
    setPage(1);
  }, [filters, size, scope]);

  useEffect(() => {
    const deepLinkId = queryRequestId();
    if (!deepLinkId || selectedRequest) return;
    const match = rows.find((request) => request.id === deepLinkId);
    if (match) setSelectedRequest(match);
  }, [rows, selectedRequest]);

  const canUpdate = (request: EmploymentChangeRequest) =>
    isMine && canOwnerUpdate(request, currentUserId);

  const canDelete = (request: EmploymentChangeRequest) =>
    isMine && canOwnerDelete(request, currentUserId);

  const openCreate = () => {
    setEditingRequest(null);
    setFormOpen(true);
  };

  const openUpdate = (request: EmploymentChangeRequest) => {
    setSelectedRequest(null);
    setInitialDecision(null);
    setEditingRequest(request);
    setFormOpen(true);
  };

  const openDetails = (
    request: EmploymentChangeRequest,
    decision: DecisionMode = null,
  ) => {
    setEditingRequest(null);
    setInitialDecision(decision);
    setSelectedRequest(request);
  };

  const deleteRequest = async (request: EmploymentChangeRequest) => {
    if (!canDelete(request)) return;

    if (
      !window.confirm(
        "Delete this request? It will disappear from My Requests, while the deletion remains in the audit log.",
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(request.id);
      if (selectedRequest?.id === request.id) {
        setSelectedRequest(null);
      }
      showAlert("Request deleted successfully.", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          error?.message ||
          "Could not delete the request.",
        "error",
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">
            {isMine ? "My Requests" : "Requests"}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {isMine
              ? "Your title and salary change requests. Salary changes are shown using net pay."
              : "Review employment changes and approve requests assigned to you."}
          </p>
        </div>

        {isMine && (
          <Button
            onClick={openCreate}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        )}
      </div>

      <EmploymentRequestFilters
        scope={scope}
        value={filters}
        onChange={setFilters}
      />

      {pageQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {(pageQuery.error as any)?.response?.data?.message ||
            "Could not load career requests."}
        </div>
      )}

      <EmploymentRequestTable
        rows={rows}
        loading={pageQuery.isLoading}
        currency={currency}
        page={pagination.page}
        size={size}
        total={pagination.total}
        totalPages={pagination.totalPages}
        deletePending={deleteMutation.isPending}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onSizeChange={setSize}
        onPageChange={setPage}
        onView={(request) => openDetails(request)}
        onUpdate={openUpdate}
        onDelete={(request) => void deleteRequest(request)}
        onApprove={(request) => openDetails(request, "APPROVE")}
      />

      <EmploymentRequestFormDialog
        open={formOpen}
        request={editingRequest}
        context={context.data}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRequest(null);
        }}
        onSaved={() => {
          setEditingRequest(null);
          setSelectedRequest(null);
        }}
        showAlert={showAlert}
      />

      <EmploymentRequestDetailsDialog
        open={Boolean(selectedRequest)}
        request={selectedRequest}
        currency={currency}
        allowUpdate={Boolean(selectedRequest && canUpdate(selectedRequest))}
        allowDelete={Boolean(selectedRequest && canDelete(selectedRequest))}
        deletePending={deleteMutation.isPending}
        initialDecision={initialDecision}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setInitialDecision(null);
          }
        }}
        onEdit={openUpdate}
        onDelete={(request) => void deleteRequest(request)}
        showAlert={showAlert}
      />
    </div>
  );
}
