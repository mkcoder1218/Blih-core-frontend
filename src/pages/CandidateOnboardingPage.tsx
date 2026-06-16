import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, Circle, ChevronRight, ChevronLeft, Loader2,
  User, FileText, Phone, CreditCard, BookOpen, Package, ClipboardCheck, Eye,
  CheckCircle, XCircle, AlertCircle, UploadCloud, Trash2, File as FileIcon,
} from 'lucide-react';
import {
  usePublicOnboarding,
  useSaveOnboardingSection,
  useRespondToResources,
  useSubmitOnboarding,
} from '../hooks/useCandidateOnboarding';
import { uploadOnboardingDocument } from '../api/candidateOnboarding';
import { ConfirmDialog } from '@/components/ui/blih';

interface Props {
  onboardingId: string;
}

const SECTION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  overview:          { label: 'Overview',          icon: <Eye className="w-4 h-4" /> },
  personal_info:     { label: 'Personal Info',     icon: <User className="w-4 h-4" /> },
  documents:         { label: 'Documents',         icon: <FileText className="w-4 h-4" /> },
  emergency_contact: { label: 'Emergency Contact', icon: <Phone className="w-4 h-4" /> },
  payroll:           { label: 'Payroll / Bank',    icon: <CreditCard className="w-4 h-4" /> },
  policies:          { label: 'Policies',          icon: <BookOpen className="w-4 h-4" /> },
  resources:         { label: 'Resources',         icon: <Package className="w-4 h-4" /> },
  review:            { label: 'Review & Submit',   icon: <ClipboardCheck className="w-4 h-4" /> },
};

// ─── Section Forms ────────────────────────────────────────────────────────────

function OverviewSection({ onboarding }: { onboarding: any }) {
  const meta = onboarding.metadata || {};
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6">
        <h2 className="text-xl font-black text-slate-900 mb-1">Welcome, {onboarding.candidateName}! 👋</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          We're thrilled to have you joining the team. This onboarding portal will guide you through everything you need to complete before your first day.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {meta.startDate && (
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Start Date</p>
            <p className="text-sm font-bold text-slate-800">{new Date(meta.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        )}
        {meta.salary && (
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Salary</p>
            <p className="text-sm font-bold text-slate-800">{meta.salary}</p>
          </div>
        )}
        {meta.employmentType && (
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Employment Type</p>
            <p className="text-sm font-bold text-slate-800">{meta.employmentType}</p>
          </div>
        )}
        {meta.workLocation && (
          <div className="bg-white border border-slate-100 rounded-xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Work Location</p>
            <p className="text-sm font-bold text-slate-800">{meta.workLocation}</p>
          </div>
        )}
        {meta.reportingManager && (
          <div className="bg-white border border-slate-100 rounded-xl p-4 col-span-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Reporting Manager</p>
            <p className="text-sm font-bold text-slate-800">{meta.reportingManager}</p>
          </div>
        )}
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-700">
          📋 Please complete all sections in this portal. Your information will be reviewed by the HR team before your start date.
        </p>
      </div>
    </div>
  );
}

function PersonalInfoSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const f = data || {};
  const set = (k: string, v: string) => onChange({ ...f, [k]: v });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const passwordMatch = !f.confirmPassword || f.password === f.confirmPassword;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-700">Personal Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" value={f.firstName || ''} onChange={v => set('firstName', v)} />
        <Field label="Last Name" value={f.lastName || ''} onChange={v => set('lastName', v)} />
        <Field label="Date of Birth" type="date" value={f.dateOfBirth || ''} onChange={v => set('dateOfBirth', v)} />
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Gender</label>
          <select value={f.gender || ''} onChange={e => set('gender', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400">
            <option value="">Select gender</option>
            <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
          </select>
        </div>
        <Field label="Nationality" value={f.nationality || ''} onChange={v => set('nationality', v)} />
        <Field label="Phone Number" value={f.phone || ''} onChange={v => set('phone', v)} />
        <Field label="Address" value={f.address || ''} onChange={v => set('address', v)} className="col-span-2" />
        <Field label="City" value={f.city || ''} onChange={v => set('city', v)} />
        <Field label="Country" value={f.country || ''} onChange={v => set('country', v)} />
      </div>

      {/* Account Password */}
      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <span className="text-xs">🔐</span>
          </div>
          <div>
            <p className="text-[12px] font-black text-slate-700">Set Your Account Password</p>
            <p className="text-[10px] text-slate-400 font-medium">You'll use this to log in to the employee portal after onboarding.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={f.password || ''}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {f.password && f.password.length < 8 && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1">At least 8 characters required</p>
            )}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={f.confirmPassword || ''}
                onChange={e => set('confirmPassword', e.target.value)}
                placeholder="Repeat password"
                className={`w-full bg-slate-50 border rounded-xl px-3 py-2.5 pr-10 text-sm font-medium text-slate-700 focus:outline-none focus:bg-white transition-colors ${
                  f.confirmPassword && !passwordMatch ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-blue-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            {f.confirmPassword && !passwordMatch && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1">Passwords do not match</p>
            )}
            {f.confirmPassword && passwordMatch && f.password?.length >= 8 && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Passwords match</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentsSection({
  onboardingId,
  requiredDocuments,
  data,
  onChange,
}: {
  onboardingId: string;
  requiredDocuments: any[];
  data: any;
  onChange: (d: any) => void;
}) {
  const f = data || {};
  const set = (k: string, v: any) => onChange({ ...f, [k]: v });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-700">Document Uploads</h3>
      {requiredDocuments.length === 0 && (
        <p className="text-sm text-slate-400">No documents required.</p>
      )}
      {requiredDocuments.map((doc: any, i: number) => {
        const key = `doc_${i}`;
        const val = f[key] || {};
        return (
          <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">{doc.name}</p>
              {doc.required && (
                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                  Required
                </span>
              )}
            </div>
            <FileUploadZone
              onboardingId={onboardingId}
              value={val}
              onChange={(v) => set(key, v)}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── File Upload Zone ─────────────────────────────────────────────────────────
function FileUploadZone({
  onboardingId,
  value,
  onChange,
}: {
  onboardingId: string;
  value: { fileId?: string; originalName?: string; mimeType?: string; sizeBytes?: number; downloadUrl?: string; status?: string };
  onChange: (v: any) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;
    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10 MB.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const res = await uploadOnboardingDocument(onboardingId, file);
      const uploaded = res.data?.data ?? res.data;
      onChange({ ...uploaded, status: 'provided' });
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange({});
    if (inputRef.current) inputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Already uploaded — show file info
  if (value?.fileId) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <FileIcon className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 truncate">{value.originalName}</p>
          {value.sizeBytes && (
            <p className="text-[10px] text-slate-400 font-medium">{formatSize(value.sizeBytes)}</p>
          )}
        </div>
        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <button
          type="button"
          onClick={handleRemove}
          className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
          title="Remove file"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Uploading…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <UploadCloud className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                Drop file here or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                PDF, JPG, PNG, DOC up to 10 MB
              </p>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

function EmergencyContactSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const f = data || {};
  const set = (k: string, v: string) => onChange({ ...f, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-700">Emergency Contact</h3>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name" value={f.name || ''} onChange={v => set('name', v)} className="col-span-2" />
        <Field label="Relationship" value={f.relationship || ''} onChange={v => set('relationship', v)} />
        <Field label="Phone Number" value={f.phone || ''} onChange={v => set('phone', v)} />
        <Field label="Email" type="email" value={f.email || ''} onChange={v => set('email', v)} />
        <Field label="Address" value={f.address || ''} onChange={v => set('address', v)} />
      </div>
    </div>
  );
}

function PayrollSection({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  const f = data || {};
  const set = (k: string, v: string) => onChange({ ...f, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-700">Payroll / Bank Information</h3>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
        <p className="text-xs font-semibold text-amber-700">🔒 Your banking information is encrypted and stored securely.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Bank Name" value={f.bankName || ''} onChange={v => set('bankName', v)} />
        <Field label="Account Number" value={f.accountNumber || ''} onChange={v => set('accountNumber', v)} />
        <Field label="Account Name" value={f.accountName || ''} onChange={v => set('accountName', v)} />
        <Field label="Bank Branch" value={f.bankBranch || ''} onChange={v => set('bankBranch', v)} />
        <Field label="Tax ID / TIN" value={f.taxId || ''} onChange={v => set('taxId', v)} />
      </div>
    </div>
  );
}

function PoliciesSection({ requiredPolicies, data, onChange }: { requiredPolicies: any[]; data: any; onChange: (d: any) => void }) {
  const f = data || {};
  const set = (k: string, v: boolean) => onChange({ ...f, [k]: v });
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-700">Policies & Agreements</h3>
      {requiredPolicies.length === 0 && <p className="text-sm text-slate-400">No policies to review.</p>}
      {requiredPolicies.map((policy: any, i: number) => {
        const key = `policy_${i}`;
        return (
          <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
              <p className="text-sm font-bold text-slate-800">{policy.title}</p>
            </div>
            <div className="p-4">
              <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto mb-3">
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{policy.content || 'No content provided.'}</p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={Boolean(f[key])} onChange={e => set(key, e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-xs font-semibold text-slate-700">I have read and agree to this policy</span>
                {policy.required && <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Required</span>}
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResourcesSection({
  resources,
  responses,
  onChange,
}: {
  resources: any[];
  responses: any[];
  onChange: (r: any[]) => void;
}) {
  const getResponse = (i: number) => responses.find(r => r.resourceIndex === i) || { resourceIndex: i, status: '', comment: '' };
  const setResponse = (i: number, field: string, value: any) => {
    const existing = responses.filter(r => r.resourceIndex !== i);
    const current = getResponse(i);
    onChange([...existing, { ...current, [field]: value }]);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-slate-700">Resources & Equipment</h3>
      {resources.map((resource: any, i: number) => {
        const resp = getResponse(i);
        return (
          <div key={i} className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{resource.resourceName}</p>
                <p className="text-xs text-slate-500 font-medium">{resource.resourceType} · Qty: {resource.quantity} · Condition: {resource.condition}</p>
                {resource.expectedIssueDate && (
                  <p className="text-xs text-slate-400 mt-0.5">Expected: {new Date(resource.expectedIssueDate).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {resource.returnRequired && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Return Required</span>}
              </div>
            </div>
            {resource.acceptanceRequired && (
              <div className="space-y-2">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Your Response</p>
                <div className="flex items-center gap-2">
                  {[
                    { value: 'accepted', label: 'Accept', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'text-emerald-600 border-emerald-300 bg-emerald-50' },
                    { value: 'declined', label: 'Decline', icon: <XCircle className="w-3.5 h-3.5" />, cls: 'text-rose-600 border-rose-300 bg-rose-50' },
                    { value: 'correction_requested', label: 'Request Correction', icon: <AlertCircle className="w-3.5 h-3.5" />, cls: 'text-amber-600 border-amber-300 bg-amber-50' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setResponse(i, 'status', opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${resp.status === opt.value ? opt.cls + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                {(resp.status === 'declined' || resp.status === 'correction_requested') && (
                  <textarea
                    value={resp.comment || ''}
                    onChange={e => setResponse(i, 'comment', e.target.value)}
                    placeholder="Please provide a reason or details..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400 resize-none"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ReviewSection({ onboarding, sectionData, onSubmit, isSubmitting }: { onboarding: any; sectionData: Record<string, any>; onSubmit: () => void; isSubmitting: boolean }) {
  const sections: string[] = onboarding.sections || [];
  const candidateData = onboarding.candidateData || {};
  const personalInfo = sectionData.personal_info || {};
  const passwordOk = personalInfo.password && personalInfo.password.length >= 8 && personalInfo.password === personalInfo.confirmPassword;
  const resourceResponses: any[] = onboarding.resourceResponses || [];
  const resources: any[] = onboarding.resources || [];

  const getSectionStatus = (key: string) => {
    if (key === 'review') return 'current';

    // Overview is read-only — always complete once visited
    if (key === 'overview') return 'complete';

    // Resources: complete if no resources assigned, OR all acceptance-required resources have a response
    if (key === 'resources') {
      if (resources.length === 0) return 'complete';
      const acceptanceRequired = resources.filter((r: any) => r.acceptanceRequired);
      if (acceptanceRequired.length === 0) return 'complete';
      const responded = acceptanceRequired.every((_: any, i: number) =>
        resourceResponses.some((rr: any) => rr.resourceIndex === i && rr.status)
      );
      return responded ? 'complete' : 'empty';
    }

    // Personal info: also requires password
    if (key === 'personal_info') {
      const d = candidateData[key];
      if (!d || Object.keys(d).length === 0) return 'empty';
      if (!passwordOk) return 'password_missing';
      return 'complete';
    }

    const d = candidateData[key];
    if (!d || Object.keys(d).length === 0) return 'empty';
    return 'complete';
  };

  const allComplete = sections
    .filter(s => s !== 'review')
    .every(s => getSectionStatus(s) === 'complete');

  return (
    <div className="space-y-5">
      <h3 className="text-sm font-black text-slate-700">Review & Submit</h3>
      <div className="space-y-2">
        {sections.filter(s => s !== 'review').map(key => {
          const status = getSectionStatus(key);
          const meta = SECTION_META[key];
          const isPasswordIssue = status === 'password_missing';
          return (
            <div key={key} className={`flex items-center justify-between p-3 rounded-xl border ${status === 'complete' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
              <div className="flex items-center gap-2.5">
                <span className={status === 'complete' ? 'text-emerald-600' : 'text-rose-400'}>{meta?.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{meta?.label || key}</span>
              </div>
              {status === 'complete'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                : <span className="text-[10px] font-black text-rose-500">{isPasswordIssue ? 'Password required' : 'Incomplete'}</span>
              }
            </div>
          );
        })}
      </div>

      {!passwordOk && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-amber-500 mt-0.5">⚠️</span>
          <p className="text-[11px] font-semibold text-amber-700">
            Please go back to <strong>Personal Info</strong> and set your account password before submitting.
          </p>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          By submitting, you confirm that all information provided is accurate and complete. Your employee account will be created automatically using the email and password you provided.
        </p>
      </div>
      <button
        onClick={onSubmit}
        disabled={isSubmitting || !passwordOk}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating your account…</> : '🚀 Submit & Create Account'}
      </button>
    </div>
  );
}

