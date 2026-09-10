import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/blih";
import type { AttendanceRequest } from "../../../hooks/useAttendanceRequests";
import {
  useAttendanceRequests,
  useCancelWorkFromHomeRequest,
} from "../../../hooks/useAttendanceRequests";

import type {
  AlertProps,
  WfhRequestCardData,
} from "./wfh.types";
import { toWfhCard } from "./wfh.utils";
import WfhRequestForm from "./WfhRequestForm";
import WfhRequestModal from "./WfhRequestModal";
import WfhRequestsTable from "./WfhRequestsTable";

export default function MyWfhRequests({
  showAlert,
}: AlertProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<WfhRequestCardData | null>(null);
  const [editingRequest, setEditingRequest] =
    useState<AttendanceRequest | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<WfhRequestCardData | null>(null);

  const mineQuery = useAttendanceRequests({
    requestType: "work_from_home",
    mine: true,
    size: 100,
  });

  const cancelRequest = useCancelWorkFromHomeRequest();

  const requests = (mineQuery.data?.rows || [])
    .filter((request) => request.status !== "cancelled")
    .map(toWfhCard);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await cancelRequest.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedRequest((current) =>
        current?.id === deleteTarget.id ? null : current,
      );
      setEditingRequest((current) =>
        current?.id === deleteTarget.id ? null : current,
      );
      showAlert("WFH request deleted successfully.", "success");
    } catch (error: any) {
      showAlert(
        error?.response?.data?.message ||
          "Failed to delete the WFH request.",
        "error",
      );
    }
  };

  return (
    <>
      <WfhRequestsTable
        title="My WFH Requests"
        subtitle="Track your submitted requests. Pending requests can be edited or deleted before approval."
        requests={requests}
        isLoading={mineQuery.isLoading}
        emptyMessage="No WFH requests yet."
        showEmployee={false}
        onOpen={setSelectedRequest}
        onEdit={(request) => {
          if (request.status !== "pending") return;
          setSelectedRequest(null);
          setEditingRequest(request.raw);
        }}
        onDelete={(request) => {
          if (request.status !== "pending") return;
          setDeleteTarget(request);
        }}
      />

      <WfhRequestModal
        request={selectedRequest}
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
      />

      <WfhRequestForm
        open={Boolean(editingRequest)}
        editingRequest={editingRequest}
        onClose={() => setEditingRequest(null)}
        showAlert={showAlert}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!cancelRequest.isPending) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDelete();
        }}
        title="Delete WFH request?"
        description="This pending request will be removed from your request list. Approved or rejected requests cannot be deleted."
        confirmLabel="Delete request"
        variant="destructive"
        loading={cancelRequest.isPending}
      />
    </>
  );
}
