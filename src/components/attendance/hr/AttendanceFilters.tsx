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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        <div className="lg:col-span-4">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Search employee</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={value.search}
              onChange={(e) => onChange({ ...value, search: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
              placeholder="Name or email…"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Date</label>
          <input
            type="date"
            value={value.date}
            onChange={(e) => onChange({ ...value, date: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Department</label>
          <select
            value={value.departmentId}
            onChange={(e) => onChange({ ...value, departmentId: e.target.value })}
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

        <div className="lg:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Status</label>
          <select
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value })}
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

        <div className="lg:col-span-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Range</label>
          <select
            value={value.range}
            onChange={(e) => onChange({ ...value, range: e.target.value as any })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      {value.range !== "daily" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Start date</label>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => onChange({ ...value, startDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">End date</label>
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => onChange({ ...value, endDate: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1a56db] focus:ring-1 focus:ring-[#1a56db]"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mt-3">
        <select
          value={value.sortBy}
          onChange={(e) => onChange({ ...value, sortBy: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="name">Sort: Name</option>
          <option value="checkInTime">Sort: Check-in time</option>
          <option value="workedMinutes">Sort: Worked duration</option>
          <option value="status">Sort: Status</option>
        </select>
        <select
          value={value.sortOrder}
          onChange={(e) => onChange({ ...value, sortOrder: e.target.value })}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="asc">Order: Asc</option>
          <option value="desc">Order: Desc</option>
        </select>
      </div>
    </div>
  );
}
