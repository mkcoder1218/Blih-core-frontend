import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Clock3,
  ExternalLink,
  FileWarning,
  ListChecks,
  RotateCcw,
  Search,
  Timer,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '@/components/ui/blih';
import { useOnboardingAnalytics } from '../../hooks/useCandidateOnboarding';

type Interval = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const STATUS_META: Record<string, { label: string; pill: string; dot: string }> = {
  not_started: { label: 'Not started', pill: 'border-slate-200 bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
  in_progress: { label: 'In progress', pill: 'border-blue-100 bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  blocked: { label: 'Blocked', pill: 'border-violet-100 bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  overdue: { label: 'Overdue', pill: 'border-rose-100 bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
  completed: { label: 'Completed', pill: 'border-emerald-100 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
};

export default function PeopleOnboardingOverview() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [interval, setInterval] = useState<Interval>('monthly');
  const [attentionPage, setAttentionPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setAttentionPage(1);
    setActivePage(1);
  }, [dateFrom, dateTo, departmentId, managerId, status, deferredSearch]);

  const params = useMemo(() => ({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    departmentId: departmentId || undefined,
    managerId: managerId || undefined,
    status: status || undefined,
    search: deferredSearch || undefined,
    interval,
    attentionPage,
    activePage,
    pageSize: 10,
  }), [dateFrom, dateTo, departmentId, managerId, status, deferredSearch, interval, attentionPage, activePage]);

  const analyticsQuery = useOnboardingAnalytics(params);
  const analytics: any = analyticsQuery.data;
  const summary = analytics?.summary;
  const filterOptions = analytics?.filters;

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDepartmentId('');
    setManagerId('');
    setStatus('');
    setSearch('');
    setInterval('monthly');
    setAttentionPage(1);
    setActivePage(1);
  };

  return (
    <div className="space-y-5 pb-12 font-sans">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">Onboarding Overview Analytics</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">Live onboarding, task, department, and probation performance.</p>
          </div>
          {analytics?.generatedAt && <p className="text-[10px] font-bold text-slate-400">Updated {formatDateTime(analytics.generatedAt)}</p>}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(220px,1.3fr)_repeat(5,minmax(145px,1fr))_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={event => setSearch(event.currentTarget.value)} placeholder="Search employee" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 focus:bg-white" />
          </label>
          <input aria-label="Date from" type="date" value={dateFrom} max={dateTo || undefined} onChange={event => setDateFrom(event.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" />
          <input aria-label="Date to" type="date" value={dateTo} min={dateFrom || undefined} onChange={event => setDateTo(event.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700" />
          <select aria-label="Department" value={departmentId} onChange={event => setDepartmentId(event.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="">All departments</option>
            {(filterOptions?.departments || []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select aria-label="Manager" value={managerId} onChange={event => setManagerId(event.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="">All managers</option>
            {(filterOptions?.managers || []).map((item: any) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select aria-label="Onboarding status" value={status} onChange={event => setStatus(event.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
            <option value="">All statuses</option>
            {(filterOptions?.statuses || Object.keys(STATUS_META)).map((value: string) => <option key={value} value={value}>{STATUS_META[value]?.label || titleCase(value)}</option>)}
          </select>
          <button type="button" onClick={resetFilters} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-black text-slate-600 hover:bg-slate-50">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </section>

      {analyticsQuery.isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-bold text-rose-700">
          Unable to load onboarding analytics. {errorMessage(analyticsQuery.error)}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Active onboarding" value={metric(summary?.activeOnboarding, analyticsQuery.isLoading)} icon={<UserPlus className="h-5 w-5" />} tone="blue" />
            <StatCard label="Starting within 7 days" value={metric(summary?.startingWithinSevenDays, analyticsQuery.isLoading)} icon={<CalendarClock className="h-5 w-5" />} tone="cyan" />
            <StatCard label="Completed this month" value={metric(summary?.completedThisMonth, analyticsQuery.isLoading)} icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
            <StatCard label="Overdue onboarding" value={metric(summary?.overdueOnboarding, analyticsQuery.isLoading)} icon={<AlertTriangle className="h-5 w-5" />} tone="rose" />
            <StatCard label="On probation" value={metric(summary?.onProbation, analyticsQuery.isLoading)} icon={<Clock3 className="h-5 w-5" />} tone="amber" />
            <StatCard label="Avg. completion time" value={analyticsQuery.isLoading ? '—' : `${summary?.averageCompletionDays ?? 0} days`} icon={<Timer className="h-5 w-5" />} tone="violet" />
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <StatusBreakdown rows={analytics?.statusBreakdown || []} loading={analyticsQuery.isLoading} />
            <TrendChart rows={analytics?.trend?.rows || []} interval={interval} onIntervalChange={setInterval} loading={analyticsQuery.isLoading} />
          </div>

          <AttentionTable data={analytics?.attention} loading={analyticsQuery.isLoading} onPageChange={setAttentionPage} />
          <ActiveOnboardingTable data={analytics?.active} loading={analyticsQuery.isLoading} onPageChange={setActivePage} />

          <TaskAnalytics data={analytics?.tasks} loading={analyticsQuery.isLoading} />
          <DepartmentAnalytics rows={analytics?.departments || []} loading={analyticsQuery.isLoading} />
          <ProbationAnalytics data={analytics?.probation} loading={analyticsQuery.isLoading} />
        </>
      )}
    </div>
  );
}

function StatusBreakdown({ rows, loading }: { rows: any[]; loading: boolean }) {
  const total = rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <h3 className="text-sm font-black text-slate-950">Onboarding status breakdown</h3>
      <p className="mt-1 text-xs font-semibold text-slate-500">Current state of filtered onboarding records.</p>
      <div className="mt-5 space-y-4">
        {(loading && !rows.length ? Object.keys(STATUS_META).map(status => ({ status, count: 0 })) : rows).map(row => {
          const meta = STATUS_META[row.status] || STATUS_META.not_started;
          const percentage = total ? Math.round((Number(row.count || 0) / total) * 100) : 0;
          return (
            <div key={row.status}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 font-bold text-slate-700"><span className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}</span>
                <span className="font-black text-slate-900">{loading ? '—' : row.count} <span className="font-semibold text-slate-400">({percentage}%)</span></span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${percentage}%` }} /></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrendChart({ rows, interval, onIntervalChange, loading }: { rows: any[]; interval: Interval; onIntervalChange: (value: Interval) => void; loading: boolean }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-950">Onboarding started vs completed</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Uses actual onboarding start and completion dates.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {(['weekly', 'monthly', 'quarterly', 'yearly'] as Interval[]).map(value => (
            <button key={value} type="button" onClick={() => onIntervalChange(value)} className={`rounded-md px-2.5 py-1.5 text-[10px] font-black capitalize ${interval === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{value}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 h-[280px] w-full">
        {loading && !rows.length ? <LoadingBlock /> : rows.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, left: -24, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, borderColor: '#e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Line name="Started" type="monotone" dataKey="started" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} activeDot={{ r: 5 }} />
              <Line name="Completed" type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyBlock text="No onboarding start or completion dates match the filters." />}
      </div>
    </section>
  );
}

function AttentionTable({ data, loading, onPageChange }: { data: any; loading: boolean; onPageChange: (page: number) => void }) {
  return (
    <TableSection title="Employees requiring attention" description="Real onboarding issues that need an owner or follow-up." icon={<FileWarning className="h-4 w-4 text-rose-600" />}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-left">
          <TableHead labels={['Employee', 'Department', 'Start date', 'Progress', 'Current issue', 'Responsible person', 'Days overdue', 'Action']} />
          <tbody className="divide-y divide-slate-100">
            {(data?.rows || []).map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <NameCell name={row.employee} />
                <TextCell value={row.department} />
                <TextCell value={formatDate(row.startDate)} />
                <td className="px-4 py-3"><Progress value={row.progress} /></td>
                <td className="px-4 py-3"><span className="inline-flex rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">{row.currentIssue}</span></td>
                <TextCell value={row.responsiblePerson} />
                <td className="px-4 py-3 text-xs font-black text-rose-600">{row.daysOverdue || '—'}</td>
                <ActionCell onboardingId={row.onboardingId} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && !(data?.rows?.length) ? <LoadingBlock compact /> : !(data?.rows?.length) ? <EmptyBlock text="No employees currently require attention." /> : null}
      <Pagination data={data} onPageChange={onPageChange} />
    </TableSection>
  );
}

function ActiveOnboardingTable({ data, loading, onPageChange }: { data: any; loading: boolean; onPageChange: (page: number) => void }) {
  return (
    <TableSection title="Active onboarding" description="Live task completion, current stage, and expected completion." icon={<Users className="h-4 w-4 text-blue-600" />}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1420px] text-left">
          <TableHead labels={['Employee', 'Position', 'Department', 'Manager', 'Start date', 'Completed tasks', 'Remaining tasks', 'Progress', 'Current stage', 'Expected completion', 'Status']} />
          <tbody className="divide-y divide-slate-100">
            {(data?.rows || []).map((row: any) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <NameCell name={row.employee} />
                <TextCell value={row.position} />
                <TextCell value={row.department} />
                <TextCell value={row.manager} />
                <TextCell value={formatDate(row.startDate)} />
                <NumberCell value={row.completedTasks} />
                <NumberCell value={row.remainingTasks} />
                <td className="px-4 py-3"><Progress value={row.progress} /></td>
                <TextCell value={row.currentStage} />
                <TextCell value={formatDate(row.expectedCompletion)} />
                <td className="px-4 py-3"><StatusPill status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && !(data?.rows?.length) ? <LoadingBlock compact /> : !(data?.rows?.length) ? <EmptyBlock text="No active onboarding records match the filters." /> : null}
      <Pagination data={data} onPageChange={onPageChange} />
    </TableSection>
  );
}

function TaskAnalytics({ data, loading }: { data: any; loading: boolean }) {
  const cards = [
    ['Required tasks', data?.required, <ListChecks className="h-5 w-5" />, 'blue'],
    ['Completed', data?.completed, <CheckCircle2 className="h-5 w-5" />, 'emerald'],
    ['Pending', data?.pending, <CircleDashed className="h-5 w-5" />, 'amber'],
    ['Overdue', data?.overdue, <AlertTriangle className="h-5 w-5" />, 'rose'],
    ['Blocked', data?.blocked, <Ban className="h-5 w-5" />, 'violet'],
    ['Completion percentage', data ? `${data.completionPercentage}%` : undefined, <ClipboardCheck className="h-5 w-5" />, 'cyan'],
  ] as const;
  return (
    <section>
      <SectionHeading title="Task analytics" description="Candidate checklist steps and assigned onboarding tasks." />
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, icon, tone]) => <div key={label}><StatCard label={label} value={loading ? '—' : value ?? 0} icon={icon} tone={tone} className="h-full" /></div>)}
      </div>
    </section>
  );
}

function DepartmentAnalytics({ rows, loading }: { rows: any[]; loading: boolean }) {
  return (
    <TableSection title="Department analytics" description="Onboarding volume, timeliness, and progress by department." icon={<Building2 className="h-4 w-4 text-violet-600" />}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <TableHead labels={['Department', 'Active onboarding', 'Completed this month', 'Overdue employees', 'Avg. completion time', 'Avg. progress']} />
          <tbody className="divide-y divide-slate-100">
            {rows.map(row => (
              <tr key={row.departmentId || 'unassigned'} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-xs font-black text-slate-900">{row.department}</td>
                <NumberCell value={row.activeOnboarding} />
                <NumberCell value={row.completedThisMonth} />
                <NumberCell value={row.overdueEmployees} danger={row.overdueEmployees > 0} />
                <TextCell value={`${row.averageCompletionDays} days`} />
                <td className="px-4 py-3"><Progress value={row.averageProgress} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && !rows.length ? <LoadingBlock compact /> : !rows.length ? <EmptyBlock text="No department onboarding data matches the filters." /> : null}
    </TableSection>
  );
}

function ProbationAnalytics({ data, loading }: { data: any; loading: boolean }) {
  const cards = [
    ['Currently on probation', data?.currentlyOnProbation, <UserCheck className="h-5 w-5" />, 'blue'],
    ['Ending in 7 days', data?.endingInSevenDays, <CalendarClock className="h-5 w-5" />, 'amber'],
    ['Ending in 30 days', data?.endingInThirtyDays, <Clock3 className="h-5 w-5" />, 'cyan'],
    ['Reviews overdue', data?.reviewsOverdue, <AlertTriangle className="h-5 w-5" />, 'rose'],
  ] as const;
  return (
    <section>
      <SectionHeading title="Probation analytics" description="Probation deadlines and review follow-up from employee records." />
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(([label, value, icon, tone]) => <div key={label}><StatCard label={label} value={loading ? '—' : value ?? 0} icon={icon} tone={tone} className="h-full" /></div>)}
      </div>
    </section>
  );
}

function TableSection({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex items-start gap-2 border-b border-slate-200 px-4 py-3">
        <div className="mt-0.5 rounded-lg bg-slate-50 p-2">{icon}</div>
        <div><h3 className="text-sm font-black text-slate-950">{title}</h3><p className="mt-0.5 text-xs font-semibold text-slate-500">{description}</p></div>
      </div>
      {children}
    </section>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <div><h3 className="text-sm font-black text-slate-950">{title}</h3><p className="mt-1 text-xs font-semibold text-slate-500">{description}</p></div>;
}

function TableHead({ labels }: { labels: string[] }) {
  return <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-400"><tr>{labels.map(label => <th key={label} className="whitespace-nowrap px-4 py-3">{label}</th>)}</tr></thead>;
}

function NameCell({ name }: { name: string }) {
  const initials = String(name || '').split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white">{initials || '?'}</span><span className="text-xs font-black text-slate-900">{name || '—'}</span></div></td>;
}

function TextCell({ value }: { value: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">{value || '—'}</td>;
}

function NumberCell({ value, danger = false }: { value: number; danger?: boolean }) {
  return <td className={`px-4 py-3 text-xs font-black ${danger ? 'text-rose-600' : 'text-slate-800'}`}>{value ?? 0}</td>;
}

function ActionCell({ onboardingId }: { onboardingId: string }) {
  return <td className="px-4 py-3"><a href={`/onboarding/${encodeURIComponent(onboardingId)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-black text-white hover:bg-blue-700">Open <ExternalLink className="h-3 w-3" /></a></td>;
}

function Progress({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="flex min-w-28 items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${safe}%` }} /></div><span className="w-8 text-right text-[10px] font-black text-slate-700">{safe}%</span></div>;
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] || STATUS_META.not_started;
  return <span className={`inline-flex whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] font-black ${meta.pill}`}>{meta.label}</span>;
}

function Pagination({ data, onPageChange }: { data: any; onPageChange: (page: number) => void }) {
  if (!data || data.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
      <span className="text-[10px] font-bold text-slate-500">Page {data.page} of {data.totalPages} · {data.total} records</span>
      <div className="flex gap-2">
        <button type="button" disabled={data.page <= 1} onClick={() => onPageChange(data.page - 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="h-3.5 w-3.5" /></button>
        <button type="button" disabled={data.page >= data.totalPages} onClick={() => onPageChange(data.page + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function LoadingBlock({ compact = false }: { compact?: boolean }) {
  return <div className={`flex items-center justify-center ${compact ? 'py-8' : 'h-full'}`}><span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" /></div>;
}

function EmptyBlock({ text }: { text: string }) {
  return <div className="flex h-full min-h-24 items-center justify-center px-5 py-8 text-center text-xs font-semibold text-slate-400">{text}</div>;
}

function metric(value: unknown, loading: boolean) {
  return loading ? '—' : Number(value || 0);
}

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value: unknown) {
  if (!value) return '—';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function errorMessage(error: unknown) {
  const value = error as any;
  return value?.response?.data?.message || value?.message || '';
}
