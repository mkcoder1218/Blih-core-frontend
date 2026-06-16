/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, Calendar, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard, StatCardGrid, SectionCard, UserAvatar, StatusBadge, FilterBar } from '@/components/ui/blih';

interface AttendanceCheckInTabProps {
  avgMonthHours: number;
  avgWeekHours: number;
  totalLeaveHours: number;
}

const employeesList = [
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
  { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', type: 'Full-Time', email: 'alexg@gmail.com', phone: '+251 922 76 6767' },
];

export default function AttendanceCheckInTab({ avgMonthHours, avgWeekHours, totalLeaveHours }: AttendanceCheckInTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchEmployees, setSearchEmployees] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timesheetRange, setTimesheetRange] = useState('Monthly');
  const [sortBy, setSortBy] = useState('Name');

  const todayDisplay = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'short', day: '2-digit', year: 'numeric',
  }).format(new Date());

  return (
    <motion.div
      key="check-in"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Top row of three mini key indicators */}
      <StatCardGrid cols={3}>
        <StatCard label="In Progress" value={avgMonthHours} icon={<Clock className="w-5 h-5" />} tone="blue" />
        <StatCard label="Total Check-ins" value={avgWeekHours} icon={<CheckSquare className="w-5 h-5" />} tone="emerald" />
        <StatCard label="Completed" value={totalLeaveHours} icon={<CheckSquare className="w-5 h-5" />} tone="amber" />
      </StatCardGrid>

      <div>
        <h2 className="text-sm font-black text-slate-950 tracking-tight">Daily Check-Ins</h2>
        <p className="text-[11px] text-slate-500 font-semibold mt-0.5">All employees' daily attendance stamp.</p>
      </div>

      {/* Filter controls section */}
      <FilterBar
        search={searchEmployees}
        onSearchChange={setSearchEmployees}
        searchPlaceholder="Search employees..."
        filters={[
          {
            value: deptFilter,
            onChange: setDeptFilter,
            placeholder: 'All departments',
            options: [{ value: 'All', label: 'All departments' }],
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            placeholder: 'Status',
            options: [
              { value: 'All', label: 'Status' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'IN_PROGRESS', label: 'In progress' },
              { value: 'ON_BREAK', label: 'On lunch' },
              { value: 'REMOTE', label: 'Remote' },
              { value: 'MISSED', label: 'Missed' },
            ],
          },
          {
            value: timesheetRange,
            onChange: setTimesheetRange,
            placeholder: 'Range',
            options: [
              { value: 'Daily', label: 'Daily' },
              { value: 'Weekly', label: 'Weekly' },
              { value: 'Monthly', label: 'Monthly' },
            ],
          },
        ]}
      />

      <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
        <span>{employeesList.length} employees found</span>
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

      {/* Check-in table card */}
      <SectionCard
        action={
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg p-1.5">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">{todayDisplay}</span>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-[10px] text-blue-600 tracking-wider font-extrabold uppercase border-b border-slate-100">
                <th className="py-3 px-2">Name</th>
                <th className="py-3 px-2">Department</th>
                <th className="py-3 px-2">Mor-In</th>
                <th className="py-3 px-2">Lun-Out</th>
                <th className="py-3 px-2">Lun-In</th>
                <th className="py-3 px-2">Aft-Out</th>
                <th className="py-3 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {employeesList.map((emp, index) => {
                const isAlternateMissedCol = index === 2 || index === 6;
                const isAlternateMissedCol2 = index === 4;

                return (
                  <tr key={index} className="hover:bg-slate-50/50 text-xs transition-colors">
                    <td className="py-3 px-2">
                      <UserAvatar name={emp.name} size="sm" />
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-medium">{emp.dept}</td>
                    <td className="py-3 px-2">
                      {isAlternateMissedCol2 ? (
                        <span className="text-slate-400 font-semibold border border-slate-200 bg-slate-50/40 px-2.5 py-1 rounded inline-flex items-center gap-1">Missed</span>
                      ) : (
                        <span className="text-slate-700 font-semibold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          09:30 AM
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-slate-700 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        09:30 AM
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {isAlternateMissedCol ? (
                        <span className="text-slate-400 font-semibold border border-slate-200 bg-slate-50/40 px-2.5 py-1 rounded inline-flex items-center gap-1">Missed</span>
                      ) : (
                        <span className="text-slate-700 font-semibold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          09:30 AM
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-slate-700 font-semibold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        05:30 PM
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <StatusBadge status={isAlternateMissedCol || isAlternateMissedCol2 ? 'MISSED' : 'COMPLETED'} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table pagination foot */}
        <div className="flex justify-center items-center gap-1.5 mt-4 pt-3 border-t border-slate-100">
          <button className="p-1 rounded hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          {[1, 2, 3, 4].map((num) => (
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
          <button className="p-1 rounded hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-700 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </SectionCard>
    </motion.div>
  );
}
