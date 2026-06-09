/**
 * PublicRegisterPage — /register/:businessSlug
 * 4-step self-registration form.
 *
 * Step 1: Account  (name, email, password)
 * Step 2: Personal (DOB, gender, nationality, ID upload, address)
 * Step 3: Work     (role, department, position, employment type, hire date)
 * Step 4: Emergency contact + bank details (optional)
 */
import {
  useState, useEffect, FormEvent, ReactNode,
  ChangeEvent, useRef, useCallback,
} from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, UserPlus, Clock, CheckCircle, AlertCircle,
  Loader2, ArrowRight, ArrowLeft, User, Briefcase, Shield,
  CreditCard, ChevronsUpDown, Check, Plus, Globe, Smartphone,
  MapPin, Building2, UploadCloud, HeartPulse, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Country, State, City } from 'country-state-city';

import { Input }    from '@/components/ui/input';
import { Button }   from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { api } from '../api/client';

// Taller wrappers so form fields feel comfortable on a registration page
const Inp = ({ className, ...p }: React.ComponentProps<typeof Input>) => (
  <Input className={cn('h-10 rounded-lg px-3 text-xs bg-white/50 border-slate-200/60 focus:bg-white transition-all shadow-sm', className)} {...p} />
);
const Btn = ({ className, children, ...p }: React.ComponentProps<typeof Button>) => (
  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
    <Button className={cn('h-10 rounded-lg text-xs font-semibold px-4 shadow-sm transition-all', className)} {...p}>
      {children}
    </Button>
  </motion.div>
);
const Sel = ({ className, ...p }: React.ComponentProps<typeof SelectTrigger>) => (
  <SelectTrigger className={cn('h-10 rounded-lg px-3 text-xs w-full bg-white/50 border-slate-200/60 focus:bg-white transition-all shadow-sm', className)} {...p} />
);

// ── Types ──────────────────────────────────────────────────────────────────────
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
  fullName: string; email: string; password: string; confirmPassword: string;
  phone: string; dateOfBirth: string; gender: string; maritalStatus: string;
  nationality: string; nationalId: string;
  address: string; city: string; country: string; zipCode: string;
  requestedRoleKey: string; employmentType: string; hireDate: string;
  departmentId: string; positionId: string;
  emergencyName: string; emergencyPhone: string; emergencyRelationship: string;
  bankName: string; bankAccount: string;
}

const EMPTY: FormData = {
  fullName: '', email: '', password: '', confirmPassword: '',
  phone: '', dateOfBirth: '', gender: '', maritalStatus: '', nationality: '',
  nationalId: '', address: '', city: '', country: '', zipCode: '',
  requestedRoleKey: 'EMPLOYEE', employmentType: 'full_time',
  hireDate: '', departmentId: '', positionId: '',
  emergencyName: '', emergencyPhone: '', emergencyRelationship: '',
  bankName: '', bankAccount: '',
};

const ROLES = [
  { key: 'EMPLOYEE',        label: 'Employee' },
  { key: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { key: 'HR_MANAGER',      label: 'HR Manager' },
  { key: 'FINANCE_MANAGER', label: 'Finance Manager' },
  { key: 'CEO',             label: 'CEO / Executive' },
];
const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract',  label: 'Contract' },
  { value: 'intern',    label: 'Intern' },
];
const GENDERS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
];
const RELATIONSHIPS = [
  { value: 'spouse',  label: 'Spouse' },
  { value: 'parent',  label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child',   label: 'Child' },
  { value: 'friend',  label: 'Friend' },
  { value: 'relative',label: 'Other Relative' },
  { value: 'other',   label: 'Other' },
];

const MARITAL_STATUSES = [
  { value: 'single',   label: 'Single' },
  { value: 'married',  label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed',  label: 'Widowed' },
];
const NATIONALITIES = Country.getAllCountries()
  .map(c => c.name)
  .sort((a, b) => a.localeCompare(b));

const STEPS = [
  { id: 1, label: 'Account',   icon: User },
  { id: 2, label: 'Personal',  icon: Shield },
  { id: 3, label: 'Work Info', icon: Briefcase },
  { id: 4, label: 'Emergency', icon: CreditCard },
];

// ── Small UI helpers ───────────────────────────────────────────────────────────

function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1 ml-0.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </span>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[10px] font-semibold text-red-500">{msg}</p>;
}

function Field({
  label, required, error, children, icon: Icon,
}: { label: string; required?: boolean; error?: string; children: ReactNode; icon?: any }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 px-0.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-blue-600/70" />}
        <Label required={required}>{label}</Label>
      </div>
      {children}
      <FieldError msg={error} />
    </div>
  );
}

