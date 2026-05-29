import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { createOfferLetterTemplate, updateOfferLetterTemplate } from '../../api/offerLetters';

interface OfferLetterTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  showAlert: (title: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: () => void;
  initialData?: any;
}

export default function OfferLetterTemplateModal({ isOpen, onClose, showAlert, onSuccess, initialData }: OfferLetterTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    bodyHtml: initialData?.bodyHtml || '',
    bodyText: initialData?.bodyText || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.bodyHtml) {
      return showAlert("Please fill required fields (Name, Subject, Body HTML)", "error");
    }

    setLoading(true);
    try {
      // Find placeholders like {{var}}
      const placeholderRegex = /\{\{\s*([\w]+)\s*\}\}/g;
      let match;
      const placeholders = new Set<string>();
      
      while ((match = placeholderRegex.exec(formData.bodyHtml)) !== null) {
        placeholders.add(match[1]);
      }
      while ((match = placeholderRegex.exec(formData.subject)) !== null) {
        placeholders.add(match[1]);
      }

      if (initialData?.id) {
        await updateOfferLetterTemplate(initialData.id, {
          ...formData,
          variables: Array.from(placeholders)
        });
        showAlert("Template updated successfully", "success");
      } else {
        await createOfferLetterTemplate({
          ...formData,
          variables: Array.from(placeholders)
        });
        showAlert("Template created successfully", "success");
      }
      
      onSuccess?.();
      onClose();
    } catch (e: any) {
      showAlert(e.response?.data?.message || 'Failed to save template', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">{initialData?.id ? 'Edit Offer Template' : 'Create Offer Template'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 py-8 bg-white custom-scrollbar space-y-6">
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-500 uppercase">Template Name <span className="text-rose-500">*</span></label>
             <input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Standard Engineer Offer" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
           </div>
           
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-500 uppercase">Email Subject <span className="text-rose-500">*</span></label>
             <input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="e.g. Job Offer from {{companyName}}" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all" />
           </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex justify-between">
                <span>Body Content (Letter Editor) <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-blue-500 lowercase font-medium">Tip: Use {'{{candidateName}}'} for dynamic text</span>
              </label>
              <div className="modern-quill-container">
                <ReactQuill 
                  theme="snow"
                  value={formData.bodyHtml}
                  onChange={(val) => setFormData(prev => ({ ...prev, bodyHtml: val }))}
                  placeholder="Draft your professional offer letter here..."
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['link', 'clean']
                    ],
                  }}
                  className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 focus-within:border-blue-500 transition-all"
                />
              </div>
              <style>{`
                .modern-quill-container .ql-toolbar {
                  border: none !important;
                  background: #f8fafc !important;
                  border-bottom: 1px solid #e2e8f0 !important;
                  padding: 8px 12px !important;
                }
                .modern-quill-container .ql-container {
                  border: none !important;
                  height: 350px !important;
                  font-size: 14px !important;
                  font-family: 'Inter', sans-serif !important;
                }
                .modern-quill-container .ql-editor {
                  padding: 20px !important;
                  min-height: 100% !important;
                }
                .modern-quill-container .ql-editor.ql-blank::before {
                  color: #94a3b8 !important;
                  font-style: normal !important;
                  left: 20px !important;
                }
              `}</style>
            </div>
           
           <div className="space-y-2">
             <label className="text-[11px] font-bold text-slate-500 uppercase">Body Plain Text (Optional)</label>
             <textarea name="bodyText" value={formData.bodyText} onChange={handleInputChange} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none transition-all font-mono text-xs" />
           </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-3xl">
           <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors">
             Cancel
           </button>
           <button 
             disabled={loading}
             onClick={handleSave} 
             className="px-8 py-2.5 rounded-xl text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
           >
             {loading ? 'Saving...' : <><Save className="w-4 h-4"/> Save Template</>}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
