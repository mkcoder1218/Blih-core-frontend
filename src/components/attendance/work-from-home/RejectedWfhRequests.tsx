import { useState } from "react";

import { useAttendanceRequests } from "../../../hooks/useAttendanceRequests";

import type { WfhRequestCardData } from "./wfh.types";
import { toWfhCard } from "./wfh.utils";
import WfhRequestModal from "./WfhRequestModal";
import WfhRequestsTable from "./WfhRequestsTable";

export default function RejectedWfhRequests() {
  const [selectedRequest, setSelectedRequest] =
    useState<WfhRequestCardData | null>(null);

  const rejectedQuery = useAttendanceRequests({
    requestType: "work_from_home",
    status: "rejected",
    size: 100,
  });

  const requests = (rejectedQuery.data?.rows || []).map(
    toWfhCard,
  );

  return (
    <>
      <WfhRequestsTable
        title="Rejected WFH Requests"
        subtitle="View work-from-home requests that were rejected."
        requests={requests}
        isLoading={rejectedQuery.isLoading}
        emptyMessage="No rejected WFH requests."
        showEmployee
        onOpen={setSelectedRequest}
      />

      <WfhRequestModal
        request={selectedRequest}
        open={Boolean(selectedRequest)}
        onClose={() => setSelectedRequest(null)}
      />
    </>
  );
}