// ─── Shared Field component ───────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', className = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
      />
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────
export default function CandidateOnboardingPage({ onboardingId }: Props) {
  const { data: queryData, isLoading, isError, error } = usePublicOnboarding(onboardingId);
  const saveSection = useSaveOnboardingSection();
  const respondResources = useRespondToResources();
  const submitMutation = useSubmitOnboarding();

  const onboarding = queryData as any;

  const sections: string[] = onboarding?.sections || [];
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [sectionData, setSectionData] = useState<Record<string, any>>({});
  const [resourceResponses, setResourceResponses] = useState<any[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Sync server data into local state on load
  useEffect(() => {
    if (onboarding?.candidateData) {
      setSectionData(onboarding.candidateData);
    }
    if (onboarding?.resourceResponses) {
      setResourceResponses(onboarding.resourceResponses);
    }
    if (onboarding?.status === 'SUBMITTED_FOR_REVIEW' || onboarding?.status === 'COMPLETED') {
      setSubmitted(true);
    }
  }, [onboarding?.id]);

  const currentSection = sections[currentSectionIndex];
  const progress = onboarding?.progress || 0;

  const isSectionComplete = (key: string) => {
    if (key === 'review') return false;
    if (key === 'overview') return true; // read-only, always complete
    if (key === 'resources') {
      const resources: any[] = onboarding?.resources || [];
      const resourceResponses: any[] = onboarding?.resourceResponses || [];
      if (resources.length === 0) return true;
      const acceptanceRequired = resources.filter((r: any) => r.acceptanceRequired);
      if (acceptanceRequired.length === 0) return true;
      return acceptanceRequired.every((_: any, i: number) =>
        resourceResponses.some((rr: any) => rr.resourceIndex === i && rr.status)
      );
    }
    const d = sectionData[key];
    return d && Object.keys(d).length > 0;
  };

  const handleSaveAndContinue = async () => {
    if (!currentSection || currentSection === 'review') return;
    setSaving(true);
    try {
      if (currentSection === 'resources') {
        await respondResources.mutateAsync({ onboardingId, responses: resourceResponses });
      } else {
        const data = sectionData[currentSection] || {};
        await saveSection.mutateAsync({ onboardingId, section: currentSection, data });
      }
      if (currentSectionIndex < sections.length - 1) {
        setCurrentSectionIndex(i => i + 1);
      }
    } catch (e: any) {
      console.error('Save failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const password = sectionData.personal_info?.password;
    if (!password || password.length < 8) {
      setPasswordModalOpen(true);
      return;
    }
    try {
      await submitMutation.mutateAsync({ onboardingId, password });
      setSubmitted(true);
    } catch (e: any) {
      console.error('Submit failed:', e);
    }
  };

  // ── Loading / Error states ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading your onboarding…</p>
        </div>
      </div>
    );
  }

  if (isError || !onboarding) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-md text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7 text-rose-500" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Onboarding Not Found</h2>
          <p className="text-sm text-slate-500">This onboarding link is invalid or has expired. Please contact your HR team.</p>
        </div>
      </div>
    );
  }

  // ── Submitted success screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-emerald-100 p-10 max-w-lg text-center space-y-5"
        >
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-black text-slate-900">Account Created!</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your onboarding is complete and your employee account has been created. You can now log in to the employee portal using your email and the password you set.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1 text-left">
            <p className="text-xs font-black text-emerald-700 uppercase tracking-wider">Your Login Details</p>
            <p className="text-sm font-semibold text-slate-700">📧 {onboarding?.candidateEmail}</p>
            <p className="text-xs text-slate-500">Use the password you set during onboarding.</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700">✓ Your information has been submitted for HR review. You'll be contacted before your start date.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main layout ──
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top progress bar */}
      <div className="h-1.5 bg-slate-200 w-full">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-black text-slate-900">Employee Onboarding</h1>
          <p className="text-[11px] text-slate-400 font-medium">{onboarding.candidateName} · {progress}% complete</p>
        </div>
        <div className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          Step {currentSectionIndex + 1} of {sections.length}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 py-6 px-4 gap-1 overflow-y-auto">
          {sections.map((key, i) => {
            const meta = SECTION_META[key] || { label: key, icon: <Circle className="w-4 h-4" /> };
            const isActive = i === currentSectionIndex;
            const isComplete = isSectionComplete(key) && key !== 'review';
            return (
              <button
                key={key}
                onClick={() => setCurrentSectionIndex(i)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className={`flex-shrink-0 ${isActive ? 'text-blue-600' : isComplete ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {isComplete && !isActive ? <CheckCircle2 className="w-4 h-4" /> : meta.icon}
                </span>
                <span className="text-[12px] font-bold truncate">{meta.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto bg-white border-b border-slate-100 px-4 py-2 gap-2">
          {sections.map((key, i) => {
            const meta = SECTION_META[key] || { label: key, icon: null };
            const isActive = i === currentSectionIndex;
            const isComplete = isSectionComplete(key);
            return (
              <button
                key={key}
                onClick={() => setCurrentSectionIndex(i)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${isActive ? 'bg-blue-600 text-white' : isComplete ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {isComplete && !isActive ? <CheckCircle2 className="w-3 h-3" /> : null}
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6"
              >
                {currentSection === 'overview' && <OverviewSection onboarding={onboarding} />}
                {currentSection === 'personal_info' && (
                  <PersonalInfoSection
                    data={sectionData.personal_info}
                    onChange={d => setSectionData(prev => ({ ...prev, personal_info: d }))}
                  />
                )}
                {currentSection === 'documents' && (
                  <DocumentsSection
                    onboardingId={onboardingId}
                    requiredDocuments={onboarding.requiredDocuments || []}
                    data={sectionData.documents}
                    onChange={d => setSectionData(prev => ({ ...prev, documents: d }))}
                  />
                )}
                {currentSection === 'emergency_contact' && (
                  <EmergencyContactSection
                    data={sectionData.emergency_contact}
                    onChange={d => setSectionData(prev => ({ ...prev, emergency_contact: d }))}
                  />
                )}
                {currentSection === 'payroll' && (
                  <PayrollSection
                    data={sectionData.payroll}
                    onChange={d => setSectionData(prev => ({ ...prev, payroll: d }))}
                  />
                )}
                {currentSection === 'policies' && (
                  <PoliciesSection
                    requiredPolicies={onboarding.requiredPolicies || []}
                    data={sectionData.policies}
                    onChange={d => setSectionData(prev => ({ ...prev, policies: d }))}
                  />
                )}
                {currentSection === 'resources' && onboarding.resources?.length > 0 && (
                  <ResourcesSection
                    resources={onboarding.resources}
                    responses={resourceResponses}
                    onChange={setResourceResponses}
                  />
                )}
                {currentSection === 'resources' && (!onboarding.resources || onboarding.resources.length === 0) && (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No resources assigned for this onboarding.</p>
                  </div>
                )}
                {currentSection === 'review' && (
                  <ReviewSection
                    onboarding={{ ...onboarding, candidateData: sectionData }}
                    sectionData={sectionData}
                    onSubmit={handleSubmit}
                    isSubmitting={submitMutation.isPending}
                  />
                )}

                {/* Navigation buttons */}
                {currentSection !== 'review' && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setCurrentSectionIndex(i => Math.max(0, i - 1))}
                      disabled={currentSectionIndex === 0}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      onClick={handleSaveAndContinue}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <>Save & Continue <ChevronRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <ConfirmDialog
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onConfirm={() => {
          setPasswordModalOpen(false);
          setCurrentSectionIndex(Math.max(0, sections.indexOf('personal_info')));
        }}
        title="Password Required"
        description="Please set a valid password in the Personal Info section before submitting."
        confirmLabel="Go to Personal Info"
        cancelLabel="Close"
        variant="primary"
      />
    </div>
  );
}
