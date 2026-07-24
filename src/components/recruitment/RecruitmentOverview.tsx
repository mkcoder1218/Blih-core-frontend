/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SectionCard } from '@/components/ui/blih';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Activity,
  BriefcaseBusiness,
  CalendarCheck,
  Clock3,
  FileText,
  Gauge,
  Send,
  Timer,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { useInterviews, useJobApplications, useJobRequests } from '../../hooks/useJobRequests';
import { KpiCard } from './RecruitmentRequestParts';

interface RecruitmentOverviewProps {
  onNavigateToTab: (tabId: string) => void;
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const activePostingStatuses = new Set(['open', 'active', 'published']);
const reviewStages = new Set(['', 'applied', 'new', 'screening', 'review', 'pending_review']);
const interviewStages = new Set(['interview', 'interview_scheduled', 'scheduled']);
const shortlistStages = new Set(['shortlisted', 'waitlisted']);
const offerStages = new Set(['offer', 'offered']);

const trendChartConfig = {
  applications: { label: 'Applications', color: '#2563eb' },
  interviews: { label: 'Interviews', color: '#06b6d4' },
  hires: { label: 'Hires', color: '#84cc16' },
} satisfies ChartConfig;

const pipelineChartConfig = {
  count: { label: 'Candidates', color: '#2563eb' },
} satisfies ChartConfig;

const statusChartConfig = {
  active: { label: 'Active', color: '#2563eb' },
  pending: { label: 'Pending', color: '#f59e0b' },
  closed: { label: 'Closed', color: '#94a3b8' },
} satisfies ChartConfig;

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

function normalizeStage(value: unknown) {
  return `${value ?? ''}`.toLowerCase().trim();
}

function getRecordDate(record: any) {
  const raw =
    record?.createdAt ||
    record?.submittedAt ||
    record?.appliedAt ||
    record?.requestedDate ||
    record?.updatedAt ||
    record?.interviewAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getApplicationJobId(application: any) {
  return (
    application?.jobId ||
    application?.jobRequestId ||
    application?.jobOpeningId ||
    application?.job?.id ||
    application?.jobRequest?.id ||
    application?.jobOpening?.id ||
    application?.JobOpening?.id
  );
}

function daysBetween(start: Date | null, end: Date | null) {
  if (!start || !end || end < start) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000));
}

