/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  CheckSquare,
  Users,
  Smartphone,
  MapPin,
  Laptop,
  Briefcase,
  AlertTriangle,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EmployeeAttendancePage from './EmployeeAttendancePage';
import AttendanceShortcutCard from './AttendanceShortcutCard';
import HrAttendanceCheckInsPage from './hr/HrAttendanceCheckInsPage';
import { useLegacyUser } from '../../api/legacyUserStore';
import EmployeeAttendanceHistoryPage from './EmployeeAttendanceHistoryPage';
import HrLateReasonsPage from './hr/HrLateReasonsPage';
import OvertimePage from './OvertimePage';
import { useAttendanceHrReport } from '../../hooks/useAttendanceHrReport';

interface AttendanceViewProps {
  currentAttendanceTab: 'overview' | 'check-in' | 'check-me-in' | 'history' | 'late-reasons' | 'requests' | 'timesheet' | 'leaves' | 'overtime' | 'memo-log' | 'work-from-home';
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function AttendanceView({
  currentAttendanceTab,
  onDraftAiSuggestion,
  showAlert,
}: AttendanceViewProps) {
  const legacyUser = useLegacyUser();
  const role = legacyUser?.role || "Employee";
  const isHr = role === "HR Manager" || role === "Business Admin" || role === "Super Admin";

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

  // --- STATE FOR INTERACTIVITY ---
  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchEmployees, setSearchEmployees] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Name');
  const [timesheetRange, setTimesheetRange] = useState<string>('Monthly');

  // Highlight/Select individual rows for detailed panels (Split Layouts)
  const [selectedLeaveIndex, setSelectedLeaveIndex] = useState<number>(0);
  const [selectedOvertimeIndex, setSelectedOvertimeIndex] = useState<number>(0);
  const [selectedMemoIndex, setSelectedMemoIndex] = useState<number>(0);
  const [selectedWfhIndex, setSelectedWfhIndex] = useState<number>(0);

  // Active dates
  const [activeDate, setActiveDate] = useState<string>(todayYmd);

  // Multi-state list of pending approval items for realistic updates
  const [overtimeRequests, setOvertimeRequests] = useState([
    {
      id: 'ot-1',
      employee: 'Jessica Parker',
      role: 'Full Stack Developer',
      type: 'Public Holiday',
      from: '02:33 PM Dec 30, 2025',
      to: '02:33 PM Dec 30, 2025',
      totalHours: '8Hrs',
      submitted: '02:33 PM Dec 30, 2025',
      reason: "We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.",
      approvedBy: 'Jessica Parker',
      status: 'pending'
    },
    {
      id: 'ot-2',
      employee: 'Jessica Parker',
      role: 'Full Stack Developer',
      type: 'Regular',
      from: '02:33 PM Dec 30, 2025',
      to: '02:33 PM Dec 30, 2025',
      totalHours: '8Hrs',
      submitted: '02:33 PM Dec 30, 2025',
      reason: "Optimizing the platform databases to prevent latency peaks during high holiday concurrency periods.",
      approvedBy: 'Jessica Parker',
      status: 'pending'
    },
    {
      id: 'ot-3',
      employee: 'Jessica Parker',
      role: 'Full Stack Developer',
      type: 'Weekend',
      from: '02:33 PM Dec 30, 2025',
      to: '02:33 PM Dec 30, 2025',
      totalHours: '8Hrs',
      submitted: '02:33 PM Dec 30, 2025',
      reason: "Handling the scheduled server infrastructure upgrades and major deployment synchronization.",
      approvedBy: 'Jessica Parker',
      status: 'pending'
    },
  ]);

  const [memoLogs, setMemoLogs] = useState([
    {
      id: 'memo-1',
      employee: 'Jessica Parker',
      role: 'Full Stack Developer',
      type: 'Technical Issue',
      from: '-',
      to: '-',
      duration: '30Min',
      submitted: '02:33 PM Dec 30, 2025',
      title: 'I had a Check-in failure technical issue',
      reason: 'Biometric system failed to register check-in. Security guard confirmed arrival at 8:50 AM.',
      approvedBy: 'Jessica Parker',
      status: 'pending'
    },
    {
      id: 'memo-2',
      employee: 'Jessica Parker',
      role: 'Full Stack Developer',
      type: 'Emergency',
      from: '02:33 PM Dec 30, 2025',
      to: '02:33 PM Dec 30, 2025',
      duration: '2Hrs',
      submitted: '02:33 PM Dec 30, 2025',
      title: 'Unable to work on the project on emergency matters.',
      reason: 'Biometric system failed to register check-in. Security guard confirmed arrival at 8:50 AM.',
      approvedBy: 'Jessica Parker',
      status: 'pending'
    }
  ]);

