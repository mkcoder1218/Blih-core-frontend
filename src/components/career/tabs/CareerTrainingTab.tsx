/**
 * Career Management — Training & Skills Tab
 * Integrated with real TrainingRecord API
 */
import { Clock, CheckCircle, TrendingUp, Award } from 'lucide-react';
import {
  StatCard, StatCardGrid, PageHeader, SectionCard, UserAvatar, StatusBadge,
  EmptyState, LoadingSpinner,
} from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import {
  useTrainingRequests,
  useApproveTrainingRequest,
  useRejectTrainingRequest,
} from '../../../hooks/useDevelopment';

interface CareerTrainingTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

// AI recommendations stay static — no backend model yet
const AI_RECS = [
  { id: 'ai-1', title: 'Cloud Security',                  dept: 'Engineering', count: 12, priority: 'high',   rec: 'Implement company-wide cloud security certification program' },
  { id: 'ai-2', title: 'AI Design Tools',                 dept: 'Design',      count: 6,  priority: 'medium', rec: 'Early adoption training for AI-assisted design tools' },
  { id: 'ai-3', title: 'AI Marketing Tools',              dept: 'Marketing',   count: 8,  priority: 'medium', rec: 'Provide training on AI-powered marketing automation platforms' },
  { id: 'ai-4', title: 'Advanced Analytics Certification',dept: 'Analytics',   count: 5,  priority: 'low',    rec: 'Support team members pursuing professional certifications' },
];

const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-100',
  low:    'bg-slate-100 text-slate-600 border-slate-200',
};

export default function CareerTrainingTab({ showAlert }: CareerTrainingTabProps) {
  // All training records
  const { data: allData,       isLoading } = useTrainingRequests({ size: 100 });
  const { data: pendingData                } = useTrainingRequests({ status: 'requested', size: 50 });
  const { data: completedData              } = useTrainingRequests({ status: 'completed', size: 50 });

  const approveTraining = useApproveTrainingRequest();
  const rejectTraining  = useRejectTrainingRequest();

  const pendingRows   = pendingData?.rows   ?? [];
  const completedRows = completedData?.rows ?? [];

  const handleApprove = async (id: string, name: string) => {
    await approveTraining.mutateAsync({ id });
    showAlert(`Approved ${name}'s training request!`, 'success');
  };
  const handleReject = async (id: string, name: string) => {
    await rejectTraining.mutateAsync({ id });
    showAlert(`Rejected ${name}'s training request.`, 'info');
  };

  const fmt = (v?: number | null) => v ? `$${Number(v).toLocaleString()}` : '—';

  return (
    <div className="space-y-6">
      <PageHeader title="Training & Skills" description="Manage training requests, certifications, and skill gap assessments." />

      <StatCardGrid cols={4}>
        <StatCard label="Pending Requests"    value={pendingData?.total   ?? 0} icon={<Clock />}        tone="amber" />
        <StatCard label="Completed Trainings" value={completedData?.total ?? 0} icon={<CheckCircle />}  tone="emerald" />
        <StatCard label="All Trainings"       value={allData?.total       ?? 0} icon={<TrendingUp />}   tone="blue" />
        <StatCard label="Certifications"      value={completedData?.total ?? 0} icon={<Award />}        tone="violet" />
      </StatCardGrid>

      {/* Pending Training Requests */}
      <SectionCard title={`Training Requests — Awaiting Approval (${pendingRows.length})`} icon={<Clock />} accent="blue">
        {isLoading ? (
          <LoadingSpinner label="Loading training requests…" />
        ) : pendingRows.length === 0 ? (
          <EmptyState title="No pending training requests" compact />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingRows.map(tr => (
              <div key={tr.id} className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between hover:border-slate-200 transition-all">
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between">
                    <UserAvatar
                      name={tr.employee?.fullName ?? 'Employee'}
                      subtitle={`${tr.employee?.email ?? ''} · Program Requester`}
                    />
                    <StatusBadge status={tr.status} />
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-blue-700">{tr.title}</p>
                    {tr.provider && <p className="text-[10px] text-slate-400 font-medium mt-0.5">Provider: {tr.provider}</p>}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/50 text-center text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Cost</span>
                        <p className="font-extrabold text-slate-800 mt-0.5">{fmt(tr.cost)}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Type</span>
                        <p className="font-extrabold text-slate-800 mt-0.5 capitalize">{tr.trainingType ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Start</span>
                        <p className="font-extrabold text-slate-800 mt-0.5 font-mono">{tr.startDate?.slice(0, 10) ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5 pt-4 border-t border-slate-50">
                  <Button size="sm" className="flex-1" disabled={approveTraining.isPending}
                    onClick={() => handleApprove(tr.id, tr.employee?.fullName ?? 'Employee')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" disabled={rejectTraining.isPending}
                    onClick={() => handleReject(tr.id, tr.employee?.fullName ?? 'Employee')}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Completed Trainings */}
      <SectionCard title="Completed Trainings & Certifications" icon={<Award />} accent="blue">
        {completedRows.length === 0 ? (
          <EmptyState title="No completed trainings yet" compact />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedRows.map(tr => (
              <div key={tr.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
                <div className="flex items-start justify-between">
                  <UserAvatar name={tr.employee?.fullName ?? 'Employee'} subtitle={tr.title} />
                  <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-4">
                  <span className="text-[9px] text-slate-400 block uppercase font-semibold">Provider</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">{tr.provider ?? '—'}</p>
                </div>
                <div className="flex items-center justify-between mt-3 text-[10px]">
                  <span className="text-slate-400 font-semibold capitalize">Type: <b className="text-slate-800">{tr.trainingType ?? '—'}</b></span>
                  {tr.endDate && <span className="text-slate-400 font-semibold">Done: <b className="text-slate-800 font-mono">{tr.endDate.slice(0, 10)}</b></span>}
                </div>
                {(tr.resultData as any)?.score && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">Score: {(tr.resultData as any).score}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* AI Recommendations — static for now */}
      <SectionCard title="AI Training & Skills Recommendations" icon={<TrendingUp />} accent="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AI_RECS.map(r => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-extrabold text-slate-900">{r.title}</h4>
                    <span className="text-[9px] border bg-slate-100 text-slate-500 px-1.5 rounded-full font-bold">{r.dept}</span>
                  </div>
                  <span className={`text-[9px] border uppercase font-extrabold px-1.5 py-0.5 rounded-md ${PRIORITY_BADGE[r.priority]}`}>
                    {r.priority} priority
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Affects {r.count} employees</p>
              </div>
              <div className="bg-[#f0f4ff] p-3 rounded-xl border border-blue-50/50 mt-4 text-[#1a56db]">
                <p className="text-xs font-bold leading-relaxed">AI Recommendation: {r.rec}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
