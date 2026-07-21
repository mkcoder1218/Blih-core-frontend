import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Clock, FileText, Inbox } from "lucide-react";
import {
  useAllLeaveRequests,
  useApproveLeave,
  useCancelLeave,
  useLeaveTemplates,
  useMyLeaveBalances,
  useMyLeaveRequests,
  usePendingLeaveRequests,
  type LeaveRequest,
} from "../../hooks/useLeave";
import { useLegacyUser } from "../../api/legacyUserStore";
import { useMyPermissions } from "../../hooks/usePermissions";
import { useMe } from "../../hooks/useMe";
import { KpiCard } from "../recruitment/RecruitmentRequestParts";
import LeaveRequestsTable from "./LeaveRequestsTable";
import { LeaveTabs, type LeaveTabId } from "./leave/LeaveTabs";
import { SubmitModal } from "./leave/SubmitLeaveRequestDialog";
import { RejectModal } from "./leave/RejectLeaveDialog";
import { TemplatesPanel } from "./leave/LeaveTemplatesPanel";
import { LeavePageHeader } from "./leave/LeavePageHeader";
import { LeaveTablePagination } from "./leave/LeaveTablePagination";

interface LeavePageProps {
  showAlert: (message: string, type?: "success" | "error" | "warning" | "info") => void;
}

const PAGE_SIZE = 10;

