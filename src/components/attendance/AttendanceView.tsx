/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLegacyUser } from '../../api/legacyUserStore';
import { useAttendanceHrReport } from '../../hooks/useAttendanceHrReport';
import { useMyPermissions } from '../../hooks/usePermissions';

import EmployeeAttendancePage from './EmployeeAttendancePage';
import HrAttendanceCheckInsPage from './hr/HrAttendanceCheckInsPage';
import EmployeeAttendanceHistoryPage from './EmployeeAttendanceHistoryPage';
import HrLateReasonsPage from './hr/HrLateReasonsPage';
import ManualLatenessReasonPage from './hr/ManualLatenessReasonPage';
import MyLatenessReasonPage from './MyLatenessReasonPage';
import OvertimePage from './OvertimePage';
import LeavePage from './LeavePage';

import AttendanceOverviewTab from './AttendanceOverviewTab';
import AttendanceCheckInTab from './AttendanceCheckInTab';
import AttendanceRequestsTab from './AttendanceRequestsTab';
import AttendanceTimesheetTab from './AttendanceTimesheetTab';
import AttendanceMemoLogTab from './AttendanceMemoLogTab';
import AttendanceWfhTab from './AttendanceWfhTab';
import AttendanceUnavailableTab from './AttendanceUnavailableTab';
import SpecialRequestPage from './SpecialRequestPage';
import ExitOffboardingView from '../offboarding/ExitOffboardingView';
import AttendanceCalendarTab from './AttendanceCalendarTab';

interface AttendanceViewProps {
  currentAttendanceTab: 'overview' | 'calendar' | 'check-in' | 'check-me-in' | 'history' | 'my-lateness-reason' | 'manual-lateness-reason' | 'late-reasons' | 'requests' | 'timesheet' | 'leaves' | 'overtime' | 'special-request' | 'unavailable' | 'memo-log' | 'work-from-home' | 'exit-request';
  setCurrentAttendanceTab?: (tab: AttendanceViewProps['currentAttendanceTab']) => void;
  routeForTab?: (tab: AttendanceViewProps['currentAttendanceTab']) => string;
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AttendanceView({
  currentAttendanceTab,
  setCurrentAttendanceTab,
  routeForTab,
  onDraftAiSuggestion,
  showAlert,
}: AttendanceViewProps) {
  const navigate = useNavigate();
  const legacyUser = useLegacyUser();
  const perms = useMyPermissions();
  const role = legacyUser?.role || 'Employee';
  const isHr = role === 'HR Manager' || role === 'Business Admin' || role === 'Super Admin';
  const canViewLateReasons = perms.hasAny('attendance.late_reason.read', 'attendance.manage');
  const navigateToSpecialRequest = () => {
    setCurrentAttendanceTab?.('special-request');
    if (routeForTab) navigate(routeForTab('special-request'));
  };

  // --- Shared date/format helpers ---
  const todayYmd = new Date().toISOString().slice(0, 10);
  const formatMinutes = (minutes: number) => {
    const safeMinutes = Math.max(0, Math.round(minutes || 0));
    const hours = Math.floor(safeMinutes / 60);
    const mins = safeMinutes % 60;
    return mins ? `${hours}h ${mins}m` : `${hours}h`;
  };
  const toYmd = (date: Date) => date.toISOString().slice(0, 10);
  const startOfWeek = (ymd: string) => {
    const date = new Date(`${ymd}T00:00:00Z`);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
    return toYmd(date);
  };
  const startOfMonth = (ymd: string) => `${ymd.slice(0, 7)}-01`;
  const formatDisplayDate = (ymd: string) =>
    new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(`${ymd}T00:00:00Z`));

  // --- Shared state for timesheet/check-in controls ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchEmployees, setSearchEmployees] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Name');
  const [timesheetRange, setTimesheetRange] = useState<string>('Monthly');
  const [activeDate, setActiveDate] = useState<string>(todayYmd);

  // --- Memo-log state ---
  const [memoLogs, setMemoLogs] = useState([
    { id: 'memo-1', employee: 'Jessica Parker', role: 'Full Stack Developer', type: 'Technical Issue', from: '-', to: '-', duration: '30Min', submitted: '02:33 PM Dec 30, 2025', title: 'I had a Check-in failure technical issue', reason: 'Biometric system failed to register check-in. Security guard confirmed arrival at 8:50 AM.', approvedBy: 'Jessica Parker', status: 'pending' },
    { id: 'memo-2', employee: 'Jessica Parker', role: 'Full Stack Developer', type: 'Emergency', from: '02:33 PM Dec 30, 2025', to: '02:33 PM Dec 30, 2025', duration: '2Hrs', submitted: '02:33 PM Dec 30, 2025', title: 'Unable to work on the project on emergency matters.', reason: 'Biometric system failed to register check-in. Security guard confirmed arrival at 8:50 AM.', approvedBy: 'Jessica Parker', status: 'pending' },
  ]);

