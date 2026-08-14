import { Eye, Pencil } from "lucide-react";

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
  onEdit?: (request: WfhRequestCardData) => void;
}

export default function WfhRequestsTable({
  title,
  subtitle,
  requests,
  isLoading = false,
  emptyMessage = "No WFH requests found.",
  showEmployee = true,
  onOpen,
  onEdit,
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
          className="cursor-pointer border-b border-border transition-colors hover:bg-muted/45"
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
                  <p className="truncate text-xs font-bold text-foreground">
                    {request.employee}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {request.department !== "-"
                      ? request.department
                      : request.role}
                  </p>
                </div>
              </div>
            </td>
          )}

          <td className="px-4 py-3">
            <span className="text-xs font-bold text-foreground">
              {request.category}
            </span>
          </td>

          <td className="px-4 py-3">
            <p className="text-[11px] font-semibold text-foreground">
              {request.from}
            </p>

            <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
              to {request.to}
            </p>
          </td>

          <td className="px-4 py-3">
            <span className="text-xs font-black text-blue-600 dark:text-blue-400">
              {request.duration}
            </span>
          </td>

          <td className="max-w-[260px] px-4 py-3">
            <p className="truncate text-[11px] font-medium text-muted-foreground">
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
            <div className="flex items-center justify-end gap-1">
              {!showEmployee &&
              request.status === "pending" &&
              onEdit ? (
                <button
                  type="button"
                  aria-label="Edit pending work-from-home request"
                  title="Edit request"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(request);
                  }}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              ) : null}

              <button
                type="button"
                aria-label="View work-from-home request"
                title="View request"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(request);
                }}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      )}
    />
  );
}