// Shadcn-styled combobox (Popover + Command) for searchable single-select
function Combobox({
  value, onChange, options, placeholder, error,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border bg-white/50 px-3 py-1 text-xs transition-all outline-none shadow-sm',
          error ? 'border-destructive' : 'border-slate-200/60',
          'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/10 focus:bg-white',
        )}
      >
        <span className={selected ? 'text-foreground font-medium' : 'text-muted-foreground'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width,260px)] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search…`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map(o => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => { onChange(o.value); setOpen(false); }}
                  data-checked={value === o.value}
                >
                  {o.label}
                  {value === o.value && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Searchable combobox with inline "Create new" — for department & position
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered  = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));
  const showCreate = query.trim() && !filtered.some(i => i.label.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = async () => {
    if (!query.trim()) return;
    setCreating(true);
    try {
      const item = await onCreate(query.trim());
      onSelect(item); setQuery(''); setOpen(false);
    } finally { setCreating(false); }
  };

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          'flex h-10 items-center gap-1 rounded-lg border bg-white/50 px-3 text-xs transition-all cursor-text shadow-sm',
          error ? 'border-destructive' : 'border-slate-200/60',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/10 focus-within:bg-white',
        )}
        onClick={() => setOpen(true)}
      >
        <Inp
          value={open ? query : (selectedId ? selectedLabel : '')}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(''); }}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none shadow-none focus:ring-0 px-0 h-full"
        />
        {selectedId && !open && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onSelect(null); setQuery(''); }}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <Plus className="rotate-45 w-3 h-3" />
          </button>
        )}
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-md max-h-48 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 && !showCreate ? (
            <p className="px-3 py-2.5 text-xs text-muted-foreground">No results found</p>
          ) : (
            <>
              {filtered.map(item => (
                <Btn
                  key={item.id} type="button"
                  onClick={() => { onSelect(item); setQuery(''); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between',
                    item.id === selectedId && 'text-blue-600',
                  )}
                >
                  {item.label}
                  {item.id === selectedId && <Check className="h-3 w-3" />}
                </Btn>
              ))}
              {showCreate && (
                <Btn
                  type="button" onClick={handleCreate} disabled={creating}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-accent border-t border-border flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  {creating ? 'Creating…' : `Create "${query.trim()}"`}
                </Btn>
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
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`);
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [until]);
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" />{label}
    </span>
  );
}