  // --- WFH state ---
  const [wfhRequests, setWfhRequests] = useState([
    { id: 'wfh-1', employee: 'Jessica Parker', role: 'Full Stack Developer', type: 'Marketing Campaign', from: '02:33 PM Dec 30, 2025', to: '02:33 PM Dec 30, 2025', duration: '2Days', submitted: '02:33 PM Dec 30, 2025', title: 'WFH for Marketing Campaign Planning', reason: 'Need focused time to complete Q1 marketing strategy without office distractions. All meetings can be attended remotely.', approvedBy: 'Jessica Parker', status: 'pending' },
    { id: 'wfh-2', employee: 'Jessica Parker', role: 'Full Stack Developer', type: 'Server Maintenance', from: '02:33 PM Dec 30, 2025', to: '02:33 PM Dec 30, 2025', duration: '2Days', submitted: '02:33 PM Dec 30, 2025', title: 'Remote Work - Server Maintenance', reason: 'Multiple virtual client meetings scheduled. More efficient to work from home office with better video setup.', approvedBy: 'Jessica Parker', status: 'pending' },
  ]);

  // --- Shared previousLeaves dummy data (used by memo-log and wfh) ---
  const previousLeaves = [
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', dept: 'Marketing', leaveType: 'Sick', dates: 'Dec 30, 2025 - Jan 03, 2026', duration: '4Days', status: 'Approved' },
  ];

  // --- Timesheet API data ---
  const timesheetStartDate = timesheetRange === 'Daily' ? activeDate : timesheetRange === 'Weekly' ? startOfWeek(activeDate) : startOfMonth(activeDate);
  const timesheetStatus = statusFilter === 'All' ? undefined : statusFilter;
  const timesheetSortBy = sortBy === 'Name' ? 'name' : sortBy === 'Status' ? 'status' : 'workedMinutes';
  const timesheetReport = useAttendanceHrReport({
    startDate: timesheetStartDate,
    endDate: activeDate,
    status: timesheetStatus,
    search: searchEmployees || undefined,
    sortBy: timesheetSortBy,
    sortOrder: 'asc',
    enabled: currentAttendanceTab === 'timesheet' && isHr,
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchEmployees, statusFilter, sortBy, timesheetRange, activeDate]);

  const timesheetRows = React.useMemo(() => {
    const grouped = new Map<string, {
      employeeId: string;
      employeeName: string;
      departmentName: string;
      weekMinutes: number;
      monthMinutes: number;
      overtimeMinutes: number;
      leaveMinutes: number;
      billableMinutes: number;
    }>();
    const weekStart = startOfWeek(activeDate);
    const rows = timesheetReport.data?.data?.rows || [];

    for (const row of rows) {
      const current = grouped.get(row.employeeId) || {
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        departmentName: row.department?.name || 'Unassigned',
        weekMinutes: 0,
        monthMinutes: 0,
        overtimeMinutes: 0,
        leaveMinutes: 0,
        billableMinutes: 0,
      };
      const worked = Number(row.totalWorkedMinutes || 0);
      const overtime = Number(row.overtimeMinutes || 0);
      current.monthMinutes += worked;
      current.overtimeMinutes += overtime;
      current.billableMinutes += Math.max(0, worked - overtime);
      if (row.date >= weekStart) current.weekMinutes += worked;
      grouped.set(row.employeeId, current);
    }

    const values = Array.from(grouped.values());
    values.sort((a, b) => {
      if (sortBy === 'Department') return a.departmentName.localeCompare(b.departmentName) || a.employeeName.localeCompare(b.employeeName);
      if (sortBy === 'Hours') return b.monthMinutes - a.monthMinutes;
      return a.employeeName.localeCompare(b.employeeName);
    });
    return values;
  }, [activeDate, sortBy, timesheetReport.data]);

  const timesheetPageSize = 8;
  const totalTimesheetPages = Math.max(1, Math.ceil(timesheetRows.length / timesheetPageSize));
  const visibleTimesheetRows = timesheetRows.slice((currentPage - 1) * timesheetPageSize, currentPage * timesheetPageSize);
  const avgMonthHours = timesheetRows.length ? Math.round(timesheetRows.reduce((sum, row) => sum + row.monthMinutes, 0) / timesheetRows.length / 60) : 0;
  const avgWeekHours = timesheetRows.length ? Math.round(timesheetRows.reduce((sum, row) => sum + row.weekMinutes, 0) / timesheetRows.length / 60) : 0;
  const totalLeaveHours = Math.round(timesheetRows.reduce((sum, row) => sum + row.leaveMinutes, 0) / 60);

