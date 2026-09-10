/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import { TabSwitcher } from "@/components/ui/blih";
import { useAttendanceRequests } from "../../hooks/useAttendanceRequests";
import MyWfhRequests from "./work-from-home/MyWfhRequests";
import PendingWfhRequests from "./work-from-home/PendingWfhRequests";
import RejectedWfhRequests from "./work-from-home/RejectedWfhRequests";
import WfhRequestForm from "./work-from-home/WfhRequestForm";
import WfhStats from "./work-from-home/WfhStats";

interface AttendanceWfhTabProps {
  showAlert: (
    message: string,
    type?: "success" | "info" | "error",
  ) => void;
}

type ApprovalTab = "pending" | "rejected";

export default function AttendanceWfhTab({
  showAlert,
}: AttendanceWfhTabProps) {
  const [showRequestModal, setShowRequestModal] =
    useState(false);
  const [approvalTab, setApprovalTab] =
    useState<ApprovalTab>("pending");

  const mineQuery = useAttendanceRequests({
    requestType: "work_from_home",
    mine: true,
    size: 100,
  });

  const pendingQuery = useAttendanceRequests({
    requestType: "work_from_home",
    status: "pending",
    size: 1,
  });

  const allQuery = useAttendanceRequests({
    requestType: "work_from_home",
    size: 1,
  });

  const myActiveTotal = (mineQuery.data?.rows || []).filter(
    (request) => request.status !== "cancelled",
  ).length;

  return (
    <motion.div
      key="work-from-home"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <WfhStats
        myTotal={myActiveTotal}
        pendingTotal={pendingQuery.data?.total || 0}
        totalRequests={allQuery.data?.total || 0}
        isLoading={
          mineQuery.isLoading ||
          pendingQuery.isLoading ||
          allQuery.isLoading
        }
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-foreground">
            Work From Home
          </h2>

          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
            Submit and track work-from-home requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New WFH Request
        </button>
      </div>

      <MyWfhRequests showAlert={showAlert} />

      <WfhRequestForm
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        showAlert={showAlert}
      />

      <div className="space-y-3">
        <TabSwitcher
          tabs={[
            { id: "pending", label: "Pending requests" },
            { id: "rejected", label: "Rejected requests" },
          ]}
          active={approvalTab}
          onChange={(id) => setApprovalTab(id as ApprovalTab)}
          size="sm"
        />

        {approvalTab === "pending" ? (
          <PendingWfhRequests showAlert={showAlert} />
        ) : (
          <RejectedWfhRequests />
        )}
      </div>
    </motion.div>
  );
}
