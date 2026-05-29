import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Plus, Trash2, ChevronRight, ChevronLeft, Rocket, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInitializeOnboarding, useOnboardingByOfferId } from '../../hooks/useCandidateOnboarding';

const ALL_SECTIONS = [
  { key: 'overview', label: 'Overview & Welcome' },
  { key: 'personal_info', label: 'Personal Information' },
  { key: 'documents', label: 'Document Uploads' },
  { key: 'emergency_contact', label: 'Emergency Contact' },
  { key: 'payroll', label: 'Payroll / Bank Info' },
  { key: 'policies', label: 'Policies & Contract' },
  { key: 'resources', label: 'Resources & Equipment' },
  { key: 'review', label: 'Review & Submit' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  showAlert: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSuccess?: () => void;
}

export default function OnboardingInitializerModal({ isOpen, onClose, offer, showAlert, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [selectedSections, setSelectedSections] = useState<string[]>(ALL_SECTIONS.map(s => s.key));
  const [requiredDocuments, setRequiredDocuments] = useState<{ name: string; required: boolean }[]>([
    { name: 'National ID / Passport', required: true },
    { name: 'Proof of Address', required: true },
  ]);
  const [requiredPolicies, setRequiredPolicies] = useState<{ title: string; content: string; required: boolean }[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const initMutation = useInitializeOnboarding();

  // Load existing onboarding for this offer (if already initialized)
  const { data: existingOnboarding, isLoading: loadingExisting } = useOnboardingByOfferId(
    isOpen ? offer?.id : null
  );

  // Auto-fill state from existing onboarding when it loads
  useEffect(() => {
    if (!existingOnboarding) return;
    if (existingOnboarding.sections?.length)        setSelectedSections(existingOnboarding.sections);
    if (existingOnboarding.requiredDocuments?.length) setRequiredDocuments(existingOnboarding.requiredDocuments);
    if (existingOnboarding.requiredPolicies?.length)  setRequiredPolicies(existingOnboarding.requiredPolicies);
    if (existingOnboarding.resources?.length)         setResources(existingOnboarding.resources);
    // Pre-set the generated URL so step 4 shows it immediately if they just want to resend
    const url = `${window.location.origin}/career/onboarding/${existingOnboarding.onboardingId}`;
    setGeneratedUrl(url);
  }, [existingOnboarding?.id]);

  const toggleSection = (key: string) => {
    setSelectedSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const addDocument = () => setRequiredDocuments(prev => [...prev, { name: '', required: true }]);
  const removeDocument = (i: number) => setRequiredDocuments(prev => prev.filter((_, idx) => idx !== i));
  const updateDocument = (i: number, field: 'name' | 'required', value: any) =>
    setRequiredDocuments(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const addPolicy = () => setRequiredPolicies(prev => [...prev, { title: '', content: '', required: true }]);
  const removePolicy = (i: number) => setRequiredPolicies(prev => prev.filter((_, idx) => idx !== i));
  const updatePolicy = (i: number, field: 'title' | 'content' | 'required', value: any) =>
    setRequiredPolicies(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const addResource = () => setResources(prev => [...prev, {
    resourceName: '', resourceType: '', quantity: 1, condition: 'New',
    expectedIssueDate: '', returnRequired: false, acceptanceRequired: true,
  }]);
  const removeResource = (i: number) => setResources(prev => prev.filter((_, idx) => idx !== i));
  const updateResource = (i: number, field: string, value: any) =>
    setResources(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));

  const handleSubmit = async () => {
    try {
      const result = await initMutation.mutateAsync({
        offerId: offer.id,
        sections: selectedSections,
        resources,
        requiredDocuments: requiredDocuments.filter(d => d.name.trim()),
        requiredPolicies: requiredPolicies.filter(p => p.title.trim()),
      });
      // successResponse wraps as { success, data: { onboarding, onboardingUrl } }
      // axios wraps that as res.data, so mutateAsync returns res.data = { success, data: {...} }
      const url = result?.data?.onboardingUrl || result?.onboardingUrl;
      setGeneratedUrl(url || null);
      setStep(4);
      showAlert('Onboarding initialized successfully!', 'success');
      onSuccess?.();
    } catch (e: any) {
      showAlert(e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to initialize onboarding', 'error');
    }
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep(1);
    setGeneratedUrl(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Rocket className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-black text-slate-900">
                  {existingOnboarding ? 'Update Onboarding' : 'Initialize Onboarding'}
                </h2>
                {loadingExisting && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />}
                {existingOnboarding && !loadingExisting && (
                  <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Pre-filled from existing
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{offer?.candidateName} · {offer?.candidateEmail}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100">
            {['Sections & Docs', 'Resources', 'Confirm'].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 text-[11px] font-bold ${step === i + 1 ? 'text-blue-600' : step > i + 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === i + 1 ? 'bg-blue-600 text-white' : step > i + 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {step > i + 1 ? '✓' : i + 1}
                  </div>
                  {label}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-slate-200" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                {/* Sections */}
                <div>
                  <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider mb-3">Onboarding Sections</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_SECTIONS.map(s => (
                      <label key={s.key} className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${selectedSections.includes(s.key) ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <input type="checkbox" checked={selectedSections.includes(s.key)} onChange={() => toggleSection(s.key)} className="w-4 h-4 accent-blue-600" />
                        <span className="text-[12px] font-semibold text-slate-700">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Required Documents */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Required Documents</h3>
                    <button onClick={addDocument} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {requiredDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={doc.name} onChange={e => updateDocument(i, 'name', e.target.value)} placeholder="Document name" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400" />
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                          <input type="checkbox" checked={doc.required} onChange={e => updateDocument(i, 'required', e.target.checked)} className="w-3.5 h-3.5 accent-blue-600" /> Required
                        </label>
                        <button onClick={() => removeDocument(i)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Policies */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Policies & Agreements</h3>
                    <button onClick={addPolicy} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                      <Plus className="w-3.5 h-3.5" /> Add Policy
                    </button>
                  </div>
                  <div className="space-y-3">
                    {requiredPolicies.map((policy, i) => (
                      <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <input value={policy.title} onChange={e => updatePolicy(i, 'title', e.target.value)} placeholder="Policy title" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400" />
                          <button onClick={() => removePolicy(i)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea value={policy.content} onChange={e => updatePolicy(i, 'content', e.target.value)} placeholder="Policy content..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400 resize-none" />
                      </div>
                    ))}
                    {requiredPolicies.length === 0 && (
                      <p className="text-[11px] text-slate-400 text-center py-3">No policies added. Click "Add Policy" to include agreements.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Resources & Equipment</h3>
                  <button onClick={addResource} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700">
                    <Plus className="w-3.5 h-3.5" /> Add Resource
                  </button>
                </div>
                {resources.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-sm font-medium">No resources added</p>
                    <p className="text-xs mt-1">Add equipment, devices, or access cards the candidate will receive.</p>
                  </div>
                )}
                {resources.map((r, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Resource #{i + 1}</span>
                      <button onClick={() => removeResource(i)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Resource Name</label>
                        <input value={r.resourceName} onChange={e => updateResource(i, 'resourceName', e.target.value)} placeholder="e.g. MacBook Pro" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Type</label>
                        <input value={r.resourceType} onChange={e => updateResource(i, 'resourceType', e.target.value)} placeholder="e.g. Laptop" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quantity</label>
                        <input type="number" min={1} value={r.quantity} onChange={e => updateResource(i, 'quantity', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Condition</label>
                        <select value={r.condition} onChange={e => updateResource(i, 'condition', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400">
                          <option>New</option>
                          <option>Good</option>
                          <option>Fair</option>
                          <option>Refurbished</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expected Issue Date</label>
                        <input type="date" value={r.expectedIssueDate} onChange={e => updateResource(i, 'expectedIssueDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={r.returnRequired} onChange={e => updateResource(i, 'returnRequired', e.target.checked)} className="w-3.5 h-3.5 accent-blue-600" /> Return Required
                      </label>
                      <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 cursor-pointer">
                        <input type="checkbox" checked={r.acceptanceRequired} onChange={e => updateResource(i, 'acceptanceRequired', e.target.checked)} className="w-3.5 h-3.5 accent-blue-600" /> Acceptance Required
                      </label>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wider">Confirm & Send</h3>
                {existingOnboarding && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                    <p className="text-[11px] font-semibold text-amber-700">
                      This offer already has an onboarding session. Clicking "Send Link" will <strong>resend the invite email</strong> with the existing link. The onboarding data will be updated with your current selections.
                    </p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                  <div className="flex justify-between text-xs"><span className="text-slate-500 font-semibold">Candidate</span><span className="font-bold text-slate-800">{offer?.candidateName}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500 font-semibold">Email</span><span className="font-bold text-slate-800">{offer?.candidateEmail}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500 font-semibold">Sections</span><span className="font-bold text-slate-800">{selectedSections.length} selected</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500 font-semibold">Documents</span><span className="font-bold text-slate-800">{requiredDocuments.filter(d => d.name).length} required</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500 font-semibold">Policies</span><span className="font-bold text-slate-800">{requiredPolicies.filter(p => p.title).length} policies</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500 font-semibold">Resources</span><span className="font-bold text-slate-800">{resources.length} items</span></div>
                </div>
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  {existingOnboarding
                    ? 'The candidate will receive a new invite email with their existing onboarding link.'
                    : 'Clicking Initialize & Send Link will generate a unique onboarding URL and email it to the candidate.'}
                </p>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">🎉</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {existingOnboarding ? 'Invite Resent!' : 'Onboarding Initialized!'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Invite email sent to <strong>{offer?.candidateName}</strong>
                  </p>
                </div>
                {generatedUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2">
                    <p className="flex-1 text-xs font-mono text-slate-700 truncate">{generatedUrl}</p>
                    <button onClick={handleCopy} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          {step < 4 ? (
            <>
              <button onClick={() => step > 1 ? setStep(s => s - 1) : handleClose()} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 3 ? (
                <button onClick={() => setStep(s => s + 1)} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={initMutation.isPending} className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors">
                  <Rocket className="w-3.5 h-3.5" />
                  {initMutation.isPending
                    ? 'Sending…'
                    : existingOnboarding
                      ? 'Resend Onboarding Link'
                      : 'Initialize & Send Link'}
                </button>
              )}
            </>
          ) : (
            <button onClick={handleClose} className="ml-auto px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors">
              Done
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
