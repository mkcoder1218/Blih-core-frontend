/**
 * PublicRegisterPage — /register/:businessSlug
 * 4-step self-registration form collecting all employee information.
 *
 * Step 1: Account (name, email, password)
 * Step 2: Personal Info (DOB, national ID, address, phone)
 * Step 3: Work Info (role, department, employment type, hire date)
 * Step 4: Emergency Contact + bank (optional)
 */
import { useState, useEffect, FormEvent, ReactNode, ChangeEvent, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, UserPlus, Clock, CheckCircle, AlertCircle,
  Loader2, ArrowRight, ArrowLeft, User, Briefcase, Shield, CreditCard,
} from 'lucide-react';
import { api } from '../api/client';

// ── Types ─────────────────────────────────────────────────────────────────────
interface RegConfig {
  businessName: string;
  businessSlug: string;
  enabled: boolean;
  isOpen: boolean;
  openFrom: string | null;
  openUntil: string | null;
  autoApprove: boolean;
}

interface FormData {
  // Step 1 — Account
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2 — Personal
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  address: string;
  city: string;
  country: string;
  // Step 3 — Work
  requestedRoleKey: string;
  employmentType: string;
  hireDate: string;
  departmentId: string;
  positionId: string;
  // Step 4 — Emergency + Bank
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelationship: string;
  bankName: string;
  bankAccount: string;
}

const EMPTY: FormData = {
  fullName: '', email: '', password: '', confirmPassword: '',
  phone: '', dateOfBirth: '', nationalId: '', address: '', city: '', country: '',
  requestedRoleKey: 'EMPLOYEE', employmentType: 'full_time', hireDate: '', departmentId: '', positionId: '',
  emergencyName: '', emergencyPhone: '', emergencyRelationship: '', bankName: '', bankAccount: '',
};

// Available roles (excludes BUSINESS_ADMIN and PLATFORM_SUPER_ADMIN)
const ROLES = [
  { key: 'EMPLOYEE',         label: 'Employee' },
  { key: 'DEPARTMENT_HEAD',  label: 'Department Head' },
  { key: 'HR_MANAGER',       label: 'HR Manager' },
  { key: 'FINANCE_MANAGER',  label: 'Finance Manager' },
  { key: 'CEO',              label: 'CEO / Executive' },
];