export default function LeavePage({ showAlert }: LeavePageProps) {
  const legacyUser = useLegacyUser();
  const permissions = useMyPermissions();
  const { data: meResponse } = useMe();
  const currentRoles = new Set((meResponse?.data?.roles || []).map((role) => role.toUpperCase()));
  const legacyRole = legacyUser?.role || "Employee";
  const legacyIsHrAdmin = ["HR Manager", "Business Admin", "Super Admin"].includes(legacyRole);
  const legacyIsDeptHead = legacyRole === "Department Head";
  const isHrAdmin =
    legacyIsHrAdmin ||
    permissions.hasAny("leave.read", "leave.approve") ||
    currentRoles.has("HR_MANAGER") ||
    currentRoles.has("BUSINESS_ADMIN");
  const isApprover =
    isHrAdmin ||
    legacyIsDeptHead ||
    permissions.hasAny("self_department_leave_read", "self_department_leave_manage") ||
    currentRoles.has("DEPARTMENT_HEAD") ||
    currentRoles.has("DEPT_HEAD");
  const canViewSentRequests = isHrAdmin || isApprover;
  const currentUserId = meResponse?.data?.user?.id ?? (legacyUser as { id?: string } | null)?.id ?? "";

  const [view, setView] = useState<LeaveTabId>("my");
  const [page, setPage] = useState(1);
  const [showSubmit, setShowSubmit] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const approve = useApproveLeave();
  const cancel = useCancelLeave();
  const myQuery = useMyLeaveRequests({ page, size: PAGE_SIZE });
  const pendingQuery = usePendingLeaveRequests({ page, size: PAGE_SIZE });
  const allQuery = useAllLeaveRequests({ page, size: PAGE_SIZE });
  const myPendingCountQuery = useMyLeaveRequests({ page: 1, size: 1, status: "pending" });
  const myApprovedCountQuery = useMyLeaveRequests({ page: 1, size: 1, status: "approved" });
  const balancesQuery = useMyLeaveBalances();
  const activeTemplatesQuery = useLeaveTemplates(true);

  const activeQuery =
    view === "my" ? myQuery : view === "on-request" ? pendingQuery : view === "sent" ? allQuery : myQuery;
  const rows = activeQuery.data?.rows ?? [];
  const backendPage = activeQuery.data?.page ?? page;
  const backendSize = activeQuery.data?.size ?? PAGE_SIZE;
  const totalPages = activeQuery.data?.totalPages ?? 1;
  const total = activeQuery.data?.total ?? 0;
  const pendingCount = pendingQuery.data?.total ?? 0;
  const myPendingCount = myPendingCountQuery.data?.total ?? 0;
  const approvedCount = myApprovedCountQuery.data?.total ?? 0;

  const annualTemplate = (activeTemplatesQuery.data ?? []).find(
    (template) => template.leaveType === "annual" || template.name.toLowerCase().trim() === "annual leave",
  );
  const annualBalance = (balancesQuery.data ?? []).find(
    (balance) => balance.leaveType === (annualTemplate?.leaveType || "annual"),
  );
  const annualRemaining = annualBalance?.remainingDays ?? annualTemplate?.totalDays ?? 0;

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(totalPages, 1));
  }, [page, totalPages]);

  const changeView = (nextView: LeaveTabId) => {
    setView(nextView);
    setPage(1);
  };

  const handleApprove = async (id: string) => {
    try {
      await approve.mutateAsync({ id });
      showAlert("Leave request approved and moved to the next stage", "success");
    } catch (error: any) {
      showAlert(error?.response?.data?.message || error?.message || "Failed to approve", "error");
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancel.mutateAsync(id);
      showAlert("Leave request cancelled", "info");
    } catch (error: any) {
      showAlert(error?.response?.data?.message || error?.message || "Failed to cancel", "error");
    }
  };

  if (view === "templates") {
    return (
      <div className="space-y-5">
        <LeavePageHeader
          canManageTemplates={isHrAdmin}
          canCreateRequest={false}
          isRefreshing={activeTemplatesQuery.isFetching}
          onCreateRequest={() => undefined}
          onManageTemplates={() => undefined}
          onRefresh={() => activeTemplatesQuery.refetch()}
        />
        <LeaveTabs
          view={view}
          setView={changeView}
          isHrAdmin={isHrAdmin}
          isApprover={isApprover}
          canViewSentRequests={canViewSentRequests}
          pendingCount={pendingCount}
        />
        <TemplatesPanel showAlert={showAlert} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <LeavePageHeader
        canManageTemplates={isHrAdmin}
        canCreateRequest={view === "my"}
        isRefreshing={activeQuery.isFetching}
        onCreateRequest={() => setShowSubmit(true)}
        onManageTemplates={() => changeView("templates")}
        onRefresh={() => activeQuery.refetch()}
      />

      {view === "my" && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Total Requests"
            value={myQuery.data?.total ?? 0}
            icon={FileText}
            trend="All submitted requests"
          />
          <KpiCard label="Pending" value={myPendingCount} icon={Clock} trend="Waiting for approval" />
          <KpiCard label="Approved" value={approvedCount} icon={CheckCircle2} trend="Approved requests" />
          <KpiCard label="Annual Remaining" value={`${annualRemaining}d`} icon={Calendar} trend="Available annual leave" />
        </div>
      )}

      <LeaveTabs
        view={view}
        setView={changeView}
        isHrAdmin={isHrAdmin}
        isApprover={isApprover}
        canViewSentRequests={canViewSentRequests}
        pendingCount={pendingCount}
      />

      {view === "on-request" && pendingQuery.data?.stage && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <Inbox className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-700">
            Awaiting your approval at: {String(pendingQuery.data.stage).replace("_", " ")}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <LeaveRequestsTable
          title={
            view === "my"
              ? "My Leave Requests"
              : view === "on-request"
                ? "Requests Awaiting My Approval"
                : "All Leave Requests"
          }
          subtitle={`${total} request${total === 1 ? "" : "s"}`}
          requests={rows}
          isLoading={activeQuery.isLoading}
          emptyMessage={view === "on-request" ? "No requests awaiting your approval." : "No leave requests found."}
          showEmployee={view !== "my"}
          isApprover={view === "on-request"}
          currentUserId={currentUserId}
          selectedRequest={selectedRequest}
          onSelectRequest={setSelectedRequest}
          onApprove={handleApprove}
          onReject={setRejectId}
          onCancel={handleCancel}
          isApproving={approve.isPending}
          isCancelling={cancel.isPending}
          embedded
        />
        <LeaveTablePagination
          page={backendPage}
          size={backendSize}
          total={total}
          totalPages={totalPages}
          isFetching={activeQuery.isFetching}
          onPageChange={setPage}
        />
      </div>

      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} showAlert={showAlert} />}
      {rejectId && <RejectModal requestId={rejectId} onClose={() => setRejectId(null)} showAlert={showAlert} />}
    </div>
  );
}
