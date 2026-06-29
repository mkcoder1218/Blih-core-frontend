import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Award, BriefcaseBusiness, CheckCircle2, Clock, Filter, Target, TrendingUp } from 'lucide-react';
import { getPerformanceOverview, type EmployeeProjectMetrics, type PerformanceOverviewResponse } from '../../api/performance';
import { EmptyState, SectionCard, StatCard, StatCardGrid } from '@/components/ui/blih';

export default function PerformanceOverview() {
  const [overview, setOverview] = useState<PerformanceOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState({ employee: 'All', department: 'All', project: 'All', period: 'Current period', status: 'All', team: 'All' });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPerformanceOverview()
      .then((data) => {
        if (!alive) return;
        setOverview(data || null);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setOverview(null);
        setError('Performance analytics could not be loaded.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const projectRows = overview?.projectDashboard.rows || [];
  const projectDepartments = useMemo(() => {
    return Array.from(new Set(projectRows.map((row) => row.employee.department?.name).filter(Boolean) as string[]));
  }, [projectRows]);
  const projectEmployees = useMemo(() => projectRows.map((row) => row.employee.name || row.employee.email || 'Employee'), [projectRows]);
  const projectNames = useMemo(() => {
    return Array.from(new Set(projectRows.flatMap((row) => row.tasks.map((task) => task.project?.title).filter(Boolean) as string[])));
  }, [projectRows]);
  const statuses = useMemo(() => Array.from(new Set(projectRows.flatMap((row) => row.tasks.map((task) => task.status)))), [projectRows]);

  const filteredProjectRows = projectRows.filter((row) => {
    const employeeName = row.employee.name || row.employee.email || '';
    const departmentName = row.employee.department?.name || '';
    const taskStatusMatch = projectFilter.status === 'All' || row.tasks.some((task) => task.status === projectFilter.status);
    const projectMatch = projectFilter.project === 'All' || row.tasks.some((task) => task.project?.title === projectFilter.project);
    return (
      (projectFilter.employee === 'All' || employeeName === projectFilter.employee) &&
      (projectFilter.department === 'All' || departmentName === projectFilter.department) &&
      (projectFilter.team === 'All' || departmentName === projectFilter.team) &&
      taskStatusMatch &&
      projectMatch
    );
  });

  const projectTotals = summarizeProjects(filteredProjectRows);
  const weightedCompletion = projectTotals.assignedWeight ? Math.round((projectTotals.completedWeight / projectTotals.assignedWeight) * 100) : 0;
  const distributionTotal = overview ? Object.values(overview.distribution).reduce<number>((sum, value) => sum + Number(value || 0), 0) : 0;

  if (loading) {
    return <SectionCard><EmptyState icon={<Clock className="w-8 h-8" />} title="Loading performance analytics..." compact /></SectionCard>;
  }

  if (error) {
    return <SectionCard><EmptyState icon={<AlertTriangle className="w-8 h-8" />} title={error} compact /></SectionCard>;
  }

  if (!overview) {
    return <SectionCard><EmptyState icon={<Target className="w-8 h-8" />} title="No performance analytics available yet." compact /></SectionCard>;
  }

  return (
    <div id="performance-overview-panel" className="space-y-6">
      <StatCardGrid cols={3}>
        <StatCard
          label="Most Improved"
          value={overview.summary.mostImprovedDepartment || 'No scored reviews'}
          icon={<TrendingUp className="w-5 h-5 stroke-[2.5]" />}
          tone="blue"
          trend="Based on completed review scores"
          trendPositive={Boolean(overview.summary.mostImprovedDepartment)}
        />
        <StatCard
          label="Reviews Due"
          value={`${overview.summary.reviewsDue}`}
          icon={<Clock className="w-5 h-5 stroke-[2.5]" />}
          tone={overview.summary.reviewsDue > 0 ? 'rose' : 'blue'}
          trend={overview.summary.reviewsDue > 0 ? 'pending review action' : 'no pending reviews'}
          trendPositive={overview.summary.reviewsDue === 0}
        />
        <StatCard
          label="Active OKRs"
          value={`${overview.summary.activeOkrs}`}
          icon={<Target className="w-5 h-5 stroke-[2.5]" />}
          tone="blue"
          trend={`${overview.summary.onTrackOkrs}% on track`}
          trendPositive={overview.summary.onTrackOkrs >= 70}
        />
      </StatCardGrid>

      <ProjectEvidenceSection
        projectRows={projectRows}
        filteredProjectRows={filteredProjectRows}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        projectEmployees={projectEmployees}
        projectDepartments={projectDepartments}
        projectNames={projectNames}
        statuses={statuses}
        weightedCompletion={weightedCompletion}
        projectTotals={projectTotals}
      />

      <SectionCard title="Top Performing Employees" icon={<Award className="w-5 h-5" />} accent="blue">
        {overview.topEmployees.length === 0 ? (
          <EmptyState icon={<Award className="w-8 h-8" />} title="No scored performance reviews yet." compact />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
            {groupTopEmployees(overview.topEmployees).map((group) => (
              <div key={group.department} className="space-y-3.5">
                <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">{group.department}</h4>
                <div className="space-y-2">
                  {group.employees.map((employee, index) => (
                    <div key={employee.reviewId} className="flex items-center justify-between bg-slate-50/50 p-2.5 px-3.5 rounded-xl border border-slate-100/50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-blue-100 text-blue-700">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 truncate">{employee.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded-md">{employee.score.toFixed(1)}/5</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <SectionCard title="Performance Trend" className="lg:col-span-3">
          {overview.trend.length === 0 ? (
            <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="No review trend data yet." compact />
          ) : (
            <TrendChart points={overview.trend} />
          )}
        </SectionCard>

        <SectionCard title="Performance Distribution" className="lg:col-span-2">
          {distributionTotal === 0 ? (
            <EmptyState icon={<Target className="w-8 h-8" />} title="No scored reviews to distribute yet." compact />
          ) : (
            <Distribution data={overview.distribution} total={distributionTotal} />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Department Performance Overview">
        {overview.departments.length === 0 ? (
          <EmptyState icon={<BriefcaseBusiness className="w-8 h-8" />} title="No departments found." compact />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {overview.departments.map((dept) => (
                <div key={dept.id || dept.name} className="bg-slate-50/60 border border-slate-100 p-3.5 rounded-2xl flex flex-col justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">{dept.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{dept.employeeCount} employees</span>
                  </div>
                  <span className="text-sm font-black text-blue-600 block mt-2 text-right">
                    {dept.averageScore === null ? 'No score' : `${dept.averageScore}/5.0`}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}

function ProjectEvidenceSection(props: {
  projectRows: EmployeeProjectMetrics[];
  filteredProjectRows: EmployeeProjectMetrics[];
  projectFilter: Record<string, string>;
  setProjectFilter: React.Dispatch<React.SetStateAction<any>>;
  projectEmployees: string[];
  projectDepartments: string[];
  projectNames: string[];
  statuses: string[];
  weightedCompletion: number;
  projectTotals: ReturnType<typeof summarizeProjects>;
}) {
  return (
    <SectionCard
      title="Project Delivery Evidence"
      icon={<BriefcaseBusiness className="w-5 h-5" />}
      accent="blue"
      action={<div className="flex items-center gap-2 text-[10px] font-bold text-slate-400"><Filter className="w-3.5 h-3.5" /><span>Supporting evidence only</span></div>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pb-4">
        {[
          { value: props.projectFilter.employee, key: 'employee', options: ['All', ...props.projectEmployees] },
          { value: props.projectFilter.department, key: 'department', options: ['All', ...props.projectDepartments] },
          { value: props.projectFilter.project, key: 'project', options: ['All', ...props.projectNames] },
          { value: props.projectFilter.period, key: 'period', options: ['Current period'] },
          { value: props.projectFilter.status, key: 'status', options: ['All', ...props.statuses] },
          { value: props.projectFilter.team, key: 'team', options: ['All', ...props.projectDepartments] },
        ].map((filter) => (
          <select
            key={filter.key}
            value={filter.value}
            onChange={(e) => props.setProjectFilter((prev: any) => ({ ...prev, [filter.key]: e.target.value }))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none focus:border-blue-400"
          >
            {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ))}
      </div>

      {props.projectRows.length === 0 ? (
        <EmptyState icon={<BriefcaseBusiness className="w-8 h-8" />} title="No project task evidence found for this period." compact />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ProjectMetric label="Weighted complete" value={`${props.weightedCompletion}%`} icon={<CheckCircle2 className="w-4 h-4" />} />
            <ProjectMetric label="Overdue tasks" value={props.projectTotals.overdueTasks} icon={<Clock className="w-4 h-4" />} tone="rose" />
            <ProjectMetric label="Blocked / reopened" value={`${props.projectTotals.blockedTasks}/${props.projectTotals.reopenedTasks}`} icon={<AlertTriangle className="w-4 h-4" />} tone="amber" />
            <ProjectMetric label="Approved work" value={props.projectTotals.approvedTasks} icon={<Award className="w-4 h-4" />} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            {props.filteredProjectRows.slice(0, 3).map((row) => (
              <div key={row.employee.id} className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="block text-xs font-black text-slate-900">{row.employee.name || row.employee.email}</span>
                    <span className="block text-[10px] font-bold text-slate-400">{row.employee.department?.name || 'Unassigned'}</span>
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{row.summary.weightedCompletionRate}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <MiniMetric label="Done" value={row.summary.completedTasks} />
                  <MiniMetric label="Late" value={row.summary.overdueTasks} />
                  <MiniMetric label="Block" value={row.summary.blockedTasks} />
                  <MiniMetric label="Reopen" value={row.summary.reopenedTasks} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}

function summarizeProjects(rows: EmployeeProjectMetrics[]) {
  return rows.reduce((acc, row) => {
    acc.assignedWeight += row.summary.assignedWeight;
    acc.completedWeight += row.summary.completedWeight;
    acc.overdueTasks += row.summary.overdueTasks;
    acc.blockedTasks += row.summary.blockedTasks;
    acc.reopenedTasks += row.summary.reopenedTasks;
    acc.approvedTasks += row.summary.approvedTasks;
    return acc;
  }, { assignedWeight: 0, completedWeight: 0, overdueTasks: 0, blockedTasks: 0, reopenedTasks: 0, approvedTasks: 0 });
}

function groupTopEmployees(employees: PerformanceOverviewResponse['topEmployees']) {
  const groups = new Map<string, PerformanceOverviewResponse['topEmployees']>();
  for (const employee of employees) {
    const existing = groups.get(employee.department) || [];
    if (existing.length < 3) existing.push(employee);
    groups.set(employee.department, existing);
  }
  return Array.from(groups.entries()).slice(0, 3).map(([department, groupEmployees]) => ({ department, employees: groupEmployees }));
}

function TrendChart({ points }: { points: Array<{ month: string; score: number }> }) {
  const width = 500;
  const height = 150;
  const chartPoints = points.map((point, index) => {
    const x = 40 + (index * (420 / Math.max(points.length - 1, 1)));
    const y = 130 - ((point.score / 5) * 110);
    return { ...point, x, y };
  });
  const path = chartPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  return (
    <div className="relative h-44 w-full pt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        <line x1="30" y1="130" x2="470" y2="130" stroke="#f1f5f9" />
        <line x1="30" y1="75" x2="470" y2="75" stroke="#e2e8f0" strokeDasharray="3 3" />
        <line x1="30" y1="20" x2="470" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
        {chartPoints.map((point) => (
          <g key={`${point.month}-${point.x}`}>
            <circle cx={point.x} cy={point.y} r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
            <text x={point.x} y={point.y - 12} fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">{point.score}</text>
            <text x={point.x} y="145" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">{point.month}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Distribution({ data, total }: { data: PerformanceOverviewResponse['distribution']; total: number }) {
  const rows = [
    { label: 'Exceeds (4.5-5.0)', value: data.exceeds, color: 'bg-blue-600' },
    { label: 'Meets (3.5-4.4)', value: data.meets, color: 'bg-blue-400' },
    { label: 'Below (2.5-3.4)', value: data.below, color: 'bg-blue-300' },
    { label: 'Needs Imp. (<2.5)', value: data.needsImprovement, color: 'bg-blue-100' },
  ];
  return (
    <div className="space-y-2 text-[11px] font-semibold py-4">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 ${row.color} rounded-full flex-shrink-0`} />
          <span className="text-slate-500 flex-1">{row.label}</span>
          <span className="text-slate-800 font-extrabold">{Math.round((row.value / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

function ProjectMetric({ label, value, icon, tone = 'blue' }: { label: string; value: string | number; icon: React.ReactNode; tone?: 'blue' | 'rose' | 'amber' }) {
  const toneClass = tone === 'rose' ? 'text-rose-600 bg-rose-50' : tone === 'amber' ? 'text-amber-700 bg-amber-50' : 'text-blue-600 bg-blue-50';
  return (
    <div className="border border-slate-100 rounded-xl p-3 bg-white flex items-center justify-between">
      <div>
        <span className="block text-[10px] font-black uppercase text-slate-400">{label}</span>
        <span className="block text-lg font-black text-slate-950 mt-1">{value}</span>
      </div>
      <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${toneClass}`}>{icon}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-slate-100 rounded-lg py-2">
      <span className="block text-xs font-black text-slate-900">{value}</span>
      <span className="block text-[9px] font-bold text-slate-400 uppercase">{label}</span>
    </div>
  );
}
