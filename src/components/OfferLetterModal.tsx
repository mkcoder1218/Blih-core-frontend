/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  FileText, 
  Edit, 
  Printer, 
  Send 
} from 'lucide-react';

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  positionTitle: string;
  onSendOffer?: (candidateName: string, email: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

interface OFormData {
  subject: string;
  candidateName: string;
  position: string;
  startDate: string;
  netSalary: string;
  employmentType: 'Full-time' | 'Contract' | 'Remote' | 'Part-time';
  senderName: string;
  senderPosition: string;
  senderEmail: string;
}

export default function OfferLetterModal({
  isOpen,
  onClose,
  candidateName,
  positionTitle,
  onSendOffer,
  showAlert
}: OfferLetterModalProps) {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [formData, setFormData] = useState<OFormData>({
    subject: 'Job Offer Letter',
    candidateName: '',
    position: '',
    startDate: '2026-06-01',
    netSalary: '100,000',
    employmentType: 'Full-time',
    senderName: 'Aytenew Yihunie',
    senderPosition: 'HR Manager',
    senderEmail: 'aytenew@blihmarketing.com'
  });

  // Sync candidate details when opening or changing parameters
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        candidateName: candidateName || 'Dawit',
        position: positionTitle || 'UI/UX Designer',
        subject: `Job Offer Letter - ${positionTitle || 'UI/UX Designer'}`
      }));
      setShowPreview(false);
    }
  }, [isOpen, candidateName, positionTitle]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPreview(true);
  };

  const handleSendOfferEmail = () => {
    if (onSendOffer) {
      onSendOffer(formData.candidateName, formData.senderEmail);
    } else {
      showAlert(`Offer letter dispatched officially to ${formData.candidateName} (${formData.senderEmail})!`, 'success');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none">
        <div className="absolute inset-0" onClick={onClose} />

        {/* Form View Modal */}
        {!showPreview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-white rounded-3xl p-6.5 shadow-2xl border border-slate-100 z-50 space-y-4"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#1a56db]">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <h4 className="text-[13.5px] font-bold text-slate-900">Generate Offer Letter</h4>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 select-text">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={formData.candidateName}
                  onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                  className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Position</label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 font-sans hover:bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Net Salary</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                    <input
                      type="text"
                      required
                      value={formData.netSalary}
                      onChange={(e) => setFormData({ ...formData, netSalary: e.target.value })}
                      className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white pl-7 pr-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-800 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Employment Type</label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-150 font-semibold rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Sender Name</label>
                  <input
                    type="text"
                    required
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-750 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Sender Position</label>
                  <input
                    type="text"
                    required
                    value={formData.senderPosition}
                    onChange={(e) => setFormData({ ...formData, senderPosition: e.target.value })}
                    className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-755 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Sender/Target Email</label>
                <input
                  type="email"
                  required
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  className="w-full bg-slate-50 hover:bg-slate-50 focus:bg-white px-3.5 py-2 rounded-xl border border-slate-150 focus:border-blue-500 font-semibold text-xs text-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 text-slate-500 hover:text-slate-800 text-xs font-black py-2 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer shadow-3xs"
                >
                  Preview Full Letter
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* Preview Mode Modal matching image letter exactly */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-[#f1f5f9] rounded-3xl p-5 shadow-2xl z-50 space-y-4"
          >
            {/* Top Controls Header Bar */}
            <div className="flex justify-between items-center bg-white p-4.5 rounded-2xl border border-slate-200/50 shadow-3xs">
              <h4 className="text-[14px] font-black text-slate-800">Offer Letter Preview</h4>
              
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button 
                  type="button"
                  onClick={() => showAlert('Downloaded and generated print PDF version of offer letter!', 'info')}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>

                <button 
                  type="button"
                  onClick={handleSendOfferEmail}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Offer</span>
                </button>

                <button 
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Business Letter Body Block */}
            <div className="bg-white border border-slate-200/50 p-8.5 rounded-3xl shadow-3xs min-h-[460px] flex flex-col justify-between font-sans relative select-text overflow-y-auto max-h-[500px]">
              
              <div className="space-y-6">
                {/* Header Information block */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Offer Letter</h2>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Human Resources Department</p>
                  </div>

                  <div className="text-right text-[11px] text-slate-450 leading-relaxed font-semibold">
                    <p className="font-extrabold text-slate-700">Blih Global Marketing</p>
                    <p>123 Business Street</p>
                    <p>City, State 12345</p>
                    <p>Phone: (555) 123-4567</p>
                  </div>
                </div>

                {/* Date stamp */}
                <div className="text-[11.5px] text-slate-500 font-bold">
                  {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                {/* Recipient info block */}
                <div className="text-[11.5px] space-y-0.5 animate-fade-in">
                  <p className="font-extrabold text-slate-800 text-[12.5px]">{formData.candidateName}</p>
                  <p className="text-slate-400 font-semibold">{formData.senderEmail}</p>
                </div>

                {/* Subj */}
                <div className="text-[12px] font-black text-slate-800 uppercase tracking-tight">
                  Subject: {formData.subject}
                </div>

                {/* Body paragraph */}
                <div className="text-[11.5px] text-slate-600 leading-relaxed space-y-4 font-normal">
                  <p>Dear {formData.candidateName},</p>
                  <p>
                    We are pleased to extend to you an offer of employment with our organization. After careful consideration of your qualifications and our discussions during the interview process, we believe you will be an excellent addition to our team.
                  </p>
                  <p>
                    We are offering you the position of <strong className="text-slate-800">{formData.position}</strong>, reporting to the HR Manager. We believe your skills, experience, and enthusiasm will contribute significantly to our continued success.
                  </p>
                </div>

                {/* Styled Offer details box matching Image 4 */}
                <div className="border border-blue-200 bg-blue-50/20 p-4.5 rounded-2xl space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-[#1a56db] tracking-wider mb-2">Offer Details</h5>
                  
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11.5px]">
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="text-slate-450 font-semibold">Position Title:</span>
                      <span className="font-extrabold text-slate-800">{formData.position}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="text-slate-450 font-semibold">Department:</span>
                      <span className="font-extrabold text-slate-800">Engineering Department</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="text-slate-450 font-semibold">Net Salary:</span>
                      <span className="font-extrabold text-slate-800 font-sans">{formData.netSalary}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span className="text-slate-450 font-semibold">Start Date:</span>
                      <span className="font-extrabold text-slate-800 font-sans">{formData.startDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-450 font-semibold">Employment Type:</span>
                      <span className="font-extrabold text-slate-800">{formData.employmentType}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authorized elements stamp */}
              <div className="border-t border-slate-50 pt-6 mt-6 flex justify-between items-end">
                <div className="text-[11px] text-slate-450 space-y-0.5">
                  <p className="font-black text-slate-700">{formData.senderName}</p>
                  <p className="font-semibold">{formData.senderPosition}</p>
                  <p>{formData.senderEmail}</p>
                </div>
                <div className="text-right">
                  <div className="w-24 h-10 border-b border-slate-200/80 mb-1" />
                  <p className="text-[9.5px] text-slate-350 font-bold uppercase tracking-wider">Authorized Signature</p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
