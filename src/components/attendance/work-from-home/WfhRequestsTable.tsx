import { Eye } from "lucide-react";

import {
    DataTable,
    UserAvatar,
} from "@/components/ui/blih";

import type { WfhRequestCardData } from "./wfh.types";
import {
    getWfhStatusClasses,
    getWfhStatusLabel,
} from "./wfh.utils";

interface WfhRequestsTableProps {
  title: string;
  subtitle?: string;
  requests: WfhRequestCardData[];
  isLoading?: boolean;
  emptyMessage?: string;
  showEmployee?: boolean;
  onOpen: (request: WfhRequestCardData) => void;
}

export default function WfhRequestsTable({
  title,
  subtitle,
  requests,
  isLoading = false,
  emptyMessage = "No WFH requests found.",
  showEmployee = true,
  onOpen,
}: WfhRequestsTableProps) {
  const columns = [
    ...(showEmployee ? ["Employee"] : []),
    "Type",
    "Date Range",
    "Duration",
    "Reason",
    "Status",
    "",
  ];

  return (
    <DataTable
      title={title}
      subtitle={subtitle}
      columns={columns}
      rows={requests}
      emptyMessage={
        isLoading ? "Loading requests..." : emptyMessage
      }
      renderRow={(request) => (
        <tr
          key={request.id}
          onClick={() => onOpen(request)}
          className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
        >
          {showEmployee && (
            <td className="px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  name={request.employee}
                  size="sm"
                  color="blue"
                />

                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {request.employee}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {request.department !== "-"
                      ? request.department
                      : request.role}
                  </p>
                </div>
              </div>
            </td>
          )}

          <td className="px-4 py-3">
            <span className="text-xs font-bold text-slate-700">
              {request.category}
            </span>
          </td>

          <td className="px-4 py-3">
            <p className="text-[11px] font-semibold text-slate-700">
              {request.from}
            </p>

            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              to {request.to}
            </p>
          </td>

          <td className="px-4 py-3">
            <span className="text-xs font-black text-blue-600">
              {request.duration}
            </span>
          </td>

          <td className="max-w-[260px] px-4 py-3">
            <p className="truncate text-[11px] font-medium text-slate-600">
              {request.reason}
            </p>
          </td>

          <td className="px-4 py-3">
            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${getWfhStatusClasses(
                request.status,
              )}`}
            >
              {getWfhStatusLabel(request.status)}
            </span>
          </td>

          <td className="px-4 py-3 text-right">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpen(request);
              }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
            >
              <Eye className="h-4 w-4" />
            </button>
          </td>
        </tr>
      )}
    />
  );
}