import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  ChevronDown,
  Check,
  FolderPlus,
  Trash2,
  Copy,
  Users,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight,
  TrendingUp,
  Download,
  Info,
  Edit3
} from 'lucide-react';
import {
  ConfirmDialog,
  StatusBadge,
  FormField,
  FormRow,
  EmptyState
} from '@/components/ui/blih';
import { useUsers } from '../../hooks/useUsers';
import { useDepartments } from '../../hooks/useDepartments';
import { getOkrObjectives } from '../../api/okr';
import { getKpis } from '../../api/kpi';
import {
  getTemplates,
  createTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplateSchemaDownloadUrl,
  getTemplateStats,
  assignTemplate,
  getAssignments,
  submitResponse,
  getResponse,
  EvaluationTemplate,
  EvaluationSection,
  EvaluationQuestion,
  EvaluationAssignment,
  EvaluationAnswer,
  TemplateStats
} from '../../api/evaluation';

interface EvaluationFormTabProps {
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function EvaluationFormTab({ showAlert }: EvaluationFormTabProps) {
  // Navigation: 'HR_MANAGE' or 'MY_EVALUATIONS'
  const [subTab, setSubTab] = useState<'HR_MANAGE' | 'MY_EVALUATIONS'>('MY_EVALUATIONS');

  // Lists & State
  const [templates, setTemplates] = useState<EvaluationTemplate[]>([]);
  const [myAssignments, setMyAssignments] = useState<EvaluationAssignment[]>([]);
  const [templateStatsMap, setTemplateStatsMap] = useState<Record<string, TemplateStats>>({});

  // Lookups
  const { data: usersData } = useUsers({ size: 200 });
  const { data: deptsData } = useDepartments({ size: 100 });
  const employees = usersData?.rows || [];
  const departments = deptsData?.departments || [];

  const [activeKpis, setActiveKpis] = useState<any[]>([]);
  const [activeOkrs, setActiveOkrs] = useState<any[]>([]);

  // UX states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modals & Builders State
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<EvaluationTemplate>>({
    title: '',
    description: '',
    category: 'PERFORMANCE_REVIEW',
    targetAudience: 'All Staff',
    frequency: 'QUARTERLY',
    sections: []
  });

  // Assign Flow Modal State
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<EvaluationTemplate | null>(null);
  const [assignForm, setAssignForm] = useState({
    targetType: 'EMPLOYEE' as 'EMPLOYEE' | 'DEPARTMENT' | 'ROLE',
    targetId: '',
    evaluatorType: 'MANAGER' as any,
    evaluatorUserIds: [] as string[],
    participantUserIds: [] as string[],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Employee Submissions Dialog State
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<EvaluationAssignment | null>(null);
  const [answersForm, setAnswersForm] = useState<Record<string, Partial<EvaluationAnswer>>>({});
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // View response state
  const [viewResponseOpen, setViewResponseOpen] = useState(false);
  const [historicalResponse, setHistoricalResponse] = useState<any>(null);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState<EvaluationTemplate | null>(null);

  // Load KPI/OKR lists for question builders references
  const loadReferenceChoices = async () => {
    try {
      const kpiData = await getKpis({ limit: '100' });
      setActiveKpis(kpiData.kpis || []);
      const okrData = await getOkrObjectives({ limit: '100' });
      setActiveOkrs(okrData.objectives || []);
    } catch {
      // Ignored non-blocking lookup errors
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (subTab === 'HR_MANAGE') {
        const params: Record<string, string> = {};
        if (selectedCategory !== 'ALL') params.category = selectedCategory;
        if (searchTerm) params.search = searchTerm;

        const data = await getTemplates(params);
        setTemplates(data.templates || []);

        // Load stats for each template
        const statsMap: Record<string, TemplateStats> = {};
        for (const t of data.templates) {
          if (t.id) {
            const stat = await getTemplateStats(t.id);
            statsMap[t.id] = stat;
          }
        }
        setTemplateStatsMap(statsMap);
      } else {
        const assigns = await getAssignments({ role: 'evaluator' });
        setMyAssignments(assigns || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load evaluation structures.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, selectedCategory, searchTerm]);

  useEffect(() => {
    loadReferenceChoices();
  }, []);

  // Duplicate template
  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await duplicateTemplate(id);
      showAlert(`Duplicated template into: ${duplicated.title}`, 'success');
      loadData();
    } catch (err: any) {
      showAlert(err.message || 'Failed to duplicate template.', 'error');
    }
  };

  // Delete template
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !deleteTarget.id) return;
    try {
      await deleteTemplate(deleteTarget.id);
      showAlert('Template deleted.', 'success');
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      showAlert(err.message || 'Failed to delete template.', 'error');
    }
  };

  // Builder actions
  const handleOpenCreate = () => {
    setEditingTemplateId(null);
    setTemplateForm({
      title: '',
      description: '',
      category: 'PERFORMANCE_REVIEW',
      targetAudience: 'All Staff',
      frequency: 'QUARTERLY',
      sections: []
    });
    setBuilderOpen(true);
  };

  const handleOpenEdit = async (t: EvaluationTemplate) => {
    try {
      const fullT = await getTemplate(t.id!);
      setEditingTemplateId(t.id!);
      setTemplateForm({ ...fullT });
      setBuilderOpen(true);
    } catch (err: any) {
      showAlert(err.message || 'Failed to retrieve full template details.', 'error');
    }
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.title) return;

    try {
      if (editingTemplateId) {
        await updateTemplate(editingTemplateId, templateForm);
        showAlert('Template successfully updated.', 'success');
      } else {
        await createTemplate(templateForm);
        showAlert('New Evaluation template published.', 'success');
      }
      setBuilderOpen(false);
      loadData();
    } catch (err: any) {
      showAlert(err.message || 'Failed to save template.', 'error');
    }
  };

