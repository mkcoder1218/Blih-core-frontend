/**
 * Career Management — Career Tab
 * Integrated with real PromotionRequest API + workforce finance salary data
 */
import { useState } from 'react';
import { ArrowUp, ArrowDown, TrendingUp, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  StatCard, StatCardGrid, PageHeader, SectionCard, UserAvatar, StatusBadge,
  FilterBar, DataTable, EmptyState, LoadingSpinner, InfoAlert,
} from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  usePromotionRequests,
  useApprovePromotionRequest,
  useRejectPromotionRequest,
} from '../../../hooks/useDevelopment';
import { useWorkforceFinance } from '../../../hooks/useWorkforceFinance';

interface CareerCareerTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CareerCareerTab({ showAlert }: CareerCareerTabProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Real API data
  const { data: promoData, isLoading: promoLoading } = usePromotionRequests({ size: 50 });
  const { data: financeData } = useWorkforceFinance({ tab: 'salary' });
  const approvePromotion = useApprovePromotionRequest();
  const rejectPromotion  = useRejectPromotionRequest();

  const allPromotions = promoData?.rows ?? [];
  const pendingPromotions = allPromotions.filter(p => p.status === 'pending');
  const approvedPromotions = allPromotions.filter(p => p.status === 'approved');

  // Salary adjustments from workforce finance API
  const salaryRequests: any[] = (financeData as any)?.salary?.requests ?? [];
  const pendingSalary = salaryRequests.filter((r: any) => r.status === 'pending' || r.status === 'Pending');

  // Career history = all promotions (approved + rejected)
  const historyRows = allPromotions.filter(p => p.status !== 'pending');
  const filtered = historyRows.filter(r =>
    (r.employee?.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.targetTitle ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApprovePromotion = async (id: string, name: string) => {
    await approvePromotion.mutateAsync({ id });
    showAlert(`Approved ${name}'s promotion!`, 'success');
  };
  const handleRejectPromotion = async (id: string, name: string) => {
    await rejectPromotion.mutateAsync({ id });
    showAlert(`Rejected ${name}'s promotion request.`, 'info');
  };

  const fmt = (v?: number) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Career Management" description="Track promotions, salary adjustments, and career history." />

      <StatCardGrid cols={4}>
        <StatCard label="Approved Promotions" value={approvedPromotions.length} icon={<ArrowUp />}    tone="emerald" />
        <StatCard label="Under Review"         value={pendingPromotions.length}  icon={<Bookmark />}  tone="blue" />
        <StatCard label="Salary Adjustments"   value={pendingSalary.length}      icon={<TrendingUp />} tone="amber" />
        <StatCard label="Total Requests"       value={allPromotions.length}      icon={<TrendingUp />} tone="blue" />
      </StatCardGrid>

      {/* Promotion Requests */}
      <SectionCard title={`Promotion Requests — Awaiting Approval (${pendingPromotions.length})`} icon={<ArrowUp />} accent="blue">
        {promoLoading ? (
          <LoadingSpinner label="Loading promotion requests…" />
        ) : pendingPromotions.length === 0 ? (
          <EmptyState title="No pending promotions" compact />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingPromotions.map(p => (
              <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between hover:border-slate-200 transition-all">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <UserAvatar name={p.employee?.fullName ?? 'Employee'} subtitle={p.currentTitle} />
                    <div className="flex flex-col items-end gap-1">
                      {p.kpiScore != null && <Badge variant="secondary">KPI: {p.kpiScore}</Badge>}
                      {p.yearsInRole != null && <span className="text-[9px] text-slate-400">{p.yearsInRole}y in role</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-semibold">Current</span>
                      <p className="font-bold text-slate-700 mt-0.5">{p.currentTitle}</p>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <span className="text-[9px] text-slate-400 block uppercase font-semibold flex items-center gap-1">
                        Proposed <ArrowUp className="w-2.5 h-2.5" />
                      </span>
                      <p className="font-bold text-blue-600 mt-0.5">{p.targetTitle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {p.effectiveDate && (
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-semibold block">Effective Date</span>
                        <p className="font-bold text-slate-700 mt-0.5">{p.effectiveDate}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Stage</span>
                      <StatusBadge status="pending" label={p.approvalStage.replace('_', ' ')} />
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 italic line-clamp-3">
                    "{p.justification}"
                  </div>
                </div>
                <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                  <Button size="sm" className="flex-1" disabled={approvePromotion.isPending}
                    onClick={() => handleApprovePromotion(p.id, p.employee?.fullName ?? 'Employee')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" disabled={rejectPromotion.isPending}
                    onClick={() => handleRejectPromotion(p.id, p.employee?.fullName ?? 'Employee')}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Salary Adjustments from finance API */}
      <SectionCard title="Salary Adjustment Requests" icon={<TrendingUp />} accent="blue">
        {pendingSalary.length === 0 ? (
          <EmptyState title="No pending salary adjustments" compact />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingSalary.map((s: any) => (
              <div key={s.id} className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-slate-200 transition-all">
                <div>
                  <UserAvatar name={s.employee ?? s.name ?? 'Employee'} subtitle={s.department ?? s.dept ?? ''} />
                  <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 mt-4 text-center text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase font-medium">Current</span>
                      <p className="font-bold text-slate-600 mt-0.5">{fmt(s.currentSalary)}</p>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-[9px] text-blue-600 block uppercase font-medium">Requested</span>
                      <p className="font-bold text-blue-600 mt-0.5">{fmt(s.requestedSalary)}</p>
                    </div>
                  </div>
                  {s.reason && <p className="text-xs text-slate-500 mt-3 italic bg-slate-50/20 p-2 rounded border border-slate-100 line-clamp-2">{s.reason}</p>}
                </div>
                <div className="mt-3 pt-2 border-t border-slate-50">
                  <StatusBadge status={s.status ?? 'pending'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Career History — approved/rejected promotion records */}
      <SectionCard title="Career History" icon={<Bookmark />} accent="blue">
        <div className="space-y-4">
          <FilterBar
            search={search}
            onSearchChange={v => { setSearch(v); setPage(1); }}
            searchPlaceholder="Search by name or title…"
          />
          {historyRows.length === 0 ? (
            <EmptyState title="No career history yet" compact />
          ) : (
            <>
              <DataTable
                columns={['Employee', 'From Role', 'To Role', 'Date', 'Status']}
                rows={paged}
                loading={promoLoading}
                emptyMessage="No records match current filter."
                renderRow={row => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="py-3 pr-4">
                      <UserAvatar name={row.employee?.fullName ?? 'Employee'} subtitle={row.employee?.email ?? ''} />
                    </td>
                    <td className="py-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{row.currentTitle}</td>
                    <td className="py-3 text-xs font-bold text-blue-600 whitespace-nowrap">{row.targetTitle}</td>
                    <td className="py-3 text-xs text-slate-500 whitespace-nowrap font-mono">{row.createdAt?.slice(0, 10)}</td>
                    <td className="py-3 text-right"><StatusBadge status={row.status} /></td>
                  </tr>
                )}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)} className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${n === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 disabled:opacity-30">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
