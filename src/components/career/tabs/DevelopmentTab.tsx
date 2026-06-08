/**
 * Career Management — Development Tab
 * Allows employees to request training + promotion, HR/managers to review them.
 * Uses real API via useDevelopment hooks with optimistic mock fallback while loading.
 */
import { useState } from 'react';
import { BookOpen, ArrowUpCircle, Plus, GraduationCap } from 'lucide-react';
import {
  PageHeader, SectionCard, TabSwitcher, StatusBadge, UserAvatar,
  FilterBar, DataTable, EmptyState, FormField, FormRow,
  ConfirmDialog, LoadingSpinner, InfoAlert,
} from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  useTrainingRequests, useSubmitTrainingRequest, useApproveTrainingRequest, useRejectTrainingRequest,
  usePromotionRequests, useSubmitPromotionRequest, useApprovePromotionRequest, useRejectPromotionRequest,
} from '../../../hooks/useDevelopment';

interface DevelopmentTabProps {
  showAlert: (title: string, type?: 'success' | 'info' | 'error') => void;
}

// ── Training request form state ───────────────────────────────────────────────
interface TrainingForm {
  title: string;
  provider: string;
  trainingType: string;
  startDate: string;
  endDate: string;
  cost: string;
}

// ── Promotion request form state ──────────────────────────────────────────────
interface PromotionForm {
  currentTitle: string;
  targetTitle: string;
  justification: string;
  department: string;
  kpiScore: string;
  yearsInRole: string;
  effectiveDate: string;
}

const EMPTY_TRAINING: TrainingForm = {
  title: '', provider: '', trainingType: 'external', startDate: '', endDate: '', cost: '',
};

const EMPTY_PROMOTION: PromotionForm = {
  currentTitle: '', targetTitle: '', justification: '', department: '', kpiScore: '', yearsInRole: '', effectiveDate: '',
};