  const [wfhRequests, setWfhRequests] = useState([
    {
      id: 'wfh-1',
      employee: 'Jessica Parker',
      role: 'Full Stack Developer',
      type: 'Marketing Campaign',
      from: '02:33 PM Dec 30, 2025',
      to: '02:33 PM Dec 30, 2025',
      duration: '2Days',
      submitted: '02:33 PM Dec 30, 2025',
      title: 'WFH for Marketing Campaign Planning',
      reason: 'Need focused time to complete Q1 marketing strategy without office distractions. All meetings can be attended remotely.',
      approvedBy: 'Jessica Parker',
      status: 'pending'
    },
    {
      id: 'wfh-2',
      employee: 'Jessica Parker',
      role: 'Full Stack Developer',
      type: 'Server Maintenance',
      from: '02:33 PM Dec 30, 2025',
      to: '02:33 PM Dec 30, 2025',
      duration: '2Days',
      submitted: '02:33 PM Dec 30, 2025',
      title: 'Remote Work - Server Maintenance',
      reason: 'Multiple virtual client meetings scheduled. More efficient to work from home office with better video setup.',
      approvedBy: 'Jessica Parker',
      status: 'pending'
    }
  ]);

  // Handle Accept / Reject actions in real-time
  const handleAction = (type: 'overtime' | 'memo' | 'wfh', id: string, status: 'Accepted' | 'Rejected') => {
    if (type === 'overtime') {
      setOvertimeRequests(prev => prev.map(item => item.id === id ? { ...item, status: status.toLowerCase() } : item));
    } else if (type === 'memo') {
      setMemoLogs(prev => prev.map(item => item.id === id ? { ...item, status: status.toLowerCase() } : item));
    } else if (type === 'wfh') {
      setWfhRequests(prev => prev.map(item => item.id === id ? { ...item, status: status.toLowerCase() } : item));
    }
    showAlert(`${status} request successfully!`, status === 'Accepted' ? 'success' : 'info');
  };

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

  // --- DUMMY DATA FOR TABLES & LISTS ---
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

  const leaveRequestsApproved = [
    { name: 'Jessica Parker', role: 'Full Stack Developer', depts: 'Marketing', leaveType: 'Annual' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', depts: 'Marketing', leaveType: 'Annual' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', depts: 'Marketing', leaveType: 'Sick' },
    { name: 'Jessica Parker', role: 'Full Stack Developer', depts: 'Marketing', leaveType: 'Sick' },
  ];

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

  // overview tab: employees see the self check-in directly; HR sees their check-in dashboard.
  if (currentAttendanceTab === 'overview') {
    return (
      <div className="h-full flex flex-col space-y-6">
        {isHr ? <HrAttendanceCheckInsPage /> : <EmployeeAttendancePage />}
      </div>
    );
  }

