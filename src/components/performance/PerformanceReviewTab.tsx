import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, Clock, Plus, Sparkles, User } from 'lucide-react';
import { getPerformanceReviews, type EmployeeProjectMetrics, type PerformanceReviewRecord } from '../../api/performance';
import { UserAvatar, StatusBadge, FilterBar, EmptyState, SectionCard, FormField, FormRow } from '@/components/ui/blih';

interface PerformanceReviewTabProps {
  onDraftAiSuggestion: (prompt: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function PerformanceReviewTab({ onDraftAiSuggestion, showAlert }: PerformanceReviewTabProps) {
  const [reviews, setReviews] = useState<PerformanceReviewRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedResultGroup, setSelectedResultGroup] = useState('All');
  const [selectedProjectStatus, setSelectedProjectStatus] = useState('All');
  const [newReviewModalOpen, setNewReviewModalOpen] = useState(false);
  const [newReviewForm, setNewReviewForm] = useState({
    name: '',
    dept: '',
    kpiScore: '',
    okrScore: '',
    score: '',
    gender: '',
    notes: '',
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPerformanceReviews()
      .then((data) => {
        if (!alive) return;
        setReviews(data);
        setError(null);
      })
      .catch(() => {
        if (!alive) return;
        setReviews([]);
        setError('Performance reviews could not be loaded.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const departments = useMemo(() => {
    return Array.from(new Set(reviews.map((review) => review.department?.name).filter(Boolean) as string[]));
  }, [reviews]);

  const reviewStatuses = useMemo(() => {
    return Array.from(new Set(reviews.map((review) => normalizeReviewStatus(review.status))));
  }, [reviews]);

  const projectStatusOptions = useMemo(() => {
    const statuses = reviews.flatMap((review) => review.projectEvidence?.tasks.map((task) => task.status) || []);
    return Array.from(new Set(statuses));
  }, [reviews]);

  const filteredReviews = reviews.filter((review) => {
    const department = review.department?.name || 'Unassigned';
    const displayStatus = normalizeReviewStatus(review.status);
    const matchesSearch = review.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || department === selectedDept;
    const matchesStatus = selectedStatus === 'All' || displayStatus === selectedStatus;
    const matchesProjectStatus = selectedProjectStatus === 'All' || review.projectEvidence?.tasks.some((task) => task.status === selectedProjectStatus);
    let matchesResult = true;
    if (selectedResultGroup !== 'All') {
      const score = Number(review.score || 0);
      if (selectedResultGroup === 'high') matchesResult = score >= 4.5;
      else if (selectedResultGroup === 'mid') matchesResult = score >= 3.5 && score < 4.5;
      else if (selectedResultGroup === 'low') matchesResult = score > 0 && score < 3.5;
    }
    return matchesSearch && matchesDept && matchesStatus && matchesProjectStatus && matchesResult;
  });

  const handleAiAction = (review: PerformanceReviewRecord) => {
    const evidence = review.projectEvidence?.summary;
    const projectContext = evidence
      ? ` Project evidence: ${evidence.completedTasks}/${evidence.assignedTasks} tasks completed, ${evidence.weightedCompletionRate}% weighted completion, ${evidence.overdueTasks} overdue, ${evidence.blockedTasks} blocked, ${evidence.reopenedTasks} reopened, ${evidence.latePenaltyExcludedTasks} approved blocker exclusions.`
      : '';
    const promptText = `Formulate a targeted 3-bullet professional development and coaching plan for ${review.employeeName}. Score metrics: overall ${formatScore(review.score)}, KPI ${readReviewScore(review, 'kpiScore')}, OKR ${readReviewScore(review, 'okrScore')}.${projectContext} Manager notes: "${readNotes(review)}".`;
    onDraftAiSuggestion(promptText);
  };

  const handleAddNewReview = (e: React.FormEvent) => {
    e.preventDefault();
    showAlert('Evaluation creation is connected to the existing backend review flow; this screen no longer creates local sample reviews.', 'info');
    setNewReviewModalOpen(false);
  };

  return (
    <div id="performance-review-panel" className="space-y-5">
      <SectionCard>
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name or department..."
          filters={[
            {
              value: selectedDept,
              onChange: setSelectedDept,
              placeholder: 'Department: All',
              options: [{ value: 'All', label: 'Department: All' }, ...departments.map((dept) => ({ value: dept, label: dept }))],
            },
            {
              value: selectedStatus,
              onChange: setSelectedStatus,
              placeholder: 'Status: All',
              options: [{ value: 'All', label: 'Status: All' }, ...reviewStatuses.map((status) => ({ value: status, label: status }))],
            },
            {
              value: selectedProjectStatus,
              onChange: setSelectedProjectStatus,
              placeholder: 'Project Status: All',
              options: [{ value: 'All', label: 'Project Status: All' }, ...projectStatusOptions.map((status) => ({ value: status, label: status }))],
            },
            {
              value: selectedResultGroup,
              onChange: setSelectedResultGroup,
              placeholder: 'Result Group: All',
              options: [
                { value: 'All', label: 'Result Group: All' },
                { value: 'high', label: 'Exceeds (>= 4.5)' },
                { value: 'mid', label: 'Meets (3.5 - 4.4)' },
                { value: 'low', label: 'Needs Improvement (< 3.5)' },
              ],
            },
          ]}
          actions={
            <button
              onClick={() => setNewReviewModalOpen(true)}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create evaluation</span>
            </button>
          }
        />
      </SectionCard>

      <SectionCard>
        <div className="flex justify-between items-center pb-2 border-b border-slate-100/60 mb-4">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Performance Reviews ({filteredReviews.length})</span>
          <span className="text-[10px] font-semibold text-slate-400">Project evidence supports manager scoring</span>
        </div>

        {loading ? (
          <EmptyState icon={<Clock className="w-8 h-8" />} title="Loading performance reviews..." compact />
        ) : error ? (
          <EmptyState icon={<AlertTriangle className="w-8 h-8" />} title={error} compact />
        ) : filteredReviews.length === 0 ? (
          <EmptyState icon={<User className="w-8 h-8" />} title="No real performance reviews found." compact />
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => {
              const isOpen = expandedId === review.id;
              const evidence = review.projectEvidence?.summary;
              return (
                <div
                  key={review.id}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${isOpen ? 'border-blue-200 bg-blue-50/5/30 shadow-xs' : 'border-slate-100 hover:border-slate-250 hover:bg-slate-50/20'}`}
                >
                  <div
                    onClick={() => setExpandedId(isOpen ? null : review.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-5 gap-4 cursor-pointer select-none"
                  >
                    <UserAvatar name={review.employeeName} subtitle={review.department?.name || 'Unassigned'} size="lg" />

                    <div className="flex flex-wrap items-center gap-5 sm:gap-8 text-right font-medium">
                      {evidence && (
                        <ReviewMetric label="Project Evidence" value={`${evidence.weightedCompletionRate}% weighted`} />
                      )}
                      <ReviewMetric label="KPI Score" value={readReviewScore(review, 'kpiScore')} />
                      <ReviewMetric label="OKR Score" value={readReviewScore(review, 'okrScore')} />
                      <ReviewMetric label="Overall Score" value={formatScore(review.score)} blue />
                      <StatusBadge status={normalizeReviewStatus(review.status) === 'Completed' ? 'COMPLETED' : 'IN_PROGRESS'} />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-4">
                      {review.projectEvidence && <ProjectEvidenceDetails metrics={review.projectEvidence} />}

                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Manager Assessment Summary</span>
                        <p className="text-xs text-slate-750 bg-white p-3.5 rounded-xl border border-slate-100 leading-relaxed font-semibold">
                          {readNotes(review)}
                        </p>
                      </div>

                      <div className="bg-blue-50/20 border border-blue-100 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="space-y-1">
                          <h5 className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5 leading-none">
                            <Sparkles className="w-4 h-4 text-blue-600 fill-blue-600" />
                            <span>AI Performance Coaching Advisor</span>
                          </h5>
                          <span className="text-[10px] text-blue-950 block leading-tight font-semibold">
                            Uses manager scores, review notes, and real project evidence from this period.
                          </span>
                        </div>
                        <button
                          onClick={() => handleAiAction(review)}
                          className="bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs p-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer select-none"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Draft Coaching Plan</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {newReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs">
          <div className="absolute inset-0" onClick={() => setNewReviewModalOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-5 animate-fade-in mx-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h4 className="text-[13px] font-bold text-slate-900">New Performance Evaluation File</h4>
              <button onClick={() => setNewReviewModalOpen(false)} className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 hover:bg-slate-150 rounded">X</button>
            </div>

            <form onSubmit={handleAddNewReview} className="space-y-4">
              <FormRow cols={2}>
                <FormField label="Employee Name" required>
                  <input value={newReviewForm.name} onChange={(e) => setNewReviewForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none" />
                </FormField>
                <FormField label="Department Unit">
                  <input value={newReviewForm.dept} onChange={(e) => setNewReviewForm((prev) => ({ ...prev, dept: e.target.value }))} className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none" />
                </FormField>
              </FormRow>
              <FormField label="Manager Performance Review Remarks">
                <textarea value={newReviewForm.notes} onChange={(e) => setNewReviewForm((prev) => ({ ...prev, notes: e.target.value }))} rows={3} className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none resize-none" />
              </FormField>
              <div className="flex justify-end gap-2.5 pt-3">
                <button type="button" onClick={() => setNewReviewModalOpen(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">Continue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewMetric({ label, value, blue = false }: { label: string; value: string; blue?: boolean }) {
  return (
    <div className="text-center sm:text-right">
      <span className="text-[10px] text-slate-400 block font-semibold uppercase">{label}</span>
      <span className={`text-xs font-black ${blue ? 'text-blue-600' : 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

function ProjectEvidenceDetails({ metrics }: { metrics: EmployeeProjectMetrics }) {
  const summary = metrics.summary;
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-[11px] font-black uppercase text-slate-700 flex items-center gap-2">
          <BriefcaseBusiness className="w-4 h-4 text-blue-600" />
          Project Management Evidence
        </h5>
        <span className="text-[10px] font-bold text-slate-400">Does not auto-set final review score</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <EvidenceStat label="Assigned" value={summary.assignedTasks} />
        <EvidenceStat label="Complete" value={`${summary.weightedCompletionRate}%`} tone="blue" />
        <EvidenceStat label="On time" value={`${summary.onTimeCompletionRate}%`} />
        <EvidenceStat label="Late" value={summary.overdueTasks} tone="rose" />
        <EvidenceStat label="Blocked" value={summary.blockedTasks} tone="amber" />
        <EvidenceStat label="Reopened" value={summary.reopenedTasks} tone="amber" />
      </div>
      {summary.latePenaltyExcludedTasks > 0 && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{summary.latePenaltyExcludedTasks} approved dependency/client/resource/management blocker excluded from late penalties.</span>
        </div>
      )}
      <div className="space-y-2">
        {metrics.tasks.slice(0, 3).map((task) => (
          <div key={task.id} className="flex items-center justify-between gap-3 bg-slate-50/70 border border-slate-100 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-800 truncate">{task.title}</span>
              <span className="block text-[10px] font-semibold text-slate-400 truncate">{task.project?.title || 'Project'} - Weight {task.weight}</span>
            </div>
            <div className="flex items-center gap-2">
              {task.overdue && !task.excludedLatePenalty && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
              {task.reopened && <Clock className="w-3.5 h-3.5 text-amber-500" />}
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{task.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceStat({ label, value, tone = 'slate' }: { label: string; value: string | number; tone?: 'slate' | 'blue' | 'rose' | 'amber' }) {
  const valueClass = tone === 'blue' ? 'text-blue-600' : tone === 'rose' ? 'text-rose-600' : tone === 'amber' ? 'text-amber-600' : 'text-slate-900';
  return (
    <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-2.5 text-center">
      <span className={`block text-sm font-black ${valueClass}`}>{value}</span>
      <span className="block text-[9px] font-bold uppercase text-slate-400">{label}</span>
    </div>
  );
}

function normalizeReviewStatus(status: string) {
  return ['completed', 'finalized', 'acknowledged', 'reviewed'].includes(String(status).toLowerCase()) ? 'Completed' : 'In Progress';
}

function formatScore(score: number | null) {
  return score === null || score === undefined ? 'Not scored' : `${Number(score).toFixed(1)}/5.0`;
}

function readReviewScore(review: PerformanceReviewRecord, key: 'kpiScore' | 'okrScore') {
  const value = review.reviewData?.[key] ?? review.reviewData?.[key.replace('Score', '')]?.score;
  return value === undefined || value === null ? 'Not scored' : String(value).includes('%') ? String(value) : `${value}%`;
}

function readNotes(review: PerformanceReviewRecord) {
  return review.reviewData?.notes || review.reviewData?.managerNotes || review.reviewData?.summary || 'No manager notes recorded yet.';
}