function averageDays(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function isSameMonth(date: Date | null, offset = 0) {
  if (!date) return false;
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return date.getMonth() === target.getMonth() && date.getFullYear() === target.getFullYear();
}

function trendLabel(current: number, previous: number) {
  if (!previous && !current) return 'No change';
  if (!previous) return 'New this month';
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change >= 0 ? '+' : ''}${change}% vs last month`;
}

function ratio(current: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

function EmptyAnalytics({ title }: { title: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
      <p className="text-xs font-bold text-slate-500">{title}</p>
    </div>
  );
}

function MetricGauge({ label, value, total, tone }: { label: string; value: number; total: number; tone: string }) {
  const percentage = ratio(value, total);

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black leading-none text-slate-900">{value}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>{percentage}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-900 transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-[10px] font-semibold text-slate-400">Share of total applications</p>
    </div>
  );
}

export default function RecruitmentOverview({ onNavigateToTab }: RecruitmentOverviewProps) {
  const jobRequestsQuery = useJobRequests({ includePublished: true });
  const applicationsQuery = useJobApplications();
  const interviewsQuery = useInterviews();

  const jobRequests = jobRequestsQuery.data?.rows ?? [];
  const applications = applicationsQuery.data ?? [];
  const interviews = interviewsQuery.data ?? [];

  const scheduledApplicationIds = useMemo(
    () =>
      new Set(
        interviews
          .map((interview: any) => interview?.jobApplicationId || interview?.JobApplication?.id)
          .filter(Boolean),
      ),
    [interviews],
  );

  const activeRecruitments = jobRequests.filter(
    (job: any) => activePostingStatuses.has(normalizeStage(job.postingStatus)) || job.isPosted,
  ).length;
  const pendingReviews = applications.filter((application: any) => reviewStages.has(normalizeStage(application.stage))).length;
  const interviewsScheduled = interviews.filter((interview: any) =>
    ['scheduled', 'pending_acceptance'].includes(normalizeStage(interview.status)),
  ).length;
  const offersPending = applications.filter((application: any) => offerStages.has(normalizeStage(application.stage))).length;
  const hiresThisMonth = applications.filter(
    (application: any) => normalizeStage(application.stage) === 'hired' && isSameMonth(getRecordDate(application)),
  ).length;

  const applicationTrendData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const rows = monthLabels.map((month) => ({ month, applications: 0, interviews: 0, hires: 0 }));

    applications.forEach((application: any) => {
      const date = getRecordDate(application);
      if (!date || date.getFullYear() !== currentYear) return;
      rows[date.getMonth()].applications += 1;
      if (normalizeStage(application.stage) === 'hired') rows[date.getMonth()].hires += 1;
    });

    interviews.forEach((interview: any) => {
      const date = interview?.interviewAt ? new Date(interview.interviewAt) : getRecordDate(interview);
      if (!date || Number.isNaN(date.getTime()) || date.getFullYear() !== currentYear) return;
      rows[date.getMonth()].interviews += 1;
    });

    return rows;
  }, [applications, interviews]);

  const pipelineData = useMemo(() => {
    const stages = [
      {
        stage: 'Applied',
        count: applications.filter((application: any) => ['applied', 'new', ''].includes(normalizeStage(application.stage))).length,
      },
      {
        stage: 'Screening',
        count: applications.filter((application: any) => ['screening', 'review', 'pending_review'].includes(normalizeStage(application.stage))).length,
      },
      {
        stage: 'Interview',
        count: applications.filter(
          (application: any) => interviewStages.has(normalizeStage(application.stage)) || scheduledApplicationIds.has(application.id),
        ).length,
      },
      {
        stage: 'Shortlisted',
        count: applications.filter((application: any) => shortlistStages.has(normalizeStage(application.stage))).length,
      },
      {
        stage: 'Offered',
        count: applications.filter((application: any) => offerStages.has(normalizeStage(application.stage))).length,
      },
      {
        stage: 'Hired',
        count: applications.filter((application: any) => normalizeStage(application.stage) === 'hired').length,
      },
    ];

    return stages.map((stage, index) => ({
      ...stage,
      conversion: index === 0 ? 100 : ratio(stage.count, stages[index - 1].count),
    }));
  }, [applications, scheduledApplicationIds]);

  const recruitmentStatusData = useMemo(() => {
    const active = jobRequests.filter(
      (job: any) => activePostingStatuses.has(normalizeStage(job.postingStatus)) || job.isPosted,
    ).length;
    const closed = jobRequests.filter((job: any) =>
      ['closed', 'filled', 'cancelled', 'rejected'].includes(normalizeStage(job.postingStatus || job.status)),
    ).length;
    const pending = Math.max(0, jobRequests.length - active - closed);

    return [
      { name: 'Active', value: active, fill: 'var(--color-active)' },
      { name: 'Pending', value: pending, fill: 'var(--color-pending)' },
      { name: 'Closed', value: closed, fill: 'var(--color-closed)' },
    ];
  }, [jobRequests]);

  const applicationDistribution = useMemo(() => {
    const counts = new Map<string, number>();

    applications.forEach((application: any) => {
      const jobId = getApplicationJobId(application);
      const job = jobRequests.find((row: any) => row.id === jobId);
      const title =
        application?.job?.title ||
        application?.jobRequest?.title ||
        application?.jobOpening?.title ||
        application?.JobOpening?.title ||
        application?.jobTitle ||
        job?.title ||
        'Unassigned';
      counts.set(title, (counts.get(title) ?? 0) + 1);
    });

    return [...counts.entries()]
      .map(([job, count]) => ({ job, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [applications, jobRequests]);

  const hiringSpeed = useMemo(() => {
    const reviewDays = applications.map((application: any) =>
      daysBetween(
        getRecordDate(application),
        application.updatedAt ? new Date(application.updatedAt) : getRecordDate(application),
      ),
    );
    const interviewDays = interviews.map((interview: any) =>
      daysBetween(
        getRecordDate(interview?.JobApplication) || getRecordDate(interview),
        interview?.interviewAt ? new Date(interview.interviewAt) : getRecordDate(interview),
      ),
    );
    const hireDays = applications
      .filter((application: any) => normalizeStage(application.stage) === 'hired')
      .map((application: any) =>
        daysBetween(
          getRecordDate(application),
          application.updatedAt ? new Date(application.updatedAt) : getRecordDate(application),
        ),
      );
    const acceptedOffers = applications.filter((application: any) => normalizeStage(application.stage) === 'hired').length;
    const totalOffers = applications.filter(
      (application: any) => offerStages.has(normalizeStage(application.stage)) || normalizeStage(application.stage) === 'hired',
    ).length;

    return [
      { label: 'Average review time', value: averageDays(reviewDays), suffix: 'days' },
      { label: 'Average interview time', value: averageDays(interviewDays), suffix: 'days' },
      { label: 'Average time to hire', value: averageDays(hireDays), suffix: 'days' },
      {
        label: 'Offer acceptance',
        value: totalOffers ? Math.round((acceptedOffers / totalOffers) * 100) : null,
        suffix: '%',
      },
    ];
  }, [applications, interviews]);

  const unscheduledShortlists = applications.filter(
    (application: any) => shortlistStages.has(normalizeStage(application.stage)) && !scheduledApplicationIds.has(application.id),
  ).length;
  const inactiveRecruitments = jobRequests.filter((job: any) => {
    if (!activePostingStatuses.has(normalizeStage(job.postingStatus)) && !job.isPosted) return false;
    const activityDate = getRecordDate(job);
    return !activityDate || (daysBetween(activityDate, new Date()) ?? 0) > 14;
  }).length;

  const kpis = [
    {
      label: 'Active Recruitments',
      value: activeRecruitments,
      icon: BriefcaseBusiness,
      tab: 'active_posting',
      trend: `${jobRequests.filter((job: any) => normalizeStage(job.status) === 'approved').length} approved`,
    },
    {
      label: 'Total Applications',
      value: applications.length,
      icon: FileText,
      tab: 'active_posting',
      trend: trendLabel(
        applications.filter((application: any) => isSameMonth(getRecordDate(application))).length,
        applications.filter((application: any) => isSameMonth(getRecordDate(application), -1)).length,
      ),
    },
    {
      label: 'Pending Reviews',
      value: pendingReviews,
      icon: Clock3,
      tab: 'active_posting',
      trend: pendingReviews ? 'Needs review' : 'Clear',
    },
    {
      label: 'Interviews Scheduled',
      value: interviewsScheduled,
      icon: CalendarCheck,
      tab: 'my_interviews',
      trend: trendLabel(
        interviews.filter((interview: any) => isSameMonth(getRecordDate(interview))).length,
        interviews.filter((interview: any) => isSameMonth(getRecordDate(interview), -1)).length,
      ),
    },
    {
      label: 'Offers Pending',
      value: offersPending,
      icon: Send,
      tab: 'offers',
      trend: offersPending ? 'Awaiting response' : 'No pending offers',
    },
    {
      label: 'Hires This Month',
      value: hiresThisMonth,
      icon: UserCheck,
      tab: 'ongoing_recruitment',
      trend: trendLabel(
        hiresThisMonth,
        applications.filter(
          (application: any) => normalizeStage(application.stage) === 'hired' && isSameMonth(getRecordDate(application), -1),
        ).length,
      ),
    },
  ];

  return (
    <motion.div
      id="recruitment-overview-view"
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            trend={kpi.trend}
            onClick={() => onNavigateToTab(kpi.tab)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.div className="xl:col-span-8" {...cardMotion}>
          <SectionCard title="Recruitment Activity Trend" icon={<Activity className="h-4 w-4" />} padding="sm">
            {applications.length || interviews.length ? (
              <ChartContainer config={trendChartConfig} className="h-[320px] w-full">
                <AreaChart data={applicationTrendData} margin={{ top: 16, right: 16, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-applications)" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="var(--color-applications)" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="interviewsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-interviews)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--color-interviews)" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={38} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent className="pt-2" />} />
                  <Area type="monotone" dataKey="applications" stroke="var(--color-applications)" fill="url(#applicationsFill)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="interviews" stroke="var(--color-interviews)" fill="url(#interviewsFill)" strokeWidth={2.25} />
                  <Area type="monotone" dataKey="hires" stroke="var(--color-hires)" fill="transparent" strokeWidth={2.25} />
                </AreaChart>
              </ChartContainer>
            ) : (
              <EmptyAnalytics title="No recruitment trend data yet." />
            )}
          </SectionCard>
        </motion.div>

        <motion.div className="xl:col-span-4" {...cardMotion} transition={{ duration: 0.35, delay: 0.05 }}>
          <SectionCard title="Recruitment Status Mix" icon={<Gauge className="h-4 w-4" />} padding="sm">
            {jobRequests.length ? (
              <ChartContainer config={statusChartConfig} className="h-[320px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={recruitmentStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={105}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {recruitmentStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <EmptyAnalytics title="No recruitment status data yet." />
            )}
          </SectionCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <motion.div className="xl:col-span-7" {...cardMotion} transition={{ duration: 0.35, delay: 0.1 }}>
          <SectionCard title="Candidate Pipeline" icon={<UsersRound className="h-4 w-4" />} padding="sm">
            {applications.length ? (
              <ChartContainer config={pipelineChartConfig} className="h-[310px] w-full">
                <BarChart data={pipelineData} margin={{ top: 18, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 6" />
                  <XAxis dataKey="stage" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 2, 2]} maxBarSize={54} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyAnalytics title="No candidate pipeline data yet." />
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 md:grid-cols-6">
              {pipelineData.map((stage) => (
                <div key={stage.stage} className="rounded-lg bg-slate-50 px-2 py-2 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{stage.stage}</p>
                  <p className="mt-1 text-xs font-black text-slate-700">{stage.conversion}%</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        <motion.div className="xl:col-span-5" {...cardMotion} transition={{ duration: 0.35, delay: 0.15 }}>
          <SectionCard title="Applications by Position" icon={<BriefcaseBusiness className="h-4 w-4" />} padding="sm">
            {applicationDistribution.length ? (
              <ChartContainer config={pipelineChartConfig} className="h-[360px] w-full">
                <BarChart data={applicationDistribution} layout="vertical" margin={{ top: 8, right: 18, left: 10, bottom: 0 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="4 6" />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="job"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 10 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[2, 8, 8, 2]} maxBarSize={30} />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyAnalytics title="No application distribution data yet." />
            )}
          </SectionCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.2 }}>
          <SectionCard title="Hiring Efficiency" icon={<Timer className="h-4 w-4" />} padding="sm">
            <div className="grid grid-cols-2 gap-3">
              {hiringSpeed.map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{metric.label}</p>
                  <p className="mt-3 text-3xl font-black leading-none text-slate-900">
                    {metric.value === null ? '—' : metric.value}
                    {metric.value !== null && <span className="ml-1 text-xs font-bold text-slate-400">{metric.suffix}</span>}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.25 }}>
          <SectionCard title="Recruitment Workload" icon={<Gauge className="h-4 w-4" />} padding="sm">
            <div className="grid grid-cols-2 gap-3">
              <MetricGauge label="Waiting for review" value={pendingReviews} total={applications.length} tone="bg-amber-50 text-amber-700" />
              <MetricGauge label="Need scheduling" value={unscheduledShortlists} total={applications.length} tone="bg-blue-50 text-blue-700" />
              <MetricGauge label="Offers pending" value={offersPending} total={applications.length} tone="bg-violet-50 text-violet-700" />
              <MetricGauge label="Inactive recruitments" value={inactiveRecruitments} total={Math.max(jobRequests.length, 1)} tone="bg-rose-50 text-rose-700" />
            </div>
          </SectionCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