  const addSection = () => {
    const sCount = (templateForm.sections || []).length;
    const newSec: EvaluationSection = {
      title: `Section #${sCount + 1}`,
      description: '',
      orderIndex: sCount,
      questions: []
    };
    setTemplateForm(prev => ({
      ...prev,
      sections: [...(prev.sections || []), newSec]
    }));
  };

  const removeSection = (sIdx: number) => {
    setTemplateForm(prev => ({
      ...prev,
      sections: (prev.sections || []).filter((_, idx) => idx !== sIdx)
    }));
  };

  const addQuestion = (sIdx: number) => {
    setTemplateForm(prev => {
      const sections = [...(prev.sections || [])];
      const sec = sections[sIdx];
      const qCount = sec.questions.length;
      const newQ: EvaluationQuestion = {
        type: 'RATING',
        label: '',
        description: '',
        isRequired: true,
        scoreWeight: 1.0,
        orderIndex: qCount,
        options: { choices: [] }
      };
      sec.questions = [...sec.questions, newQ];
      sections[sIdx] = sec;
      return { ...prev, sections };
    });
  };

  const removeQuestion = (sIdx: number, qIdx: number) => {
    setTemplateForm(prev => {
      const sections = [...(prev.sections || [])];
      const sec = sections[sIdx];
      sec.questions = sec.questions.filter((_, idx) => idx !== qIdx);
      sections[sIdx] = sec;
      return { ...prev, sections };
    });
  };

  const updateQuestionField = (sIdx: number, qIdx: number, field: keyof EvaluationQuestion, value: any) => {
    setTemplateForm(prev => {
      const sections = [...(prev.sections || [])];
      const sec = sections[sIdx];
      const questions = [...sec.questions];
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      sec.questions = questions;
      sections[sIdx] = sec;
      return { ...prev, sections };
    });
  };

  // Duplicate choices/options editor helper
  const addOptionChoice = (sIdx: number, qIdx: number) => {
    setTemplateForm(prev => {
      const sections = [...(prev.sections || [])];
      const q = sections[sIdx].questions[qIdx];
      const choices = [...(q.options?.choices || [])];
      choices.push({ value: `Option #${choices.length + 1}`, score: 100 });
      q.options = { ...q.options, choices };
      sections[sIdx].questions[qIdx] = q;
      return { ...prev, sections };
    });
  };

