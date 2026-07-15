import React from "react";
import { ChevronDown, Search } from "lucide-react";
import { useDepartments } from "../../../hooks/useDepartments";

export type AttendanceFiltersValue = {
  date: string;
  startDate: string;
  endDate: string;
  departmentId: string;
  status: string;
  search: string;
  sortBy: string;
  sortOrder: string;
  range: "daily" | "weekly" | "monthly";
};

export default function AttendanceFilters({
  value,
  onChange,
}: {
  value: AttendanceFiltersValue;
  onChange: (v: AttendanceFiltersValue) => void;
}) {
  const [moreOpen, setMoreOpen] = React.useState(false);
  const departments = useDepartments();
  const deptList = departments.data?.departments || [];
  const secondaryCount = [value.range !== "daily", value.sortBy !== "name", value.sortOrder !== "asc"].filter(Boolean).length;
  const hasFilters = Boolean(value.search || value.departmentId || value.status || secondaryCount);

  const controlClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="flex flex-col gap-3 border-y border-slate-200 bg-white py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[240px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={value.search}
            onChange={(e) => onChange({ ...value, search: e.currentTarget.value })}
            className={`${controlClass} w-full pl-9`}
            placeholder="Search employees..."
          />
        </div>

        <input
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.currentTarget.value })}
          className={`${controlClass} w-full sm:w-[170px]`}
        />

        <select
          value={value.departmentId}
          onChange={(e) => onChange({ ...value, departmentId: e.currentTarget.value })}
          className={`${controlClass} w-full sm:w-[190px]`}
        >
          <option value="">Department: All</option>
          {deptList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.currentTarget.value })}
          className={`${controlClass} w-full sm:w-[170px]`}
        >
          <option value="">Status: All</option>
          <option value="NOT_STARTED">Not started</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="ON_BREAK">On break</option>
          <option value="ON_LEAVE">On leave</option>
          <option value="REMOTE">Remote</option>
          <option value="COMPLETED">Completed</option>
          <option value="MISSED">Absent</option>
          <option value="LATE">Late</option>
        </select>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          More filters
          {secondaryCount > 0 && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">{secondaryCount}</span>}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {hasFilters && (
          <button
            type="button"
            onClick={() => onChange({ ...value, search: "", departmentId: "", status: "", range: "daily", sortBy: "name", sortOrder: "asc" })}
            className="h-10 rounded-lg px-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            Reset
          </button>
        )}

        {moreOpen && (
          <div className="absolute right-0 top-11 z-20 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold text-slate-500">
                Date range
                <select
                  value={value.range}
                  onChange={(e) => onChange({ ...value, range: e.currentTarget.value as AttendanceFiltersValue["range"] })}
                  className={controlClass}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-500">
                Sort by
                <select
                  value={value.sortBy}
                  onChange={(e) => onChange({ ...value, sortBy: e.currentTarget.value })}
                  className={controlClass}
                >
                  <option value="name">Name</option>
                  <option value="checkInTime">Check-in time</option>
                  <option value="workedMinutes">Worked duration</option>
                  <option value="status">Status</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-slate-500">
                Sort order
                <select
                  value={value.sortOrder}
                  onChange={(e) => onChange({ ...value, sortOrder: e.currentTarget.value })}
                  className={controlClass}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
