import { useState } from "react";

import {
    useApproveAttendanceRequest,
    useAttendanceRequests,
    useRejectAttendanceRequest,
} from "../../../hooks/useAttendanceRequests";

import type {
    AlertProps,
    WfhRequestCardData,
} from "./wfh.types";
import { toWfhCard } from "./wfh.utils";
import WfhRequestModal from "./WfhRequestModal";
import WfhRequestsTable from "./WfhRequestsTable";

export default function PendingWfhRequests({
  showAlert,
}: AlertProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<WfhRequestCardData | null>(null);

  const pendingQuery = useAttendanceRequests({
    requestType: "work_from_home",
    status: "pending",
    size: 100,
  });

  const approveRequest =
    useApproveAttendanceRequest();

  const rejectRequest =
    useRejectAttendanceRequest();

  const requests = (
    pendingQuery.data?.rows || []
  ).map(toWfhCard);

  const isActionPending =
    approveRequest.isPending ||
    rejectRequest.isPending;

  const handleApprove = async (id: string) => {
    try {
      await approveRequest.mutateAsync(id);

      setSelectedRequest(null);

      showAlert(
        "WFH request approved successfully.",
        "success",
      );
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          "Failed to approve the request.",
        "error",
      );
    }
  };

  const handleReject = async (
    id: string,
    reason: string,
  ) => {
    try {
      await rejectRequest.mutateAsync({
        id,
        reason,
      });

      setSelectedRequest(null);

      showAlert(
        "WFH request rejected successfully.",
        "info",
      );
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          "Failed to reject the request.",
        "error",
      );
    }
  };

  return (
    <>
      <WfhRequestsTable
        title="Pending WFH Approvals"
        subtitle="Review employee work-from-home requests."
        requests={requests}
        isLoading={pendingQuery.isLoading}
        emptyMessage="No pending WFH requests."
        showEmployee
        onOpen={setSelectedRequest}
      />

      <WfhRequestModal
        request={selectedRequest}
        open={Boolean(selectedRequest)}
        showManagerActions
        isActionPending={isActionPending}
        onClose={() => setSelectedRequest(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}