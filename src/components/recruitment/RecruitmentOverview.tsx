/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'motion/react';
import { Calendar, TrendingUp, Users, BriefcaseBusiness } from 'lucide-react';
import { useLegacyUser } from '../../api/legacyUserStore';
import { useEmployees } from '../../hooks/useHrRecords';
import { useInterviews, useJobApplications, useJobRequests } from '../../hooks/useJobRequests';
import AttendanceShortcutCard from '../attendance/AttendanceShortcutCard';
import { StatCard, StatCardGrid, SectionCard } from '@/components/ui/blih';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface RecruitmentOverviewProps {
  onNavigateToTab: (tabId: string) => void;
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const funnelStages = new Set(['shortlisted', 'interview', 'waitlisted', 'offer', 'hired']);
const offerStages = new Set(['offer', 'hired']);
const activePostingStatuses = new Set(['open', 'active', 'published']);

const lineChartConfig = {
  applications: { label: 'Applications', color: '#2563eb' },
  interviews: { label: 'Interviews', color: '#06b6d4' },
  hires: { label: 'Hires', color: '#84cc16' },
} satisfies ChartConfig;

const jobChartConfig = {
  applications: { label: 'Applications', color: '#2563eb' },
  shortlisted: { label: 'Shortlisted', color: '#22c55e' },
  offers: { label: 'Offers', color: '#f59e0b' },
} satisfies ChartConfig;

const salaryChartConfig = {
  employees: { label: 'Employees', color: '#2563eb' },
} satisfies ChartConfig;

const experienceChartConfig = {
  employees: { label: 'Employees', color: '#2563eb' },
} satisfies ChartConfig;

const genderChartConfig = {
  male: { label: 'Male', color: '#2563eb' },
  female: { label: 'Female', color: '#60a5fa' },
} satisfies ChartConfig;

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

function getRecordDate(record: any) {
  const raw = record?.createdAt || record?.submittedAt || record?.appliedAt || record?.requestedDate || record?.updatedAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getJobTitle(record: any, jobById: Map<string, any>) {
  const directTitle = record?.job?.title || record?.jobRequest?.title || record?.jobOpening?.title || record?.jobTitle || record?.title;
  if (directTitle) return directTitle;

  const jobId = record?.jobId || record?.jobRequestId || record?.jobOpeningId || record?.job?.id || record?.jobRequest?.id || record?.jobOpening?.id;
  return jobId ? jobById.get(jobId)?.title : undefined;
}

function getEmployeeSalary(employee: any) {
  const value = employee?.salary || employee?.baseSalary || employee?.compensation?.salary || employee?.profile?.salary;
  const numeric = Number(String(value ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function getEmployeeExperience(employee: any) {
  return employee?.experience || employee?.experienceLevel || employee?.profile?.experience || employee?.metadata?.experience;
}

function getEmployeeGender(employee: any) {
  return employee?.gender || employee?.profile?.gender || employee?.metadata?.gender;
}

export default function RecruitmentOverview({ onNavigateToTab: _onNavigateToTab }: RecruitmentOverviewProps) {
  const [selectedJob, setSelectedJob] = useState<string>('');
  const legacyUser = useLegacyUser();
  const isEmployee = legacyUser?.role === 'Employee';
  const jobRequestsQuery = useJobRequests({ includePublished: true });
  const applicationsQuery = useJobApplications();
  const interviewsQuery = useInterviews();
  const employeesQuery = useEmployees({ limit: 500, offset: 0 });

  const jobRequests = jobRequestsQuery.data?.rows ?? [];
  const applications = applicationsQuery.data ?? [];
  const interviews = interviewsQuery.data ?? [];
  const employees = employeesQuery.data?.employees ?? [];

  const jobById = useMemo(() => new Map(jobRequests.map((job: any) => [job.id, job])), [jobRequests]);

  const applicationTrendData = useMemo(() => {
    const rows = monthLabels.map((month) => ({ month, applications: 0, interviews: 0, hires: 0 }));

    applications.forEach((application: any) => {
      const date = getRecordDate(application);
      if (!date) return;
      rows[date.getMonth()].applications += 1;
      if (application.stage === 'hired') rows[date.getMonth()].hires += 1;
    });

    interviews.forEach((interview: any) => {
      const date = getRecordDate(interview) || (interview?.interviewAt ? new Date(interview.interviewAt) : null);
      if (!date || Number.isNaN(date.getTime())) return;
      rows[date.getMonth()].interviews += 1;
    });

    return rows;
  }, [applications, interviews]);

  const frequentlyPostedJobs = useMemo(() => {
    const counts = new Map<string, number>();
    jobRequests.forEach((job: any) => {
      if (!job.title) return;
      counts.set(job.title, (counts.get(job.title) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([title, count]) => ({ id: title, title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [jobRequests]);

  const jobAnalyticsData = useMemo(() => {
    const titles = new Set<string>();
    jobRequests.forEach((job: any) => job.title && titles.add(job.title));
    applications.forEach((application: any) => {
      const title = getJobTitle(application, jobById);
      if (title) titles.add(title);
    });

    const analytics = [...titles].reduce<Record<string, { month: string; applications: number; shortlisted: number; offers: number }[]>>((acc, title) => {
      acc[title] = monthLabels.map((month) => ({ month, applications: 0, shortlisted: 0, offers: 0 }));
      return acc;
    }, {});

    applications.forEach((application: any) => {
      const title = getJobTitle(application, jobById);
      const date = getRecordDate(application);
      if (!title || !date || !analytics[title]) return;

      const row = analytics[title][date.getMonth()];
      row.applications += 1;
      if (funnelStages.has(application.stage)) row.shortlisted += 1;
      if (offerStages.has(application.stage)) row.offers += 1;
    });

    return analytics;
  }, [applications, jobById, jobRequests]);

  const jobOptions = Object.keys(jobAnalyticsData);
  const activeSelectedJob = selectedJob || jobOptions[0] || 'No job data';

  const pendingRequests = jobRequests.filter((job: any) => job.status === 'pending').length;
  const activeRecruitments = jobRequests.filter((job: any) => activePostingStatuses.has(job.postingStatus) || job.isPosted).length;

  const salaryData = useMemo(() => {
    const buckets = [
      { range: '<10k', min: 0, max: 9999, fill: '#60a5fa' },
      { range: '10-15k', min: 10000, max: 15000, fill: '#2563eb' },
      { range: '15-20k', min: 15001, max: 20000, fill: '#84cc16' },
      { range: '>20k', min: 20001, max: Infinity, fill: '#facc15' },
    ];

    return buckets.map((bucket) => ({
      range: bucket.range,
      employees: employees.filter((employee: any) => {
        const actualSalary = getEmployeeSalary(employee);
        if (actualSalary === null) return false;
        return actualSalary >= bucket.min && actualSalary <= bucket.max;
      }).length,
      fill: bucket.fill,
    }));
  }, [employees]);

  const experienceData = useMemo(() => {
    const ranges = ['0-2 yr', '3-5 yr', '5-10 yr', '10+ yr'];
    const colors = ['#84cc16', '#2563eb', '#facc15', '#60a5fa'];

    return ranges.map((range, index) => ({
      range: range.replace(' yr', ''),
      employees: employees.filter((employee: any) => getEmployeeExperience(employee) === range).length,
      fill: colors[index],
    }));
  }, [employees]);

  const genderData = useMemo(() => {
    const male = employees.filter((employee: any) => `${getEmployeeGender(employee)}`.toLowerCase() === 'male').length;
    const female = employees.filter((employee: any) => `${getEmployeeGender(employee)}`.toLowerCase() === 'female').length;

    return [
      { gender: 'male', employees: male, fill: 'var(--color-male)' },
      { gender: 'female', employees: female, fill: 'var(--color-female)' },
    ];
  }, [employees]);

  const totalEmployees = employeesQuery.data?.total ?? employees.length;
  const selectedJobData = jobAnalyticsData[activeSelectedJob] ?? monthLabels.map((month) => ({ month, applications: 0, shortlisted: 0, offers: 0 }));

  return (
    <motion.div
      id="recruitment-overview-view"
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {isEmployee && (
        <div className="max-w-xl">
          <AttendanceShortcutCard />
        </div>
      )}

      <StatCardGrid cols={3}>
        <StatCard label="Pending Requests" value={pendingRequests} icon={<Calendar className="w-5 h-5" />} tone="blue" />
        <StatCard label="Active Recruitments" value={activeRecruitments} icon={<TrendingUp className="w-5 h-5" />} tone="cyan" />
        <StatCard label="Total Employees" value={totalEmployees} icon={<Users className="w-5 h-5" />} tone="violet" />
      </StatCardGrid>

      <motion.div {...cardMotion}>
        <SectionCard title="Application Pipeline Trend">
          <ChartContainer config={lineChartConfig} className="h-[290px] w-full">
            <AreaChart data={applicationTrendData} margin={{ top: 16, right: 18, left: -16, bottom: 6 }}>
              <defs>
                <linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-applications)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="var(--color-applications)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="4 6" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={34} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area type="monotone" dataKey="applications" stroke="var(--color-applications)" fill="url(#applicationsFill)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="interviews" stroke="var(--color-interviews)" strokeWidth={2.5} dot={{ r: 3.5 }} />
              <Line type="monotone" dataKey="hires" stroke="var(--color-hires)" strokeWidth={2.5} dot={{ r: 3.5 }} />
            </AreaChart>
          </ChartContainer>
        </SectionCard>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div className="lg:col-span-7" {...cardMotion} transition={{ duration: 0.35, delay: 0.05 }}>
          <SectionCard title="Frequently Posted Jobs">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
              {frequentlyPostedJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => job.title in jobAnalyticsData && setSelectedJob(job.title)}
                  className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between text-left hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                >
                  <p className="text-[10px] font-bold text-slate-500 leading-tight uppercase line-clamp-2">{job.title}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-blue-600">{job.count}</span>
                    <span className="text-[10px] font-bold text-slate-400">posts</span>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        <motion.div
          className="lg:col-span-5 bg-blue-50 rounded-2xl border border-blue-100 p-6 shadow-sm flex flex-col justify-between"
          {...cardMotion}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
                <BriefcaseBusiness className="w-4 h-4" />
              </span>
              <h4 className="text-[13px] font-extrabold text-blue-800 tracking-tight">Job Performance Analytics</h4>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mb-6">
              Review applications, shortlist volume, and offers by role for the current hiring year.
            </p>
          </div>

          <div className="space-y-1.5 focus-within:text-blue-600">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose job</label>
            <select
              value={activeSelectedJob === 'No job data' ? '' : activeSelectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-xs text-slate-800 font-semibold focus:outline-none transition-all shadow-xs cursor-pointer"
            >
              {Object.keys(jobAnalyticsData).map((job) => (
                <option key={job} value={job}>{job}</option>
              ))}
            </select>
          </div>
        </motion.div>
      </div>

      <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.15 }}>
        <SectionCard title={`${activeSelectedJob} Hiring Funnel`}>
          <ChartContainer config={jobChartConfig} className="h-[300px] w-full">
            <LineChart data={selectedJobData} margin={{ top: 16, right: 18, left: -16, bottom: 6 }}>
              <CartesianGrid vertical={false} strokeDasharray="4 6" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={12} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={34} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line type="monotone" dataKey="applications" stroke="var(--color-applications)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="shortlisted" stroke="var(--color-shortlisted)" strokeWidth={2.5} dot={{ r: 3.5 }} />
              <Line type="monotone" dataKey="offers" stroke="var(--color-offers)" strokeWidth={2.5} dot={{ r: 3.5 }} />
            </LineChart>
          </ChartContainer>
        </SectionCard>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.2 }}>
          <SectionCard title="Salary Distribution">
            <ChartContainer config={salaryChartConfig} className="h-[180px] w-full">
              <BarChart data={salaryData} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="employees" radius={[7, 7, 0, 0]}>
                  {salaryData.map((entry) => <Cell key={entry.range} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </SectionCard>
        </motion.div>

        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.25 }}>
          <SectionCard title="Gender Distribution">
            <ChartContainer config={genderChartConfig} className="mx-auto h-[180px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie data={genderData} dataKey="employees" nameKey="gender" innerRadius={48} outerRadius={70} strokeWidth={4}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-xl font-extrabold">
                              {totalEmployees}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-slate-400 text-[10px] font-bold uppercase">
                              Employees
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </SectionCard>
        </motion.div>

        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.3 }}>
          <SectionCard title="Experience Distribution">
            <ChartContainer config={experienceChartConfig} className="h-[180px] w-full">
              <BarChart data={experienceData} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="employees" radius={[7, 7, 0, 0]}>
                  {experienceData.map((entry) => <Cell key={entry.range} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </SectionCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