export default function DevelopmentTab({ showAlert }: DevelopmentTabProps) {
  const [subTab, setSubTab] = useState<'training' | 'promotion'>('training');
  const [search, setSearch] = useState('');

  // Training modals
  const [trainingModalOpen, setTrainingModalOpen] = useState(false);
  const [trainingForm, setTrainingForm] = useState<TrainingForm>(EMPTY_TRAINING);
  const [confirmRejectTraining, setConfirmRejectTraining] = useState<string | null>(null);
  const [confirmApproveTraining, setConfirmApproveTraining] = useState<string | null>(null);

  // Promotion modals
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [promotionForm, setPromotionForm] = useState<PromotionForm>(EMPTY_PROMOTION);
  const [confirmRejectPromotion, setConfirmRejectPromotion] = useState<string | null>(null);
  const [confirmApprovePromotion, setConfirmApprovePromotion] = useState<string | null>(null);

  // React Query
  const { data: trainingData, isLoading: trainingLoading, error: trainingError } = useTrainingRequests();
  const { data: promotionData, isLoading: promotionLoading, error: promotionError } = usePromotionRequests();

  const submitTraining  = useSubmitTrainingRequest();
  const approveTraining = useApproveTrainingRequest();
  const rejectTraining  = useRejectTrainingRequest();

  const submitPromotion  = useSubmitPromotionRequest();
  const approvePromotion = useApprovePromotionRequest();
  const rejectPromotion  = useRejectPromotionRequest();

  // ── Training handlers ─────────────────────────────────────────────────────
  const handleSubmitTraining = async () => {
    if (!trainingForm.title.trim()) return;
    await submitTraining.mutateAsync({
      title:        trainingForm.title,
      provider:     trainingForm.provider || undefined,
      trainingType: trainingForm.trainingType || undefined,
      startDate:    trainingForm.startDate  || undefined,
      endDate:      trainingForm.endDate    || undefined,
      cost:         trainingForm.cost ? parseFloat(trainingForm.cost) : undefined,
    });
    setTrainingModalOpen(false);
    setTrainingForm(EMPTY_TRAINING);
    showAlert('Training request submitted successfully!', 'success');
  };

  const handleApproveTraining = async (id: string) => {
    await approveTraining.mutateAsync({ id });
    setConfirmApproveTraining(null);
    showAlert('Training request approved!', 'success');
  };

  const handleRejectTraining = async (id: string) => {
    await rejectTraining.mutateAsync({ id });
    setConfirmRejectTraining(null);
    showAlert('Training request rejected.', 'info');
  };

  // ── Promotion handlers ────────────────────────────────────────────────────
  const handleSubmitPromotion = async () => {
    if (!promotionForm.currentTitle.trim() || !promotionForm.targetTitle.trim() || !promotionForm.justification.trim()) return;
    await submitPromotion.mutateAsync({
      currentTitle:  promotionForm.currentTitle,
      targetTitle:   promotionForm.targetTitle,
      justification: promotionForm.justification,
      department:    promotionForm.department || undefined,
      kpiScore:      promotionForm.kpiScore   ? parseFloat(promotionForm.kpiScore)   : undefined,
      yearsInRole:   promotionForm.yearsInRole ? parseFloat(promotionForm.yearsInRole) : undefined,
      effectiveDate: promotionForm.effectiveDate || undefined,
    });
    setPromotionModalOpen(false);
    setPromotionForm(EMPTY_PROMOTION);
    showAlert('Promotion request submitted successfully!', 'success');
  };

  const handleApprovePromotion = async (id: string) => {
    await approvePromotion.mutateAsync({ id });
    setConfirmApprovePromotion(null);
    showAlert('Promotion request approved!', 'success');
  };

  const handleRejectPromotion = async (id: string) => {
    await rejectPromotion.mutateAsync({ id });
    setConfirmRejectPromotion(null);
    showAlert('Promotion request rejected.', 'info');
  };

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const trainingRows = (trainingData?.rows ?? [])?.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.employee?.fullName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const promotionRows = (promotionData?.rows ?? [])?.filter(r =>
    r.targetTitle.toLowerCase().includes(search.toLowerCase()) ||
    (r.employee?.fullName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Career Management"
        title="Development Requests"
        description="Submit and track training and promotion requests through the approval workflow."
        actions={
          <Button
            onClick={() => subTab === 'training' ? setTrainingModalOpen(true) : setPromotionModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            New {subTab === 'training' ? 'Training' : 'Promotion'} Request
          </Button>
        }
      />

      <TabSwitcher
        tabs={[
          { id: 'training',  label: 'Training Requests',  badge: trainingData?.rows?.filter(r => r.status === 'requested').length ?? 0 },
          { id: 'promotion', label: 'Promotion Requests', badge: promotionData?.rows?.filter(r => r.status === 'pending').length ?? 0 },
        ]}
        active={subTab}
        onChange={(t) => { setSubTab(t as 'training' | 'promotion'); setSearch(''); }}
        variant="pill"
      />

      {/* ── TRAINING REQUESTS ──────────────────────────────────────────────── */}
      {subTab === 'training' && (
        <SectionCard title="Training Requests" icon={<BookOpen />} accent="blue">
          <div className="space-y-4">
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by title or employee..."
            />

            {trainingError && <InfoAlert variant="error" message="Failed to load training requests." />}

            {trainingLoading ? (
              <LoadingSpinner label="Loading training requests…" />
            ) : trainingRows.length === 0 ? (
              <EmptyState
                icon={<BookOpen />}
                title="No training requests"
                description="Training requests will appear here once submitted."
                action={<Button onClick={() => setTrainingModalOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />New Request</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {trainingRows.map(tr => (
                  <div key={tr.id} className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between hover:border-slate-200 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <UserAvatar
                          name={tr.employee?.fullName ?? 'Employee'}
                          subtitle={tr.employee?.email ?? 'Training Request'}
                        />
                        <StatusBadge status={tr.status} />
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-xs font-bold text-blue-700">{tr.title}</p>
                        {tr.provider && <p className="text-[10px] text-slate-400 mt-0.5">Provider: {tr.provider}</p>}
                        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200/50 text-center text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-medium">Type</span>
                            <p className="font-bold text-slate-800 capitalize mt-0.5">{tr.trainingType ?? '—'}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-medium">Cost</span>
                            <p className="font-bold text-slate-800 mt-0.5">{tr.cost ? `$${tr.cost.toLocaleString()}` : '—'}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-medium">Start</span>
                            <p className="font-bold text-slate-800 font-mono mt-0.5">{tr.startDate?.slice(0, 10) ?? '—'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {tr.status === 'requested' && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-slate-50">
                        <Button size="sm" className="flex-1" onClick={() => setConfirmApproveTraining(tr.id)}>Approve</Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmRejectTraining(tr.id)}>Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── PROMOTION REQUESTS ─────────────────────────────────────────────── */}
      {subTab === 'promotion' && (
        <SectionCard title="Promotion Requests" icon={<ArrowUpCircle />} accent="blue">
          <div className="space-y-4">
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by title or employee..."
            />

            {promotionError && <InfoAlert variant="error" message="Failed to load promotion requests." />}

            {promotionLoading ? (
              <LoadingSpinner label="Loading promotion requests…" />
            ) : promotionRows.length === 0 ? (
              <EmptyState
                icon={<GraduationCap />}
                title="No promotion requests"
                description="Promotion requests will appear here once submitted."
                action={<Button onClick={() => setPromotionModalOpen(true)} className="gap-1.5"><Plus className="w-4 h-4" />New Request</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {promotionRows.map(pr => (
                  <div key={pr.id} className="bg-white border border-slate-100 rounded-xl p-5 flex flex-col justify-between hover:border-slate-200 transition-all">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <UserAvatar
                          name={pr.employee?.fullName ?? 'Employee'}
                          subtitle={pr.employee?.email ?? 'Promotion Request'}
                        />
                        <StatusBadge status={pr.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-semibold">Current</span>
                          <p className="font-bold text-slate-700 mt-0.5">{pr.currentTitle}</p>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <span className="text-[9px] text-slate-400 block uppercase font-semibold">Proposed</span>
                          <p className="font-bold text-blue-600 mt-0.5">{pr.targetTitle}</p>
                        </div>
                      </div>
                      {(pr.kpiScore || pr.yearsInRole) && (
                        <div className="flex items-center gap-2 text-[10px]">
                          {pr.kpiScore    && <span className="bg-blue-50 text-blue-700 border border-blue-100 font-bold px-1.5 py-0.5 rounded-md">KPI: {pr.kpiScore}</span>}
                          {pr.yearsInRole && <span className="text-slate-400">{pr.yearsInRole}y in role</span>}
                          {pr.effectiveDate && <span className="text-slate-400">Effective: {pr.effectiveDate}</span>}
                        </div>
                      )}
                      <div className="bg-slate-50/50 p-2.5 rounded-lg border border-dashed border-slate-200 text-xs text-slate-500 italic">
                        "{pr.justification}"
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Stage: <span className="font-semibold text-slate-600 capitalize">{pr.approvalStage.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {pr.status === 'pending' && (
                      <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                        <Button size="sm" className="flex-1" onClick={() => setConfirmApprovePromotion(pr.id)}>Approve</Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setConfirmRejectPromotion(pr.id)}>Reject</Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── NEW TRAINING REQUEST MODAL ────────────────────────────────────── */}
      <Dialog open={trainingModalOpen} onOpenChange={setTrainingModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              New Training Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <FormField label="Training Title" required>
              <Input placeholder="e.g. Advanced Cloud Architecture" value={trainingForm.title} onChange={e => setTrainingForm(p => ({ ...p, title: e.target.value }))} />
            </FormField>
            <FormRow cols={2}>
              <FormField label="Provider">
                <Input placeholder="e.g. AWS, Google, Coursera" value={trainingForm.provider} onChange={e => setTrainingForm(p => ({ ...p, provider: e.target.value }))} />
              </FormField>
              <FormField label="Training Type">
                <Select value={trainingForm.trainingType} onValueChange={v => setTrainingForm(p => ({ ...p, trainingType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Start Date">
                <Input type="date" value={trainingForm.startDate} onChange={e => setTrainingForm(p => ({ ...p, startDate: e.target.value }))} />
              </FormField>
              <FormField label="End Date">
                <Input type="date" value={trainingForm.endDate} onChange={e => setTrainingForm(p => ({ ...p, endDate: e.target.value }))} />
              </FormField>
            </FormRow>
            <FormField label="Estimated Cost (USD)">
              <Input type="number" placeholder="e.g. 2500" value={trainingForm.cost} onChange={e => setTrainingForm(p => ({ ...p, cost: e.target.value }))} />
            </FormField>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setTrainingModalOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!trainingForm.title.trim() || submitTraining.isPending} onClick={handleSubmitTraining}>
                {submitTraining.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── NEW PROMOTION REQUEST MODAL ───────────────────────────────────── */}
      <Dialog open={promotionModalOpen} onOpenChange={setPromotionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-blue-600" />
              New Promotion Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <FormRow cols={2}>
              <FormField label="Current Title" required>
                <Input placeholder="e.g. Junior Developer" value={promotionForm.currentTitle} onChange={e => setPromotionForm(p => ({ ...p, currentTitle: e.target.value }))} />
              </FormField>
              <FormField label="Proposed Title" required>
                <Input placeholder="e.g. Senior Developer" value={promotionForm.targetTitle} onChange={e => setPromotionForm(p => ({ ...p, targetTitle: e.target.value }))} />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="Department">
                <Input placeholder="e.g. Engineering" value={promotionForm.department} onChange={e => setPromotionForm(p => ({ ...p, department: e.target.value }))} />
              </FormField>
              <FormField label="Effective Date">
                <Input type="date" value={promotionForm.effectiveDate} onChange={e => setPromotionForm(p => ({ ...p, effectiveDate: e.target.value }))} />
              </FormField>
            </FormRow>
            <FormRow cols={2}>
              <FormField label="KPI Score">
                <Input type="number" placeholder="e.g. 90" min={0} max={100} value={promotionForm.kpiScore} onChange={e => setPromotionForm(p => ({ ...p, kpiScore: e.target.value }))} />
              </FormField>
              <FormField label="Years in Current Role">
                <Input type="number" placeholder="e.g. 2.5" min={0} step="0.5" value={promotionForm.yearsInRole} onChange={e => setPromotionForm(p => ({ ...p, yearsInRole: e.target.value }))} />
              </FormField>
            </FormRow>
            <FormField label="Justification" required>
              <Textarea
                placeholder="Explain why this promotion is warranted…"
                rows={4}
                value={promotionForm.justification}
                onChange={e => setPromotionForm(p => ({ ...p, justification: e.target.value }))}
              />
            </FormField>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPromotionModalOpen(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!promotionForm.currentTitle.trim() || !promotionForm.targetTitle.trim() || !promotionForm.justification.trim() || submitPromotion.isPending}
                onClick={handleSubmitPromotion}
              >
                {submitPromotion.isPending ? 'Submitting…' : 'Submit Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRM DIALOGS ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmApproveTraining}
        onClose={() => setConfirmApproveTraining(null)}
        onConfirm={() => handleApproveTraining(confirmApproveTraining!)}
        title="Approve Training Request"
        description="This will move the request to scheduled status and notify the employee."
        confirmLabel="Approve"
        loading={approveTraining.isPending}
      />
      <ConfirmDialog
        open={!!confirmRejectTraining}
        onClose={() => setConfirmRejectTraining(null)}
        onConfirm={() => handleRejectTraining(confirmRejectTraining!)}
        title="Reject Training Request"
        description="The employee will be notified that this request was declined."
        confirmLabel="Reject"
        variant="destructive"
        loading={rejectTraining.isPending}
      />
      <ConfirmDialog
        open={!!confirmApprovePromotion}
        onClose={() => setConfirmApprovePromotion(null)}
        onConfirm={() => handleApprovePromotion(confirmApprovePromotion!)}
        title="Approve Promotion Request"
        description="This will advance the request to the next approval stage."
        confirmLabel="Approve"
        loading={approvePromotion.isPending}
      />
      <ConfirmDialog
        open={!!confirmRejectPromotion}
        onClose={() => setConfirmRejectPromotion(null)}
        onConfirm={() => handleRejectPromotion(confirmRejectPromotion!)}
        title="Reject Promotion Request"
        description="The employee will be notified that this promotion request was declined."
        confirmLabel="Reject"
        variant="destructive"
        loading={rejectPromotion.isPending}
      />
    </div>
  );
}
