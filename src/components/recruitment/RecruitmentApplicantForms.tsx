/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Copy,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { ConfirmDialog } from '@/components/ui/blih';

interface ApplicantFormsProps {
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
  onOpenCreateTemplateModal: () => void;
}

type FormRow = {
  id: string;
  name: string;
  assignedJob: string;
  questionCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  status: 'Draft' | 'Active' | 'Archived';
  fields: string[];
  raw: any;
};

const FORMS_QUERY_KEY = ['recruitment-templates'];

function normalizeTemplate(template: any): FormRow {
  const applicantFields = template?.applicationFormConfig?.applicantFields || {};
  const customFields = template?.applicationFormConfig?.customFields || [];
  const fields = [
    ...Object.keys(applicantFields).filter((key) => applicantFields[key]?.included !== false),
    ...customFields.map((field: any) => field?.label || field?.name || 'Custom question'),
  ];
  const assignedJob = template?.metadata?.assignedJob || template?.requestConfig?.jobTitle || '';

  return {
    id: template.id,
    name: template.name?.trim() || 'Untitled Application Form',
    assignedJob,
    questionCount: fields.length,
    createdBy: template.creator?.fullName || template.createdBy?.name || 'HR',
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    usageCount: Number(template.metadata?.usageCount ?? template.metadata?.usedByJobs ?? 0),
    status: template.metadata?.status || (assignedJob ? 'Active' : 'Draft'),
    fields,
    raw: template,
  };
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function RecruitmentApplicantForms({
  onDraftAiSuggestion,
  showAlert,
}: ApplicantFormsProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [viewForm, setViewForm] = useState<FormRow | null>(null);
  const [editingForm, setEditingForm] = useState<FormRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormRow | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createAssignedJob, setCreateAssignedJob] = useState('');

  const formsQuery = useQuery({
    queryKey: FORMS_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get('/api/v1/hr/recruitment/templates');
      const payload: any = res.data;
      const rows = payload?.data?.data ?? payload?.data ?? [];
      return Array.isArray(rows) ? rows : [];
    },
  });

  const rawForms = formsQuery.data ?? [];
  const forms = useMemo(() => rawForms.map(normalizeTemplate), [rawForms]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; assignedJob?: string }) => {
      const res = await api.post('/api/v1/hr/recruitment/templates', {
        name: data.name.trim() || 'Untitled Application Form',
        description: 'Application form template',
        requestConfig: data.assignedJob ? { jobTitle: data.assignedJob } : {},
        jobDetailsConfig: {},
        applicationFormConfig: {
          applicantFields: {
            firstName: { included: true, required: true },
            lastName: { included: true, required: true },
            email: { included: true, required: true },
            phone: { included: true, required: true },
            resumeUrl: { included: true, required: true },
            expectedSalary: { included: true, required: false },
          },
          customFields: [],
        },
        metadata: {
          assignedJob: data.assignedJob || '',
          status: data.assignedJob ? 'Active' : 'Draft',
          usageCount: data.assignedJob ? 1 : 0,
        },
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<any[]>(FORMS_QUERY_KEY, (current = []) => [created, ...current.filter((item) => item.id !== created.id)]);
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      setHighlightId(created.id);
      window.setTimeout(() => setHighlightId(null), 1800);
      setCreateOpen(false);
      setCreateName('');
      setCreateAssignedJob('');
      showAlert('Application form created', 'success');
    },
    onError: (error: any) => {
      showAlert(error?.response?.data?.message || 'Failed to create form. Your entries were kept.', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/api/v1/hr/recruitment/templates/${id}`, data);
      return res.data?.data ?? res.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<any[]>(FORMS_QUERY_KEY, (current = []) => current.map((item) => item.id === updated.id ? updated : item));
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      setEditingForm(null);
      showAlert('Application form updated', 'success');
    },
    onError: (error: any) => showAlert(error?.response?.data?.message || 'Failed to update form', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (form: FormRow) => {
      await api.delete(`/api/v1/hr/recruitment/templates/${form.id}`);
      return form;
    },
    onSuccess: (form) => {
      queryClient.setQueryData<any[]>(FORMS_QUERY_KEY, (current = []) => current.filter((item) => item.id !== form.id));
      queryClient.invalidateQueries({ queryKey: FORMS_QUERY_KEY });
      setDeleteTarget(null);
      showAlert(`Form "${form.name}" deleted`, 'success');
    },
    onError: () => showAlert('Could not delete form. Please try again.', 'error'),
  });

  const filteredForms = useMemo(() => {
    const rows = forms.filter((form) => {
      const text = `${form.name} ${form.assignedJob} ${form.createdBy}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesAssignment = assignmentFilter === 'All' || (assignmentFilter === 'Assigned' ? !!form.assignedJob : !form.assignedJob);
      const matchesStatus = statusFilter === 'All' || form.status === statusFilter;
      return matchesSearch && matchesAssignment && matchesStatus;
    });

    return rows.sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Questions') return b.questionCount - a.questionCount;
      if (sortBy === 'Updated') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [assignmentFilter, forms, search, sortBy, statusFilter]);

  const assignedCount = forms.filter((form) => form.assignedJob).length;
  const jobsUsingForms = forms.reduce((sum, form) => sum + form.usageCount, 0);

  const triggerCreateWithAi = () => {
    onDraftAiSuggestion('Draft a modern job applicant form standard schema containing relevant data capture inputs, validation requirements, and application questions.');
  };

  const duplicateForm = (form: FormRow) => {
    createMutation.mutate({
      name: `${form.name} Copy`,
      assignedJob: form.assignedJob,
    });
  };

  return (
    <div id="applicant-forms-view" className="-m-4 w-full max-w-none bg-slate-50 px-6 py-5 sm:-m-6 lg:px-8">
      <div className="w-full max-w-none space-y-4">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">Application Forms</h1>
            <p className="mt-1 text-xs font-medium text-slate-500">Create, assign, and manage reusable candidate application templates.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCreateOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Create Form
            </button>
            <button onClick={triggerCreateWithAi} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Generate with AI
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Total Forms" value={forms.length} />
          <Metric label="Assigned Forms" value={assignedCount} />
          <Metric label="Unassigned Forms" value={forms.length - assignedCount} />
          <Metric label="Jobs Using Forms" value={jobsUsingForms} />
        </div>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-2 border-b border-slate-100 p-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_160px_160px]">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Search forms..." className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none" />
            </label>
            <Select value={assignmentFilter} onChange={setAssignmentFilter} options={['All', 'Assigned', 'Unassigned']} />
            <Select value={statusFilter} onChange={setStatusFilter} options={['All', 'Draft', 'Active', 'Archived']} />
            <Select value={sortBy} onChange={setSortBy} options={['Newest', 'Updated', 'Name', 'Questions']} />
          </div>

          {formsQuery.isLoading ? (
            <div className="p-6 text-center text-xs font-bold text-slate-400">Loading forms...</div>
          ) : forms.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-black">Form Name</th>
                      <th className="px-4 py-3 font-black">Assigned Job</th>
                      <th className="px-4 py-3 font-black">Number of Questions</th>
                      <th className="px-4 py-3 font-black">Created By</th>
                      <th className="px-4 py-3 font-black">Created Date</th>
                      <th className="px-4 py-3 font-black">Last Updated</th>
                      <th className="px-4 py-3 font-black">Used By Jobs</th>
                      <th className="px-4 py-3 font-black">Status</th>
                      <th className="px-4 py-3 text-right font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredForms.map((form) => (
                      <FormTableRow
                        key={form.id}
                        form={form}
                        highlighted={highlightId === form.id}
                        menuOpen={menuOpenId === form.id}
                        setMenuOpen={setMenuOpenId}
                        onPreview={setViewForm}
                        onEdit={setEditingForm}
                        onDuplicate={duplicateForm}
                        onArchive={(row) => updateMutation.mutate({ id: row.id, data: { metadata: { ...row.raw.metadata, status: 'Archived' } } })}
                        onDelete={setDeleteTarget}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 p-3 lg:hidden">
                {filteredForms.map((form) => (
                  <FormMobileCard
                    key={form.id}
                    form={form}
                    highlighted={highlightId === form.id}
                    onPreview={setViewForm}
                    onEdit={setEditingForm}
                    onDuplicate={duplicateForm}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[170px] items-center justify-center p-6">
              <div className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-black text-slate-950">No application forms yet</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">Create a reusable form template or generate one with AI.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => setCreateOpen(true)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">Create Form</button>
                  <button onClick={triggerCreateWithAi} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">Generate with AI</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <FormEditorModal
        open={createOpen}
        title="Create Application Form"
        name={createName}
        assignedJob={createAssignedJob}
        loading={createMutation.isPending}
        submitLabel={createMutation.isPending ? 'Creating Form...' : 'Create Form'}
        onNameChange={setCreateName}
        onAssignedJobChange={setCreateAssignedJob}
        onClose={() => setCreateOpen(false)}
        onSubmit={() => createMutation.mutate({ name: createName, assignedJob: createAssignedJob })}
      />

      <FormEditorModal
        open={!!editingForm}
        title="Edit Application Form"
        name={editingForm?.name ?? ''}
        assignedJob={editingForm?.assignedJob ?? ''}
        loading={updateMutation.isPending}
        submitLabel={updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        onNameChange={(value) => setEditingForm((current) => current ? { ...current, name: value } : current)}
        onAssignedJobChange={(value) => setEditingForm((current) => current ? { ...current, assignedJob: value } : current)}
        onClose={() => setEditingForm(null)}
        onSubmit={() => editingForm && updateMutation.mutate({
          id: editingForm.id,
          data: {
            name: editingForm.name.trim() || 'Untitled Application Form',
            requestConfig: { ...editingForm.raw.requestConfig, jobTitle: editingForm.assignedJob },
            metadata: {
              ...editingForm.raw.metadata,
              assignedJob: editingForm.assignedJob,
              usageCount: editingForm.assignedJob ? Math.max(1, editingForm.usageCount) : 0,
              status: editingForm.assignedJob ? 'Active' : 'Draft',
            },
          },
        })}
      />

      <PreviewModal form={viewForm} onClose={() => setViewForm(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        title="Delete Form"
        description={deleteTarget ? `Delete "${deleteTarget.name}"? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950 leading-none">{value}</p>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.currentTarget.value)} className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}

function StatusPill({ status }: { status: FormRow['status'] }) {
  const cls = status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : status === 'Archived' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-700 border-amber-100';
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black ${cls}`}>{status}</span>;
}

function FormTableRow({ form, highlighted, menuOpen, setMenuOpen, onPreview, onEdit, onDuplicate, onArchive, onDelete }: any) {
  return (
    <tr className={`transition-colors ${highlighted ? 'bg-blue-50' : 'hover:bg-blue-50/40'}`}>
      <td className="px-4 py-3 font-black text-slate-950">{form.name}</td>
      <td className="px-4 py-3 font-bold text-slate-600">{form.assignedJob ? `Assigned to ${form.assignedJob}` : 'Unassigned'}</td>
      <td className="px-4 py-3 font-bold text-slate-700">{form.questionCount}</td>
      <td className="px-4 py-3 font-semibold text-slate-600">{form.createdBy}</td>
      <td className="px-4 py-3 font-semibold text-slate-500">{formatDate(form.createdAt)}</td>
      <td className="px-4 py-3 font-semibold text-slate-500">{formatDate(form.updatedAt)}</td>
      <td className="px-4 py-3 font-bold text-slate-700">{form.usageCount}</td>
      <td className="px-4 py-3"><StatusPill status={form.status} /></td>
      <td className="px-4 py-3 text-right">
        <div className="relative inline-flex">
          <button onClick={() => setMenuOpen(menuOpen ? null : form.id)} className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
            <MoreHorizontal className="h-4 w-4" />
            Actions
          </button>
          {menuOpen ? (
            <div className="absolute bottom-9 right-0 z-50 w-44 rounded-xl border border-slate-200 bg-white p-2 text-xs shadow-xl">
              <MenuItem icon={Eye} label="Preview" onClick={() => { setMenuOpen(null); onPreview(form); }} />
              <MenuItem icon={Pencil} label="Edit" onClick={() => { setMenuOpen(null); onEdit(form); }} />
              <MenuItem icon={Copy} label="Duplicate" onClick={() => { setMenuOpen(null); onDuplicate(form); }} />
              <MenuItem icon={FileText} label="Assign to Job" onClick={() => { setMenuOpen(null); onEdit(form); }} />
              <MenuItem icon={Archive} label="Archive" onClick={() => { setMenuOpen(null); onArchive(form); }} />
              <MenuItem icon={Trash2} label="Delete" danger onClick={() => { setMenuOpen(null); onDelete(form); }} />
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: any) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-bold hover:bg-slate-50 ${danger ? 'text-rose-600' : 'text-slate-600'}`}>
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FormMobileCard({ form, highlighted, onPreview, onEdit, onDuplicate, onDelete }: any) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${highlighted ? 'ring-2 ring-blue-200' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-950">{form.name}</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">{form.assignedJob ? `Assigned to ${form.assignedJob}` : 'Unassigned'}</p>
        </div>
        <StatusPill status={form.status} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <span className="font-semibold text-slate-500">{form.questionCount} questions</span>
        <span className="font-semibold text-slate-500">{form.usageCount} jobs</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => onPreview(form)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold">Preview</button>
        <button onClick={() => onEdit(form)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold">Edit</button>
        <button onClick={() => onDuplicate(form)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold">Duplicate</button>
        <button onClick={() => onDelete(form)} className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700">Delete</button>
      </div>
    </div>
  );
}

function FormEditorModal({ open, title, name, assignedJob, loading, submitLabel, onNameChange, onAssignedJobChange, onClose, onSubmit }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <form onSubmit={(event) => { event.preventDefault(); if (!loading) onSubmit(); }} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-black text-slate-950">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Form Name</span>
            <input value={name} onChange={(event) => onNameChange(event.currentTarget.value)} placeholder="Untitled Application Form" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-bold outline-none focus:border-blue-400" />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Assigned Job</span>
            <input value={assignedJob} onChange={(event) => onAssignedJobChange(event.currentTarget.value)} placeholder="Frontend Developer" className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-xs font-bold outline-none focus:border-blue-400" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">Cancel</button>
          <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

function PreviewModal({ form, onClose }: { form: FormRow | null; onClose: () => void }) {
  if (!form) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-black text-slate-950">{form.name}</h3>
            <p className="text-xs font-semibold text-slate-500">{form.assignedJob ? `Assigned to ${form.assignedJob}` : 'Unassigned'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Questions</p>
          <div className="mt-3 grid gap-2">
            {form.fields.length ? form.fields.map((field, index) => (
              <div key={`${field}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                {index + 1}. {field}
              </div>
            )) : <p className="text-xs font-semibold text-slate-400">No questions configured.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
