import React from "react";
import { AlertCircle, Clock3, FileText } from "lucide-react";
import type { LeaveBalance, LeavePage } from "./types";
import { display, formatDate, statusClass } from "./utils";
import { EmptyState, Pagination } from "./ProfileCommon";

interface MyProfileLeaveProps {
  data?: LeavePage;
  balances: LeaveBalance[];
  loading: boolean;
  balancesLoading: boolean;
  error: any;
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function MyProfileLeave({
  data,
  balances,
  loading,
  balancesLoading,
  error,
  page,
  pages,
  onPageChange,
}: MyProfileLeaveProps) {
  const rows = data?.rows || [];
  const remainingLeave = balances.reduce(
    (total, item) => total + Number(item.remainingDays || 0),
    0,
  );
  const usedLeave = balances.reduce(
    (total, item) => total + Number(item.usedDays || 0),
    0,
  );

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-sm font-extrabold text-foreground">Leave requests</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Your leave balances and request history from the Leave module.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Remaining", remainingLeave, "days"],
          ["Used", usedLeave, "days"],
          ["Total Requests", data?.total || 0, "requests"],
          ["Leave Types", balances.length, "balances"],
        ].map(([label, value, suffix]) => (
          <div key={label} className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-xl font-extrabold text-foreground">{value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{suffix}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        {loading || balancesLoading ? (
          <EmptyState
            icon={Clock3}
            title="Loading leave data"
            description="Fetching your leave requests and balances."
          />
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Leave unavailable"
            description={
              error?.response?.data?.message ||
              error?.message ||
              "Could not load leave requests."
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No leave requests"
            description="Requests you submit from the Leave module will appear here."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-muted/50">
                  <tr className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    <th className="px-4 py-3">Leave</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Days</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((request) => {
                    const status = String(request.status || "pending");
                    const days = request.requestedDays ?? request.totalDays ?? "-";
                    return (
                      <tr key={request.id} className="border-t border-border text-xs">
                        <td className="px-4 py-3.5 font-semibold text-foreground">
                          {request.template?.name || request.leaveType || "Leave"}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatDate(request.startDate)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {formatDate(request.endDate)}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {display(days)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusClass(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                        <td
                          className="max-w-[260px] truncate px-4 py-3.5 text-muted-foreground"
                          title={request.reason || ""}
                        >
                          {display(request.reason)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onPageChange={onPageChange} />
          </>
        )}
      </div>
    </div>
  );
}
