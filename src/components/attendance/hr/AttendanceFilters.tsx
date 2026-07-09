import React from "react";
import { Search } from "lucide-react";
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
  const departments = useDepartments();
  const deptList = departments.data?.departments || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="mb-3">
        <h3 className="text-sm font-black text-slate-950">Data Filters</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-3 items-end">
        <div className="xl:col-span-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Search employee</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={value.search}
              onChange={(e) => onChange({ ...value, search: e.currentTarget.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
              placeholder="Name or email..."
            />
          </div>
        </div>

        <div className="xl:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Date</label>
          <input
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.currentTarget.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          />
        </div>

        <div className="xl:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Department</label>
          <select
            value={value.departmentId}
            onChange={(e) => onChange({ ...value, departmentId: e.currentTarget.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          >
            <option value="">All</option>
            {deptList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="xl:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status</label>
          <select
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.currentTarget.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          >
            <option value="">All</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_BREAK">On Break</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="REMOTE">Remote</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
            <option value="LATE">Late</option>
          </select>
        </div>

        <div className="xl:col-span-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Range</label>
          <select
            value={value.range}
            onChange={(e) => onChange({ ...value, range: e.currentTarget.value as AttendanceFiltersValue["range"] })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="xl:col-span-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sort</label>
          <select
            value={value.sortBy}
            onChange={(e) => onChange({ ...value, sortBy: e.currentTarget.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          >
            <option value="name">Name</option>
            <option value="checkInTime">Check-in time</option>
            <option value="workedMinutes">Worked duration</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div className="xl:col-span-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Order</label>
          <select
            value={value.sortOrder}
            onChange={(e) => onChange({ ...value, sortOrder: e.currentTarget.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>
    </div>
  );
}