function ClosedScreen({ title, message }: { title: string; message: string }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-100 rounded-full blur-[120px] opacity-40" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-100 rounded-full blur-[120px] opacity-40" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/50 p-10 max-w-sm w-full text-center shadow-2xl space-y-6 relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto shadow-inner">
          <Clock className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <Btn onClick={() => navigate('/')} className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-900/20">
          Back to Login
        </Btn>
      </motion.div>
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

  // Country / state / city cascade
  const [countryCode, setCountryCode] = useState('');
  const [stateCode,   setStateCode]   = useState('');

  const allCountries = Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }));
  const stateOptions = countryCode
    ? State.getStatesOfCountry(countryCode).map(s => ({ value: s.isoCode, label: s.name }))
    : [];
  const cityOptions = countryCode && stateCode
    ? City.getCitiesOfState(countryCode, stateCode).map(c => ({ value: c.name, label: c.name }))
    : countryCode
    ? (City.getCitiesOfCountry(countryCode) ?? []).map(c => ({ value: c.name, label: c.name }))
    : [];

  // Department + position
  const [departments,  setDepartments]  = useState<SearchableItem[]>([]);
  const [positions,    setPositions]    = useState<SearchableItem[]>([]);
  const [deptLoading,  setDeptLoading]  = useState(false);
  const [posLoading,   setPosLoading]   = useState(false);
  const [selectedDept, setSelectedDept] = useState<SearchableItem | null>(null);
  const [selectedPos,  setSelectedPos]  = useState<SearchableItem | null>(null);

  const loadDepartments = useCallback(async () => {
    if (!businessSlug) return;
    setDeptLoading(true);
    try {
      const res = await api.get(`/api/v1/auth/public-register/${businessSlug}/departments`);
      setDepartments((res.data?.data?.departments ?? []).map((d: any) => ({ id: d.id, label: d.name })));
    } catch {} finally { setDeptLoading(false); }
  }, [businessSlug]);

  const loadPositions = useCallback(async () => {
    if (!businessSlug) return;
    setPosLoading(true);
    try {
      const res = await api.get(`/api/v1/auth/public-register/${businessSlug}/positions`);
      setPositions((res.data?.data?.positions ?? []).map((p: any) => ({ id: p.id, label: p.title })));
    } catch {} finally { setPosLoading(false); }
  }, [businessSlug]);

  useEffect(() => {
    if (step === 3) { loadDepartments(); loadPositions(); }
  }, [step, loadDepartments, loadPositions]);

  // Fayda (National ID) — front & back
  const [idFront,        setIdFront]        = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBack,         setIdBack]         = useState<File | null>(null);
  const [idBackPreview,  setIdBackPreview]  = useState<string | null>(null);

  const handleIdSideChange = (side: 'front' | 'back', e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    (side === 'front' ? setIdFront : setIdBack)(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => (side === 'front' ? setIdFrontPreview : setIdBackPreview)(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      (side === 'front' ? setIdFrontPreview : setIdBackPreview)(null);
    }
    e.target.value = '';
  };

  useEffect(() => {
    if (!businessSlug) return;
    api.get(`/api/v1/auth/public-register/${businessSlug}/config`)
      .then(r => setConfig(r.data?.data ?? r.data))
      .catch(err => setConfigError(err?.response?.data?.message ?? 'Could not load registration info.'))
      .finally(() => setConfigLoading(false));
  }, [businessSlug]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (s: number): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.fullName.trim() || form.fullName.length < 2) e.fullName = 'Full name required (min 2 chars)';
      if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
      if (!form.password || form.password.length < 8) e.password = 'Minimum 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    if (s === 2) {
      if (!form.phone.trim()) e.phone = 'Phone number required';
      if (!form.dateOfBirth)  e.dateOfBirth = 'Date of birth required';
      if (!idFront || !idBack) e.nationalId = 'Upload both sides of your National ID';
    }
    if (s === 3) {
      if (!form.requestedRoleKey) e.requestedRoleKey = 'Select a role';
      if (!form.employmentType)   e.employmentType   = 'Select employment type';
    }
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validate(step)) setStep(s => Math.min(4, s + 1)); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate(4)) return;
    setServerError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('businessSlug', businessSlug!);
      fd.append('fullName',     form.fullName.trim());
      fd.append('email',        form.email.trim().toLowerCase());
      fd.append('password',     form.password);
      if (form.phone)                 fd.append('phone',                 form.phone.trim());
      if (form.dateOfBirth)           fd.append('dateOfBirth',           form.dateOfBirth);
      if (form.gender)                fd.append('gender',                form.gender);
      if (form.maritalStatus)         fd.append('maritalStatus',         form.maritalStatus);
      if (form.nationality)           fd.append('nationality',           form.nationality.trim());
      if (form.address)               fd.append('address',               form.address.trim());
      if (form.city)                  fd.append('city',                  form.city.trim());
      if (form.country)               fd.append('country',               form.country.trim());
      if (form.zipCode)               fd.append('zipCode',               form.zipCode.trim());
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
      if (idFront)                    fd.append('idDocumentFront',       idFront,  idFront.name);
      if (idBack)                     fd.append('idDocumentBack',        idBack,   idBack.name);

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

  // ── Gates ──────────────────────────────────────────────────────────────────
  if (configLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
    </div>
  );
  if (configError || !config) return <ClosedScreen title="Not Available" message={configError || 'Invalid link.'} />;
  if (!config.enabled)         return <ClosedScreen title={config.businessName} message="Self-registration is not enabled." />;
  if (config.openUntil && new Date(config.openUntil).getTime() < Date.now() - 3_600_000)
    return <ClosedScreen title={config.businessName} message="The registration window has closed." />;

  // ── Success ────────────────────────────────────────────────────────────────
  if (result) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100/40 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/40 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/80 p-10 max-w-md w-full text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative z-10"
      >
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 shadow-inner relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          >
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </motion.div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-emerald-500/20 rounded-3xl -z-10"
          />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-3">
          {result.autoApproved ? 'Account Activated!' : 'Application Sent!'}
        </h2>
        <p className="text-slate-500 leading-relaxed mb-8">
          {result.autoApproved
            ? 'Your employee account is ready. We are taking you to your dashboard now.'
            : 'Your application is being reviewed by HR. We will notify you as soon as it is approved.'}
        </p>
        {!result.autoApproved && (
          <Btn onClick={() => navigate('/')} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 py-6">
            Go to Login
          </Btn>
        )}
      </motion.div>
    </div>
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-50/50 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-32 h-32 bg-blue-200/20 rounded-full blur-[60px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 space-y-4">

        {/* ── Header ── */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-600/20 transform transition-transform hover:scale-105">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
              {config.businessName}
            </h1>
            <p className="text-[11px] font-medium text-slate-500">Self-Registration Portal</p>
          </div>
          {config.openUntil && new Date(config.openUntil).getTime() > Date.now() && (
            <div className="flex justify-center scale-90">
              <CountdownBadge until={config.openUntil} />
            </div>
          )}
        </motion.div>

        {/* ── Step indicators ── */}
        <div className="px-6">
          <div className="flex items-center justify-between gap-0.5 mb-2">
            {STEPS.map((s, i) => {
              const Icon    = s.icon;
              const active  = step === s.id;
              const done    = step > s.id;
              return (
                <div key={s.id} className="flex-1 flex items-center gap-0.5 group">
                  <div 
                    className={cn(
                      'relative flex flex-col items-center gap-1.5 flex-1 pt-1 transition-all duration-300',
                      active ? 'opacity-100' : 'opacity-40'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm border',
                      active ? 'bg-blue-600 border-blue-600 text-white'
                             : done  ? 'bg-emerald-500 border-emerald-500 text-white'
                                     : 'bg-white border-slate-200 text-slate-400',
                    )}>
                      {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={cn(
                      'text-[9px] font-bold uppercase tracking-wider hidden sm:block',
                      active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-400'
                    )}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px mt-[-20px] relative">
                      <div className="absolute inset-0 bg-slate-200" />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: done ? '100%' : '0%' }}
                        className="absolute inset-0 bg-emerald-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Card ── */}
        <motion.div 
          layout
          className="bg-white/90 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl p-6 md:p-8 relative"
        >
          {serverError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-2.5 mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-tight">{serverError}</p>
            </motion.div>
          )}

          <form
            onSubmit={step === 4 ? handleSubmit : e => { e.preventDefault(); handleNext(); }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >

              {step === 1 && (
                <>
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-none text-center sm:text-left">Account Information</h3>
                    <p className="text-[10px] text-slate-500 mt-1 text-center sm:text-left">Set up your secure login credentials</p>
                  </div>

                  <Field label="Full Name" required error={fieldErrors.fullName} icon={User}>
                    <Inp
                      value={form.fullName} onChange={e => set('fullName')(e.target.value)}
                      placeholder="e.g. Amara Bekele"
                      aria-invalid={!!fieldErrors.fullName}
                    />
                  </Field>

                  <Field label="Work Email" required error={fieldErrors.email} icon={Globe}>
                    <Inp
                      type="email" value={form.email} onChange={e => set('email')(e.target.value)}
                      placeholder="your@company.com"
                      aria-invalid={!!fieldErrors.email}
                    />
                  </Field>

                  <Field label="Password" required error={fieldErrors.password} icon={Shield}>
                    <div className="relative">
                      <Inp
                        type={showPass ? 'text' : 'password'}
                        value={form.password} onChange={e => set('password')(e.target.value)}
                        placeholder="Min. 8 characters"
                        aria-invalid={!!fieldErrors.password}
                        className="pr-12"
                      />
                      <button
                        type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 transition-colors"
                      >
                        {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm Password" required error={fieldErrors.confirmPassword} icon={CheckCircle}>
                    <Inp
                      type="password" value={form.confirmPassword}
                      onChange={e => set('confirmPassword')(e.target.value)}
                      placeholder="Re-enter password"
                      aria-invalid={!!fieldErrors.confirmPassword}
                    />
                  </Field>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight text-center sm:text-left">Personal Details</h3>
                    <p className="text-[10px] text-slate-500 mt-1 text-center sm:text-left">Help us get to know you better</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Phone" required error={fieldErrors.phone} icon={Smartphone}>
                      <Inp
                        type="tel" value={form.phone} onChange={e => set('phone')(e.target.value)}
                        placeholder="+251 9XX XXX XXX"
                        aria-invalid={!!fieldErrors.phone}
                      />
                    </Field>
                    <Field label="DOB" required error={fieldErrors.dateOfBirth} icon={Clock}>
                      <Inp
                        type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth')(e.target.value)}
                        aria-invalid={!!fieldErrors.dateOfBirth}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Gender" icon={User}>
                      <Select value={form.gender} onValueChange={set('gender')}>
                        <Sel className="w-full">
                          <SelectValue placeholder="Select" />
                        </Sel>
                        <SelectContent>
                          {GENDERS.map(g => (
                            <SelectItem key={g.value} value={g.value} className="text-xs">{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Marital" icon={Shield}>
                      <Select value={form.maritalStatus} onValueChange={set('maritalStatus')}>
                        <Sel className="w-full">
                          <SelectValue placeholder="Select" />
                        </Sel>
                        <SelectContent>
                          {MARITAL_STATUSES.map(m => (
                            <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Field label="Nationality" icon={Globe}>
                    <Combobox
                      value={form.nationality}
                      onChange={set('nationality')}
                      options={NATIONALITIES.map(n => ({ value: n, label: n }))}
                      placeholder="Search…"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['front', 'back'] as const).map(side => {
                      const file    = side === 'front' ? idFront         : idBack;
                      const preview = side === 'front' ? idFrontPreview  : idBackPreview;
                      const hasErr  = !!fieldErrors.nationalId && !file;
                      return (
                        <div key={side}>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={cn(
                              'border border-dashed rounded-xl p-2 text-center cursor-pointer transition-all h-20 flex flex-col items-center justify-center relative overflow-hidden',
                              hasErr  ? 'border-red-300 bg-red-50/50'
                                      : file ? 'border-emerald-500 bg-emerald-50/30'
                                              : 'border-slate-200 bg-slate-50/50 hover:border-blue-400 hover:bg-blue-50/50',
                            )}
                            onClick={() => document.getElementById(`idDoc-${side}`)?.click()}
                          >
                            <Inp
                              id={`idDoc-${side}`} type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={e => handleIdSideChange(side, e)}
                            />
                            {preview ? (
                              <>
                                <img src={preview} alt={`ID ${side}`} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <UploadCloud className="w-5 h-5 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{side} ID side</p>
                                <p className="text-[8px] text-slate-400">JPG, PNG</p>
                              </div>
                            )}
                          </motion.div>
                          {file && (
                            <button
                              type="button"
                              onClick={() => {
                                if (side === 'front') { setIdFront(null); setIdFrontPreview(null); }
                                else                  { setIdBack(null);  setIdBackPreview(null); }
                              }}
                              className="mt-1 text-[8px] text-red-500 hover:text-red-700 font-bold ml-1 uppercase tracking-tighter"
                            >Remove</button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <Field label="Home Address" icon={MapPin}>
                    <Inp value={form.address} onChange={e => set('address')(e.target.value)} placeholder="House #, Street" />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Country" icon={Globe}>
                      <Combobox
                        value={countryCode}
                        onChange={code => {
                          setCountryCode(code);
                          setStateCode('');
                          set('country')(Country.getCountryByCode(code)?.name ?? '');
                          set('city')('');
                        }}
                        options={allCountries}
                        placeholder="Search country…"
                      />
                    </Field>

                    {stateOptions.length > 0 && (
                      <Field label="State / Region" icon={MapPin}>
                        <Combobox
                          value={stateCode}
                          onChange={code => { setStateCode(code); set('city')(''); }}
                          options={stateOptions}
                          placeholder="Search state…"
                        />
                      </Field>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="City" icon={Building2}>
                      {cityOptions.length > 0 ? (
                        <Combobox
                          value={form.city}
                          onChange={set('city')}
                          options={cityOptions}
                          placeholder="Search city…"
                        />
                      ) : (
                        <Inp value={form.city} onChange={e => set('city')(e.target.value)} placeholder="e.g. Addis Ababa" />
                      )}
                    </Field>
                    <Field label="Zip / Postal Code" icon={MapPin}>
                      <Inp value={form.zipCode} onChange={e => set('zipCode')(e.target.value)} placeholder="e.g. 1000" />
                    </Field>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight text-center sm:text-left">Work Information</h3>
                    <p className="text-[10px] text-slate-500 mt-1 text-center sm:text-left">Your professional role</p>
                  </div>

                  <Field label="Requested Role" required error={fieldErrors.requestedRoleKey} icon={User}>
                    <Select value={form.requestedRoleKey} onValueChange={set('requestedRoleKey')}>
                      <Sel className="w-full">
                        <SelectValue placeholder="Select" />
                      </Sel>
                      <SelectContent>
                        {ROLES.map(r => (
                          <SelectItem key={r.key} value={r.key} className="text-xs">{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Department" icon={Building2}>
                      <SearchableCreate
                        placeholder="Search…"
                        items={departments}
                        loading={deptLoading}
                        selectedId={selectedDept?.id ?? ''}
                        selectedLabel={selectedDept?.label ?? ''}
                        onSelect={item => {
                          setSelectedDept(item);
                          set('departmentId')(item?.id ?? '');
                        }}
                        onCreate={async name => {
                          const res = await api.post(`/api/v1/auth/public-register/${businessSlug}/departments`, { name });
                          const d   = res.data?.data?.department;
                          const item = { id: d.id, label: d.name };
                          setDepartments(prev => [...prev, item]);
                          set('departmentId')(d.id);
                          return item;
                        }}
                      />
                    </Field>

                    <Field label="Position" icon={Briefcase}>
                      <SearchableCreate
                        placeholder="Search…"
                        items={positions}
                        loading={posLoading}
                        selectedId={selectedPos?.id ?? ''}
                        selectedLabel={selectedPos?.label ?? ''}
                        onSelect={item => {
                          setSelectedPos(item);
                          set('positionId')(item?.id ?? '');
                        }}
                        onCreate={async title => {
                          const res = await api.post(`/api/v1/auth/public-register/${businessSlug}/positions`, {
                            title, departmentId: selectedDept?.id || undefined,
                          });
                          const p    = res.data?.data?.position;
                          const item = { id: p.id, label: p.title };
                          setPositions(prev => [...prev, item]);
                          set('positionId')(p.id);
                          return item;
                        }}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Type" required error={fieldErrors.employmentType} icon={Shield}>
                      <Select value={form.employmentType} onValueChange={set('employmentType')}>
                        <Sel className="w-full">
                          <SelectValue placeholder="Select" />
                        </Sel>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Start Date" icon={Clock}>
                      <Inp type="date" value={form.hireDate} onChange={e => set('hireDate')(e.target.value)} />
                    </Field>
                  </div>

                  {!config.autoApprove && (
                    <motion.div 
                      className="flex items-center gap-2 bg-amber-50/50 border border-amber-100 rounded-xl px-3 py-2 text-[9px] text-amber-800 font-semibold"
                    >
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                      <p>Note: HR approval is required.</p>
                    </motion.div>
                  )}
                </>
              )}

            {/* ════ STEP 4: Emergency + Bank ════ */}
              {step === 4 && (
                <>
                  <div className="mb-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight text-center sm:text-left text-xs uppercase">Final Details</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5 text-center sm:text-left">Emergency & Payment Info</p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <HeartPulse className="w-3 h-3 text-rose-500" />
                        <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Emergency</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field label="Name" icon={User}>
                          <Inp value={form.emergencyName} onChange={e => set('emergencyName')(e.target.value)} placeholder="Full name" />
                        </Field>
                        <Field label="Rel" icon={HeartPulse}>
                          <Select value={form.emergencyRelationship} onValueChange={set('emergencyRelationship')}>
                            <Sel className="w-full">
                              <SelectValue placeholder="Select" />
                            </Sel>
                            <SelectContent>
                              {RELATIONSHIPS.map(r => (
                                <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <div className="mt-2.5">
                        <Field label="Phone" icon={Smartphone}>
                          <Inp type="tel" value={form.emergencyPhone} onChange={e => set('emergencyPhone')(e.target.value)} placeholder="+251..." />
                        </Field>
                      </div>
                    </div>

                    <div className="bg-blue-50/30 rounded-xl p-3 border border-blue-100/30">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Landmark className="w-3 h-3 text-blue-600" />
                        <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Bank</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <Field label="Bank" icon={Building2}>
                          <Inp value={form.bankName} onChange={e => set('bankName')(e.target.value)} placeholder="e.g. CBE" />
                        </Field>
                        <Field label="Acc #" icon={CreditCard}>
                          <Inp value={form.bankAccount} onChange={e => set('bankAccount')(e.target.value)} placeholder="Acc #" />
                        </Field>
                      </div>
                    </div>
                  </div>
                </>
              )}
                </motion.div>
              </AnimatePresence>

              {/* ── Footer / Navigation ── */}
              <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                {step > 1 && (
                  <Btn 
                    type="button" 
                    onClick={() => setStep(s => s - 1)}
                    variant="ghost"
                    className="px-2 text-slate-400 hover:text-slate-700 border-none shadow-none font-bold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                    Back
                  </Btn>
                )}
                
                <div className="flex-1" />

                <Btn 
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    "px-6 py-4 rounded-xl min-w-[120px] shadow-lg",
                    step === 4 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10" 
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/10"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ...
                    </>
                  ) : step === 4 ? (
                    <>
                      Finish
                      <CheckCircle className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Btn>
              </div>
            </form>

            <p className="text-center text-[11px] text-slate-400 mt-5 font-medium">
              Already have an account?{' '}
              <button 
                onClick={() => navigate('/')} 
                className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors"
              >
                Sign in
              </button>
            </p>
          </motion.div>

          {/* ── Footer ── */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center opacity-50 flex flex-col items-center gap-1"
          >
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
              Powered by <span className="text-slate-600">Blih CORE</span>
            </p>
          </motion.div>
        </div>
      </div>
    );
}
