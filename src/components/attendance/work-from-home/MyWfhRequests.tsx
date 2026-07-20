import { useState } from "react";

import { useAttendanceRequests } from "../../../hooks/useAttendanceRequests";

import type { WfhRequestCardData } from "./wfh.types";
import { toWfhCard } from "./wfh.utils";
import WfhRequestModal from "./WfhRequestModal";
import WfhRequestsTable from "./WfhRequestsTable";

export default function MyWfhRequests() {
  const [selectedRequest, setSelectedRequest] =
    useState<WfhRequestCardData | null>(null);

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
        subtitle="Track your submitted requests."
        requests={requests}
        isLoading={mineQuery.isLoading}
        emptyMessage="No WFH requests yet."
        showEmployee={false}
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