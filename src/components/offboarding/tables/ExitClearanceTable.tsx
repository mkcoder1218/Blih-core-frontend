import { Eye } from "lucide-react";

import {
    formatExitDate,
    getExitModeLabel,
    getExitStatusClasses,
    getExitStatusLabel,
} from "../exit.utils";

interface ExitClearanceTableProps {
  exits: any[];
  onView: (exitProcess: any) => void;
}

function getEmployeeName(exitProcess: any): string {
  return (
    exitProcess.employee?.fullName ||
    exitProcess.employee?.email ||
    "Employee"
  );
}

function getDepartmentName(exitProcess: any): string {
  return (
    exitProcess.employee?.BusinessUserProfile
      ?.department?.name ||
    exitProcess.employee?.profile?.department?.name ||
    "-"
  );
}

function getCompletedStepCount(exitProcess: any): number {
  const steps = exitProcess.clearanceSteps ?? [];

  return steps.filter((step: any) =>
    ["completed", "waived"].includes(
      String(step.status),
    ),
  ).length;
}

export default function ExitClearanceTable({
  exits,
  onView,
}: ExitClearanceTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {[
                "Employee",
                "Exit type",
                "Final day",
                "Reason",
                "Clearance",
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
            {exits.map((exitProcess) => {
              const totalSteps =
                exitProcess.clearanceSteps?.length ?? 4;

              const completedSteps =
                getCompletedStepCount(exitProcess);

              return (
                <tr
                  key={exitProcess.id}
                  onClick={() => onView(exitProcess)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="whitespace-nowrap text-xs font-black text-slate-900">
                      {getEmployeeName(exitProcess)}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {getDepartmentName(exitProcess)}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700">
                    {getExitModeLabel(
                      exitProcess.exitMode,
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-slate-700">
                    {formatExitDate(
                      exitProcess.effectiveDate,
                    )}
                  </td>

                  <td className="max-w-[240px] px-4 py-3">
                    <p className="truncate text-xs text-slate-600">
                      {exitProcess.exitReasonNameSnapshot ||
                        exitProcess.reason ||
                        "-"}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: `${
                              totalSteps > 0
                                ? Math.round(
                                    (completedSteps /
                                      totalSteps) *
                                      100,
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <span className="text-[10px] font-black text-slate-500">
                        {completedSteps}/{totalSteps}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${getExitStatusClasses(
                        exitProcess.status,
                      )}`}
                    >
                      {getExitStatusLabel(
                        exitProcess.status,
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onView(exitProcess);
                      }}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                      aria-label="View clearance"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {exits.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-14 text-center"
                >
                  <p className="text-sm font-bold text-slate-700">
                    No exits ready for clearance
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Approved exit requests will appear here.
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