/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  Timer,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { useLegacyUser } from '../../api/legacyUserStore';
import { useInterviews, useJobApplications, useJobRequests } from '../../hooks/useJobRequests';
import AttendanceShortcutCard from '../attendance/AttendanceShortcutCard';
import { SectionCard } from '@/components/ui/blih';
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
const activePostingStatuses = new Set(['open', 'active', 'published']);
const reviewStages = new Set(['', 'applied', 'new', 'screening', 'review', 'pending_review']);
const interviewStages = new Set(['interview', 'interview_scheduled', 'scheduled']);
const shortlistStages = new Set(['shortlisted', 'waitlisted']);
const offerStages = new Set(['offer', 'offered']);

const lineChartConfig = {
  applications: { label: 'Applications', color: '#2563eb' },
  interviews: { label: 'Interviews', color: '#06b6d4' },
  hires: { label: 'Hires', color: '#84cc16' },
} satisfies ChartConfig;

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' },
};

function normalizeStage(value: any) {
  return `${value ?? ''}`.toLowerCase().trim();
}

function getRecordDate(record: any) {
  const raw = record?.createdAt || record?.submittedAt || record?.appliedAt || record?.requestedDate || record?.updatedAt || record?.interviewAt;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getActivityDate(record: any) {
  const raw = record?.updatedAt || record?.interviewAt || record?.createdAt || record?.submittedAt || record?.appliedAt || record?.requestedDate;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getJobTitle(record: any, jobById: Map<string, any>) {
  const directTitle = record?.job?.title || record?.jobRequest?.title || record?.jobOpening?.title || record?.JobOpening?.title || record?.jobTitle || record?.title;
  if (directTitle) return directTitle;

  const jobId = record?.jobId || record?.jobRequestId || record?.jobOpeningId || record?.job?.id || record?.jobRequest?.id || record?.jobOpening?.id || record?.JobOpening?.id;
  return jobId ? jobById.get(jobId)?.title : undefined;
}

function getCandidateName(record: any) {
  return record?.fullName || record?.candidateName || record?.metadata?.fullName || record?.JobApplication?.fullName || 'Candidate';
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(value)
    : 'No activity';
}

function daysBetween(start: Date | null, end: Date | null) {
  if (!start || !end || end < start) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
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

function formatPercent(current: number, previous: number) {
  if (!previous) return current ? '100%' : '0%';
  return `${Math.round((current / previous) * 100)}%`;
}

function EmptyMessage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-5 text-center">
      <p className="text-xs font-bold text-slate-500">{title}</p>
    </div>
  );
}

export default function RecruitmentOverview({ onNavigateToTab }: RecruitmentOverviewProps) {
  const legacyUser = useLegacyUser();
  const isEmployee = legacyUser?.role === 'Employee';
  const jobRequestsQuery = useJobRequests({ includePublished: true });
  const applicationsQuery = useJobApplications();
  const interviewsQuery = useInterviews();

  const jobRequests = jobRequestsQuery.data?.rows ?? [];
  const applications = applicationsQuery.data ?? [];
  const interviews = interviewsQuery.data ?? [];
  const jobById = useMemo(() => new Map(jobRequests.map((job: any) => [job.id, job])), [jobRequests]);
  const scheduledApplicationIds = useMemo(() => new Set(interviews.map((interview: any) => interview?.jobApplicationId || interview?.JobApplication?.id).filter(Boolean)), [interviews]);

  const activeRecruitments = jobRequests.filter((job: any) => activePostingStatuses.has(job.postingStatus) || job.isPosted).length;
  const pendingReviews = applications.filter((application: any) => reviewStages.has(normalizeStage(application.stage))).length;
  const interviewsScheduled = interviews.filter((interview: any) => ['scheduled', 'pending_acceptance'].includes(normalizeStage(interview.status))).length;
  const offersPending = applications.filter((application: any) => offerStages.has(normalizeStage(application.stage))).length;
  const hiresThisMonth = applications.filter((application: any) => normalizeStage(application.stage) === 'hired' && isSameMonth(getRecordDate(application))).length;

  const applicationTrendData = useMemo(() => {
    const rows = monthLabels.map((month) => ({ month, applications: 0, interviews: 0, hires: 0 }));

    applications.forEach((application: any) => {
      const date = getRecordDate(application);
      if (!date) return;
      rows[date.getMonth()].applications += 1;
      if (normalizeStage(application.stage) === 'hired') rows[date.getMonth()].hires += 1;
    });

    interviews.forEach((interview: any) => {
      const date = getRecordDate(interview) || (interview?.interviewAt ? new Date(interview.interviewAt) : null);
      if (!date || Number.isNaN(date.getTime())) return;
      rows[date.getMonth()].interviews += 1;
    });

    return rows;
  }, [applications, interviews]);

  const pipelineData = useMemo(() => {
    const applied = applications.filter((application: any) => ['applied', 'new', ''].includes(normalizeStage(application.stage))).length;
    const screening = applications.filter((application: any) => ['screening', 'review', 'pending_review'].includes(normalizeStage(application.stage))).length;
    const interview = applications.filter((application: any) => interviewStages.has(normalizeStage(application.stage)) || scheduledApplicationIds.has(application.id)).length;
    const shortlisted = applications.filter((application: any) => shortlistStages.has(normalizeStage(application.stage))).length;
    const offered = applications.filter((application: any) => offerStages.has(normalizeStage(application.stage))).length;
    const hired = applications.filter((application: any) => normalizeStage(application.stage) === 'hired').length;
    const stages = [
      { stage: 'Applied', count: applied, color: 'bg-blue-600' },
      { stage: 'Screening', count: screening, color: 'bg-cyan-500' },
      { stage: 'Interview', count: interview, color: 'bg-indigo-500' },
      { stage: 'Shortlisted', count: shortlisted, color: 'bg-emerald-500' },
      { stage: 'Offered', count: offered, color: 'bg-amber-500' },
      { stage: 'Hired', count: hired, color: 'bg-violet-500' },
    ];

    return stages.map((stage, index) => ({
      ...stage,
      conversion: index === 0 ? '100%' : formatPercent(stage.count, stages[index - 1].count),
    }));
  }, [applications, scheduledApplicationIds]);

  const jobPerformance = useMemo(() => {
    const titles = new Set<string>();
    jobRequests.forEach((job: any) => job.title && titles.add(job.title));
    applications.forEach((application: any) => {
      const title = getJobTitle(application, jobById);
      if (title) titles.add(title);
    });

    return [...titles].map((title) => {
      const jobRows = jobRequests.filter((job: any) => job.title === title);
      const jobApps = applications.filter((application: any) => getJobTitle(application, jobById) === title);
      const jobInterviews = interviews.filter((interview: any) => getJobTitle(interview, jobById) === title || getJobTitle(interview?.JobApplication, jobById) === title);
      const dates = [...jobRows, ...jobApps, ...jobInterviews].map(getActivityDate).filter(Boolean) as Date[];
      const hires = jobApps.filter((application: any) => normalizeStage(application.stage) === 'hired').length;
      const status = jobRows.find((job: any) => activePostingStatuses.has(job.postingStatus) || job.isPosted)?.postingStatus || jobRows[0]?.status || 'No posting';

      return {
        title,
        applications: jobApps.length,
        interviews: jobInterviews.length,
        shortlisted: jobApps.filter((application: any) => shortlistStages.has(normalizeStage(application.stage))).length,
        offers: jobApps.filter((application: any) => offerStages.has(normalizeStage(application.stage))).length,
        hires,
        conversion: formatPercent(hires, jobApps.length),
        status,
        lastActivity: dates.length ? new Date(Math.max(...dates.map((date) => date.getTime()))) : null,
      };
    }).sort((a, b) => (b.lastActivity?.getTime() ?? 0) - (a.lastActivity?.getTime() ?? 0));
  }, [applications, interviews, jobById, jobRequests]);

  const staleRecruitments = jobPerformance.filter((job) => {
    if (!['open', 'active', 'published', 'approved'].includes(normalizeStage(job.status))) return false;
    if (!job.lastActivity) return true;
    return daysBetween(job.lastActivity, new Date())! > 14;
  }).length;

  const attentionItems = [
    { label: 'Applications waiting for review', value: pendingReviews, tab: 'active_posting', tone: 'text-amber-600' },
    {
      label: 'Interviews that need scheduling',
      value: applications.filter((application: any) => shortlistStages.has(normalizeStage(application.stage)) && !scheduledApplicationIds.has(application.id)).length,
      tab: 'ongoing_recruitment',
      tone: 'text-blue-600',
    },
    { label: 'Offers awaiting responses', value: offersPending, tab: 'offers', tone: 'text-violet-600' },
    { label: 'Recruitments with no recent activity', value: staleRecruitments, tab: 'ongoing_recruitment', tone: 'text-rose-600' },
  ];

  const hiringSpeed = useMemo(() => {
    const reviewDays = applications.map((application: any) => daysBetween(getRecordDate(application), application.updatedAt ? new Date(application.updatedAt) : getRecordDate(application)));
    const interviewDays = interviews.map((interview: any) => daysBetween(getRecordDate(interview?.JobApplication) || getRecordDate(interview), interview?.interviewAt ? new Date(interview.interviewAt) : getRecordDate(interview)));
    const hireDays = applications
      .filter((application: any) => normalizeStage(application.stage) === 'hired')
      .map((application: any) => daysBetween(getRecordDate(application), application.updatedAt ? new Date(application.updatedAt) : getRecordDate(application)));
    const acceptedOffers = applications.filter((application: any) => normalizeStage(application.stage) === 'hired').length;
    const totalOffers = applications.filter((application: any) => offerStages.has(normalizeStage(application.stage)) || normalizeStage(application.stage) === 'hired').length;

    return [
      { label: 'Avg time to review', value: averageDays(reviewDays), suffix: 'days' },
      { label: 'Avg time to interview', value: averageDays(interviewDays), suffix: 'days' },
      { label: 'Avg time to hire', value: averageDays(hireDays), suffix: 'days' },
      { label: 'Offer acceptance rate', value: totalOffers ? Math.round((acceptedOffers / totalOffers) * 100) : null, suffix: '%' },
    ];
  }, [applications, interviews]);

  const recentActivity = useMemo(() => {
    const applicationEvents = applications.map((application: any) => {
      const stage = normalizeStage(application.stage);
      const action = stage === 'hired'
        ? 'Candidate hired'
        : offerStages.has(stage)
          ? 'Offer sent'
          : stage && stage !== 'applied'
            ? `Moved to ${stage.replace(/_/g, ' ')}`
            : 'Candidate applied';

      return {
        id: `app-${application.id}`,
        action,
        candidate: getCandidateName(application),
        job: getJobTitle(application, jobById) || 'Recruitment',
        date: getActivityDate(application),
      };
    });

    const interviewEvents = interviews.map((interview: any) => ({
      id: `interview-${interview.id}`,
      action: 'Interview scheduled',
      candidate: getCandidateName(interview?.JobApplication || interview),
      job: getJobTitle(interview, jobById) || getJobTitle(interview?.JobApplication, jobById) || 'Recruitment',
      date: interview?.interviewAt ? new Date(interview.interviewAt) : getRecordDate(interview),
    }));

    return [...applicationEvents, ...interviewEvents]
      .filter((event) => event.date)
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
      .slice(0, 8);
  }, [applications, interviews, jobById]);

  const kpis = [
    { label: 'Active Recruitments', value: activeRecruitments, icon: BriefcaseBusiness, tab: 'active_posting', trend: `${jobRequests.filter((job: any) => job.status === 'approved').length} approved` },
    { label: 'Total Applications', value: applications.length, icon: FileText, tab: 'active_posting', trend: trendLabel(applications.filter((app: any) => isSameMonth(getRecordDate(app))).length, applications.filter((app: any) => isSameMonth(getRecordDate(app), -1)).length) },
    { label: 'Pending Reviews', value: pendingReviews, icon: Clock3, tab: 'active_posting', trend: pendingReviews ? 'Needs review' : 'Clear' },
    { label: 'Interviews Scheduled', value: interviewsScheduled, icon: CalendarCheck, tab: 'my_interviews', trend: trendLabel(interviews.filter((iv: any) => isSameMonth(getRecordDate(iv))).length, interviews.filter((iv: any) => isSameMonth(getRecordDate(iv), -1)).length) },
    { label: 'Offers Pending', value: offersPending, icon: Send, tab: 'offers', trend: offersPending ? 'Awaiting response' : 'No pending offers' },
    { label: 'Hires This Month', value: hiresThisMonth, icon: UserCheck, tab: 'ongoing_recruitment', trend: trendLabel(hiresThisMonth, applications.filter((app: any) => normalizeStage(app.stage) === 'hired' && isSameMonth(getRecordDate(app), -1)).length) },
  ];

  return (
    <motion.div
      id="recruitment-overview-view"
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {isEmployee && (
        <div className="max-w-xl">
          <AttendanceShortcutCard />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              onClick={() => onNavigateToTab(kpi.tab)}
              className="rounded-xl border border-slate-100 bg-white p-3 text-left shadow-xs hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 leading-tight">{kpi.label}</p>
                <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-1 text-2xl font-black text-slate-900 leading-none">{kpi.value}</p>
              <p className="mt-1.5 text-[10px] font-semibold text-slate-500 truncate">{kpi.trend}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <motion.div id="pipeline-section" className="xl:col-span-8" {...cardMotion}>
          <SectionCard title="Recruitment Pipeline" padding="sm">
            {applications.length ? (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
                {pipelineData.map((stage, index) => (
                  <div key={stage.stage} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className={`h-1.5 rounded-full ${stage.color}`} />
                    <p className="mt-3 text-[11px] font-extrabold text-slate-700">{stage.stage}</p>
                    <p className="text-2xl font-black text-slate-900 leading-tight">{stage.count}</p>
                    <p className="text-[10px] font-semibold text-slate-400">{index === 0 ? 'Starting pool' : `${stage.conversion} from prior`}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyMessage title="No candidate pipeline data yet." />
            )}
          </SectionCard>
        </motion.div>

        <motion.div className="xl:col-span-4" {...cardMotion} transition={{ duration: 0.35, delay: 0.05 }}>
          <SectionCard title="Attention Required" icon={<AlertTriangle className="h-4 w-4" />} padding="sm" accent="amber">
            <div className="grid gap-2">
              {attentionItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onNavigateToTab(item.tab)}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-left hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                >
                  <span className="text-xs font-bold text-slate-600">{item.label}</span>
                  <span className={`text-lg font-black ${item.tone}`}>{item.value}</span>
                </button>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div id="trend-section" {...cardMotion} transition={{ duration: 0.35, delay: 0.1 }}>
          <SectionCard title="Applications Over Time" padding="sm">
            <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
              <AreaChart data={applicationTrendData} margin={{ top: 18, right: 18, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="applicationsFillCompact" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-applications)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-applications)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 6" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={44} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent className="pt-1" />} />
                <Area type="monotone" dataKey="applications" stroke="var(--color-applications)" fill="url(#applicationsFillCompact)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="interviews" stroke="var(--color-interviews)" strokeWidth={2.25} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="hires" stroke="var(--color-hires)" strokeWidth={2.25} dot={{ r: 3 }} />
              </AreaChart>
            </ChartContainer>
          </SectionCard>
        </motion.div>

        <motion.div {...cardMotion} transition={{ duration: 0.35, delay: 0.15 }}>
          <SectionCard title="Hiring Speed" icon={<Timer className="h-4 w-4" />} padding="sm">
            <div className="grid grid-cols-2 gap-3">
              {hiringSpeed.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{metric.label}</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 leading-none">
                    {metric.value === null ? '—' : metric.value}
                    {metric.value !== null && <span className="ml-1 text-xs font-bold text-slate-400">{metric.suffix}</span>}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>
      </div>

      <motion.div id="job-performance-section" {...cardMotion} transition={{ duration: 0.35, delay: 0.2 }}>
        <SectionCard title="Job Performance" icon={<TrendingUp className="h-4 w-4" />} padding="sm">
          {jobPerformance.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2 font-extrabold">Job title</th>
                    <th className="px-3 py-2 font-extrabold">Applications</th>
                    <th className="px-3 py-2 font-extrabold">Interviews</th>
                    <th className="px-3 py-2 font-extrabold">Shortlisted</th>
                    <th className="px-3 py-2 font-extrabold">Offers</th>
                    <th className="px-3 py-2 font-extrabold">Hires</th>
                    <th className="px-3 py-2 font-extrabold">Conversion</th>
                    <th className="px-3 py-2 font-extrabold">Status</th>
                    <th className="px-3 py-2 font-extrabold">Last activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobPerformance.map((job) => (
                    <tr
                      key={job.title}
                      onClick={() => onNavigateToTab('ongoing_recruitment')}
                      className="cursor-pointer hover:bg-blue-50/50"
                    >
                      <td className="px-3 py-3 font-extrabold text-slate-900">{toTitleCase(job.title)}</td>
                      <td className="px-3 py-3 font-bold text-slate-700">{job.applications}</td>
                      <td className="px-3 py-3 font-bold text-slate-700">{job.interviews}</td>
                      <td className="px-3 py-3 font-bold text-slate-700">{job.shortlisted}</td>
                      <td className="px-3 py-3 font-bold text-slate-700">{job.offers}</td>
                      <td className="px-3 py-3 font-bold text-slate-700">{job.hires}</td>
                      <td className="px-3 py-3 font-black text-blue-600">{job.conversion}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold capitalize text-slate-600">{`${job.status}`.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-500">{formatDate(job.lastActivity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyMessage title="No job performance data yet." />
          )}
        </SectionCard>
      </motion.div>

      <motion.div id="activity-section" {...cardMotion} transition={{ duration: 0.35, delay: 0.25 }}>
        <SectionCard title="Recent Recruitment Activity" icon={<CheckCircle2 className="h-4 w-4" />} padding="sm">
          {recentActivity.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recentActivity.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-extrabold text-slate-800">{event.action}</p>
                    <p className="text-[10px] font-semibold text-slate-400 shrink-0">{formatDate(event.date)}</p>
                  </div>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">{event.candidate} · {toTitleCase(event.job)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyMessage title="No recent recruitment activity." />
          )}
        </SectionCard>
      </motion.div>
    </motion.div>
  );
}
