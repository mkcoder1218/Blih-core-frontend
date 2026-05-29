import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Send, Download } from 'lucide-react';
import { createOfferLetter, sendOfferLetter } from '../../api/offerLetters';

interface OfferLetterPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: any; // HTML, Text, Subject, MissingVariables
  formData: any;
  showAlert: (title: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: () => void;
}

export default function OfferLetterPreviewModal({ isOpen, onClose, previewData, formData, showAlert, onSuccess }: OfferLetterPreviewModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSendOffer = async () => {
    // acceptUrl and rejectUrl are always "missing" at preview time — they're generated
    // server-side at send time. Filter them out before deciding to block.
    const blockingMissing = (previewData.missingVariables || []).filter(
      (v: string) => v !== 'acceptUrl' && v !== 'rejectUrl'
    );

    if (blockingMissing.length > 0) {
      showAlert(`Required fields are missing: ${blockingMissing.join(', ')}`, 'error');
      return;
    }

    setLoading(true);
    try {
      // Use payloadData (has resolved names + all fields) for creating the draft
      // Strip preview-only override keys before saving
      const draftPayload = { ...(previewData.payloadData || formData) };
      delete draftPayload.overrideBodyHtml;
      delete draftPayload.overrideSubject;
      // Strip keys that aren't DB columns
      delete draftPayload.departmentName;
      delete draftPayload.roleName;
      delete draftPayload.positionName;

      // Validate required fields before hitting the server
      if (!draftPayload.templateId || !draftPayload.candidateName || !draftPayload.candidateEmail) {
        showAlert('Template, candidate name and email are required', 'error');
        setLoading(false);
        return;
      }

      const draftRes = await createOfferLetter(draftPayload);
      const newLetterId = draftRes.data?.data?.id;

      if (!newLetterId) throw new Error('Failed to create draft');

      // Now send it — pass payloadData so the backend can render with all variables
      await sendOfferLetter(newLetterId, previewData.payloadData || formData);
      
      showAlert('Offer letter sent successfully to Candidate!', 'success');
      onSuccess?.();
    } catch (e: any) {
      showAlert(e.response?.data?.message || e.response?.data?.error || 'Failed to send offer letter', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Offer Letter Preview</h2>
          </div>
          <div className="flex gap-3">
             <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1.5">
               <X className="w-4 h-4" /> Cancel
             </button>
             <button 
               disabled={loading}
               onClick={handleSendOffer}
               className="px-6 py-2 rounded-xl text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
             >
               {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Offer</>}
             </button>
          </div>
        </div>

        {(() => {
          const displayMissing = (previewData.missingVariables || []).filter(
            (v: string) => v !== 'acceptUrl' && v !== 'rejectUrl'
          );
          return displayMissing.length > 0 ? (
            <div className="bg-amber-50 border-b border-amber-100 p-4 px-6 flex flex-col justify-center">
              <span className="text-sm font-bold text-amber-800">Warning: Missing Variables</span>
              <span className="text-xs text-amber-600">The following variables are not filled: {displayMissing.join(', ')}. Please update your form.</span>
            </div>
          ) : null;
        })()}

        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 custom-scrollbar relative">
           <div 
             className="bg-white shadow-sm border border-slate-200 mx-auto p-12 custom-html-render"
             style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}
           >
              {/* Note: In a real app we'd use DOMPurify for previewData.html to prevent XSS. Assuming trusted backend input here. */}
              <div dangerouslySetInnerHTML={{ __html: previewData.html || '' }} />
           </div>
        </div>
      </motion.div>
    </div>
  );
}
