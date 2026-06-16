import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { UserPlus, CheckCircle, CheckSquare, Clock, Calendar, TrendingUp } from 'lucide-react';
import { StatCard, StatCardGrid } from '@/components/ui/blih';
import { useAttendanceHrReport } from '../../../hooks/useAttendanceHrReport';
import { useOnboardings } from '../../../hooks/useCandidateOnboarding';
import { useEmployees } from '../../../hooks/useHrRecords';
import { useJobApplications } from '../../../hooks/useJobRequests';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ACTIVE_ONBOARDING_STATUSES = new Set(['PENDING_CANDIDATE_COMPLETION', 'IN_PROGRESS']);
const COMPLETED_ONBOARDING_STATUSES = new Set(['COMPLETED', 'SUBMITTED_FOR_REVIEW']);

export default function OnboardingOverviewTab() {
  const today = useMemo(() => new Date(), []);
  const todayYmd = toYmd(today);
  const monthStartYmd = toYmd(new Date(today.getFullYear(), today.getMonth(), 1));
  const yearStartYmd = toYmd(new Date(today.getFullYear(), 0, 1));
  const yearEndYmd = toYmd(new Date(today.getFullYear(), 11, 31));

  const onboardingsQuery = useOnboardings({ limit: 1000 });
  const employeesQuery = useEmployees({ limit: 1000, offset: 0 });
  const applicationsQuery = useJobApplications();
  const dailyAttendanceQuery = useAttendanceHrReport({
    startDate: todayYmd,
    endDate: todayYmd,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const monthlyAttendanceQuery = useAttendanceHrReport({
    startDate: monthStartYmd,
    endDate: todayYmd,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const annualAttendanceQuery = useAttendanceHrReport({
    startDate: yearStartYmd,
    endDate: yearEndYmd,
    sortBy: 'name',
    sortOrder: 'asc',
  });

  const onboardings: any[] = onboardingsQuery.data?.rows ?? [];
  const employees: any[] = employeesQuery.data?.employees ?? [];
  const applications: any[] = applicationsQuery.data ?? [];

  const completedThisMonth = useMemo(() => {
    return onboardings.filter((item) => {
      if (!COMPLETED_ONBOARDING_STATUSES.has(String(item.status || ''))) return false;
      const completedAt = parseDate(item.completedAt || item.submittedAt || item.updatedAt);
      return completedAt && completedAt.getFullYear() === today.getFullYear() && completedAt.getMonth() === today.getMonth();
    }).length;
  }, [onboardings, today]);

  const activeOnboarding = useMemo(
    () => onboardings.filter((item) => ACTIVE_ONBOARDING_STATUSES.has(String(item.status || ''))).length,
    [onboardings]
  );

  const onProbation = useMemo(() => {
    const now = today.getTime();
    return employees.filter((employee) => {
      const probationEnd = parseDate(employee.probationEndDate || employee.EmployeeRecord?.probationEndDate || employee.user?.EmployeeRecord?.probationEndDate);
      const status = String(employee.employmentStatus || employee.EmployeeRecord?.employmentStatus || '').toLowerCase();
      return probationEnd && probationEnd.getTime() >= now && status !== 'terminated';
    }).length;
  }, [employees, today]);

  const checklistStats = useMemo(() => {
    return onboardings.reduce(
      (stats, item) => {
        const sections = countItems(item.sections);
        const resources = countItems(item.resources);
        const documents = countItems(item.requiredDocuments);
        const policies = countItems(item.requiredPolicies);
        const items = sections + resources + documents + policies;
        return {
          totalChecklists: stats.totalChecklists + (items > 0 ? 1 : 0),
          totalItems: stats.totalItems + items,
          timesUsed: stats.timesUsed + 1,
        };
      },
      { totalChecklists: 0, totalItems: 0, timesUsed: 0 }
    );
  }, [onboardings]);

  const lineChartData = useMemo(() => {
    const rows = MONTH_LABELS.map((name) => ({ name, count: 0 }));
    applications.forEach((application) => {
      const createdAt = parseDate(application.createdAt || application.appliedAt || application.updatedAt);
      if (!createdAt || createdAt.getFullYear() !== today.getFullYear()) return;
      rows[createdAt.getMonth()].count += 1;
    });
    return rows;
  }, [applications, today]);

  const maxApplications = Math.max(5, ...lineChartData.map((row) => row.count));
  const yAxisMax = Math.ceil(maxApplications / 5) * 5;

  const dailyHours = averageWorkedHours(dailyAttendanceQuery.data?.data?.rows ?? []);
  const monthlyHours = averageWorkedHoursByEmployee(monthlyAttendanceQuery.data?.data?.rows ?? []);
  const annualHours = averageWorkedHoursByEmployee(annualAttendanceQuery.data?.data?.rows ?? []);

  const workHoursCards = [
    { label: 'Daily', value: formatHours(dailyHours), target: '8h', pct: percent(dailyHours, 8), progress: progressWidth(dailyHours, 8), icon: <Clock className="w-4 h-4" /> },
    { label: 'Monthly', value: formatHours(monthlyHours), target: '160h', pct: percent(monthlyHours, 160), progress: progressWidth(monthlyHours, 160), icon: <Calendar className="w-4 h-4" /> },
    { label: 'Annually', value: formatHours(annualHours), target: '1920h', pct: percent(annualHours, 1920), progress: progressWidth(annualHours, 1920), icon: <TrendingUp className="w-4 h-4" /> },
  ];
  const isSummaryLoading = onboardingsQuery.isLoading || employeesQuery.isLoading;

  return (
    <div id="tab-overview-pane" className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Top Summary row */}
      <StatCardGrid cols={3}>
        <StatCard label="Active Onboarding"    value={isSummaryLoading ? '-' : activeOnboarding} icon={<UserPlus className="w-5 h-5" />}    tone="blue" />
        <StatCard label="Completed This Month" value={onboardingsQuery.isLoading ? '-' : completedThisMonth} icon={<CheckCircle className="w-5 h-5" />} tone="emerald" />
        <StatCard label="On Probation"         value={employeesQuery.isLoading ? '-' : onProbation} icon={<Clock className="w-5 h-5" />}       tone="amber" />
      </StatCardGrid>

      {/* Work Hours Performance */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Work Hours Performance</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {workHoursCards.map(({ label, value, target, pct, progress, icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">{label}</span>
                  <h3 className="text-2xl font-black text-blue-600 mt-1">{value}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Target: {target}</p>
                </div>
                <div className="text-blue-600 bg-blue-50/70 p-1.5 rounded-lg">{icon}</div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
                  <span>Performance</span>
                  <span className="text-blue-600">{pct}</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: progress }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Application Frequency Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Job Application Frequency</h4>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-normal">Monthly metric registry</span>
        </div>
        <div className="h-[210px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, yAxisMax]} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} Apps`, 'Applications']} />
              <Line type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Checklists', value: onboardingsQuery.isLoading ? '-' : checklistStats.totalChecklists, icon: <CheckSquare className="w-5 h-5" /> },
          { label: 'Total Items', value: onboardingsQuery.isLoading ? '-' : checklistStats.totalItems, icon: <CheckSquare className="w-5 h-5" /> },
          { label: 'Times Used', value: onboardingsQuery.isLoading ? '-' : checklistStats.timesUsed, icon: <Calendar className="w-5 h-5" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center">
            <div>
              <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">{label}</span>
              <h4 className="text-2xl font-black text-slate-900 mt-2">{value}</h4>
            </div>
            <div className="text-blue-500">{icon}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function countItems(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

function averageWorkedHours(rows: any[]) {
  if (!rows.length) return 0;
  const totalMinutes = rows.reduce((sum, row) => sum + Number(row.totalWorkedMinutes || row.workedMinutes || 0), 0);
  return totalMinutes / rows.length / 60;
}

function averageWorkedHoursByEmployee(rows: any[]) {
  const employeeTotals = new Map<string, number>();
  rows.forEach((row) => {
    const employeeId = String(row.employeeId || row.employeeName || 'unknown');
    employeeTotals.set(employeeId, (employeeTotals.get(employeeId) || 0) + Number(row.totalWorkedMinutes || row.workedMinutes || 0));
  });
  if (!employeeTotals.size) return 0;
  const totalMinutes = Array.from(employeeTotals.values()).reduce((sum, minutes) => sum + minutes, 0);
  return totalMinutes / employeeTotals.size / 60;
}

function formatHours(hours: number) {
  const rounded = Math.round(hours * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}h`;
}

function percent(value: number, target: number) {
  if (!target) return '0%';
  return `${Math.round((value / target) * 100)}%`;
}

function progressWidth(value: number, target: number) {
  if (!target) return '0%';
  return `${Math.min(100, Math.round((value / target) * 100))}%`;
}
