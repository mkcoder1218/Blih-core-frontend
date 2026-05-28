import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Download, Send, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { getOfferLetterTemplates, createOfferLetter, previewOfferLetter, generateOfferLetterPdf, sendOfferLetter } from '../../api/offerLetters';
import OfferLetterPreviewModal from './OfferLetterPreviewModal';

interface OfferLetterCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (title: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: (draftId?: string) => void;
  initialData?: any;
}

export default function OfferLetterCreateModal({ isOpen, onClose, showAlert, onSuccess, initialData }: OfferLetterCreateModalProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Data lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

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
    companyName: 'Blih'
  });

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  const loadDependencies = async () => {
    try {
      const [tplRes, deptRes, roleRes, posRes] = await Promise.all([
        getOfferLetterTemplates(),
        api.get('/api/v1/departments').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/roles').catch(() => ({ data: { data: [] } })),
        api.get('/api/v1/positions').catch(() => ({ data: { data: [] } }))
      ]);
      setTemplates(tplRes.data.data || []);
      setDepartments(deptRes.data.data?.departments || deptRes.data.rows || deptRes.data.data || []);
      setRoles(roleRes.data.data?.roles || roleRes.data.roles || roleRes.data.data || []);
      setPositions(posRes.data.data?.positions || posRes.data.rows || posRes.data.data || []);

      if (tplRes.data.data?.length > 0) {
        setFormData(prev => ({ ...prev, templateId: tplRes.data.data[0].id }));
      }
    } catch (e) {
      showAlert("Failed to load form dependencies", "error");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePreview = async () => {
    if (!formData.templateId || !formData.candidateName || !formData.candidateEmail) {
      showAlert("Please fill in candidate details and select a template", "error");
      return;
    }

    setLoading(true);
    try {
      const selectedDept = departments.find(d => d.id === formData.departmentId)?.name || 'Department';
      const selectedRole = roles.find(r => r.id === formData.roleId)?.name || 'Role';
      const selectedPos = positions.find(p => p.id === formData.positionId)?.title || 'Position';

      const payloadData = {
        ...formData,
        departmentName: selectedDept,
        roleName: selectedRole,
        positionName: selectedPos
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
    if (!formData.templateId) return showAlert("Select a template", "error");
    setLoading(true);
    try {
      const resp = await createOfferLetter(formData);
      showAlert("Draft saved successfully", "success");
      onSuccess?.(resp.data?.data?.id); // passed draft ID for convenience
      onClose();
    } catch (e: any) {
      showAlert(e.response?.data?.message || 'Failed to save draft', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Generate Offer Letter</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Fill details to preview and send.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 py-8 bg-white custom-scrollbar space-y-6">

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase">Offer Template <span className="text-rose-500">*</span></label>
              <select name="templateId" value={formData.templateId} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                <option value="">Select Template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Candidate Name <span className="text-rose-500">*</span></label>
                <input name="candidateName" value={formData.candidateName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Email <span className="text-rose-500">*</span></label>
                <input type="email" name="candidateEmail" value={formData.candidateEmail} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Department</label>
                <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Department</option>
                  {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Position (Role)</label>
                <select name="positionId" value={formData.positionId} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="">Select Position</option>
                  {positions?.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Net Salary</label>
                <input name="salary" placeholder="100,000" value={formData.salary} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Employment Type</label>
                <select name="employmentType" value={formData.employmentType} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all">
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="space-y-2 col-span-2 sm:col-span-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Reporting Manager</label>
                <input name="reportingManager" value={formData.reportingManager} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
              </div>
            </div>

          </div>

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
                {loading ? 'Processing...' : 'Preview Full Letter'}
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
          onSuccess={(draftId) => { setPreviewOpen(false); onSuccess?.(draftId); onClose() }}
        />
      )}
    </>
  );
}
