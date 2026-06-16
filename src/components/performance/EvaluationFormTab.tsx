import React, { useState } from 'react';
import { FileText, Plus, Search, ChevronDown, Check, Columns, FolderPlus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/blih';

interface FormTemplate {
  id: string;
  title: string;
  category: 'Performance Review' | 'KPI Assessment' | 'OKR Check-in' | 'Competency Survey';
  targetAudience: string;
  questionsCount: number;
  freq: string;
  created: string;
}

interface EvaluationFormTabProps {
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function EvaluationFormTab({ showAlert }: EvaluationFormTabProps) {
  // Forms collection lists
  const [templates, setTemplates] = useState<FormTemplate[]>([
    {
      id: "form-1",
      title: "Quarterly Performance Review Checklist",
      category: "Performance Review",
      targetAudience: "All Employees",
      questionsCount: 8,
      freq: "Quarterly",
      created: "2024-01-10"
    },
    {
      id: "form-2",
      title: "V SaaS Operational KPI Assessment",
      category: "KPI Assessment",
      targetAudience: "Sales and Marketing Units",
      questionsCount: 5,
      freq: "Monthly",
      created: "2024-01-15"
    },
    {
      id: "form-3",
      title: "OKR Strategic Progress Check-in",
      category: "OKR Check-in",
      targetAudience: "Department Leads",
      questionsCount: 6,
      freq: "Quarterly",
      created: "2024-02-01"
    },
    {
      id: "form-4",
      title: "Leadership Competency Competency Survey",
      category: "Competency Survey",
      targetAudience: "Managers and Executives",
      questionsCount: 12,
      freq: "Annual",
      created: "2024-02-12"
    }
  ]);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Builder form inputs
  const [builderForm, setBuilderForm] = useState({
    title: '',
    category: 'Performance Review' as FormTemplate['category'],
    targetAudience: 'All Staff',
    freq: 'Quarterly',
    questions: ['Assess delivery rate and timelines', 'Specify key milestones reached', 'Identify growth and training opportunities']
  });

  const handleAddQuestionRow = () => {
    setBuilderForm(prev => ({
      ...prev,
      questions: [...prev.questions, '']
    }));
  };

  const handleEditQuestion = (index: number, val: string) => {
    setBuilderForm(prev => {
      const qCopy = [...prev.questions];
      qCopy[index] = val;
      return { ...prev, questions: qCopy };
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setBuilderForm(prev => {
      const qCopy = [...prev.questions];
      qCopy.splice(index, 1);
      return { ...prev, questions: qCopy };
    });
  };

  const saveFormTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderForm.title) return;

    // Filter out blank questions
    const validQuestions = builderForm.questions.filter(q => q.trim().length > 0);

    const newTemplate: FormTemplate = {
      id: `form-${Date.now()}`,
      title: builderForm.title,
      category: builderForm.category,
      targetAudience: builderForm.targetAudience,
      questionsCount: validQuestions.length,
      freq: builderForm.freq,
      created: new Date().toISOString().split('T')[0]
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setBuilderOpen(false);
    showAlert(`Successfully published form structure: ${newTemplate.title}!`, 'success');

    // Reset Form builder and input values
    setBuilderForm({
      title: '',
      category: 'Performance Review',
      targetAudience: 'All Staff',
      freq: 'Quarterly',
      questions: ['Assess delivery rate and timelines', 'Specify key milestones reached', 'Identify growth and training opportunities']
    });
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    setDeleteTarget(null);
    showAlert("Form template deleted from listing.", "info");
  };

  // Filter forms
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.targetAudience.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="evaluation-form-builder-panel" className="space-y-5">
      {/* Dynamic forms telemetry stats blocks bar */}
      <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Templates Active</span>
          <span className="text-xl font-extrabold text-slate-850 block mt-1">{templates.length}</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block font-sans">Responses Logged</span>
          <span className="text-xl font-extrabold text-[#1a56db] block mt-1">112 submissions</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg Completion</span>
          <span className="text-xl font-extrabold text-emerald-60 block mt-1 text-emerald-600">94%</span>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block font-sans">Awaiting Sign-offs</span>
          <span className="text-xl font-extrabold text-amber-500 block mt-1">2 profiles</span>
        </div>
      </div>

      {/* Control bar for filters and searching */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-3xs">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5 w-full">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search evaluation templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-100 hover:bg-white"
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-3.5 pr-8 text-xs font-bold text-slate-605 cursor-pointer focus:outline-none"
            >
              <option value="All">All Form Categories</option>
              <option value="Performance Review">Performance Review</option>
              <option value="KPI Assessment">KPI Assessment</option>
              <option value="OKR Check-in">OKR Check-in</option>
              <option value="Competency Survey">Competency Survey</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-405 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => setBuilderOpen(true)}
          className="w-full sm:w-auto bg-[#1a56db] hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
        >
          <Plus className="w-4.5 h-4.5 shrink-0" />
          <span>Create Form</span>
        </button>
      </div>

      {/* Grid of Templates cards columns representation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-slate-100 hover:border-slate-200 rounded-3xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Labels header */}
              <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-50">
                <span className="bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider block">
                  {t.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="bg-slate-50 border border-slate-150 text-[9px] font-extrabold text-slate-500 rounded p-0.5 px-1 bg-clip-text flex items-center gap-0.5 uppercase tracking-wide">
                    {t.freq}
                  </span>
                </div>
              </div>

              {/* Title representation */}
              <h4 className="text-xs font-black text-slate-900 mt-3 leading-tight tracking-tight">
                {t.title}
              </h4>

              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[8px]">Target Audience</span>
                  <span className="text-slate-700">{t.targetAudience}</span>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-slate-400 block text-[8px]">Diagnostic Questions</span>
                  <span className="text-slate-700">{t.questionsCount} items</span>
                </div>
              </div>
            </div>

            {/* Bottom active state metrics and trash */}
            <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-bold gap-4">
              <span className="text-[10px] text-slate-400">Created: {t.created}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => showAlert(`Selected Template: "${t.title}". Downloading JSON metrics structure...`, 'info')}
                  className="text-blue-600 hover:bg-blue-50/50 p-1 px-2 border border-blue-100 hover:border-blue-200 rounded-lg text-[10px] transition-all cursor-pointer"
                >
                  Download schema
                </button>
                <button
                  onClick={() => setDeleteTarget({ id: t.id, name: t.title })}
                  className="p-1 px-1.5 border border-rose-100 rounded-lg text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer"
                  title="Remove template"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form builder wizard detailed Modal overlay */}
      {builderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-3xs overflow-y-auto pt-10 pb-10">
          <div className="absolute inset-0" onClick={() => setBuilderOpen(false)} />

          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative z-10 w-full max-w-xl space-y-4 animate-fade-in mx-4 my-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-600" />
                <h4 className="text-[13px] font-bold text-slate-900">Configure Digital Evaluation Form Builder</h4>
              </div>
              <button
                onClick={() => setBuilderOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-850 font-black p-1 px-2 border border-slate-100 rounded hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveFormTemplate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Diagnostic Form Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Competency & Pipeline Engagement Audit"
                  value={builderForm.title}
                  onChange={(e) => setBuilderForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Form Category Classification</label>
                  <select
                    value={builderForm.category}
                    onChange={(e) => setBuilderForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-155 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Performance Review">Performance Review</option>
                    <option value="KPI Assessment">KPI Assessment</option>
                    <option value="OKR Check-in">OKR Check-in</option>
                    <option value="Competency Survey">Competency Survey</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-405 uppercase block">Evaluating Frequency</label>
                  <select
                    value={builderForm.freq}
                    onChange={(e) => setBuilderForm(prev => ({ ...prev, freq: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-155 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="Monthly">Monthly Recurring</option>
                    <option value="Quarterly">Quarterly Cycle</option>
                    <option value="Annual">Annual Evaluation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Target Staff Audience</label>
                <input
                  type="text"
                  required
                  value={builderForm.targetAudience}
                  onChange={(e) => setBuilderForm(prev => ({ ...prev, targetAudience: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-155 rounded-xl px-3.5 py-2 text-xs font-bold focus:outline-none focus:bg-white"
                />
              </div>

              {/* Form questions list manager */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Evaluation Diagnostic Questions</label>
                  <button
                    type="button"
                    onClick={handleAddQuestionRow}
                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    + Add Question Question
                  </button>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {builderForm.questions.map((qText, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-[10px] text-slate-400 font-extrabold w-4">{i + 1}.</span>
                      <input
                        type="text"
                        required
                        placeholder="Type standard question..."
                        value={qText}
                        onChange={(e) => handleEditQuestion(i, e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:bg-white"
                      />
                      {builderForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(i)}
                          className="p-1 px-2 hover:bg-rose-50 text-rose-500 rounded border border-slate-100 hover:border-rose-100 transition-all text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBuilderOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1a56db] hover:bg-blue-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Publish Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteTemplate(deleteTarget.id, deleteTarget.name)}
        title="Delete Form Template"
        description={deleteTarget ? `Delete form structure "${deleteTarget.name}"?` : undefined}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
