/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Calendar, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard, StatCardGrid, FilterBar, UserAvatar } from '@/components/ui/blih';

interface TimesheetRow {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  weekMinutes: number;
  monthMinutes: number;
  overtimeMinutes: number;
  leaveMinutes: number;
  billableMinutes: number;
}

interface AttendanceTimesheetTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
  avgMonthHours: number;
  avgWeekHours: number;
  totalLeaveHours: number;
  timesheetRows: TimesheetRow[];
  visibleTimesheetRows: TimesheetRow[];
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalTimesheetPages: number;
  searchEmployees: string;
  setSearchEmployees: React.Dispatch<React.SetStateAction<string>>;
  deptFilter: string;
  setDeptFilter: React.Dispatch<React.SetStateAction<string>>;
  statusFilter: string;
  setStatusFilter: React.Dispatch<React.SetStateAction<string>>;
  timesheetRange: string;
  setTimesheetRange: React.Dispatch<React.SetStateAction<string>>;
  sortBy: string;
  setSortBy: React.Dispatch<React.SetStateAction<string>>;
  activeDate: string;
  formatDisplayDate: (ymd: string) => string;
  formatMinutes: (minutes: number) => string;
  timesheetReport: { isLoading: boolean; isError: boolean };
}

export default function AttendanceTimesheetTab({
  avgMonthHours,
  avgWeekHours,
  totalLeaveHours,
  timesheetRows,
  visibleTimesheetRows,
  currentPage,
  setCurrentPage,
  totalTimesheetPages,
  searchEmployees,
  setSearchEmployees,
  deptFilter,
  setDeptFilter,
  statusFilter,
  setStatusFilter,
  timesheetRange,
  setTimesheetRange,
  sortBy,
  setSortBy,
  activeDate,
  formatDisplayDate,
  formatMinutes,
  timesheetReport,
}: AttendanceTimesheetTabProps) {
  return (
    <motion.div
      key="timesheet"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Top row indicators */}
      <StatCardGrid cols={3}>
        <StatCard label="Avg Work Hours This Month" value={avgMonthHours}   icon={<Clock className="w-5 h-5" />}        tone="blue" />
        <StatCard label="Avg Work Hours This Week"  value={avgWeekHours}    icon={<Clock className="w-5 h-5" />}        tone="blue" />
        <StatCard label="Total Leaves"              value={totalLeaveHours} icon={<CheckSquare className="w-5 h-5" />}  tone="emerald" />
      </StatCardGrid>

      <div>
        <h2 className="text-sm font-black text-slate-950 tracking-tight">Employee Timesheet</h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Calculated billable hours worked, leaves, and overtimes.</p>
      </div>

      {/* Filter controls */}
      <FilterBar
        search={searchEmployees}
        onSearchChange={setSearchEmployees}
        searchPlaceholder="Search employees..."
        filters={[
          { value: deptFilter,      onChange: setDeptFilter,      placeholder: 'All departments', options: [{ value: 'All', label: 'All departments' }] },
          { value: statusFilter,    onChange: setStatusFilter,    placeholder: 'Status', options: [
            { value: 'All', label: 'Status' }, { value: 'COMPLETED', label: 'Completed' },
            { value: 'IN_PROGRESS', label: 'In progress' }, { value: 'ON_BREAK', label: 'On lunch' }, { value: 'MISSED', label: 'Missed' },
          ]},
          { value: timesheetRange,  onChange: setTimesheetRange,  placeholder: 'Range', options: [
            { value: 'Daily', label: 'Daily' }, { value: 'Weekly', label: 'Weekly' }, { value: 'Monthly', label: 'Monthly' },
          ]},
        ]}
      />

      <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
        <span>{timesheetRows.length} employees found</span>
        <div className="flex items-center gap-1">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-slate-800 font-bold outline-none cursor-pointer border-b border-dotted border-slate-400"
          >
            <option value="Name">Name</option>
            <option value="Department">Department</option>
            <option value="Hours">Hours</option>
          </select>
        </div>
      </div>

      {/* Timesheet Table card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs overflow-hidden">
        <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
          <span className="text-xs font-bold text-slate-900">Timesheet</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg p-1.5">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">{formatDisplayDate(activeDate)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[10px] text-blue-600 tracking-wider font-extrabold uppercase border-b border-slate-100">
                <th className="py-3 px-2">Name</th>
                <th className="py-3 px-2">Hours Per Week</th>
                <th className="py-3 px-2">Hours Per Month</th>
                <th className="py-3 px-2">Overtime</th>
                <th className="py-3 px-2">Leave Hours</th>
                <th className="py-3 px-2 text-right">Billable Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-sans">
              {timesheetReport.isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 px-2 text-center text-xs font-semibold text-slate-500">Loading timesheet...</td>
                </tr>
              ) : timesheetReport.isError ? (
                <tr>
                  <td colSpan={6} className="py-8 px-2 text-center text-xs font-semibold text-red-600">Failed to load timesheet data.</td>
                </tr>
              ) : visibleTimesheetRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-2 text-center text-xs font-semibold text-slate-500">No timesheet data matches the current filters.</td>
                </tr>
              ) : visibleTimesheetRows.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-slate-50/50 text-xs transition-colors">
                  <td className="py-3 px-2">
                    <UserAvatar name={emp.employeeName} subtitle={emp.departmentName} size="sm" />
                  </td>
                  <td className="py-3 px-2 text-slate-600 font-semibold">{formatMinutes(emp.weekMinutes)}</td>
                  <td className="py-3 px-2 text-slate-600 font-semibold">{formatMinutes(emp.monthMinutes)}</td>
                  <td className="py-3 px-2 text-slate-600 font-semibold">{formatMinutes(emp.overtimeMinutes)}</td>
                  <td className="py-3 px-2 text-slate-600 font-semibold font-mono">{formatMinutes(emp.leaveMinutes)}</td>
                  <td className="py-3 px-2 text-right font-black text-blue-600 text-[13px]">{formatMinutes(emp.billableMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table pagination foot */}
        <div className="flex justify-center items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded hover:bg-slate-50 disabled:hover:bg-transparent disabled:text-slate-300 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalTimesheetPages }, (_, index) => index + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold cursor-pointer ${
                currentPage === num
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalTimesheetPages, page + 1))}
            disabled={currentPage >= totalTimesheetPages}
            className="p-1 rounded hover:bg-slate-50 disabled:hover:bg-transparent disabled:text-slate-300 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
