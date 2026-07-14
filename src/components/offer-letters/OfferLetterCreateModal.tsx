import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, ChevronUp, FileText, Eye, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { getOfferLetterTemplates, createOfferLetter, previewOfferLetter, updateOfferLetter } from '../../api/offerLetters';
import OfferLetterPreviewModal from './OfferLetterPreviewModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
interface OfferLetterCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (title: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: (draftId?: string) => void;
  initialData?: any;
}

// All variables the template can use — shown as clickable chips
const TEMPLATE_VARIABLES = [
  { key: 'candidateName',   label: 'Candidate Name' },
  { key: 'candidateEmail',  label: 'Email' },
  { key: 'candidatePhone',  label: 'Phone' },
  { key: 'departmentName',  label: 'Department' },
  { key: 'positionName',    label: 'Position' },
  { key: 'roleName',        label: 'Role' },
  { key: 'salary',          label: 'Net Salary' },
  { key: 'startDate',       label: 'Start Date' },
  { key: 'employmentType',  label: 'Employment Type' },
  { key: 'workLocation',    label: 'Work Location' },
  { key: 'reportingManager',label: 'Reporting Manager' },
  { key: 'companyName',     label: 'Company Name' },
  { key: 'acceptUrl',       label: 'Accept URL' },
  { key: 'rejectUrl',       label: 'Reject URL' },
];

