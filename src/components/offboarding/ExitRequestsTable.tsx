import {
  Eye,
} from "lucide-react";

import {
  DataTable,
  UserAvatar,
} from "@/components/ui/blih";

import type {
  ExitRequestRow,
} from "./exit.types";

import {
  getExitModeLabel,
  getExitStatusClasses,
  getExitStatusLabel,
} from "./exit.utils";

interface ExitRequestsTableProps {
  rows: ExitRequestRow[];

  isLoading?: boolean;
  showEmployee?: boolean;

  onOpen: (
    row: ExitRequestRow,
  ) => void;
}

export default function ExitRequestsTable({
  rows,
  isLoading = false,
  showEmployee = true,
  onOpen,
}: ExitRequestsTableProps) {
  const columns = [
    ...(showEmployee
      ? ["Employee"]
      : []),

    "Initiated By",
    "Exit Type",
    "Notice",
    "Final Day",
    "Reason",
    "Status",
    "",
  ];

  return (
    <DataTable
      title="Exit Requests"
      subtitle={`${rows.length} request${
        rows.length === 1 ? "" : "s"
      }`}
      columns={columns}
      rows={rows}
      loading={isLoading}
      emptyMessage="No exit requests found."
      renderRow={(row) => (
        <tr
          key={row.id}
          onClick={() => onOpen(row)}
          className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
        >
          {showEmployee && (
            <td className="px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  name={
                    row.employeeName
                  }
                  size="sm"
                  color="blue"
                />

                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {row.employeeName}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {row.department !==
                    "-"
                      ? row.department
                      : row.position}
                  </p>
                </div>
              </div>
            </td>
          )}

          <td className="px-4 py-3">
            <span className="text-xs font-bold capitalize text-slate-700">
              {row.initiatedBy}
            </span>
          </td>

          <td className="px-4 py-3">
            <span className="text-xs font-bold text-slate-700">
              {getExitModeLabel(
                row.mode,
              )}
            </span>
          </td>

          <td className="px-4 py-3">
            <span className="text-xs font-black text-blue-600">
              {row.noticeDays} day
              {row.noticeDays === 1
                ? ""
                : "s"}
            </span>
          </td>

          <td className="whitespace-nowrap px-4 py-3">
            <span className="text-[11px] font-semibold text-slate-700">
              {row.effectiveDate}
            </span>
          </td>

          <td className="max-w-[220px] px-4 py-3">
            <p className="truncate text-[11px] font-medium text-slate-600">
              {row.reason}
            </p>
          </td>

          <td className="px-4 py-3">
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${getExitStatusClasses(
                row.status,
              )}`}
            >
              {getExitStatusLabel(
                row.status,
              )}
            </span>
          </td>

          <td className="px-4 py-3 text-right">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen(row);
              }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
              aria-label="Open exit request"
            >
              <Eye className="h-4 w-4" />
            </button>
          </td>
        </tr>
      )}
    />
  );
}