  const updateOptionChoice = (sIdx: number, qIdx: number, cIdx: number, field: 'value' | 'score', val: any) => {
    setTemplateForm(prev => {
      const sections = [...(prev.sections || [])];
      const q = sections[sIdx].questions[qIdx];
      const choices = [...(q.options?.choices || [])];
      choices[cIdx] = { ...choices[cIdx], [field]: val };
      q.options = { ...q.options, choices };
      sections[sIdx].questions[qIdx] = q;
      return { ...prev, sections };
    });
  };

  const removeOptionChoice = (sIdx: number, qIdx: number, cIdx: number) => {
    setTemplateForm(prev => {
      const sections = [...(prev.sections || [])];
      const q = sections[sIdx].questions[qIdx];
      q.options = { ...q.options, choices: q.options.choices.filter((_: any, idx: number) => idx !== cIdx) };
      sections[sIdx].questions[qIdx] = q;
      return { ...prev, sections };
    });
  };

  // Assignment Actions
  const handleOpenAssign = (t: EvaluationTemplate) => {
    setSelectedTemplateForAssign(t);
    setAssignForm({
      targetType: 'EMPLOYEE',
      targetId: '',
      evaluatorType: 'MANAGER',
      evaluatorUserIds: [],
      participantUserIds: [],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setAssignOpen(true);
  };

  const submitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateForAssign || !selectedTemplateForAssign.id) return;

    try {
      await assignTemplate({
        templateId: selectedTemplateForAssign.id,
        targetType: assignForm.targetType,
        targetId: assignForm.targetType === 'EMPLOYEE' ? null : assignForm.targetId,
        evaluatorType: assignForm.evaluatorType,
        evaluatorUserIds: assignForm.evaluatorUserIds,
        participantUserIds: assignForm.participantUserIds,
        dueDate: assignForm.dueDate
      });
      showAlert('Appraisal assignments scheduled successfully.', 'success');
      setAssignOpen(false);
      loadData();
    } catch (err: any) {
      showAlert(err.message || 'Failed to dispatch assignments.', 'error');
    }
  };

  // Submit/Response Actions for Employees
  const handleOpenSubmission = async (assign: EvaluationAssignment) => {
    try {
      setActiveAssignment(assign);
      // Initialize response answers structure
      const initAnswers: Record<string, Partial<EvaluationAnswer>> = {};
      const responseRes = await getResponse(assign.id);

      // Pre-populate if response already exists
      const answersList = responseRes?.answers || [];
      const questionsList: any[] = [];
      (assign.templateSnapshot.sections || []).forEach((sec: any) => {
        (sec.questions || []).forEach((q: any) => {
          questionsList.push(q);
        });
      });

      questionsList.forEach(q => {
        const found = answersList.find(a => a.questionId === q.id);
        if (found) {
          initAnswers[q.id] = { ...found };
        } else {
          initAnswers[q.id] = {
            questionId: q.id,
            textValue: '',
            numberValue: q.type === 'RATING' ? 3 : 0,
            dateValue: '',
            optionValues: {},
            referencedKpiId: '',
            referencedObjectiveId: '',
            referencedKeyResultId: ''
          };
        }
      });

      setAnswersForm(initAnswers);
      setSubmissionOpen(true);
    } catch (err: any) {
      showAlert(err.message || 'Failed to initialize appraisal form.', 'error');
    }
  };

  const handleOpenViewResponse = async (assign: EvaluationAssignment) => {
    try {
      const res = await getResponse(assign.id);
      setHistoricalResponse(res || null);
      setActiveAssignment(assign);
      setViewResponseOpen(true);
    } catch (err: any) {
      showAlert(err.message || 'Failed to load completed responses.', 'error');
    }
  };

  const saveResponseChecklist = async (isDraft: boolean) => {
    if (!activeAssignment) return;
    setIsDraftSaving(true);

    try {
      // Map form records
      const answersPayload = Object.values(answersForm) as EvaluationAnswer[];
      await submitResponse({
        assignmentId: activeAssignment.id,
        answers: answersPayload,
        isDraft
      });

      showAlert(
        isDraft ? 'Draft appraisal saved successfully.' : 'Appraisal response submitted successfully.',
        'success'
      );
      setSubmissionOpen(false);
      loadData();
    } catch (err: any) {
      showAlert(err.message || 'Failed to save responses.', 'error');
    } finally {
      setIsDraftSaving(false);
    }
  };

