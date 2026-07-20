/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

import { useAttendanceRequests } from "../../hooks/useAttendanceRequests";
import MyWfhRequests from "./work-from-home/MyWfhRequests";
import PendingWfhRequests from "./work-from-home/PendingWfhRequests";
import WfhRequestForm from "./work-from-home/WfhRequestForm";
import WfhStats from "./work-from-home/WfhStats";
import { useState } from "react";
import { Plus } from "lucide-react";
interface AttendanceWfhTabProps {
  showAlert: (
    message: string,
    type?: "success" | "info" | "error"
  ) => void;
}

export default function AttendanceWfhTab({
  showAlert,
}: AttendanceWfhTabProps) {
  const [showRequestModal, setShowRequestModal] =
    useState(false);
  const mineQuery = useAttendanceRequests({
    requestType: "work_from_home",
    mine: true,
    size: 1,
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

  return (
    <motion.div
      key="work-from-home"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      <WfhStats
        myTotal={mineQuery.data?.total || 0}
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
          <h2 className="text-sm font-black text-slate-950">
            Work From Home
          </h2>

          <p className="mt-1 text-[11px] font-semibold text-slate-500">
            Submit and track work-from-home requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New WFH Request
        </button>
      </div>

      <MyWfhRequests />

      <WfhRequestForm
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        showAlert={showAlert}
      />

      <PendingWfhRequests showAlert={showAlert} />

    </motion.div>
  );
}
