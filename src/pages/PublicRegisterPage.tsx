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
  ChangeEvent, useRef, useCallback, useMemo,
} from 'react';
import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  <Button className={cn('h-10 rounded-lg text-xs font-semibold px-4 shadow-sm transition-all active:scale-[0.98]', className)} {...p}>
    {children}
  </Button>
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

// ── Draft persistence ──────────────────────────────────────────────────────────
interface DraftState {
  form: FormData;
  step: number;
  countryCode: string;
  stateCode: string;
  selectedDept: { id: string; label: string } | null;
  selectedPos:  { id: string; label: string } | null;
}

function draftKey(slug: string, token: string | null) {
  return `blih_register_draft__${slug}${token ? `__${token}` : ''}`;
}

const ROLES: { key: string; label: string }[] = []; // loaded from API per-business
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
  const [open,     setOpen]     = useState(false);
  const [query,    setQuery]    = useState('');
  const [creating, setCreating] = useState(false);

  const filtered   = items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = filtered.some(i => i.label.toLowerCase() === query.trim().toLowerCase());
  const showCreate = query.trim().length > 0 && !exactMatch;

  const handleCreate = async () => {
    if (!query.trim() || creating) return;
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-xl border bg-transparent px-4 text-sm transition-colors outline-none',
          error ? 'border-destructive' : 'border-input',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        )}
      >
        <span className={selectedId ? 'text-foreground' : 'text-muted-foreground'}>
          {selectedId ? selectedLabel : placeholder}
        </span>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {selectedId && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onSelect(null); setQuery(''); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="rotate-45 w-3.5 h-3.5" />
            </button>
          )}
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--anchor-width,280px)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <CommandEmpty>
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              </CommandEmpty>
            ) : (
              <>
                {filtered.length === 0 && !showCreate && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}
                <CommandGroup>
                  {filtered.map(item => (
                    <CommandItem
                      key={item.id}
                      value={item.label}
                      onSelect={() => { onSelect(item); setQuery(''); setOpen(false); }}
                      data-checked={selectedId === item.id}
                    >
                      {item.label}
                      {selectedId === item.id && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                    </CommandItem>
                  ))}
                  {showCreate && (
                    <CommandItem
                      value={`__create__${query}`}
                      onSelect={handleCreate}
                      disabled={creating}
                      className="text-blue-600 font-semibold"
                    >
                      {creating
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Creating…</>
                        : <><Plus className="w-3.5 h-3.5 mr-1.5" />Create "{query.trim()}"</>
                      }
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
  const [searchParams] = useSearchParams();
  const resubmitToken = searchParams.get('resubmit') || null;

  // ── Resubmit prefill loading ──
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillError,   setPrefillError]   = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  // resubmitToken → when present we show "updating" flow instead of fresh registration
  const isResubmit = !!resubmitToken;

  const [config,        setConfig]        = useState<RegConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError,   setConfigError]   = useState('');

  const [step,        setStep]        = useState(1);
  const [form,        setForm]        = useState<FormData>({ ...EMPTY });
  const [showPass,    setShowPass]    = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting,  setSubmitting]  = useState(false);
  const [serverError, setServerError] = useState('');
  const [result,      setResult]      = useState<{ autoApproved: boolean; resubmitted?: boolean } | null>(null);

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

  // ── Draft persistence ────────────────────────────────────────────────────────
  const DRAFT_KEY = useMemo(() => draftKey(businessSlug ?? 'unknown', resubmitToken), [businessSlug, resubmitToken]);
  const [draftSavedAt,  setDraftSavedAt]  = useState<Date | null>(null);
  const [hasDraftBanner, setHasDraftBanner] = useState(false);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore draft on mount (only before config/prefill loads, so we don't stomp server data)
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved: DraftState = JSON.parse(raw);
      // Don't restore passwords for security
      const { password: _pw, confirmPassword: _cpw, ...safeForm } = saved.form;
      setForm(prev => ({ ...prev, ...safeForm, password: '', confirmPassword: '' }));
      setStep(saved.step ?? 1);
      if (saved.countryCode) setCountryCode(saved.countryCode);
      if (saved.stateCode)   setStateCode(saved.stateCode);
      if (saved.selectedDept) setSelectedDept(saved.selectedDept);
      if (saved.selectedPos)  setSelectedPos(saved.selectedPos);
      setHasDraftBanner(true);
    } catch {
      // corrupt draft — ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DRAFT_KEY]);

  // Debounced save on every form / step / location / department / position change
  useEffect(() => {
    if (result) return; // don't save after success
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = setTimeout(() => {
      try {
        const draft: DraftState = {
          form:         { ...form, password: '', confirmPassword: '' }, // never persist passwords
          step,
          countryCode,
          stateCode,
          selectedDept,
          selectedPos,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedAt(new Date());
      } catch {
        // storage full or unavailable — silent fail
      }
    }, 800);
    return () => { if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current); };
  }, [form, step, countryCode, stateCode, selectedDept, selectedPos, DRAFT_KEY, result]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftSavedAt(null);
    setHasDraftBanner(false);
  }, [DRAFT_KEY]);
  // ─────────────────────────────────────────────────────────────────────────────

  // Roles — fetched from backend (excludes BUSINESS_ADMIN, PLATFORM_SUPER_ADMIN)
  const [roles,        setRoles]        = useState<{ key: string; label: string }[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const loadRoles = useCallback(async () => {
    if (!businessSlug) return;
    setRolesLoading(true);
    try {
      const res = await api.get(`/api/v1/auth/public-register/${businessSlug}/roles`);
      const fetched: { key: string; label: string }[] = res.data?.data?.roles ?? [];
      const finalRoles = fetched.length > 0 ? fetched : [
        { key: 'EMPLOYEE',        label: 'Employee' },
        { key: 'DEPARTMENT_HEAD', label: 'Department Head' },
        { key: 'HR_MANAGER',      label: 'HR Manager' },
        { key: 'FINANCE_MANAGER', label: 'Finance Manager' },
        { key: 'CEO',             label: 'CEO / Executive' },
      ];
      setRoles(finalRoles);
      // Reset selection if current value isn't in the returned list
      setForm(prev => {
        const valid = finalRoles.some(r => r.key === prev.requestedRoleKey);
        return valid ? prev : { ...prev, requestedRoleKey: finalRoles[0]?.key ?? '' };
      });
    } catch {
      // fallback to sensible defaults if endpoint fails
      setRoles([
        { key: 'EMPLOYEE',        label: 'Employee' },
        { key: 'DEPARTMENT_HEAD', label: 'Department Head' },
        { key: 'HR_MANAGER',      label: 'HR Manager' },
        { key: 'FINANCE_MANAGER', label: 'Finance Manager' },
        { key: 'CEO',             label: 'CEO / Executive' },
      ]);
    } finally { setRolesLoading(false); }
  }, [businessSlug]);

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
    if (step === 3) { loadRoles(); loadDepartments(); loadPositions(); }
  }, [step, loadRoles, loadDepartments, loadPositions]);

  // Fayda (National ID) — front & back
  const [idFront,            setIdFront]            = useState<File | null>(null);
  const [idFrontPreview,     setIdFrontPreview]     = useState<string | null>(null);
  const [idBack,             setIdBack]             = useState<File | null>(null);
  const [idBackPreview,      setIdBackPreview]      = useState<string | null>(null);
  // Existing uploaded URLs (resubmit mode — shown as previews until replaced)
  const [existingFrontUrl,   setExistingFrontUrl]   = useState<string | null>(null);
  const [existingBackUrl,    setExistingBackUrl]    = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

  // ── Resubmit: load pre-filled data ────────────────────────────────────────
  useEffect(() => {
    if (!resubmitToken || !businessSlug) return;
    setPrefillLoading(true);
    api.get(`/api/v1/auth/public-register/${businessSlug}/resubmit/${resubmitToken}`)
      .then(r => {
        const d = r.data?.data ?? r.data;
        const pf = d.prefill ?? {};
        setForm(prev => ({
          ...prev,
          fullName:              pf.fullName              || prev.fullName,
          email:                 pf.email                 || prev.email,
          phone:                 pf.phone                 || prev.phone,
          // Personal
          dateOfBirth:           pf.dateOfBirth           || prev.dateOfBirth,
          gender:                pf.gender                || prev.gender,
          maritalStatus:         pf.maritalStatus         || prev.maritalStatus,
          nationality:           pf.nationality           || prev.nationality,
          address:               pf.address               || prev.address,
          city:                  pf.city                  || prev.city,
          country:               pf.country               || prev.country,
          zipCode:               pf.zipCode               || prev.zipCode,
          // Work
          requestedRoleKey:      pf.requestedRoleKey      || prev.requestedRoleKey,
          employmentType:        pf.employmentType        || prev.employmentType,
          hireDate:              pf.hireDate              || prev.hireDate,
          departmentId:          pf.departmentId          || prev.departmentId,
          positionId:            pf.positionId            || prev.positionId,
          // Emergency
          emergencyName:         pf.emergencyName         || prev.emergencyName,
          emergencyPhone:        pf.emergencyPhone        || prev.emergencyPhone,
          emergencyRelationship: pf.emergencyRelationship || prev.emergencyRelationship,
          // Bank
          bankName:              pf.bankName              || prev.bankName,
          bankAccount:           pf.bankAccount           || prev.bankAccount,
        }));

        if (d.rejectionReason) setRejectionReason(d.rejectionReason);

        // Pre-select department and position in the SearchableCreate dropdowns
        if (pf.departmentId && pf.departmentName) {
          setSelectedDept({ id: pf.departmentId, label: pf.departmentName });
        }
        if (pf.positionId && pf.positionTitle) {
          setSelectedPos({ id: pf.positionId, label: pf.positionTitle });
        }

        // Pre-fill existing ID doc previews
        if (pf.idDocumentFrontUrl) {
          const url = pf.idDocumentFrontUrl.startsWith('http') ? pf.idDocumentFrontUrl : `${API_BASE}${pf.idDocumentFrontUrl}`;
          setExistingFrontUrl(url);
          setIdFrontPreview(url);
        }
        if (pf.idDocumentBackUrl) {
          const url = pf.idDocumentBackUrl.startsWith('http') ? pf.idDocumentBackUrl : `${API_BASE}${pf.idDocumentBackUrl}`;
          setExistingBackUrl(url);
          setIdBackPreview(url);
        }
      })
      .catch(() => setPrefillError('Could not load your previous application data. You may need to fill the form again.'))
      .finally(() => setPrefillLoading(false));
  }, [resubmitToken, businessSlug]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (s: number): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (s === 1) {
      if (!form.fullName.trim() || form.fullName.length < 2) e.fullName = 'Full name required (min 2 chars)';
      if (!isResubmit) {
        // Password only required for fresh registration
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
        if (!form.password || form.password.length < 8) e.password = 'Minimum 8 characters';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      } else {
        // In resubmit mode password is optional — validate only if they filled it in
        if (form.password && form.password.length < 8) e.password = 'Minimum 8 characters';
        if (form.password && form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      }
    }
    if (s === 2) {
      if (!form.phone.trim()) e.phone = 'Phone number required';
      if (!form.dateOfBirth)  e.dateOfBirth = 'Date of birth required';
      // In resubmit mode, existing uploaded images count — only require if neither exists
      const hasFront = !!idFront || !!existingFrontUrl;
      const hasBack  = !!idBack  || !!existingBackUrl;
      if (!hasFront || !hasBack) e.nationalId = 'Upload both sides of your National ID';
    }
    if (s === 3) {
      if (!form.requestedRoleKey) e.requestedRoleKey = 'Select a role';
      if (!form.employmentType)   e.employmentType   = 'Select employment type';
    }
    if (s === 4) {
      if (form.bankAccount && !form.bankAccount.trim().startsWith('013')) {
        e.bankAccount = 'Awash Bank account numbers must start with 013';
      }
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

      // Resubmit flow: use PUT to resubmit endpoint, password only sent if changed
      if (!isResubmit) {
        fd.append('email',    form.email.trim().toLowerCase());
        fd.append('password', form.password);
      } else {
        // In resubmit, email can be updated
        fd.append('email', form.email.trim().toLowerCase());
        // Only send password if the user actually typed a new one
        if (form.password && form.password.length >= 8) {
          fd.append('password', form.password);
        }
      }

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
      if (form.bankName)              fd.append('bankName',              'Awash Bank');
      if (form.bankAccount)           fd.append('bankAccount',           form.bankAccount.trim());
      if (idFront)                    fd.append('idDocumentFront',       idFront,  idFront.name);
      if (idBack)                     fd.append('idDocumentBack',        idBack,   idBack.name);

      const res = isResubmit
        ? await api.post(`/api/v1/auth/public-register/resubmit/${resubmitToken}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await api.post('/api/v1/auth/public-register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      const data = res.data?.data ?? res.data;

      if (isResubmit) {
        setResult({ autoApproved: false, resubmitted: true });
        clearDraft();
        return;
      }

      setResult(data);
      clearDraft();
      if (data.autoApproved && data.accessToken) {
        localStorage.setItem('blih_access_token', data.accessToken);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err: any) {
      setServerError(err?.response?.data?.error ?? err?.response?.data?.message ?? (isResubmit ? 'Resubmission failed. Please try again.' : 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Gates ──────────────────────────────────────────────────────────────────
  if (configLoading || prefillLoading) return (
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
          {result.resubmitted ? 'Application Updated!' : result.autoApproved ? 'Account Activated!' : 'Application Sent!'}
        </h2>
        <p className="text-slate-500 leading-relaxed mb-8">
          {result.resubmitted
            ? 'Your updated application has been submitted for HR review. You will be notified by email once a decision is made.'
            : result.autoApproved
            ? 'Your employee account is ready. We are taking you to your dashboard now.'
            : 'Your application is being reviewed by HR. We will notify you as soon as it is approved.'}
        </p>
        {(!result.autoApproved || result.resubmitted) && (
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
            <p className="text-[11px] font-medium text-slate-500">{isResubmit ? 'Update Your Application' : 'Self-Registration Portal'}</p>
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
          {/* Draft restored banner */}
          {hasDraftBanner && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl px-3 py-2.5 mb-4"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                <p className="text-[10px] font-semibold leading-tight">Draft restored — you can pick up where you left off.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearDraft();
                  setForm({ ...EMPTY });
                  setStep(1);
                  setCountryCode('');
                  setStateCode('');
                  setSelectedDept(null);
                  setSelectedPos(null);
                }}
                className="text-[9px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0 border border-blue-200 rounded-lg px-2 py-1"
              >
                Clear
              </button>
            </motion.div>
          )}

          {/* Resubmit context: rejection reason banner */}
          {isResubmit && rejectionReason && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-0.5">HR Feedback</p>
                <p className="text-xs font-medium leading-snug">{rejectionReason}</p>
              </div>
            </motion.div>
          )}

          {prefillError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-2 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-2.5 mb-4"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold leading-tight">{prefillError}</p>
            </motion.div>
          )}

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

                  <Field label="Work Email" required={!isResubmit} error={fieldErrors.email} icon={Globe}>
                    <Inp
                      type="email" value={form.email} onChange={e => set('email')(e.target.value)}
                      placeholder="your@company.com"
                      aria-invalid={!!fieldErrors.email}
                    />
                  </Field>

                  {!isResubmit && (
                    <>
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

                  {isResubmit && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-[11px] text-blue-700 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                        Leave the password fields blank to keep your existing password.
                      </div>

                      <Field label="New Password (optional)" error={fieldErrors.password} icon={Shield}>
                        <div className="relative">
                          <Inp
                            type={showPass ? 'text' : 'password'}
                            value={form.password}
                            onChange={e => set('password')(e.target.value)}
                            placeholder="Leave blank to keep current password"
                            aria-invalid={!!fieldErrors.password}
                            className="pr-12"
                          />
                          <button
                            type="button" onClick={() => setShowPass(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 transition-colors"
                          >
                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </Field>

                      {form.password && (
                        <Field label="Confirm New Password" error={fieldErrors.confirmPassword} icon={CheckCircle}>
                          <Inp
                            type="password"
                            value={form.confirmPassword}
                            onChange={e => set('confirmPassword')(e.target.value)}
                            placeholder="Re-enter new password"
                            aria-invalid={!!fieldErrors.confirmPassword}
                          />
                        </Field>
                      )}
                    </div>
                  )}
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

                  <Field label="National ID (Fayda) — Front & Back" required={!isResubmit} error={fieldErrors.nationalId}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['front', 'back'] as const).map(side => {
                      const file      = side === 'front' ? idFront        : idBack;
                      const preview   = side === 'front' ? idFrontPreview : idBackPreview;
                      const existing  = side === 'front' ? existingFrontUrl : existingBackUrl;
                      const isExisting = preview === existing && !!existing && !file;
                      const hasErr    = !!fieldErrors.nationalId && !preview;
                      return (
                        <div key={side}>
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={cn(
                              'border border-dashed rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden',
                              'min-h-[140px]',
                              hasErr      ? 'border-red-300 bg-red-50/50'
                              : preview   ? (isExisting ? 'border-blue-400 bg-blue-50/20' : 'border-emerald-500 bg-emerald-50/30')
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
                                <img
                                  src={preview}
                                  alt={`ID ${side}`}
                                  className="w-full h-full object-contain p-1 rounded-xl"
                                  style={{ maxHeight: '200px' }}
                                />
                                {isExisting && (
                                  <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    On file
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                  <UploadCloud className="w-5 h-5 text-white" />
                                </div>
                              </>
                            ) : (
                              <div className="space-y-1.5 py-4 px-2">
                                <div className="text-2xl">{side === 'front' ? '🪪' : '🔄'}</div>
                                <p className="text-[10px] font-bold text-slate-600 capitalize">{side} side</p>
                                <p className="text-[9px] text-slate-400">JPG, PNG, WebP</p>
                              </div>
                            )}
                          </motion.div>
                          {(file || (isExisting && isResubmit)) && (
                            <button
                              type="button"
                              onClick={() => {
                                if (side === 'front') {
                                  setIdFront(null);
                                  // In resubmit mode, fall back to existing URL preview rather than clearing entirely
                                  setIdFrontPreview(isResubmit && existing ? existing : null);
                                } else {
                                  setIdBack(null);
                                  setIdBackPreview(isResubmit && existing ? existing : null);
                                }
                              }}
                              className="mt-1 text-[8px] text-red-500 hover:text-red-700 font-bold ml-1 uppercase tracking-tighter"
                            >
                              {file ? 'Remove new' : 'Keep existing'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  </Field>

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
                    <Select value={form.requestedRoleKey} onValueChange={set('requestedRoleKey')} disabled={rolesLoading}>
                      <Sel className="w-full">
                        <SelectValue placeholder={rolesLoading ? 'Loading roles…' : 'Select'} />
                      </Sel>
                      <SelectContent>
                        {rolesLoading ? (
                          <div className="flex items-center justify-center py-3">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          </div>
                        ) : (
                          roles.map(r => (
                            <SelectItem key={r.key} value={r.key} className="text-xs">{r.label}</SelectItem>
                          ))
                        )}
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
                          <div className="flex h-10 items-center rounded-lg border border-slate-200/60 bg-slate-100 px-3 text-xs font-semibold text-slate-700 select-none cursor-not-allowed gap-2 shadow-sm">
                            <Landmark className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            Awash Bank
                          </div>
                        </Field>
                        <Field label="Acc #" icon={CreditCard} error={fieldErrors.bankAccount}>
                          <Inp
                            value={form.bankAccount}
                            onChange={e => set('bankAccount')(e.target.value)}
                            placeholder="013XXXXXXXXX"
                            aria-invalid={!!fieldErrors.bankAccount}
                          />
                        </Field>
                      </div>
                      <p className="mt-1.5 text-[9px] text-slate-400 font-medium ml-0.5">
                        Account numbers must start with <span className="font-bold text-blue-600">013</span>
                      </p>
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
                
                {/* Draft saved indicator */}
                {draftSavedAt && (
                  <AnimatePresence>
                    <motion.span
                      key={draftSavedAt.getTime()}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-1 text-[9px] font-bold text-slate-400 select-none"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      Draft saved
                    </motion.span>
                  </AnimatePresence>
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
