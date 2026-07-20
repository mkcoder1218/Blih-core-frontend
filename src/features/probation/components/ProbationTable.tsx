import { Button } from "@/components/ui/button";
import { DataTable, StatusBadge, UserAvatar } from "@/components/ui/blih";
import type { ProbationDashboardRow } from "../types";
import { formatProbationDate, getProbationStatusTone } from "../utils";
import { ProbationScore } from "./ProbationScore";

interface ProbationTableProps {
  rows: ProbationDashboardRow[];
  loading: boolean;
  fetching: boolean;
  onOpenDetails: (row: ProbationDashboardRow) => void;
}

export function ProbationTable({ rows, loading, fetching, onOpenDetails }: ProbationTableProps) {
  return (
    <DataTable
      title="Employees on Probation"
      subtitle={`${rows.length} employee records`}
      columns={["Employee", "Probation period", "Days remaining", "Punctuality", "Final score", "Status", "Action"]}
      rows={rows}
      loading={loading}
      emptyMessage="No probation employees match the current filters."
      className="[&_table]:min-w-[1050px]"
      headerAction={fetching && !loading ? <span className="text-xs font-bold text-slate-400">Refreshing…</span> : undefined}
      renderRow={(row) => (
        <tr key={row.employeeId} className="border-b border-slate-100 hover:bg-slate-50/70">
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={row.employeeName} color="blue" />
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-slate-900">{row.employeeName}</p>
                <p className="truncate text-[11px] font-semibold text-slate-400">
                  {row.department?.name || "Unassigned"} · {row.position?.title || "No position"}
                </p>
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-xs font-bold text-slate-600">
            {formatProbationDate(row.probationStartDate)} to {formatProbationDate(row.probationEndDate)}
          </td>
          <td className="px-4 py-3 text-xs font-black text-slate-800">{row.countdownLabel}</td>
          <td className="px-4 py-3"><ProbationScore value={row.punctualityScore} /></td>
          <td className="px-4 py-3"><ProbationScore value={row.finalScore} emphasized /></td>
          <td className="px-4 py-3">
            <StatusBadge label={row.status} tone={getProbationStatusTone(row.status)} />
          </td>
          <td className="px-4 py-3 text-right">
            <Button size="sm" onClick={() => onOpenDetails(row)}>Open details</Button>
          </td>
        </tr>
      )}
    />
  );
}

