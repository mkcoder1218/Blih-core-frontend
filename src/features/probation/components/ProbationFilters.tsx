import { FilterBar } from "@/components/ui/blih";
import { Input } from "@/components/ui/input";
import type { ProbationFilters as ProbationFilterValues } from "../types";

interface ProbationFiltersProps {
  value: ProbationFilterValues;
  departments: Array<{ id: string; name: string }>;
  onChange: (value: ProbationFilterValues) => void;
}

export function ProbationFilters({ value, departments, onChange }: ProbationFiltersProps) {
  const update = (patch: Partial<ProbationFilterValues>) => onChange({ ...value, ...patch });

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs">
      <FilterBar
        search={value.search}
        onSearchChange={(search) => update({ search })}
        searchPlaceholder="Search employee, department, position"
        filters={[
          {
            value: value.departmentId || "all",
            onChange: (departmentId) => update({ departmentId: departmentId === "all" ? "" : departmentId }),
            placeholder: "All departments",
            width: "w-full sm:w-44",
            options: [
              { value: "all", label: "All departments" },
              ...departments.map((department) => ({ value: department.id, label: department.name })),
            ],
          },
          {
            value: value.status || "all",
            onChange: (status) => update({ status: status === "all" ? "" : status }),
            placeholder: "All statuses",
            width: "w-full sm:w-40",
            options: [
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "completed", label: "Completed" },
              { value: "pending_action", label: "Pending HR action" },
            ],
          },
        ]}
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
            <Input
              aria-label="Probation end date from"
              type="date"
              value={value.endFrom}
              max={value.endTo || undefined}
              onChange={(event) => update({ endFrom: event.currentTarget.value })}
              className="h-9 min-w-0 bg-slate-50 text-xs font-semibold sm:w-36"
            />
            <Input
              aria-label="Probation end date to"
              type="date"
              value={value.endTo}
              min={value.endFrom || undefined}
              onChange={(event) => update({ endTo: event.currentTarget.value })}
              className="h-9 min-w-0 bg-slate-50 text-xs font-semibold sm:w-36"
            />
          </div>
        }
        className="sm:flex-wrap xl:flex-nowrap"
      />
    </div>
  );
}