const EMPLOYMENT_TYPES = [
  { value: 'full_time',  label: 'Full Time' },
  { value: 'part_time',  label: 'Part Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'intern',     label: 'Intern' },
];

const STEPS = [
  { id: 1, label: 'Account',   icon: User },
  { id: 2, label: 'Personal',  icon: Shield },
  { id: 3, label: 'Work Info', icon: Briefcase },
  { id: 4, label: 'Emergency', icon: CreditCard },
];

// ── Helper components ─────────────────────────────────────────────────────────
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-600 font-semibold">{error}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', error }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string;
}) {
  return (
    <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-slate-50 focus:bg-white border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${error ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'}`}
    />
  );
}

function SelectInput({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none cursor-pointer">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Searchable combobox with inline "Create new" ───────────────────────────────
interface SearchableItem { id: string; label: string }

function SearchableCreate({
  placeholder, items, loading, onCreate, onSelect, selectedId, selectedLabel, error,
}: {
  placeholder: string;
  items: SearchableItem[];
  loading: boolean;
  onCreate: (name: string) => Promise<SearchableItem>;
  onSelect: (item: SearchableItem | null) => void;
  selectedId: string;
  selectedLabel: string;
  error?: string;
}) {
  const [query,    setQuery]    = useState('');
  const [open,     setOpen]     = useState(false);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));
  const showCreate = query.trim() && !filtered.some(i => i.label.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const item = await onCreate(query.trim());
      onSelect(item);
      setQuery('');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const displayValue = selectedId ? selectedLabel : '';

  return (
    <div ref={ref} className="relative">
      <div
        className={`w-full bg-slate-50 focus-within:bg-white border rounded-xl flex items-center gap-2 px-4 py-2.5 cursor-text ${error ? 'border-red-300' : 'border-slate-200 focus-within:border-blue-500'}`}
        onClick={() => { setOpen(true); }}
      >
        <input
          value={open ? query : displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(''); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-slate-700 placeholder-slate-400"
        />
        {selectedId && !open && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onSelect(null); setQuery(''); }}
            className="text-slate-300 hover:text-slate-600 text-xs font-bold cursor-pointer">✕</button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-xs text-slate-400 font-medium">Loading…</div>
          ) : filtered.length === 0 && !showCreate ? (
            <div className="px-4 py-3 text-xs text-slate-400 font-medium">No results found</div>
          ) : (
            <>
              {filtered.map(item => (
                <button key={item.id} type="button"
                  onClick={() => { onSelect(item); setQuery(''); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer ${item.id === selectedId ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}>
                  {item.label}
                </button>
              ))}
              {showCreate && (
                <button type="button" onClick={handleCreate} disabled={creating}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-blue-600 hover:bg-blue-50 border-t border-slate-100 flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                  <span className="text-base leading-none">+</span>
                  {creating ? 'Creating…' : `Create "${query.trim()}"`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CountdownBadge({ until }: { until: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setLabel('Closing soon'); return; }
      const d = Math.floor(diff / 86400_000);
      const h = Math.floor((diff % 86400_000) / 3600_000);
      const m = Math.floor((diff % 3600_000) / 60_000);
      setLabel(d > 0 ? `${d}d ${h}h remaining` : h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [until]);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Clock className="w-3 h-3" />{label}
    </span>
  );
}

function ClosedScreen({ title, message }: { title: string; message: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 max-w-sm w-full text-center shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7 text-slate-400" />
        </div>
        <h2 className="text-sm font-black text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{message}</p>
        <button onClick={() => navigate('/')} className="text-xs text-blue-600 hover:underline font-bold">Back to Login</button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicRegisterPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const navigate = useNavigate();

  const [config,        setConfig]        = useState<RegConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError,   setConfigError]   = useState('');

  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState<FormData>({ ...EMPTY });
  const [showPass,    setShowPass]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [serverError, setServerError] = useState('');
  const [result,      setResult]      = useState<{ autoApproved: boolean } | null>(null);

  const set = (k: keyof FormData) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  // Department + position state
  const [departments,    setDepartments]    = useState<{id:string;label:string}[]>([]);
  const [positions,      setPositions]      = useState<{id:string;label:string}[]>([]);
  const [deptLoading,    setDeptLoading]    = useState(false);
  const [posLoading,     setPosLoading]     = useState(false);
  const [selectedDept,   setSelectedDept]   = useState<{id:string;label:string}|null>(null);
  const [selectedPos,    setSelectedPos]    = useState<{id:string;label:string}|null>(null);

  const loadDepartments = useCallback(async (q = '') => {
    if (!businessSlug) return;
    setDeptLoading(true);
    try {
      const res = await api.get(`/api/v1/auth/public-register/${businessSlug}/departments`, { params: q ? { q } : {} });
      setDepartments((res.data?.data?.departments ?? []).map((d: any) => ({ id: d.id, label: d.name })));
    } catch {} finally { setDeptLoading(false); }
  }, [businessSlug]);

  const loadPositions = useCallback(async (q = '') => {
    if (!businessSlug) return;
    setPosLoading(true);
    try {
      const res = await api.get(`/api/v1/auth/public-register/${businessSlug}/positions`, { params: q ? { q } : {} });
      setPositions((res.data?.data?.positions ?? []).map((p: any) => ({ id: p.id, label: p.title })));
    } catch {} finally { setPosLoading(false); }
  }, [businessSlug]);

  // Load on step 3
  useEffect(() => {
    if (step === 3) {
      loadDepartments();
      loadPositions();
    }
  }, [step, loadDepartments, loadPositions]);

  // ID document file state
  const [idFile,    setIdFile]    = useState<File | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);

  const handleIdFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setIdPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setIdPreview(null);
    }
  };

  useEffect(() => {
    if (!businessSlug) return;
    api.get(`/api/v1/auth/public-register/${businessSlug}/config`)
      .then(r => setConfig(r.data?.data ?? r.data))
      .catch(err => setConfigError(err?.response?.data?.message ?? 'Could not load registration info.'))
      .finally(() => setConfigLoading(false));
  }, [businessSlug]);

  // ── Validation per step ─────────────────────────────────────────────────────
  const validate = (s: number): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.fullName.trim() || form.fullName.length < 2) e.fullName = 'Full name required (min 2 chars)';
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
      if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (s === 2) {
      if (!form.phone.trim()) e.phone = 'Phone number required';
      if (!idFile) e.nationalId = 'Please upload your National ID or Passport document';
      if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth required';
    }
    if (s === 3) {
      if (!form.requestedRoleKey) e.requestedRoleKey = 'Select a role';
      if (!form.employmentType) e.employmentType = 'Select employment type';
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate(step)) setStep(s => Math.min(4, s + 1));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate(4)) return;
    setServerError('');
    setSubmitting(true);
    try {
      // Build multipart form data to send file alongside text fields
      const fd = new FormData();
      fd.append('businessSlug',          businessSlug!);
      fd.append('fullName',              form.fullName.trim());
      fd.append('email',                 form.email.trim().toLowerCase());
      fd.append('password',              form.password);
      if (form.phone)                 fd.append('phone',                 form.phone.trim());
      if (form.dateOfBirth)           fd.append('dateOfBirth',           form.dateOfBirth);
      if (form.address)               fd.append('address',               form.address.trim());
      if (form.city)                  fd.append('city',                  form.city.trim());
      if (form.country)               fd.append('country',               form.country.trim());
      if (form.requestedRoleKey)      fd.append('requestedRoleKey',      form.requestedRoleKey);
      if (form.employmentType)        fd.append('employmentType',        form.employmentType);
      if (form.hireDate)              fd.append('hireDate',              form.hireDate);
      if (form.departmentId)          fd.append('departmentId',          form.departmentId);
      if (form.positionId)            fd.append('positionId',            form.positionId);
      if (form.emergencyName)         fd.append('emergencyName',         form.emergencyName.trim());
      if (form.emergencyPhone)        fd.append('emergencyPhone',        form.emergencyPhone.trim());
      if (form.emergencyRelationship) fd.append('emergencyRelationship', form.emergencyRelationship.trim());
      if (form.bankName)              fd.append('bankName',              form.bankName.trim());
      if (form.bankAccount)           fd.append('bankAccount',           form.bankAccount.trim());
      if (idFile)                     fd.append('idDocument',            idFile, idFile.name);

      const res = await api.post('/api/v1/auth/public-register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data?.data ?? res.data;
      setResult(data);
      if (data.autoApproved && data.accessToken) {
        localStorage.setItem('blih_access_token', data.accessToken);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err: any) {
      setServerError(err?.response?.data?.error ?? err?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (configLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (configError || !config) return <ClosedScreen title="Registration Not Available" message={configError || 'Link invalid.'} />;
  if (!config.enabled) return <ClosedScreen title={config.businessName} message="Self-registration is not enabled for this company." />;
  if (config.openUntil && new Date(config.openUntil).getTime() < Date.now() - 3_600_000) {
    return <ClosedScreen title={config.businessName} message="The registration window has closed." />;
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (result) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <div className="bg-white rounded-3xl border border-slate-100 p-8 max-w-sm w-full text-center shadow-xl space-y-5">
        <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle className="w-7 h-7 text-emerald-500" />
        </div>
        <h2 className="text-sm font-black text-slate-900">{result.autoApproved ? 'Account Created!' : 'Registration Submitted!'}</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {result.autoApproved
            ? 'Your account is active. Redirecting…'
            : 'Your account is pending HR approval. You will be notified once it is activated.'}
        </p>
        {!result.autoApproved && (
          <button onClick={() => navigate('/')} className="text-xs text-blue-600 hover:underline font-bold">Back to Login</button>
        )}
      </div>
    </div>
  );

  // ── Multi-step form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-lg">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{config.businessName}</h1>
          <p className="text-xs text-slate-500">Create your employee account</p>
          {config.openUntil && new Date(config.openUntil).getTime() > Date.now() && (
            <CountdownBadge until={config.openUntil} />
          )}
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active   = step === s.id;
            const complete = step > s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                  active   ? 'bg-blue-600 text-white shadow-sm' :
                  complete ? 'bg-emerald-100 text-emerald-700' :
                             'bg-slate-100 text-slate-400'
                }`}>
                  <Icon className="w-3 h-3" />
                  <span>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-5 h-px ${complete ? 'bg-emerald-300' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8">

          {serverError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-semibold">{serverError}</p>
            </div>
          )}

          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}
            className="space-y-4">

            {/* ── STEP 1: Account ── */}
            {step === 1 && (
              <>
                <h3 className="text-sm font-black text-slate-900 mb-1">Account Information</h3>
                <Field label="Full Name" required error={fieldErrors.fullName}>
                  <TextInput value={form.fullName} onChange={set('fullName')} placeholder="e.g. Amara Bekele" error={fieldErrors.fullName} />
                </Field>
                <Field label="Work Email" required error={fieldErrors.email}>
                  <TextInput value={form.email} onChange={set('email')} placeholder="your@company.com" type="email" error={fieldErrors.email} />
                </Field>
                <Field label="Password" required error={fieldErrors.password}>
                  <div className="relative">
                    <TextInput value={form.password} onChange={set('password')} placeholder="Min. 8 characters"
                      type={showPass ? 'text' : 'password'} error={fieldErrors.password} />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm Password" required error={fieldErrors.confirmPassword}>
                  <TextInput value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Re-enter password" type="password" error={fieldErrors.confirmPassword} />
                </Field>
              </>
            )}

            {/* ── STEP 2: Personal ── */}
            {step === 2 && (
              <>
                <h3 className="text-sm font-black text-slate-900 mb-1">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Phone Number" required error={fieldErrors.phone}>
                    <TextInput value={form.phone} onChange={set('phone')} placeholder="+251 9XX XXX XXX" type="tel" error={fieldErrors.phone} />
                  </Field>
                  <Field label="Date of Birth" required error={fieldErrors.dateOfBirth}>
                    <TextInput value={form.dateOfBirth} onChange={set('dateOfBirth')} type="date" error={fieldErrors.dateOfBirth} />
                  </Field>
                </div>
                <Field label="National ID / Passport Document" required error={fieldErrors.nationalId}>
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${fieldErrors.nationalId ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/30'}`}
                    onClick={() => document.getElementById('idDocInput')?.click()}>
                    <input id="idDocInput" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden" onChange={handleIdFileChange} />
                    {idPreview ? (
                      <img src={idPreview} alt="ID preview" className="max-h-32 mx-auto rounded-lg object-cover" />
                    ) : idFile ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <span className="text-2xl">📄</span>
                        <span className="text-xs font-bold truncate max-w-[200px]">{idFile.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="text-3xl">🪪</div>
                        <p className="text-xs font-bold text-slate-500">Click to upload National ID or Passport</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WebP or PDF · Max 10MB</p>
                      </div>
                    )}
                  </div>
                  {idFile && (
                    <button type="button" onClick={() => { setIdFile(null); setIdPreview(null); }}
                      className="text-[10px] text-red-500 hover:underline mt-1 font-semibold cursor-pointer">
                      Remove file
                    </button>
                  )}
                </Field>
                <Field label="Home Address">
                  <TextInput value={form.address} onChange={set('address')} placeholder="Street address" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City">
                    <TextInput value={form.city} onChange={set('city')} placeholder="e.g. Addis Ababa" />
                  </Field>
                  <Field label="Country">
                    <TextInput value={form.country} onChange={set('country')} placeholder="e.g. Ethiopia" />
                  </Field>
                </div>
              </>
            )}

            {/* ── STEP 3: Work Info ── */}
            {step === 3 && (
              <>
                <h3 className="text-sm font-black text-slate-900 mb-1">Work Information</h3>
                <Field label="Requested Role" required error={fieldErrors.requestedRoleKey}>
                  <SelectInput value={form.requestedRoleKey} onChange={set('requestedRoleKey')}
                    options={ROLES.map(r => ({ value: r.key, label: r.label }))} />
                  <p className="text-[9px] text-slate-400 mt-0.5">HR will review and confirm your role assignment.</p>
                </Field>
                <Field label="Department" error={fieldErrors.departmentId}>
                  <SearchableCreate
                    placeholder="Search or create department…"
                    items={departments}
                    loading={deptLoading}
                    selectedId={selectedDept?.id ?? ''}
                    selectedLabel={selectedDept?.label ?? ''}
                    onSelect={item => {
                      setSelectedDept(item);
                      setForm(p => ({ ...p, departmentId: item?.id ?? '' }));
                    }}
                    onCreate={async (name) => {
                      const res = await api.post(`/api/v1/auth/public-register/${businessSlug}/departments`, { name });
                      const d = res.data?.data?.department;
                      const item = { id: d.id, label: d.name };
                      setDepartments(prev => [...prev, item]);
                      setForm(p => ({ ...p, departmentId: d.id }));
                      return item;
                    }}
                  />
                </Field>
                <Field label="Position / Job Title" error={fieldErrors.positionId}>
                  <SearchableCreate
                    placeholder="Search or create position…"
                    items={positions}
                    loading={posLoading}
                    selectedId={selectedPos?.id ?? ''}
                    selectedLabel={selectedPos?.label ?? ''}
                    onSelect={item => {
                      setSelectedPos(item);
                      setForm(p => ({ ...p, positionId: item?.id ?? '' }));
                    }}
                    onCreate={async (title) => {
                      const res = await api.post(`/api/v1/auth/public-register/${businessSlug}/positions`, {
                        title,
                        departmentId: selectedDept?.id || undefined,
                      });
                      const p = res.data?.data?.position;
                      const item = { id: p.id, label: p.title };
                      setPositions(prev => [...prev, item]);
                      setForm(p2 => ({ ...p2, positionId: p.id }));
                      return item;
                    }}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Employment Type" required error={fieldErrors.employmentType}>
                    <SelectInput value={form.employmentType} onChange={set('employmentType')}
                      options={EMPLOYMENT_TYPES.map(t => ({ value: t.value, label: t.label }))} />
                  </Field>
                  <Field label="Expected Start Date">
                    <TextInput value={form.hireDate} onChange={set('hireDate')} type="date" />
                  </Field>
                </div>
                {!config.autoApprove && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800 font-semibold">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    Your account requires HR approval before you can log in. Your requested role will be reviewed.
                  </div>
                )}
              </>
            )}

            {/* ── STEP 4: Emergency + Bank ── */}
            {step === 4 && (
              <>
                <h3 className="text-sm font-black text-slate-900 mb-1">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contact Full Name">
                    <TextInput value={form.emergencyName} onChange={set('emergencyName')} placeholder="e.g. Sara Bekele" />
                  </Field>
                  <Field label="Relationship">
                    <TextInput value={form.emergencyRelationship} onChange={set('emergencyRelationship')} placeholder="e.g. Spouse, Parent" />
                  </Field>
                </div>
                <Field label="Emergency Phone">
                  <TextInput value={form.emergencyPhone} onChange={set('emergencyPhone')} placeholder="+251 9XX XXX XXX" type="tel" />
                </Field>

                <div className="pt-2 border-t border-slate-100 mt-4">
                  <h3 className="text-sm font-black text-slate-900 mb-3">Bank Details <span className="text-[10px] text-slate-400 font-normal">(optional)</span></h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Bank Name">
                      <TextInput value={form.bankName} onChange={set('bankName')} placeholder="e.g. Commercial Bank" />
                    </Field>
                    <Field label="Account Number">
                      <TextInput value={form.bankAccount} onChange={set('bankAccount')} placeholder="Account number" />
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              <button type="submit" disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-sm">
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                ) : step < 4 ? (
                  <>Next <ArrowRight className="w-4 h-4" /></>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-slate-400 font-medium mt-4">
            Already have an account?{' '}
            <button onClick={() => navigate('/')} className="text-blue-600 hover:underline font-bold">Sign in</button>
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-400">
          Powered by <span className="font-black text-slate-600">Blih CORE</span>
        </p>
      </div>
    </div>
  );
}