export default function OfferLetterCreateModal({ isOpen, onClose, showAlert, onSuccess, initialData }: OfferLetterCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Data lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Template editor state
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateBody, setTemplateBody] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateDirty, setTemplateDirty] = useState(false);

  const [formData, setFormData] = useState({
    templateId: '',
    candidateName: initialData?.candidateName || '',
    candidateEmail: initialData?.candidateEmail || '',
    candidatePhone: initialData?.candidatePhone || '',
    departmentId: initialData?.departmentId || '',
    roleId: initialData?.roleId || '',
    positionId: initialData?.positionId || '',
    salary: initialData?.salary || '',
    startDate: initialData?.startDate || '',
    employmentType: initialData?.employmentType || 'Permanent',
    workLocation: initialData?.workLocation || '',
    reportingManager: initialData?.reportingManager || '',
    reportingManagerId: initialData?.reportingManagerId || '',
    companyName: 'Blih',
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      templateId: initialData?.templateId || '',
      candidateName: initialData?.candidateName || '',
      candidateEmail: initialData?.candidateEmail || '',
      candidatePhone: initialData?.candidatePhone || '',
      departmentId: initialData?.departmentId || '',
      roleId: initialData?.roleId || '',
      positionId: initialData?.positionId || '',
      salary: initialData?.salary || '',
      startDate: initialData?.startDate || '',
      employmentType: initialData?.employmentType || 'Permanent',
      workLocation: initialData?.workLocation || '',
      reportingManager: initialData?.reportingManager || '',
      reportingManagerId: initialData?.reportingManagerId || '',
      companyName: initialData?.companyName || 'Blih',
    });
    setTemplateDirty(false);
    setTemplateBody('');
    setTemplateSubject('');
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  // When template selection changes, load its body into the editor
  useEffect(() => {
    if (!formData.templateId) {
      setTemplateBody('');
      setTemplateSubject('');
      setTemplateDirty(false);
      return;
    }
    const tpl = templates.find(t => t.id === formData.templateId);
    if (tpl) {
      setTemplateBody(tpl.bodyHtml || '');
      setTemplateSubject(tpl.subject || '');
      setTemplateDirty(false);
    }
  }, [formData.templateId, templates]);

  const loadDependencies = async () => {
    try {
      const [tplRes, deptRes, roleRes, posRes, usersRes] = await Promise.all([
        getOfferLetterTemplates(),
        api.get('/api/v1/departments').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/roles/my-domain').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/positions').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/hr/records').catch(() => ({ data: { data: [] } })),
      ]);
      const tpls = tplRes.data.data || [];
      setTemplates(tpls);
      setDepartments(deptRes.data.data?.departments || deptRes.data.rows || deptRes.data.data || []);
      setRoles(roleRes.data.data?.roles || roleRes.data.roles || roleRes.data.data || []);
      setPositions(posRes.data.data?.positions || posRes.data.rows || posRes.data.data || []);
      // HR records include user info — map to { id, fullName, jobTitle }
      const records = usersRes.data.data?.rows || usersRes.data.rows || usersRes.data.data || [];
      setUsers(records.map((r: any) => ({
        id: r.userId || r.user?.id || r.id,
        fullName: r.user?.fullName || r.fullName || 'Unknown',
        jobTitle: r.position?.title || r.jobTitle || '',
      })));

      if (tpls.length > 0) {
        const firstId = tpls[0].id;
        setFormData(prev => ({ ...prev, templateId: firstId }));
        setTemplateBody(tpls[0].bodyHtml || '');
        setTemplateSubject(tpls[0].subject || '');
      }
    } catch (e) {
      showAlert('Failed to load form dependencies', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Insert a {{variable}} at cursor position in the Quill editor
  const insertVariable = (key: string) => {
    setTemplateBody(prev => prev + `{{${key}}}`);
    setTemplateDirty(true);
  };

  const handlePreview = async () => {
    if (!formData.templateId || !formData.candidateName || !formData.candidateEmail) {
      showAlert('Please fill in candidate details and select a template', 'error');
      return;
    }

    setLoading(true);
    try {
      const selectedDept = departments.find(d => d.id === formData.departmentId)?.name || '';
      const selectedRole = roles.find(r => r.id === formData.roleId)?.name || '';
      const selectedPos  = positions.find(p => p.id === formData.positionId)?.title || '';
      const selectedMgr  = users.find(u => u.id === formData.reportingManagerId)?.fullName || formData.reportingManager || '';

      // Use dropdown-resolved names, but fall back to pre-filled values from initialData
      const resolvedDept = selectedDept || (formData as any).departmentName || '';
      const resolvedPos  = selectedPos  || (formData as any).positionName   || (formData as any).positionTitle || '';
      const resolvedRole = selectedRole || (formData as any).roleName       || '';

      const payloadData = {
        ...formData,
        departmentName:   resolvedDept,
        roleName:         resolvedRole,
        positionName:     resolvedPos,
        positionTitle:    resolvedPos,   // alias so {{positionTitle}} also works
        reportingManager: selectedMgr,
        // Pass the (possibly edited) template body so the preview uses it
        overrideBodyHtml: templateDirty ? templateBody : undefined,
        overrideSubject:  templateDirty ? templateSubject : undefined,
      };

      const res = await previewOfferLetter(formData.templateId, payloadData);
      setPreviewData({ ...res.data.data, payloadData });
      setPreviewOpen(true);
    } catch (e: any) {
      showAlert(e.response?.data?.message || 'Preview generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.templateId) return showAlert('Select a template', 'error');
    setLoading(true);
    try {
      const payload = {
        ...formData,
        overrideBodyHtml: templateDirty ? templateBody : undefined,
        overrideSubject:  templateDirty ? templateSubject : undefined,
      };
      const resp = initialData?.id
        ? await updateOfferLetter(initialData.id, payload)
        : await createOfferLetter(payload);
      showAlert(initialData?.id ? 'Draft updated successfully' : 'Draft saved successfully', 'success');
      onSuccess?.(resp.data?.data?.id);
      onClose();
    } catch (e: any) {
      showAlert(e.response?.data?.message || 'Failed to save draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedTemplate = templates.find(t => t.id === formData.templateId);

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Generate Offer Letter</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Fill details to preview and send.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar space-y-6">

            {/* Template selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">
                Offer Template <span className="text-rose-500">*</span>
              </label>
              <select
                name="templateId"
                value={formData.templateId}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Select Template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* ── Inline template editor ── */}
            {selectedTemplate && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                {/* Collapsible header */}
                <button
                  type="button"
                  onClick={() => setShowTemplateEditor(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-[13px] font-black text-slate-700">Edit Template Body</span>
                    {templateDirty && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full">Modified</span>
                    )}
                  </div>
                  {showTemplateEditor
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                <AnimatePresence initial={false}>
                  {showTemplateEditor && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-4 space-y-4 border-t border-slate-100">

                        {/* Subject line */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Subject</label>
                          <input
                            value={templateSubject}
                            onChange={e => { setTemplateSubject(e.target.value); setTemplateDirty(true); }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Job Offer from {{companyName}}"
                          />
                        </div>

                        {/* Variable chips */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Insert Variable <span className="normal-case font-semibold text-slate-400">— click to insert at end</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {TEMPLATE_VARIABLES.map(v => (
                              <button
                                key={v.key}
                                type="button"
                                onClick={() => insertVariable(v.key)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-black rounded-lg transition-colors font-mono"
                              >
                                {`{{${v.key}}}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rich text editor */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Letter Body</label>
                          <div className="offer-template-quill border border-slate-200 rounded-xl overflow-hidden">
                            <ReactQuill
                              theme="snow"
                              value={templateBody}
                              onChange={val => { setTemplateBody(val); setTemplateDirty(true); }}
                              modules={{
                                toolbar: [
                                  [{ header: [1, 2, 3, false] }],
                                  ['bold', 'italic', 'underline', 'strike'],
                                  [{ color: [] }, { background: [] }],
                                  [{ list: 'ordered' }, { list: 'bullet' }],
                                  [{ align: [] }],
                                  ['link', 'clean'],
                                ],
                              }}
                              className="bg-white"
                            />
                          </div>
                          <style>{`
                            .offer-template-quill .ql-toolbar {
                              border: none !important;
                              background: #f8fafc !important;
                              border-bottom: 1px solid #e2e8f0 !important;
                              padding: 6px 10px !important;
                            }
                            .offer-template-quill .ql-container {
                              border: none !important;
                              height: 300px !important;
                              font-size: 13px !important;
                            }
                            .offer-template-quill .ql-editor {
                              padding: 16px !important;
                              min-height: 100% !important;
                            }
                            .offer-template-quill .ql-editor.ql-blank::before {
                              color: #94a3b8 !important;
                              font-style: normal !important;
                            }
                          `}</style>
                        </div>

                        {/* Reset button */}
                        {templateDirty && (
                          <button
                            type="button"
                            onClick={() => {
                              const tpl = templates.find(t => t.id === formData.templateId);
                              if (tpl) {
                                setTemplateBody(tpl.bodyHtml || '');
                                setTemplateSubject(tpl.subject || '');
                                setTemplateDirty(false);
                              }
                            }}
                            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors underline"
                          >
                            Reset to original template
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Candidate details */}
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Candidate Name <span className="text-rose-500">*</span></label>
                <input name="candidateName" value={formData.candidateName} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Email <span className="text-rose-500">*</span></label>
                <input type="email" name="candidateEmail" value={formData.candidateEmail} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Department</label>
                <select name="departmentId" value={formData.departmentId} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Position (Role)</label>
                <select name="positionId" value={formData.positionId} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Position</option>
                  {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Net Salary</label>
                <input name="salary" placeholder="100,000" value={formData.salary} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Employment Type</label>
                <select name="employmentType" value={formData.employmentType} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Reporting Manager</label>
                <select name="reportingManagerId" value={formData.reportingManagerId} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Manager</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName}{u.jobTitle ? ` — ${u.jobTitle}` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Work Location</label>
                <input name="workLocation" value={formData.workLocation} onChange={handleInputChange}
                  placeholder="e.g. Addis Ababa, Remote"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Company Name</label>
                <input name="companyName" value={formData.companyName} onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-3xl">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <div className="flex gap-3">
              <button
                disabled={loading}
                onClick={handleSaveDraft}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                disabled={loading}
                onClick={handlePreview}
                className="px-8 py-2.5 rounded-xl text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  : <><Eye className="w-4 h-4" /> Preview Full Letter</>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {previewOpen && previewData && (
        <OfferLetterPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          previewData={previewData}
          formData={formData}
          showAlert={showAlert}
          onSuccess={() => { setPreviewOpen(false); onSuccess?.(); onClose(); }}
        />
      )}
    </>
  );
}