  // -------------------------------------------------------
  // Early returns for tabs that render full-page components
  // -------------------------------------------------------
  if (currentAttendanceTab === 'overview') {
    return (
      <div className="h-full flex flex-col space-y-6">
        {isHr ? <HrAttendanceCheckInsPage /> : <EmployeeAttendancePage onSpecialRequest={() => navigateToSpecialRequest()} />}
      </div>
    );
  }

  if (currentAttendanceTab === 'check-in') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <HrAttendanceCheckInsPage />
      </div>
    );
  }

  if (currentAttendanceTab === 'check-me-in') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <EmployeeAttendancePage onSpecialRequest={() => navigateToSpecialRequest()} />
      </div>
    );
  }

  if (currentAttendanceTab === 'history') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <EmployeeAttendanceHistoryPage />
      </div>
    );
  }

  if (currentAttendanceTab === 'calendar') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <AttendanceCalendarTab showAlert={showAlert} />
      </div>
    );
  }

  if (currentAttendanceTab === 'my-lateness-reason') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <MyLatenessReasonPage />
      </div>
    );
  }

  if (currentAttendanceTab === 'late-reasons') {
    return (
      <div className="h-full flex flex-col space-y-6">
        {canViewLateReasons ? <HrLateReasonsPage /> : <div className="text-xs text-slate-600">Not authorized.</div>}
      </div>
    );
  }

  if (currentAttendanceTab === 'manual-lateness-reason') {
    return (
      <div className="h-full flex flex-col space-y-6">
        {isHr ? <ManualLatenessReasonPage showAlert={showAlert} /> : <div className="text-xs text-slate-600">Not authorized.</div>}
      </div>
    );
  }

  if (currentAttendanceTab === 'overtime') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <OvertimePage showAlert={showAlert} />
      </div>
    );
  }

  if (currentAttendanceTab === 'leaves') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <LeavePage showAlert={showAlert} />
      </div>
    );
  }

  if (currentAttendanceTab === 'special-request') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <SpecialRequestPage showAlert={showAlert} />
      </div>
    );
  }

  if (currentAttendanceTab === 'exit-request') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <ExitOffboardingView currentTab="offboarding" onDraftAiSuggestion={onDraftAiSuggestion} showAlert={showAlert} />
      </div>
    );
  }

  // -------------------------------------------------------
  // Animated tabs: requests, timesheet, memo-log, wfh
  // -------------------------------------------------------
  return (
    <div className="h-full flex flex-col space-y-6">
      <AnimatePresence mode="wait">

        {currentAttendanceTab === 'requests' && (
          <React.Fragment key="requests">
            <AttendanceRequestsTab showAlert={showAlert} />
          </React.Fragment>
        )}

        {currentAttendanceTab === 'timesheet' && (
          <React.Fragment key="timesheet">
            <AttendanceTimesheetTab
              showAlert={showAlert}
              avgMonthHours={avgMonthHours}
              avgWeekHours={avgWeekHours}
              totalLeaveHours={totalLeaveHours}
              timesheetRows={timesheetRows}
              visibleTimesheetRows={visibleTimesheetRows}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalTimesheetPages={totalTimesheetPages}
              searchEmployees={searchEmployees}
              setSearchEmployees={setSearchEmployees}
              deptFilter={deptFilter}
              setDeptFilter={setDeptFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              timesheetRange={timesheetRange}
              setTimesheetRange={setTimesheetRange}
              sortBy={sortBy}
              setSortBy={setSortBy}
              activeDate={activeDate}
              formatDisplayDate={formatDisplayDate}
              formatMinutes={formatMinutes}
              timesheetReport={timesheetReport}
            />
          </React.Fragment>
        )}

        {currentAttendanceTab === 'memo-log' && (
          <React.Fragment key="memo-log">
            <AttendanceMemoLogTab
              showAlert={showAlert}
              memoLogs={memoLogs}
              setMemoLogs={setMemoLogs}
              previousLeaves={previousLeaves}
            />
          </React.Fragment>
        )}

        {currentAttendanceTab === 'work-from-home' && (
          <React.Fragment key="work-from-home">
            <AttendanceWfhTab
              showAlert={showAlert}
              wfhRequests={wfhRequests}
              setWfhRequests={setWfhRequests}
              previousLeaves={previousLeaves}
            />
          </React.Fragment>
        )}

        {currentAttendanceTab === 'unavailable' && (
          <React.Fragment key="unavailable">
            <AttendanceUnavailableTab showAlert={showAlert} />
          </React.Fragment>
        )}

      </AnimatePresence>
    </div>
  );
}
