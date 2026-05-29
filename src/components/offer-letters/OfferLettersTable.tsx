import React, { useState } from 'react';
import { Eye, Send, X, Rocket } from 'lucide-react';
import { sendOfferLetter } from '../../api/offerLetters';
import { motion, AnimatePresence } from 'motion/react';
import OnboardingInitializerModal from '../onboarding/OnboardingInitializerModal';

const STATUS_STYLE: Record<string, string> = {
  DRAFT:    'bg-slate-100 text-slate-600 border border-slate-200',
  SENT:     'bg-blue-50 text-blue-700 border border-blue-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

// Modal that shows the rendered HTML of an existing offer letter
function ViewLetterModal({ letter, onClose }: { letter: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-[15px] font-black text-slate-900">Offer Letter — {letter.candidateName}</h2>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{letter.candidateEmail}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div
            className="bg-white shadow-sm border border-slate-200 mx-auto p-12"
            style={{ width: '210mm', minHeight: '297mm' }}
            dangerouslySetInnerHTML={{ __html: letter.renderedHtml || '<p style="color:#94a3b8;text-align:center;padding:40px">No rendered content available.</p>' }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default function OfferLettersTable({ offerLetters, showAlert, onRefresh }: any) {
  const [viewingLetter, setViewingLetter] = useState<any>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [onboardingOffer, setOnboardingOffer] = useState<any>(null);

  const handleResend = async (letter: any) => {
    if (!confirm(`Resend offer letter to ${letter.candidateName}?`)) return;
    setResending(letter.id);
    try {
      // Build render data from the existing letter record
      const renderData = {
        candidateName:  letter.candidateName,
        candidateEmail: letter.candidateEmail,
        candidatePhone: letter.candidatePhone || '',
        departmentName: letter.Department?.name || '',
        positionName:   letter.Position?.title || '',
        roleName:       letter.Role?.name || '',
        salary:         letter.salary || '',
        startDate:      letter.startDate || '',
        employmentType: letter.employmentType || '',
        workLocation:   letter.workLocation || '',
        reportingManager: letter.reportingManager || '',
        companyName:    letter.companyName || 'Blih',
        // aliases
        name:           letter.candidateName,
        positionTitle:  letter.Position?.title || '',
      };

      // If letter is already SENT/ACCEPTED/REJECTED, create a new draft first
      if (letter.status !== 'DRAFT') {
        const { createOfferLetter } = await import('../../api/offerLetters');
        const draftRes = await createOfferLetter({
          templateId:      letter.templateId,
          candidateName:   letter.candidateName,
          candidateEmail:  letter.candidateEmail,
          candidatePhone:  letter.candidatePhone,
          departmentId:    letter.departmentId,
          roleId:          letter.roleId,
          positionId:      letter.positionId,
          salary:          letter.salary,
          startDate:       letter.startDate,
          employmentType:  letter.employmentType,
          workLocation:    letter.workLocation,
          reportingManager: letter.reportingManager,
          reportingManagerId: letter.reportingManagerId,
          companyName:     letter.companyName || 'Blih',
        });
        const newId = draftRes.data?.data?.id;
        if (!newId) throw new Error('Failed to create new draft for resend');
        await sendOfferLetter(newId, renderData);
      } else {
        await sendOfferLetter(letter.id, renderData);
      }

      showAlert(`Offer letter resent to ${letter.candidateName}`, 'success');
      onRefresh?.();
    } catch (e: any) {
      showAlert(e.response?.data?.message || e.response?.data?.error || 'Failed to resend', 'error');
    } finally {
      setResending(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-black">
                <th className="p-4 py-3">Candidate</th>
                <th className="p-4 py-3">Role / Dept</th>
                <th className="p-4 py-3">Type</th>
                <th className="p-4 py-3">Status</th>
                <th className="p-4 py-3">Date Sent</th>
                <th className="p-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {offerLetters.map((letter: any) => (
                <tr key={letter.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-sm text-slate-900">{letter.candidateName}</div>
                    <div className="text-xs text-slate-500 font-medium truncate w-48">{letter.candidateEmail}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-sm text-slate-800">{letter.Position?.title || '—'}</div>
                    <div className="text-xs text-slate-500 font-medium">{letter.Department?.name || '—'}</div>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-600">
                    {letter.employmentType || '—'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${STATUS_STYLE[letter.status] || STATUS_STYLE.DRAFT}`}>
                      {letter.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-700">
                    {letter.sentAt ? new Date(letter.sentAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {/* View rendered letter */}
                      {letter.renderedHtml && (
                        <button
                          onClick={() => setViewingLetter(letter)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>
                      )}
                      {/* Start Onboarding — only for ACCEPTED offers */}
                      {letter.status === 'ACCEPTED' && (
                        <button
                          onClick={() => setOnboardingOffer(letter)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Rocket className="w-3.5 h-3.5" />
                          {letter.onboardingInitialized ? 'View Onboarding' : 'Start Onboarding'}
                        </button>
                      )}
                      {/* Resend — only for SENT/DRAFT, not ACCEPTED */}
                      {letter.status !== 'ACCEPTED' && (
                        <button
                          disabled={resending === letter.id}
                          onClick={() => handleResend(letter)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-black text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {resending === letter.id ? 'Sending…' : 'Resend'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {offerLetters.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 text-sm font-medium">
                    No offer letters found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {viewingLetter && (
          <ViewLetterModal letter={viewingLetter} onClose={() => setViewingLetter(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {onboardingOffer && (
          <OnboardingInitializerModal
            isOpen={Boolean(onboardingOffer)}
            onClose={() => setOnboardingOffer(null)}
            offer={onboardingOffer}
            showAlert={showAlert}
            onSuccess={() => {
              setOnboardingOffer(null);
              onRefresh?.();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