  // check-in tab: only HR uses this to see the real-time check-ins list.
  if (currentAttendanceTab === 'check-in') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <HrAttendanceCheckInsPage />
      </div>
    );
  }

  // check-me-in tab: self-service check-in for everyone (including HR/Admins).
  if (currentAttendanceTab === 'check-me-in') {
    return (
      <div className="h-full flex flex-col space-y-6">
        <EmployeeAttendancePage />
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

  if (currentAttendanceTab === 'late-reasons') {
    return (
      <div className="h-full flex flex-col space-y-6">
        {isHr ? <HrLateReasonsPage /> : <div className="text-xs text-slate-600">Not authorized.</div>}
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

  return (
    <div className="h-full flex flex-col space-y-6">
      <AnimatePresence mode="wait">
        
        {/* ====================================================
            1. OVERVIEW SCREEN (IMAGE 1)
            ==================================================== */}
        {(currentAttendanceTab as any) === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top row of three large key indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Requests</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">12</span>
                </div>
                <div className="w-12 h-12 bg-blue-50/70 border border-blue-100/30 rounded-full flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Check-ins Today</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">28</span>
                </div>
                <div className="w-12 h-12 bg-blue-50/70 border border-blue-100/30 rounded-full flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Present</span>
                  <span className="text-3xl font-black text-slate-900 mt-2 block tracking-tight">45</span>
                </div>
                <div className="w-12 h-12 bg-blue-50/70 border border-blue-100/30 rounded-full flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Work Hours Performance Card Container */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Work Hours Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Daily Card */}
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Daily</span>
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-blue-600 tracking-tight block">8.5h</span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 8h</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Performance</span>
                      <span className="text-blue-600">106%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1a56db] h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 2. Monthly Card */}
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Monthly</span>
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-blue-600 tracking-tight block">168h</span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 160h</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Performance</span>
                      <span className="text-blue-600">105%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1a56db] h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

                {/* 3. Annually Card */}
                <div className="bg-slate-50 border border-slate-100/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[150px]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800">Annually</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-blue-600 tracking-tight block">2016h</span>
                    <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Target: 1920h</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Performance</span>
                      <span className="text-blue-600">105%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#1a56db] h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bezier Activity & Presence Chart */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Activity and Presence</h3>
              
              <div className="relative pt-2 h-[260px] w-full">
                <svg className="w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="980" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="65" x2="980" y2="65" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="110" x2="980" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="155" x2="980" y2="155" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="50" y1="200" x2="980" y2="200" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Y Axis labels */}
                  <text x="35" y="24" className="text-[10px] font-medium fill-slate-400" textAnchor="end">180</text>
                  <text x="35" y="69" className="text-[10px] font-medium fill-slate-400" textAnchor="end">135</text>
                  <text x="35" y="114" className="text-[10px] font-medium fill-slate-400" textAnchor="end">90</text>
                  <text x="35" y="159" className="text-[10px] font-medium fill-slate-400" textAnchor="end">45</text>
                  <text x="35" y="204" className="text-[10px] font-medium fill-slate-400" textAnchor="end">0</text>

                  {/* Chart Line Path */}
                  <path
                    d="M 50,130 C 100,125 120,115 160,112 C 200,110 240,90 280,95 C 320,100 360,155 400,145 C 440,135 480,105 520,100 C 560,95 600,115 640,112 C 680,110 720,70 760,85 C 800,100 840,120 880,105 C 920,90 950,110 980,125"
                    fill="none"
                    stroke="#1a56db"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Bezier Circles / Dots */}
                  <circle cx="50" cy="130" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="160" cy="112" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="280" cy="95" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="400" cy="145" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="520" cy="100" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="640" cy="112" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="760" cy="85" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="880" cy="105" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="980" cy="125" r="4.5" fill="#1a56db" stroke="#ffffff" strokeWidth="1.5" />

                  {/* X Axis labels */}
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mon, index) => {
                    const xCoord = 50 + (index * 84.5);
                    return (
                      <g key={mon}>
                        <line x1={xCoord} y1="200" x2={xCoord} y2="204" stroke="#cbd5e1" strokeWidth="1" />
                        <text x={xCoord} y="222" className="text-[10.5px] font-bold fill-slate-400" textAnchor="middle">{mon}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================
            2. CHECK-IN SCREEN (IMAGE 2)
            ==================================================== */}
        {(currentAttendanceTab as any) === 'check-in' && (
          <motion.div
            key="check-in"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top row of three mini key indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">In Progress</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">{avgMonthHours}</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Check-ins</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">{avgWeekHours}</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">{totalLeaveHours}</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950 tracking-tight">Daily Check-Ins</h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">All employees' daily attendance stamp.</p>
            </div>

            {/* Filter controls section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-sm relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchEmployees}
                  onChange={(e) => setSearchEmployees(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 focus:outline-none focus:ring-1.5 focus:ring-blue-600/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <Filter className="w-4 h-4" />
                </button>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="All">All departments</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="All">Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="ON_BREAK">On lunch</option>
                  <option value="MISSED">Missed</option>
                </select>

                <select
                  value={timesheetRange}
                  onChange={(e) => setTimesheetRange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>

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

            {/* Check-in table card */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs overflow-hidden">
              <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                <span className="text-xs font-bold text-slate-900">Check-in Entries</span>
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
                      // Some staggered dummy values
                      const isAlternateMissedCol = index === 2 || index === 6;
                      const isAlternateMissedCol2 = index === 4;

                      return (
                        <tr key={index} className="hover:bg-slate-50/50 text-xs transition-colors">
                          <td className="py-3 px-2 flex items-center gap-2.5 font-bold text-slate-900">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-sans font-bold flex-shrink-0">
                              JP
                            </span>
                            {emp.name}
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
                            {isAlternateMissedCol || isAlternateMissedCol2 ? (
                              <span className="text-[10px] font-bold text-blue-600 border border-blue-400 px-3 py-1 rounded-md">
                                Missed
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded-md">
                                Completed
                              </span>
                            )}
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
            </div>
          </motion.div>
        )}

        {/* ====================================================
            3. REQUESTS SCREEN (CHECK-IN ADJUSTMENTS)
            ==================================================== */}
        {currentAttendanceTab === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top row of statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Adjustment Count</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">8</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed Adjustment</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">16</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Logs Today</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">45</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950 tracking-tight">Punctuality Adjustment Requests</h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Approve or audit employee punch adjustment logs.</p>
            </div>

            {/* Content card logs */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
              <span className="text-xs font-bold text-slate-900 block border-b border-slate-50 pb-2">Pending Adjustments</span>
              
              <div className="space-y-4">
                {[
                  { id: '1', name: 'Jessica Parker', dept: 'Marketing', desc: 'Missing morning fingerprint register due to biometric sensor failure.', original: 'Missed', proposed: '09:00 AM' },
                  { id: '2', name: 'Jessica Parker', dept: 'Marketing', desc: 'Punch outward missed due to project demo extension.', original: 'Missed', proposed: '06:30 PM' }
                ].map((item) => (
                  <div key={item.id} className="border border-slate-150 rounded-2xl p-5 hover:bg-slate-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-blue-50 text-[#1a56db] flex items-center justify-center text-[10px] font-bold">JP</span>
                        <h4 className="text-xs font-extrabold text-slate-900">{item.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">{item.dept}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600">{item.desc}</p>
                      <div className="flex gap-4 text-[11px] font-bold pt-1">
                        <div>Original: <span className="text-rose-500 line-through font-mono">{item.original}</span></div>
                        <div>Proposed shift: <span className="text-blue-600 font-mono">{item.proposed}</span></div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => showAlert('Approved punch adjustment request!', 'success')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all select-none flex-1 md:flex-none text-center cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => showAlert('Rejected punch adjustment request.', 'info')}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all select-none flex-1 md:flex-none text-center cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================
            4. TIMESHEET SCREEN (IMAGE 3)
            ==================================================== */}
        {currentAttendanceTab === 'timesheet' && (
          <motion.div
            key="timesheet"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top row indicators mimicking Image 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Work Hours This Month</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">{avgMonthHours}</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Work Hours This Week</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">{avgWeekHours}</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Leaves</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">{totalLeaveHours}</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black text-slate-950 tracking-tight">Employee Timesheet</h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Calculated billable hours worked, leaves, and overtimes.</p>
            </div>

            {/* Filter controls section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-sm relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchEmployees}
                  onChange={(e) => setSearchEmployees(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 focus:outline-none focus:ring-1.5 focus:ring-blue-600/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 cursor-pointer">
                  <Filter className="w-4 h-4" />
                </button>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="All">All departments</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="All">Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="ON_BREAK">On lunch</option>
                  <option value="MISSED">Missed</option>
                </select>

                <select
                  value={timesheetRange}
                  onChange={(e) => setTimesheetRange(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-700 outline-none"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
            </div>

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
                        <td className="py-3 px-2 flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-sans font-bold flex-shrink-0">
                            {emp.employeeName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'EM'}
                          </span>
                          <div>
                            <h4 className="font-sans font-extrabold text-slate-900 leading-none">{emp.employeeName}</h4>
                            <span className="text-[10px] font-medium text-slate-400 block mt-1">{emp.departmentName}</span>
                          </div>
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
        )}

        {/* ====================================================
            5. LEAVES SCREEN (IMAGE 4)
            ==================================================== */}
        {currentAttendanceTab === 'leaves' && (
          <motion.div
            key="leaves"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top row indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Work Hours This Month</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">12</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Work Hours This Week</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">28</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Leaves</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">45</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Leave Requests Approved panel */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Leave Requests</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">People who are at approved leave today.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {leaveRequestsApproved.map((req, index) => (
                  <div key={index} className="bg-white border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:scale-[1.01] transition-transform">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                      <div>
                        <h4 className="text-[11.5px] font-serif font-black text-slate-900 leading-none">{req.name}</h4>
                        <span className="text-[9.5px] text-slate-400 font-semibold block mt-1">{req.role}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">{req.depts}</span>
                      <span className="text-[9px] font-bold border border-blue-300 text-blue-600 px-2 py-0.5 rounded-full">{req.leaveType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Leaves Grid - Split Screen View */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Previous Leaves</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Calculated billable hours worked, leaves, and overtimes.</p>
              </div>

              {/* Split Screen Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Employee Scroll Column */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  {/* Search and Leave type filters inside */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search previous leave requests..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs select-none focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                        <option>Marketing</option>
                        <option>Engineering</option>
                      </select>
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none">
                        <option>Leave Type</option>
                        <option>Sick</option>
                        <option>Annual</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 pt-1">
                    <span>8 employees found</span>
                    <span>Sort by: Name</span>
                  </div>

                  {/* List items */}
                  <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto pr-1 space-y-2">
                    {previousLeaves.map((l, index) => {
                      const isSelected = selectedLeaveIndex === index;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedLeaveIndex(index)}
                          className={`flex justify-between items-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-50/80 border-blue-300 shadow-3xs'
                              : 'bg-white border-transparent hover:bg-slate-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                            <div>
                              <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{l.name}</h4>
                              <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{l.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{l.dept}</span>
                            <span className="text-[9px] font-mono font-bold border border-blue-400 text-blue-600 px-2.5 py-0.5 rounded-md min-w-[50px] text-center">
                              {l.leaveType}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Micro pagination under directory */}
                  <div className="flex justify-center items-center gap-1 mt-2 border-t border-slate-55 pt-3">
                    <button className="p-1 rounded text-slate-400 hover:text-slate-700"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <span className="text-xs font-bold font-mono text-slate-800 bg-[#1a56db] text-white w-5.5 h-5.5 rounded flex items-center justify-center">1</span>
                    <span className="text-xs font-bold font-mono text-slate-400 hover:bg-slate-55 w-5.5 h-5.5 rounded flex items-center justify-center cursor-pointer">2</span>
                    <span className="text-xs font-bold font-mono text-slate-400 hover:bg-slate-55 w-5.5 h-5.5 rounded flex items-center justify-center cursor-pointer">3</span>
                    <span className="text-xs font-bold font-mono text-slate-400 hover:bg-slate-55 w-5.5 h-5.5 rounded flex items-center justify-center cursor-pointer">4</span>
                    <button className="p-1 rounded text-slate-400 hover:text-slate-700"><ChevronRight className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {/* Right Leave Details Preview Panel (Matches Image 4) */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  
                  {/* Detailed Profile Header */}
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">JP</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate">Jessica Parker</h4>
                        <span className="text-[7.5px] font-black tracking-wider bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded">TECHNICAL DEPT.</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold block mt-1">jessica@company.com</p>
                      <p className="text-[9.5px] text-slate-500 font-mono tracking-tight mt-0.5">+251 987 78 6353</p>
                    </div>
                  </div>

                  {/* Details Card Block */}
                  <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-4.5 space-y-3 relative">
                    <span className="text-[9px] font-extrabold tracking-wider bg-blue-100 text-[#1a56db] py-0.5 px-2 rounded font-mono uppercase absolute top-4 right-4">Sick</span>
                    <h5 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Leave Details</h5>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">From</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[10.5px]">Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">To</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[10.5px]">Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Duration</span>
                        <strong className="text-blue-600 block mt-0.5 text-xs font-black">4Days</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Submitted</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[10px] leading-tight flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          02:33 PM Dec 30, 2025
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Reason for Leave Section */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Leave</span>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
                      We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.
                    </p>
                  </div>

                  {/* Approved By Block */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Approved By</span>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/30">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-sans font-bold flex-shrink-0">JP</span>
                      <span className="text-[11px] font-bold text-slate-800">Jessica Parker</span>
                      <span className="text-[8px] bg-blue-50 text-[#1a56db] rounded ml-auto px-1.5 py-0.5 font-mono font-black text-center">TECHNICAL DEPT.</span>
                    </div>
                  </div>

                  {/* Attached Documents Block */}
                  <div className="space-y-2 pb-1 text-slate-800">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400">
                      <span>Attached Documents</span>
                      <span className="bg-slate-100 text-slate-600 font-mono font-bold px-1.5 py-0.5 rounded">2 Files</span>
                    </div>

                    <div className="border border-slate-150 rounded-xl p-2.5 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-[11px] font-bold text-slate-700">Medical Paper</span>
                      </div>
                      <Download className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>

                  {/* Action buttons on bottom of right column info card */}
                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => showAlert('Displaying Jessica Parker detailed directory profile cards details!', 'info')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all select-none flex-1 font-sans text-center cursor-pointer"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => showAlert('Init file download package sequence...', 'success')}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all select-none flex-1 font-sans text-center cursor-pointer"
                    >
                      Download Files
                    </button>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================
            6. OVERTIME SCREEN (IMAGE 5)
            ==================================================== */}
        {currentAttendanceTab === 'overtime' && (
          <motion.div
            key="overtime"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top key parameters row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Avg Overtime Work Hours This Month</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">12</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approval</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">28</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Overtime Requests</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">45</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Overtime requests lists pending approval */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Overtime Requests</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Requests pending approval.</p>
              </div>

              {/* Flex list of overtime items in draft/process status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overtimeRequests.map((ot) => (
                  <div key={ot.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                    <span className="text-[9px] font-bold bg-[#1a56db] text-white py-0.5 px-2 rounded-md uppercase absolute top-5 right-5 font-mono">
                      {ot.type}
                    </span>

                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                      <div>
                        <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{ot.employee}</h4>
                        <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{ot.role}</span>
                      </div>
                    </div>

                    {/* Meta coordinates dates from to */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/70 rounded-xl p-3 text-[10.5px]">
                      <div>
                        <span className="text-slate-400 block font-medium">From</span>
                        <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{ot.from}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">To</span>
                        <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{ot.to}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100/50">
                        <span className="text-slate-400 block font-medium">Total Hours</span>
                        <span className="text-blue-600 block font-black text-[11px] font-mono">{ot.totalHours}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100/50">
                        <span className="text-slate-400 block font-medium">Submitted</span>
                        <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{ot.submitted}</span>
                      </div>
                    </div>

                    {/* Reason block text */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Reason for Overtime</span>
                      <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed font-semibold">
                        {ot.reason}
                      </p>
                    </div>

                    {/* Operational controls */}
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      {ot.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleAction('overtime', ot.id, 'Accepted')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all select-none flex-1 cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction('overtime', ot.id, 'Rejected')}
                            className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl transition-all select-none flex-1 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center text-xs font-bold uppercase py-1 text-blue-600 bg-blue-50 rounded-lg">
                          {ot.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Overtime request list matching Image 5 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Previous Overtime Requests</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Archived overtime requests.</p>
              </div>

              {/* Split Screen Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left pane listing logs with previous overtimes */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search previous overtime requests..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs select-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                        <option>Marketing</option>
                      </select>
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                        <option>Overtime Type</option>
                      </select>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto space-y-2">
                    {previousLeaves.map((l, index) => {
                      const isSelected = selectedOvertimeIndex === index;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedOvertimeIndex(index)}
                          className={`flex justify-between items-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-50/80 border-blue-300 shadow-3xs'
                              : 'bg-white border-transparent hover:bg-slate-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                            <div>
                              <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{l.name}</h4>
                              <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{l.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{l.dept}</span>
                            <span className="text-[9px] font-mono font-bold border border-blue-400 text-blue-600 px-2.5 py-0.5 rounded-lg">
                              Weekend
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Details Card */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">JP</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate">Jessica Parker</h4>
                        <span className="text-[7.5px] font-black tracking-wider bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded">TECHNICAL DEPT.</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold block mt-1">jessica@company.com</p>
                      <p className="text-[9.5px] text-slate-500 font-mono tracking-tight mt-0.5">+251 987 78 6353</p>
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-4.5 space-y-3 relative">
                    <span className="text-[9px] font-extrabold bg-[#1a56db] text-white py-0.5 px-2 rounded font-mono uppercase absolute top-4 right-4">Weekend</span>
                    <h5 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Overtime Details</h5>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">From</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">To</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Total Hours</span>
                        <strong className="text-blue-600 block mt-0.5 text-xs font-black font-mono">8Hrs</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Submitted</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                    </div>
                  </div>

                  {/* Reason text */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Overtime</span>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
                      We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.
                    </p>
                  </div>

                  {/* Approved By Block */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Approved By</span>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/30">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-sans font-bold flex-shrink-0">JP</span>
                      <span className="text-[11px] font-bold text-slate-800">Jessica Parker</span>
                      <span className="text-[8px] bg-blue-50 text-[#1a56db] rounded ml-auto px-1.5 py-0.5 font-mono font-black text-center">TECHNICAL DEPT.</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showAlert('Displaying Jessica Parker detailed directory profile cards details!', 'info')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all select-none w-full text-center cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================
            7. MEMO LOG SCREEN (IMAGE 6)
            ==================================================== */}
        {currentAttendanceTab === 'memo-log' && (
          <motion.div
            key="memo-log"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top key parameters row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Memo Logs This Week</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">12</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approval</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">28</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Memo Logs</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">45</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Memo Logs items pending approval */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Memo Logs</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Punctuality logs pending approval.</p>
              </div>

              {/* Flex list of memo items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memoLogs.map((memo) => (
                  <div key={memo.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                    <span className="text-[9px] font-bold bg-[#1a56db] text-white py-0.5 px-2 rounded-md uppercase absolute top-5 right-5 font-mono">
                      {memo.type}
                    </span>

                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                      <div>
                        <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{memo.employee}</h4>
                        <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{memo.role}</span>
                      </div>
                    </div>

                    {/* Meta block */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/70 rounded-xl p-3 text-[10.5px]">
                      <div>
                        <span className="text-slate-400 block font-medium">From</span>
                        <span className="text-slate-700 block font-semibold font-mono text-[9px]">{memo.from}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">To</span>
                        <span className="text-slate-700 block font-semibold font-mono text-[9px]">{memo.to}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100/50">
                        <span className="text-slate-400 block font-medium">Duration</span>
                        <span className="text-blue-600 block font-black text-[11px] font-mono">{memo.duration}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100/50">
                        <span className="text-slate-400 block font-medium">Submitted</span>
                        <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{memo.submitted}</span>
                      </div>
                    </div>

                    {/* Content / reason */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#b9c4d2] uppercase">Title / Issue summary</span>
                      <h4 className="text-xs font-extrabold text-slate-950 font-sans leading-snug">{memo.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                        {memo.reason}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      {memo.status === 'pending' ? (
                        memo.type === 'Technical Issue' ? (
                          <>
                            <button
                              onClick={() => handleAction('memo', memo.id, 'Accepted')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                            >
                              Mark as Resolved
                            </button>
                            <button
                              onClick={() => handleAction('memo', memo.id, 'Rejected')}
                              className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                            >
                              Report Issue
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAction('memo', memo.id, 'Accepted')}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                            >
                              Considered
                            </button>
                            <button
                              onClick={() => handleAction('memo', memo.id, 'Rejected')}
                              className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                            >
                              View Profile
                            </button>
                          </>
                        )
                      ) : (
                        <div className="w-full text-center text-xs font-bold uppercase py-1 text-blue-600 bg-blue-50 rounded-lg">
                          {memo.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Memo request list matching Image 6 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Previous Memo logs</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Archived memo log records.</p>
              </div>

              {/* Split Screen Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left pane list of memo items */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search previous memo logs..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs select-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                        <option>Marketing</option>
                      </select>
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                        <option>Memo Type</option>
                      </select>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto space-y-2">
                    {previousLeaves.map((l, index) => {
                      const isSelected = selectedMemoIndex === index;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedMemoIndex(index)}
                          className={`flex justify-between items-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-50/80 border-blue-300 shadow-3xs'
                              : 'bg-white border-transparent hover:bg-slate-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                            <div>
                              <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{l.name}</h4>
                              <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{l.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{l.dept}</span>
                            <span className="text-[9px] font-mono font-bold border border-blue-400 text-blue-600 px-2.5 py-0.5 rounded-lg">
                              Technical Issue
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Details Memo Panel */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">JP</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate">Jessica Parker</h4>
                        <span className="text-[7.5px] font-black tracking-wider bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded">TECHNICAL DEPT.</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold block mt-1">jessica@company.com</p>
                      <p className="text-[9.5px] text-slate-500 font-mono tracking-tight mt-0.5">+251 987 78 6353</p>
                    </div>
                  </div>

                  {/* Details Card */}
                  <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-4.5 space-y-3 relative">
                    <span className="text-[9px] font-extrabold bg-[#1a56db] text-white py-0.5 px-2 rounded font-mono uppercase absolute top-4 right-4">Technical Issue</span>
                    <h5 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Memo Details</h5>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">From</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">To</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Duration</span>
                        <strong className="text-blue-600 block mt-0.5 text-xs font-black font-mono">2Hrs</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Submitted</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                    </div>
                  </div>

                  {/* Content title / body */}
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Unable to work on the project on emergency m...</span>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
                      We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.
                    </p>
                  </div>

                  {/* Approved By Block */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Approved By</span>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/30">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-sans font-bold flex-shrink-0">JP</span>
                      <span className="text-[11px] font-bold text-slate-800">Jessica Parker</span>
                      <span className="text-[8px] bg-blue-50 text-[#1a56db] rounded ml-auto px-1.5 py-0.5 font-mono font-black text-center">TECHNICAL DEPT.</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showAlert('Displaying Jessica Parker detailed directory profile cards details!', 'info')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all select-none w-full text-center cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* ====================================================
            8. WORK-FROM-HOME SCREEN (IMAGE 7)
            ==================================================== */}
        {currentAttendanceTab === 'work-from-home' && (
          <motion.div
            key="work-from-home"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Top key parameters row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total WFH Requests This Month</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">12</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approval</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">28</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-6 flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Work-From-Home Requests</span>
                  <span className="text-3xl font-black text-slate-900 mt-1 block tracking-tight">45</span>
                </div>
                <div className="w-10 h-10 bg-blue-50/70 border border-blue-100/30 rounded-xl flex items-center justify-center text-blue-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Work-from-Home requests */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Work-From-Home Requests</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">WFH requests pending approval.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {wfhRequests.map((wfh) => (
                  <div key={wfh.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                      <div>
                        <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{wfh.employee}</h4>
                        <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{wfh.role}</span>
                      </div>
                    </div>

                    {/* Meta section */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50/70 rounded-xl p-3 text-[10.5px]">
                      <div>
                        <span className="text-slate-400 block font-medium">From</span>
                        <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{wfh.from}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">To</span>
                        <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{wfh.to}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100/50">
                        <span className="text-slate-400 block font-medium">Duration</span>
                        <span className="text-blue-600 block font-black text-[11px] font-mono">{wfh.duration}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100/50">
                        <span className="text-slate-400 block font-medium">Submitted</span>
                        <span className="text-slate-700 block font-bold font-mono text-[9px] truncate">{wfh.submitted}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#b9c4d2] uppercase">{wfh.title}</span>
                      <p className="text-[11px] text-slate-500 leading-normal font-semibold">
                        {wfh.reason}
                      </p>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      {wfh.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleAction('wfh', wfh.id, 'Accepted')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction('wfh', wfh.id, 'Rejected')}
                            className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex-1 cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="w-full text-center text-xs font-bold uppercase py-1 text-blue-600 bg-blue-50 rounded-lg">
                          {wfh.status}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Previous overtime / WFH request list matching Image 7 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">Previous WFH Requests</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Archived WFH requests.</p>
              </div>

              {/* Split Screen Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left pane listing logs with previous requests */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search previous WFH requests..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs select-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                        <option>Marketing</option>
                      </select>
                      <select className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
                        <option>Status</option>
                      </select>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-50 max-h-[350px] overflow-y-auto space-y-2">
                    {previousLeaves.map((l, index) => {
                      const isSelected = selectedWfhIndex === index;
                      const isRejected = index === 2 || index === 4;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedWfhIndex(index)}
                          className={`flex justify-between items-center p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-50/80 border-blue-300 shadow-3xs'
                              : 'bg-white border-transparent hover:bg-slate-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">JP</span>
                            <div>
                              <h4 className="text-[11.5px] font-extrabold text-slate-900 leading-none">{l.name}</h4>
                              <span className="text-[9.5px] font-medium text-slate-400 block mt-1">{l.role}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{l.dept}</span>
                            <span className={`text-[9px] font-mono font-bold border px-2.5 py-0.5 rounded-lg ${
                              isRejected 
                                ? 'border-rose-400 text-rose-600' 
                                : 'border-blue-400 text-blue-600'
                            }`}>
                              {isRejected ? 'Rejected' : 'Accepted'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Details Card */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold">JP</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-slate-900 truncate">Jessica Parker</h4>
                        <span className="text-[7.5px] font-black tracking-wider bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded">TECHNICAL DEPT.</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold block mt-1">jessica@company.com</p>
                      <p className="text-[9.5px] text-slate-500 font-mono tracking-tight mt-0.5">+251 987 78 6353</p>
                    </div>
                  </div>

                  {/* Details block */}
                  <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-4.5 space-y-3 relative">
                    <h5 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">Work-From-Home Details</h5>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">From</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">To</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Total Hours</span>
                        <strong className="text-blue-600 block mt-0.5 text-xs font-black font-mono">2Days</strong>
                      </div>
                      <div>
                        <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Submitted</span>
                        <strong className="text-slate-700 font-mono block mt-0.5 text-[9.5px] leading-tight">02:33 PM Dec 30, 2025</strong>
                      </div>
                    </div>
                  </div>

                  {/* Reason text */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Working-From-Home</span>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-slate-50/40 p-3 rounded-xl border border-slate-100/50">
                      We're looking for an experienced Frontend Developer to join our team and help build the next generation of our product platform.
                    </p>
                  </div>

                  {/* Approved By Block */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">Approved By</span>
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100/30">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-sans font-bold flex-shrink-0">JP</span>
                      <span className="text-[11px] font-bold text-slate-800">Jessica Parker</span>
                      <span className="text-[8px] bg-blue-50 text-[#1a56db] rounded ml-auto px-1.5 py-0.5 font-mono font-black text-center">TECHNICAL DEPT.</span>
                    </div>
                  </div>

                  <button
                    onClick={() => showAlert('Displaying Jessica Parker detailed directory profile cards details!', 'info')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all select-none w-full text-center cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
