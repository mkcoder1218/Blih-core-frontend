import {
    Eye,
} from "lucide-react";

import {
    formatExitDate,
    getExitModeLabel,
    getExitStatusClasses,
    getExitStatusLabel,
} from "../exit.utils";

interface ExitRequestsTableProps {
  requests: any[];

  onView: (
    request: any,
  ) => void;
}

function employeeName(
  request: any,
): string {
  return (
    request.employee?.fullName ||
    request.employee?.email ||
    request.employeeName ||
    "Employee"
  );
}

function departmentName(
  request: any,
): string {
  return (
    request.employee
      ?.BusinessUserProfile
      ?.department?.name ||
    request.employee?.profile
      ?.department?.name ||
    request.department?.name ||
    "-"
  );
}

export default function ExitRequestsTable({
  requests,
  onView,
}: ExitRequestsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {[
                "Employee",
                "Initiator",
                "Exit type",
                "Notice",
                "Final day",
                "Reason",
                "Status",
                "",
              ].map((heading) => (
                <th
                  key={heading}
                  className="whitespace-nowrap px-4 py-3 text-left text-[9px] font-black uppercase tracking-wide text-slate-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {requests.map(
              (request) => (
                <tr
                  key={request.id}
                  onClick={() =>
                    onView(request)
                  }
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap text-xs font-black text-slate-900">
                      {employeeName(
                        request,
                      )}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {departmentName(
                        request,
                      )}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold capitalize text-slate-700">
                    {request.initiatedByType ||
                      (request.exitType ===
                      "resignation"
                        ? "employee"
                        : "employer")}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700">
                    {getExitModeLabel(
                      request.exitMode,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-700">
                    {request.noticePeriodDays ??
                      30}{" "}
                    days
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700">
                    {formatExitDate(
                      request.effectiveDate,
                    )}
                  </td>

                  <td className="max-w-[230px] px-4 py-3">
                    <p className="truncate text-xs text-slate-600">
                      {request.exitReasonNameSnapshot ||
                        request.reason ||
                        "-"}
                    </p>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${getExitStatusClasses(
                        request.status,
                      )}`}
                    >
                      {getExitStatusLabel(
                        request.status,
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(
                        event,
                      ) => {
                        event.stopPropagation();
                        onView(
                          request,
                        );
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ),
            )}

            {requests.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-14 text-center"
                >
                  <p className="text-sm font-bold text-slate-700">
                    No exit requests found
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Submitted exit requests will appear here.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}