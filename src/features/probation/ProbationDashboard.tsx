import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";
import { InfoAlert, PageHeader, StatCard, StatCardGrid } from "@/components/ui/blih";
import { getProbationErrorMessage, toProbationParams, useProbationDashboard } from "./hooks";
import type { ProbationDashboardRow, ProbationFilters } from "./types";
import { getProbationDepartments } from "./utils";
import { ProbationDetailsDialog } from "./components/ProbationDetailsDialog";
import { ProbationFilters as ProbationFilterBar } from "./components/ProbationFilters";
import { ProbationTable } from "./components/ProbationTable";

const initialFilters: ProbationFilters = {
  search: "",
  departmentId: "",
  status: "",
  endFrom: "",
  endTo: "",
};

const emptySummary = {
  activeProbation: 0,
  endingWithin7Days: 0,
  completed: 0,
  pendingHrAction: 0,
};

export function ProbationDashboard() {
  const [filters, setFilters] = useState<ProbationFilters>(initialFilters);
  const [selectedRow, setSelectedRow] = useState<ProbationDashboardRow | null>(null);
  const params = useMemo(() => toProbationParams(filters), [filters]);
  const dashboard = useProbationDashboard(params);
  const rows = dashboard.data?.rows || [];
  const summary = dashboard.data?.summary || emptySummary;
  const departments = useMemo(() => getProbationDepartments(rows), [rows]);

  return (
    <div id="tab-probation-pane" className="space-y-4 pb-8 font-sans">
      <PageHeader
        eyebrow="Onboarding"
        title="Performance and probation"
        description="Monitor probation status, attendance-based scoring, and performance reviews."
      />

      <StatCardGrid cols={4}>
        <StatCard label="Active probation" value={summary.activeProbation} icon={<Clock3 className="h-4 w-4" />} tone="blue" />
        <StatCard label="Ending within 7 days" value={summary.endingWithin7Days} icon={<AlertTriangle className="h-4 w-4" />} tone="amber" />
        <StatCard label="Completed" value={summary.completed} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <StatCard label="Pending HR action" value={summary.pendingHrAction} icon={<CalendarDays className="h-4 w-4" />} tone="rose" />
      </StatCardGrid>

      <ProbationFilterBar value={filters} departments={departments} onChange={setFilters} />

      {dashboard.isError ? (
        <InfoAlert
          variant="error"
          message={getProbationErrorMessage(dashboard.error, "Unable to load the probation dashboard.")}
        />
      ) : null}

      <ProbationTable
        rows={rows}
        loading={dashboard.isLoading}
        fetching={dashboard.isFetching}
        onOpenDetails={setSelectedRow}
      />

      <ProbationDetailsDialog row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