  const updateAnswerField = (qId: string, field: keyof EvaluationAnswer, val: any) => {
    setAnswersForm(prev => {
      const copy = { ...prev };
      copy[qId] = { ...copy[qId], [field]: val };
      return copy;
    });
  };

  return (
    <div id="evaluation-form-tab-panel" className="space-y-5">
      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        <button
          onClick={() => setSubTab('MY_EVALUATIONS')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
            subTab === 'MY_EVALUATIONS'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          My Evaluations Checklist
        </button>
        <button
          onClick={() => setSubTab('HR_MANAGE')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
            subTab === 'HR_MANAGE'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Manage Templates & Assignments (Admin)
        </button>
      </div>

      {subTab === 'HR_MANAGE' ? (
        // HR MANAGEMENT TAB VIEW
        <>
          {/* Header filters */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5 w-full">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 focus:outline-none"
                />
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-3.5 pr-8 text-xs font-bold text-slate-605 cursor-pointer focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="PERFORMANCE_REVIEW">Performance Review</option>
                  <option value="KPI_ASSESSMENT">KPI Assessment</option>
                  <option value="OKR_CHECK_IN">OKR Check-in</option>
                  <option value="COMPETENCY_SURVEY">Competency Survey</option>
                  <option value="CUSTOM">Custom</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={handleOpenCreate}
              className="w-full sm:w-auto bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4.5 h-4.5 shrink-0" />
              <span>Create Form</span>
            </button>
          </div>

          {/* Templates Listing Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-xs text-slate-500 font-bold">Retrieving evaluation templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              title="No Evaluation Templates Found"
              description="Deploy appraisal checklists or custom questionnaires to start collecting scores."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {templates.map((t) => {
                const stats = templateStatsMap[t.id!] || { totalCount: 0, submittedCount: 0, completionRate: 0 };
                const questionsCount = (t.sections || []).reduce((acc, s) => acc + (s.questions || []).length, 0);

                return (
                  <div key={t.id} className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-50">
                        <span className="bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider block">
                          {t.category.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <StatusBadge label={t.status} tone={t.status === 'ACTIVE' ? 'emerald' : t.status === 'DRAFT' ? 'blue' : 'slate'} />
                          <span className="bg-slate-50 border border-slate-150 text-[9px] font-extrabold text-slate-500 rounded p-0.5 px-1 flex items-center uppercase tracking-wide">
                            {t.frequency}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 mt-3 leading-tight tracking-tight">
                        {t.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-snug mt-1 max-w-sm">{t.description}</p>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 block text-[8px]">Audience</span>
                          <span className="text-slate-700 truncate block">{t.targetAudience}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-slate-400 block text-[8px]">Questions</span>
                          <span className="text-slate-700">{questionsCount} items</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-slate-400 block text-[8px]">Completion</span>
                          <span className="text-emerald-600">{stats.completionRate}% ({stats.submittedCount}/{stats.totalCount})</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold gap-4">
                      <button
                        onClick={() => handleOpenAssign(t)}
                        className="bg-slate-900 hover:bg-slate-800 text-white p-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1 transition-all"
                      >
                        <Users className="w-3 h-3" />
                        <span>Assign Form</span>
                      </button>

                      <div className="flex gap-1.5">
                        <a
                          href={getTemplateSchemaDownloadUrl(t.id!)}
                          download
                          className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-600"
                          title="Download JSON Schema"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                          title="Edit Template"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(t.id!)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-500 hover:text-slate-800"
                          title="Duplicate Template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 text-rose-500 hover:text-rose-700"
                          title="Remove Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        // EMPLOYEE CHECKLIST VIEW
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-3xl space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-xs text-slate-500 font-bold">Retrieving assigned appraisals...</span>
            </div>
          ) : myAssignments.length === 0 ? (
            <EmptyState
              title="No Appraisals Checklist Items"
              description="No active reviews or custom evaluations are scheduled for your profile."
            />
          ) : (
            <div className="space-y-4">
              {myAssignments.map((a) => {
                const statusColor =
                  a.status === 'SUBMITTED'
                    ? 'emerald'
                    : a.status === 'IN_PROGRESS'
                    ? 'blue'
                    : a.status === 'OVERDUE'
                    ? 'rose'
                    : 'slate';

                return (
                  <div key={a.id} className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-5 px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusBadge label={a.status} tone={statusColor} />
                          <span className="text-[10px] text-slate-450 font-bold">Evaluator Type: {a.evaluatorType}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 mt-1 leading-tight tracking-tight">{a.template?.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Review Target Participant: {a.participant?.fullName} • Due: {a.dueDate}</p>
                      </div>
                    </div>

                    <div>
                      {a.status === 'SUBMITTED' ? (
                        <button
                          onClick={() => handleOpenViewResponse(a)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>Read Response</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenSubmission(a)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>{a.status === 'IN_PROGRESS' ? 'Resume' : 'Start'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Evaluation Template Builder Modal */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0" onClick={() => setBuilderOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-150">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  {editingTemplateId ? 'Edit Evaluation Template' : 'Configure Diagnostic Evaluation Template'}
                </h4>
              </div>
              <button onClick={() => setBuilderOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <form onSubmit={saveTemplate} className="space-y-4">
              <FormField label="Diagnostic Form Title" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Pipeline Engagement Checklist"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none focus:bg-white"
                />
              </FormField>

              <FormField label="Form Description">
                <textarea
                  placeholder="Provide instruction context for the evaluator..."
                  value={templateForm.description || ''}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:outline-none h-16"
                />
              </FormField>

              <FormRow cols={3}>
                <FormField label="Category Classification" required>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="PERFORMANCE_REVIEW">Performance Review</option>
                    <option value="KPI_ASSESSMENT">KPI Assessment</option>
                    <option value="OKR_CHECK_IN">OKR Check-in</option>
                    <option value="COMPETENCY_SURVEY">Competency Survey</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </FormField>

                <FormField label="Evaluating Cycle Frequency" required>
                  <select
                    value={templateForm.frequency}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="ONE_TIME">One Time</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="SEMI_ANNUAL">Semi Annual</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </FormField>

                <FormField label="Target Staff Audience" required>
                  <input
                    type="text"
                    required
                    value={templateForm.targetAudience}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold"
                  />
                </FormField>
              </FormRow>

              {/* Sections & Questions Builder */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide block">Sections & Diagnostic Questions</span>
                  <button
                    type="button"
                    onClick={addSection}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] py-1.5 px-3 rounded-lg select-none"
                  >
                    + Add Section
                  </button>
                </div>

                <div className="space-y-5">
                  {(templateForm.sections || []).map((sec, sIdx) => (
                    <div key={sIdx} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-4 relative">
                      <button
                        type="button"
                        onClick={() => removeSection(sIdx)}
                        className="absolute top-3.5 right-3.5 text-rose-500 hover:text-rose-700 text-xs font-bold"
                      >
                        Remove Section
                      </button>

                      <FormRow cols={2}>
                        <FormField label={`Section #${sIdx + 1} Title`} required>
                          <input
                            type="text"
                            required
                            value={sec.title}
                            onChange={(e) => {
                              const copy = [...(templateForm.sections || [])];
                              copy[sIdx].title = e.target.value;
                              setTemplateForm(prev => ({ ...prev, sections: copy }));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </FormField>
                        <FormField label="Section Description / Core Goal">
                          <input
                            type="text"
                            value={sec.description || ''}
                            onChange={(e) => {
                              const copy = [...(templateForm.sections || [])];
                              copy[sIdx].description = e.target.value;
                              setTemplateForm(prev => ({ ...prev, sections: copy }));
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                          />
                        </FormField>
                      </FormRow>

                      {/* Question Sub-rows */}
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-550 uppercase">Questions List</span>
                          <button
                            type="button"
                            onClick={() => addQuestion(sIdx)}
                            className="text-[10px] font-black text-blue-600 hover:underline"
                          >
                            + Add Question
                          </button>
                        </div>

                        <div className="space-y-4 bg-white/40 p-3 rounded-xl border border-slate-200/50">
                          {sec.questions.map((q, qIdx) => (
                            <div key={qIdx} className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-3.5 relative">
                              <button
                                type="button"
                                onClick={() => removeQuestion(sIdx, qIdx)}
                                className="absolute top-3.5 right-3.5 text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <FormRow cols={3}>
                                <FormField label={`Q #${qIdx + 1} Label / Question Text`} required>
                                  <input
                                    type="text"
                                    required
                                    value={q.label}
                                    onChange={(e) => updateQuestionField(sIdx, qIdx, 'label', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                                  />
                                </FormField>

                                <FormField label="Question Type" required>
                                  <select
                                    value={q.type}
                                    onChange={(e) => updateQuestionField(sIdx, qIdx, 'type', e.target.value as any)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-semibold cursor-pointer"
                                  >
                                    <option value="TEXT">Free Text</option>
                                    <option value="TEXTAREA">Paragraph Text</option>
                                    <option value="NUMBER">Numeric Value</option>
                                    <option value="RATING">Rating Star (1-5)</option>
                                    <option value="SINGLE_SELECT">Single Select Option</option>
                                    <option value="BOOLEAN">Yes / No Toggle</option>
                                    <option value="KPI_REFERENCE">Reference KPI Metric</option>
                                    <option value="OKR_REFERENCE">Reference OKR Key Result</option>
                                  </select>
                                </FormField>

                                <FormField label="Scoring Weight">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={q.scoreWeight}
                                    onChange={(e) => updateQuestionField(sIdx, qIdx, 'scoreWeight', parseFloat(e.target.value) || 1.0)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold"
                                  />
                                </FormField>
                              </FormRow>

                              {/* Choice option builder for Single Select */}
                              {q.type === 'SINGLE_SELECT' && (
                                <div className="space-y-2 border-t border-slate-100 pt-2 bg-slate-50/20 p-2.5 rounded-xl">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Choice Options & Score Configurations</span>
                                    <button
                                      type="button"
                                      onClick={() => addOptionChoice(sIdx, qIdx)}
                                      className="text-[9px] text-blue-600 hover:underline"
                                    >
                                      + Add Choice Option
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(q.options?.choices || []).map((c: any, cIdx: number) => (
                                      <div key={cIdx} className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                                        <input
                                          type="text"
                                          value={c.value}
                                          onChange={(e) => updateOptionChoice(sIdx, qIdx, cIdx, 'value', e.target.value)}
                                          className="text-[10px] font-semibold focus:outline-none w-20 border-none"
                                        />
                                        <input
                                          type="number"
                                          value={c.score}
                                          placeholder="Pts"
                                          onChange={(e) => updateOptionChoice(sIdx, qIdx, cIdx, 'score', parseInt(e.target.value) || 0)}
                                          className="text-[10px] font-black text-blue-600 w-8 border-none text-right"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeOptionChoice(sIdx, qIdx, cIdx)}
                                          className="text-rose-500 text-[9px] font-black px-1"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-150">
                {editingTemplateId && templateForm.status !== 'ACTIVE' && (
                  <button
                    type="button"
                    onClick={() => setTemplateForm(prev => ({ ...prev, status: 'ACTIVE' }))}
                    className="mr-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                  >
                    Activate Template
                  </button>
                )}
                <button type="button" onClick={() => setBuilderOpen(false)} className="px-4 py-2 border border-slate-250 rounded-xl text-xs font-bold text-slate-500 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">Save Form</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HR Assignment Flow Modal */}
      {assignOpen && selectedTemplateForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs overflow-y-auto p-4">
          <div className="absolute inset-0" onClick={() => setAssignOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-lg space-y-4 animate-fade-in mx-4 my-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Assign Evaluation Form</h4>
              <button onClick={() => setAssignOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <form onSubmit={submitAssign} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Selected Template</span>
                <span className="text-xs font-bold text-slate-800 leading-snug">{selectedTemplateForAssign.title}</span>
              </div>

              <FormRow cols={2}>
                <FormField label="Evaluator Type Classification" required>
                  <select
                    value={assignForm.evaluatorType}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, evaluatorType: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="SELF">SELF Evaluation</option>
                    <option value="MANAGER">MANAGER Appraisal</option>
                    <option value="PEER">PEER Reviewer</option>
                    <option value="HR">HR Dept Sign-off</option>
                    <option value="DEPARTMENT_HEAD">Department Head</option>
                    <option value="CUSTOM">Custom Auditor</option>
                  </select>
                </FormField>

                <FormField label="Due Date" required>
                  <input
                    type="date"
                    required
                    value={assignForm.dueDate}
                    onChange={(e) => setAssignForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold"
                  />
                </FormField>
              </FormRow>

              <FormField label="Appraisal Participants (Employees being evaluated)" required>
                <select
                  multiple
                  value={assignForm.participantUserIds}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions, (option: any) => option.value);
                    setAssignForm(prev => ({ ...prev, participantUserIds: vals }));
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer h-24"
                >
                  {employees.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Evaluators (Managers/Users scoring the forms)" required>
                <select
                  multiple
                  value={assignForm.evaluatorUserIds}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions, (option: any) => option.value);
                    setAssignForm(prev => ({ ...prev, evaluatorUserIds: vals }));
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer h-24"
                >
                  {employees.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </FormField>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setAssignOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-550 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer">Dispatch Assignments</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Submission checklist dialog form */}
      {submissionOpen && activeAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs overflow-y-auto p-4 sm:p-6">
          <div className="absolute inset-0" onClick={() => setSubmissionOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Perform Appraisal Evaluation</h4>
              <button onClick={() => setSubmissionOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs font-semibold">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Participant</span>
                <span className="text-slate-800 font-black">{activeAssignment.participant?.fullName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Evaluator Role</span>
                <span className="text-slate-850 font-black">{activeAssignment.evaluatorType}</span>
              </div>
            </div>

            <div className="space-y-6 pt-2">
              {(activeAssignment.templateSnapshot.sections || []).map((sec: any, sIdx: number) => (
                <div key={sIdx} className="space-y-3.5">
                  <div className="border-l-4 border-blue-600 pl-3.5">
                    <h5 className="text-xs font-black text-slate-850 uppercase">{sec.title}</h5>
                    <p className="text-[10px] text-slate-450 font-bold">{sec.description}</p>
                  </div>

                  <div className="space-y-4">
                    {(sec.questions || []).map((q: any, qIdx: number) => {
                      const ans = answersForm[q.id] || {};

                      return (
                        <div key={q.id} className="bg-slate-50/50 p-4 border border-slate-200 rounded-2xl space-y-2">
                          <label className="text-xs font-bold text-slate-800 leading-tight block">
                            {q.label} {q.isRequired && <span className="text-rose-500">*</span>}
                          </label>
                          {q.description && <p className="text-[10px] text-slate-400 font-medium">{q.description}</p>}

                          {/* Free text field */}
                          {(q.type === 'TEXT' || q.type === 'TEXTAREA') && (
                            <textarea
                              value={ans.textValue || ''}
                              required={q.isRequired}
                              onChange={(e) => updateAnswerField(q.id, 'textValue', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                              rows={q.type === 'TEXTAREA' ? 3 : 1}
                            />
                          )}

                          {/* Numeric input */}
                          {q.type === 'NUMBER' && (
                            <input
                              type="number"
                              required={q.isRequired}
                              value={ans.numberValue !== undefined ? ans.numberValue : ''}
                              onChange={(e) => updateAnswerField(q.id, 'numberValue', parseFloat(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none max-w-xs"
                            />
                          )}

                          {/* Date input */}
                          {q.type === 'DATE' && (
                            <input
                              type="date"
                              required={q.isRequired}
                              value={ans.dateValue || ''}
                              onChange={(e) => updateAnswerField(q.id, 'dateValue', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none max-w-xs"
                            />
                          )}

                          {/* YES/NO Toggle */}
                          {q.type === 'BOOLEAN' && (
                            <div className="flex gap-3.5">
                              <button
                                type="button"
                                onClick={() => updateAnswerField(q.id, 'numberValue', 1)}
                                className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  ans.numberValue === 1
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                Yes / Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => updateAnswerField(q.id, 'numberValue', 0)}
                                className={`px-4 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  ans.numberValue === 0
                                    ? 'bg-rose-600 border-rose-600 text-white'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                No / Deny
                              </button>
                            </div>
                          )}

                          {/* Rating score dropdown/stars */}
                          {q.type === 'RATING' && (
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  type="button"
                                  key={star}
                                  onClick={() => updateAnswerField(q.id, 'numberValue', star)}
                                  className={`w-8 h-8 rounded-lg border text-xs font-black transition-all ${
                                    ans.numberValue === star
                                      ? 'bg-blue-600 border-blue-600 text-white'
                                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {star}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Choices Selector */}
                          {q.type === 'SINGLE_SELECT' && (
                            <select
                              value={ans.textValue || ''}
                              required={q.isRequired}
                              onChange={(e) => updateAnswerField(q.id, 'textValue', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer max-w-xs focus:outline-none"
                            >
                              <option value="">Select Option Choice...</option>
                              {(q.options?.choices || []).map((choice: any, idx: number) => (
                                <option key={idx} value={choice.value}>{choice.value} ({choice.score} Pts)</option>
                              ))}
                            </select>
                          )}

                          {/* KPI Reference selector */}
                          {q.type === 'KPI_REFERENCE' && (
                            <select
                              value={ans.referencedKpiId || ''}
                              required={q.isRequired}
                              onChange={(e) => updateAnswerField(q.id, 'referencedKpiId', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer max-w-md focus:outline-none"
                            >
                              <option value="">Link Active KPI...</option>
                              {activeKpis.map(k => (
                                <option key={k.id} value={k.id}>{k.title} (Current: {k.currentValue} {k.unit})</option>
                              ))}
                            </select>
                          )}

                          {/* OKR Reference selector */}
                          {q.type === 'OKR_REFERENCE' && (
                            <select
                              value={ans.referencedKeyResultId || ''}
                              required={q.isRequired}
                              onChange={(e) => updateAnswerField(q.id, 'referencedKeyResultId', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer max-w-md focus:outline-none"
                            >
                              <option value="">Link OKR Key Result...</option>
                              {activeOkrs.map(obj => (
                                (obj.keyResults || []).map((kr: any) => (
                                  <option key={kr.id} value={kr.id}>{obj.title} • {kr.title} (Current: {kr.currentValue} {kr.unit})</option>
                                ))
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-150">
              <button
                type="button"
                onClick={() => setSubmissionOpen(false)}
                className="px-4 py-2 border border-slate-250 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDraftSaving}
                onClick={() => saveResponseChecklist(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                type="button"
                disabled={isDraftSaving}
                onClick={() => saveResponseChecklist(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold text-white cursor-pointer disabled:opacity-50"
              >
                Submit Appraisal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Historical/Completed Response Modal */}
      {viewResponseOpen && activeAssignment && historicalResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs overflow-y-auto p-4">
          <div className="absolute inset-0" onClick={() => setViewResponseOpen(false)} />
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4 animate-fade-in mx-4 my-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Submitted Evaluation Responses</h4>
              <button onClick={() => setViewResponseOpen(false)} className="text-xs text-slate-450 hover:text-slate-700 font-bold px-2 py-1 bg-slate-50 rounded-lg">✕</button>
            </div>

            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-2 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Evaluated Participant:</span>
                <span className="text-slate-900 font-black">{activeAssignment.participant?.fullName}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
                <span className="text-slate-500">Appraisal Final Score:</span>
                <span className="text-blue-600 font-black text-base">{historicalResponse.score !== null ? `${Math.round(historicalResponse.score)} Pts` : 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {(activeAssignment.templateSnapshot.sections || []).map((sec: any) => (
                <div key={sec.id} className="space-y-2.5">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block border-l-2 border-blue-600 pl-2">{sec.title}</span>

                  <div className="space-y-2">
                    {sec.questions.map((q: any) => {
                      const ans = (historicalResponse.answers || []).find((a: any) => a.questionId === q.id) || {};
                      
                      let answerText = ans.textValue || ans.numberValue || ans.dateValue || 'N/A';
                      if (q.type === 'KPI_REFERENCE' || q.type === 'OKR_REFERENCE') {
                        answerText = `Linked Target Snapshot Value: ${ans.capturedValue || 'N/A'}`;
                      }

                      return (
                        <div key={q.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 flex flex-col gap-1 text-xs">
                          <span className="text-slate-700 font-bold leading-tight">{q.label}</span>
                          <span className="text-blue-700 font-extrabold mt-1">{answerText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Overlay */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Appraisal Template"
        description={deleteTarget ? `Are you sure you want to permanently delete the template "${deleteTarget.title}"?` : undefined}
        confirmLabel="Confirm Delete"
        variant="destructive"
      />
    </div>
  );
}
