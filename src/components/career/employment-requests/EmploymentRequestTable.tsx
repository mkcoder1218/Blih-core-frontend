import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { EmploymentChangeRequest } from "../../../api/employmentChanges";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeSummary,
  kindLabel,
  nice,
  statusClass,
} from "./employmentRequest.utils";

const labelClass =
  "mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400";

type Props = {
  rows: EmploymentChangeRequest[];
  loading: boolean;
  currency: string;
  page: number;
  size: number;
  total: number;
  totalPages: number;
  deletePending: boolean;
  canUpdate: (request: EmploymentChangeRequest) => boolean;
  canDelete: (request: EmploymentChangeRequest) => boolean;
  onSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onView: (request: EmploymentChangeRequest) => void;
  onUpdate: (request: EmploymentChangeRequest) => void;
  onDelete: (request: EmploymentChangeRequest) => void;
  onApprove: (request: EmploymentChangeRequest) => void;
};

export function EmploymentRequestTable({
  rows,
  loading,
  currency,
  page,
  size,
  total,
  totalPages,
  deletePending,
  canUpdate,
  canDelete,
  onSizeChange,
  onPageChange,
  onView,
  onUpdate,
  onDelete,
  onApprove,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Request</th>
              <th className="px-4 py-3">Change</th>
              <th className="px-4 py-3">Effective Date</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-xs font-semibold text-slate-400"
                >
                  <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                  Loading requests...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-xs font-semibold text-slate-400"
                >
                  No requests found.
                </td>
              </tr>
            ) : (
              rows.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="text-xs font-bold text-slate-800">
                      {request.employee?.fullName || "Employee"}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {request.employee?.email || ""}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-xs font-bold text-slate-700">
                    {kindLabel(request)}
                  </td>

                  <td className="max-w-[340px] px-4 py-3">
                    <p
                      className="truncate text-xs font-medium text-slate-600"
                      title={changeSummary(request, currency)}
                    >
                      {changeSummary(request, currency)}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                    {request.effectiveDate}
                  </td>

                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                    {nice(request.approvalStage)}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(
                        request.status,
                      )}`}
                    >
                      {nice(request.status)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {request.canApprove && (
                        <Button
                          size="sm"
                          onClick={() => onApprove(request)}
                          className="h-8 gap-1 bg-emerald-600 px-2.5 text-[11px] hover:bg-emerald-700"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </Button>
                      )}

                      {canUpdate(request) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdate(request)}
                          className="h-8 gap-1 border-blue-200 px-2.5 text-[11px] text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Update
                        </Button>
                      )}

                      {canDelete(request) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deletePending}
                          onClick={() => onDelete(request)}
                          className="h-8 gap-1 border-red-200 px-2.5 text-[11px] text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView(request)}
                        className="h-8 gap-1 px-2.5 text-[11px]"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="pb-2 text-[11px] font-medium text-slate-500 sm:pb-0">
          {total === 0
            ? "0 requests"
            : `${(page - 1) * size + 1}-${Math.min(page * size, total)} of ${total}`}
        </p>

        <div className="flex items-end gap-2">
          <div>
            <label className={labelClass}>Rows per page</label>
            <Select
              value={String(size)}
              onValueChange={(value) => onSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-20 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="min-w-16 pb-2 text-center text-[11px] font-bold text-slate-600">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
