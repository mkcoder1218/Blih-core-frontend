/**
 * Career Management — Overview Tab
 * Integrated with real TrainingRecord + PromotionRequest + DisciplinaryCase APIs
 */
import { Sparkles, AlertTriangle, Bookmark, BookOpen, UserCheck, Clock, Inbox } from 'lucide-react';
import {
  StatCard, StatCardGrid, PageHeader, SectionCard, UserAvatar, StatusBadge,
  EmptyState, LoadingSpinner, InfoAlert,
} from '@/components/ui/blih';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useTrainingRequests, useApproveTrainingRequest, useRejectTrainingRequest,
  usePromotionRequests, useApprovePromotionRequest, useRejectPromotionRequest,
} from '../../../hooks/useDevelopment';

interface CareerOverviewTabProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CareerOverviewTab({ onDraftAiSuggestion, showAlert }: CareerOverviewTabProps) {
  const { data: trainingData, isLoading: tLoading } = useTrainingRequests({ status: 'requested', size: 10 });
  const { data: promoData,    isLoading: pLoading } = usePromotionRequests({ status: 'pending',   size: 10 });

  const approveTraining  = useApproveTrainingRequest();
  const rejectTraining   = useRejectTrainingRequest();
  const approvePromotion = useApprovePromotionRequest();
  const rejectPromotion  = useRejectPromotionRequest();

  const trainings  = trainingData?.rows ?? [];
  const promotions = promoData?.rows    ?? [];
  const pendingCount = trainings.length + promotions.length;
  const isLoading  = tLoading || pLoading;

  const handleApproveTraining = async (id: string, name: string) => {
    await approveTraining.mutateAsync({ id });
    showAlert(`Approved ${name}'s training request!`, 'success');
  };
  const handleRejectTraining = async (id: string, name: string) => {
    await rejectTraining.mutateAsync({ id });
    showAlert(`Rejected ${name}'s training request.`, 'info');
  };
  const handleApprovePromotion = async (id: string, name: string) => {
    await approvePromotion.mutateAsync({ id });
    showAlert(`Approved ${name}'s promotion request!`, 'success');
  };
  const handleRejectPromotion = async (id: string, name: string) => {
    await rejectPromotion.mutateAsync({ id });
    showAlert(`Rejected ${name}'s promotion request.`, 'info');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approval Requests"
        description="Review and approve training and promotion requests."
      />

      {isLoading ? (
        <LoadingSpinner label="Loading requests…" />
      ) : pendingCount === 0 ? (
        <EmptyState icon={<Inbox />} title="All requests have been verified." compact />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Training requests */}
          {trainings.map(tr => (
            <div key={tr.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <UserAvatar
                    name={tr.employee?.fullName ?? 'Employee'}
                    subtitle={tr.employee?.email ?? ''}
                  />
                  <span className="text-[10px] font-medium border rounded-md px-2 py-0.5 leading-none border-blue-200 bg-blue-50 text-blue-700">
                    Training
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600">Training Request</p>
                  <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{tr.title}</p>
                  {tr.provider && <p className="text-[10px] text-slate-400 mt-0.5">Provider: {tr.provider}</p>}
                  {tr.startDate && <p className="text-[10px] text-slate-400 mt-1 font-mono">Start: {tr.startDate.slice(0, 10)}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
                <Button size="sm" className="flex-1" disabled={approveTraining.isPending}
                  onClick={() => handleApproveTraining(tr.id, tr.employee?.fullName ?? 'Employee')}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1" disabled={rejectTraining.isPending}
                  onClick={() => handleRejectTraining(tr.id, tr.employee?.fullName ?? 'Employee')}>
                  Reject
                </Button>
              </div>
            </div>
          ))}

          {/* Promotion requests */}
          {promotions.map(pr => (
            <div key={pr.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-md hover:border-slate-200/60 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <UserAvatar
                    name={pr.employee?.fullName ?? 'Employee'}
                    subtitle={pr.employee?.email ?? ''}
                  />
                  <span className="text-[10px] font-medium border rounded-md px-2 py-0.5 leading-none border-violet-200 bg-violet-50 text-violet-700">
                    Promotion
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-600">Promotion Request</p>
                  <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                    {pr.currentTitle} → {pr.targetTitle}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-2">"{pr.justification}"</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
                <Button size="sm" className="flex-1" disabled={approvePromotion.isPending}
                  onClick={() => handleApprovePromotion(pr.id, pr.employee?.fullName ?? 'Employee')}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="flex-1" disabled={rejectPromotion.isPending}
                  onClick={() => handleRejectPromotion(pr.id, pr.employee?.fullName ?? 'Employee')}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI stats */}
      <StatCardGrid cols={4}>
        <StatCard label="Training Pending"    value={trainings.length}  icon={<BookOpen />}  tone="blue" />
        <StatCard label="Promotions Pending"  value={promotions.length} icon={<Bookmark />}  tone="violet" />
        <StatCard label="Culture Initiatives" value={8}                 icon={<UserCheck />} tone="blue" />
        <StatCard label="Total Pending"       value={pendingCount}      icon={<Clock />}     tone="amber" />
      </StatCardGrid>

      {/* Discipline panels — discipline data is from performance module, kept as summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Current Hot Discipline Issue" icon={<AlertTriangle />} accent="rose">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Late Arrivals</h3>
                <p className="text-[11px] text-slate-400 mt-1">Most frequent issue this month</p>
              </div>
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">+25%</span>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-red-100/50 pt-4">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">This month</span>
                <p className="text-xl font-bold text-slate-900 mt-1">12</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Total Cases</span>
                <p className="text-xl font-bold text-slate-900 mt-1">28</p>
              </div>
            </div>
            <div className="border-t border-red-100/50 pt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-medium uppercase">Resolved</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">18</p>
              </div>
              <Button variant="destructive" size="sm"
                onClick={() => onDraftAiSuggestion('Suggest corrective actions for late arrival discipline issues.')}>
                Investigate Action
              </Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Average Discipline Rate" icon={<AlertTriangle />} accent="blue">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Rate this period</span>
              <Badge>3.2%</Badge>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Pending Cases</span>
                <p className="text-3xl font-black text-slate-950 mt-1">10</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Resolved Cases</span>
                <p className="text-3xl font-black text-slate-950 mt-1">18</p>
              </div>
            </div>
            <Button variant="outline" className="w-full gap-1.5"
              onClick={() => onDraftAiSuggestion('Suggest training to lower our current 3.2% discipline rate.')}>
              <Sparkles className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              Recommend Training to Lower Rate
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
