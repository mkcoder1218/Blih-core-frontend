/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  Plus,
  Eye,
  Edit2,
  Copy,
  Trash2,
  X,
  FileSignature,
  Settings,
  HelpCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { ConfirmDialog } from '@/components/ui/blih';

interface ApplicantFormsProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
  onOpenCreateTemplateModal: () => void;
}

export default function RecruitmentApplicantForms({
  onDraftAiSuggestion,
  showAlert,
  onOpenCreateTemplateModal
}: ApplicantFormsProps) {
  // Forms state
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  React.useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await api.get('/api/v1/hr/recruitment/templates');
        const payload: any = res.data;
        const rows = payload?.data?.data ?? payload?.data ?? [];
        if (Array.isArray(rows)) {
          // Map backend template structure to the frontend form structure
          const mapped = rows.map((t: any) => ({
            id: t.id,
            title: t.name,
            department: t.requestConfig?.department || 'Unassigned',
            createdDate: new Date(t.createdAt).toLocaleDateString(),
            usedInJobs: 0, // This would be fetched from a separate 'usage' query in a real production env
            fields: Object.keys(t.applicationFormConfig?.applicantFields || {})
          }));
          setForms(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch forms:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  // Modals state
  const [viewFormModal, setViewFormModal] = useState<typeof forms[0] | null>(null);
  const [createNewModal, setCreateNewModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newFormDept, setNewFormDept] = useState('Creative Department');
  
  const handleAddNewFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormTitle.trim()) {
      showAlert('Please enter a valid title', 'error');
      return;
    }
    const newForm = {
      id: `form-${Date.now()}`,
      title: newFormTitle,
      department: newFormDept,
      createdDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      usedInJobs: 0,
      fields: ['Full Name', 'Email Address', 'Contact Phone', 'Expected Salary', 'Resume Upload']
    };
    setForms(prev => [newForm, ...prev]);
    setCreateNewModal(false);
    setNewFormTitle('');
    showAlert(`Created "${newForm.title}" successfully!`, 'success');
  };

  const handleCopyForm = (id: string, title: string) => {
    const original = forms.find(f => f.id === id);
    if (!original) return;
    const duplicated = {
      ...original,
      id: `form-${Date.now()}`,
      title: `${original.title} (Copy)`,
      createdDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    };
    setForms(prev => {
      const index = prev.findIndex(f => f.id === id);
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicated);
      return updated;
    });
    showAlert(`Duplicated "${title}" successfully`, 'success');
  };

  const handleDeleteForm = async (id: string, title: string) => {
    if (deletingFormId) return;

    setDeletingFormId(id);
    try {
      await api.delete(`/api/v1/hr/recruitment/templates/${id}`);
      setForms(prev => prev.filter(f => f.id !== id));
      setDeleteTarget(null);
      showAlert(`Form "${title}" deleted`, 'success');
    } catch (err) {
      console.error('Failed to delete form:', err);
      showAlert(`Could not delete "${title}". Please try again.`, 'error');
    } finally {
      setDeletingFormId(null);
    }
  };

  const triggerCreateWithAi = () => {
    const targetPrompt = `Draft a modern job applicant form standard schema containing relevant data capture inputs (e.g., text, slider, checkboxes) for a high-performing Corporate Strategist position. Break down fields and validation requirements explicitly.`;
    onDraftAiSuggestion(targetPrompt);
  };

  return (
    <div id="applicant-forms-view" className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Visual Header Grid for cards matching Image 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Create New Form Blueprint */}
        <div 
          onClick={onOpenCreateTemplateModal}
          className="border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/5 hover:bg-blue-50/25 p-7 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-4"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-200">
            <Plus className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight">Create New Form</h4>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Build a custom application form from scratch</p>
          </div>
        </div>

        {/* Create with AI */}
        <div 
          onClick={triggerCreateWithAi}
          className="border-2 border-slate-100 hover:border-blue-400 bg-white hover:bg-blue-900/5 p-7 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-4 shadow-3xs"
        >
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-white/95">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight">Create with AI</h4>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">Generate a form using AI based on job requirements</p>
          </div>
        </div>

      </div>

      {/* Previously Created Forms Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900 tracking-tight">Previously Created Forms</h3>
          <p className="text-xs text-slate-400 font-semibold mt-1">Find applicant-to-fill forms with their job positions.</p>
        </div>

        {/* Forms list */}
        <div className="space-y-3">
          {forms.map((frm) => (
            <div 
              key={frm.id}
              className="bg-white rounded-2xl border border-slate-100 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-blue-100 transition-all font-sans"
            >
              
              {/* Form title details */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-505">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-900 tracking-tight">{frm.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] font-semibold text-slate-400">
                    <span className="text-blue-600 font-bold">{frm.department}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Created: <strong>{frm.createdDate}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Used in: <strong className="text-slate-650">{frm.usedInJobs} Jobs</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions group */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button 
                  onClick={() => setViewFormModal(frm)}
                  title="View Fields"
                  className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-450 hover:text-blue-600 border border-slate-100 flex items-center justify-center cursor-pointer transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => {
                    setNewFormTitle(frm.title);
                    setNewFormDept(frm.department);
                    setCreateNewModal(true);
                  }}
                  title="Edit Specifications"
                  className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-450 hover:text-amber-600 border border-slate-100 flex items-center justify-center cursor-pointer transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleCopyForm(frm.id, frm.title)}
                  title="Duplicate Form"
                  className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-450 hover:text-slate-600 border border-slate-100 flex items-center justify-center cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setDeleteTarget({ id: frm.id, title: frm.title })}
                  disabled={deletingFormId === frm.id}
                  title="Delete Form"
                  className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-450 hover:text-rose-600 border border-slate-100 flex items-center justify-center cursor-pointer transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                  <Trash2 className={`w-3.5 h-3.5 ${deletingFormId === frm.id ? 'animate-pulse' : ''}`} />
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="text-center pt-8 border-t border-slate-100/70 max-w-sm mx-auto space-y-3.5">
        <p className="text-xs text-slate-400 font-bold">No forms yet. Create or Generate using AI.</p>
        <button
          onClick={onOpenCreateTemplateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer shadow-md shadow-blue-200 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create Form</span>
        </button>
      </div>

      {/* VIEW SCHEMATICS FIELDS MODAL */}
      {viewFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-blue-600">
                <FileSignature className="w-4.5 h-4.5" />
                <h4 className="text-sm font-black text-slate-900 tracking-tight">Form Fields Breakdown</h4>
              </div>
              <button 
                onClick={() => setViewFormModal(null)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-slate-450 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <strong className="text-xs uppercase text-slate-400 tracking-wider">Form Name</strong>
                <h5 className="text-[13.5px] font-black text-slate-850 mt-1">{viewFormModal.title}</h5>
                <span className="text-[11px] font-bold text-blue-600 mt-0.5 block">{viewFormModal.department}</span>
              </div>

              <div className="space-y-2">
                <strong className="text-xs uppercase text-slate-400 tracking-wider">Configured Fields</strong>
                <div className="grid grid-cols-1 gap-2 pt-1.5">
                  {viewFormModal.fields.map((field, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-105 rounded-xl p-3 text-xs font-semibold text-slate-700">
                      <span className="w-4.5 h-4.5 bg-blue-600 rounded-full text-[10px] font-black text-white flex items-center justify-center">{i + 1}</span>
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* CREATE NEW FORM MODAL */}
      {createNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <form 
            onSubmit={handleAddNewFormSubmit}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl animate-scale-up"
          >
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-sm font-black text-slate-900 tracking-tight">Design New Applicant Form</h4>
              <button 
                type="button"
                onClick={() => setCreateNewModal(false)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-150 flex items-center justify-center text-slate-450 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block uppercase tracking-wide">Form Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Senior Copywriter Application"
                  value={newFormTitle}
                  onChange={(e) => setNewFormTitle(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-xl border border-slate-205 focus:border-blue-600 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-600 block uppercase tracking-wide">Department Allocation</label>
                <select 
                  value={newFormDept}
                  onChange={(e) => setNewFormDept(e.target.value)}
                  className="w-full px-4.5 py-3 rounded-xl border border-slate-205 focus:border-blue-600 text-xs font-bold text-slate-850 focus:outline-none"
                >
                  <option value="Creative Department">Creative Department</option>
                  <option value="Technology Department">Technology Department</option>
                  <option value="Business Development Department">Business Development Department</option>
                  <option value="Digital Marketing Department">Digital Marketing Department</option>
                </select>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-2.5 text-[11px] font-semibold text-slate-500 leading-relaxed">
                <HelpCircle className="w-4.5 h-4.5 text-blue-650 shrink-0" />
                <span>By default, candidate forms are auto-populated with core contact elements, a file uploader slot, and expected salary parameters.</span>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => setCreateNewModal(false)}
                className="px-4.5 py-2.5 bg-white border border-slate-205 hover:bg-slate-50 text-slate-600 text-xs font-black rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-blue-100"
              >
                Confirm Setup
              </button>
            </div>

          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteForm(deleteTarget.id, deleteTarget.title)}
        title="Delete Form"
        description={deleteTarget ? `Delete "${deleteTarget.title}"? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        variant="destructive"
        loading={!!deletingFormId}
      />

    </div>
  );
}
