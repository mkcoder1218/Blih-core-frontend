import { useState } from "react";

import type { AttendanceRequest } from "../../../hooks/useAttendanceRequests";
import { useAttendanceRequests } from "../../../hooks/useAttendanceRequests";

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

  const mineQuery = useAttendanceRequests({
    requestType: "work_from_home",
    mine: true,
    size: 100,
  });

  const requests = (mineQuery.data?.rows || []).map(
    toWfhCard,
  );

  return (
    <>
      <WfhRequestsTable
        title="My WFH Requests"
        subtitle="Track your submitted requests. Pending requests can be edited before approval."
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
    </>
  );
}
