/**
 * PublicRegistrationConfigPanel
 * Super admin can select any business and configure its public registration window.
 * Business admins see and configure only their own business.
 */
import { useState, useEffect } from 'react';
import { UserPlus, Clock, ToggleLeft, ToggleRight, Save, ChevronDown } from 'lucide-react';
import { SectionCard, FormField, FormRow, InfoAlert, LoadingSpinner } from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMyPermissions } from '../../hooks/usePermissions';
import { useBusinesses } from '../../hooks/useBusinesses';
import { api } from '../../api/client';

interface RegConfig {
  enabled: boolean;
  openFrom: string;
  openUntil: string;
  autoApprove: boolean;
  askInternPaymentType: boolean;
  windowDays: number;
}

const DEFAULT: RegConfig = { enabled: false, openFrom: '', openUntil: '', autoApprove: false, askInternPaymentType: true, windowDays: 3 };

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
}

function addDays(fromIso: string, days: number): string {
  if (!fromIso) return '';
  const d = new Date(fromIso);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 16);
}

// Convert a datetime-local string (e.g. "2026-06-07T09:30") to a full UTC ISO string
// so the backend new Date(value) comparison is timezone-correct
function localInputToISO(localStr: string): string {
  if (!localStr) return '';
  // datetime-local values look like "2026-06-07T09:30" — treat as local time
  const d = new Date(localStr);
  return isNaN(d.getTime()) ? localStr : d.toISOString();
}

interface PublicRegistrationConfigPanelProps {
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function PublicRegistrationConfigPanel({ showAlert }: PublicRegistrationConfigPanelProps) {
  const { isSuperAdmin } = useMyPermissions();
  const businessesQuery  = useBusinesses();
  const businesses = (businessesQuery.data?.data?.businesses ?? []) as { id: string; name: string; slug: string }[];

  const [selectedBusinessId,   setSelectedBusinessId]   = useState<string>('');
  const [selectedBusinessSlug, setSelectedBusinessSlug] = useState<string>('');
  const [config,   setConfig]   = useState<RegConfig>({ ...DEFAULT });
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  // For non-super-admins, auto-resolve their own business from /me
  useEffect(() => {
    if (!isSuperAdmin) {
      api.get('/api/v1/auth/me').then(r => {
        const b = r.data?.data?.business;
        if (b?.id) { setSelectedBusinessId(b.id); setSelectedBusinessSlug(b.slug); }
      }).catch(() => {});
    }
  }, [isSuperAdmin]);

  // Load settings whenever selected business changes
  useEffect(() => {
    if (!selectedBusinessId) return;
    setLoading(true);
    api.get('/api/v1/settings', { params: { businessId: selectedBusinessId } })
      .then(r => {
        const settings: any[] = r.data?.settings ?? [];
        const get = (key: string) => settings.find((s: any) => s.key === key)?.value;
        const enabled     = get('public_registration_enabled')  === true;
        const openFrom    = get('public_registration_open_from')  as string ?? '';
        const openUntil   = get('public_registration_open_until') as string ?? '';
        const autoApprove = get('auto_approve_registration') === true;
        const askInternPaymentType = get('public_registration_ask_intern_payment_type') !== false;
        let windowDays = 3;
        if (openFrom && openUntil) {
          const diff = (new Date(openUntil).getTime() - new Date(openFrom).getTime()) / 86400_000;
          if (diff > 0) windowDays = Math.round(diff);
        }
        setConfig({ enabled, openFrom, openUntil, autoApprove, askInternPaymentType, windowDays });
      })
      .catch(() => setConfig({ ...DEFAULT }))
      .finally(() => setLoading(false));
  }, [selectedBusinessId]);

  const handleBusinessSelect = (bizId: string) => {
    const biz = businesses.find((b: any) => b.id === bizId);
    setSelectedBusinessId(bizId);
    setSelectedBusinessSlug(biz?.slug ?? '');
    setConfig({ ...DEFAULT });
  };

  const handleFromChange = (val: string) => {
    // val is datetime-local string: "2026-06-07T09:30"
    const fromISO   = localInputToISO(val);
    const untilISO  = addDays(val, config.windowDays);
    setConfig(p => ({ ...p, openFrom: fromISO, openUntil: localInputToISO(untilISO) }));
  };

  const handleWindowDaysChange = (days: number) => {
    const untilISO = addDays(toLocalInput(config.openFrom), days);
    setConfig(p => ({ ...p, windowDays: days, openUntil: localInputToISO(untilISO) }));
  };

  const handleSave = async () => {
    if (!selectedBusinessId) return showAlert('Select a business first.', 'error');
    setSaving(true);
    try {
      const settings = [
        { key: 'public_registration_enabled',   value: config.enabled,          category: 'auth', isPublic: false, businessId: selectedBusinessId },
        { key: 'public_registration_open_from',  value: config.openFrom || null, category: 'auth', isPublic: false, businessId: selectedBusinessId },
        { key: 'public_registration_open_until', value: config.openUntil || null,category: 'auth', isPublic: false, businessId: selectedBusinessId },
        { key: 'auto_approve_registration',      value: config.autoApprove,      category: 'auth', isPublic: false, businessId: selectedBusinessId },
        { key: 'public_registration_ask_intern_payment_type', value: config.askInternPaymentType, category: 'auth', isPublic: false, businessId: selectedBusinessId },
      ];
      for (const s of settings) await api.post('/api/v1/settings', s);
      showAlert('Public registration config saved.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.message ?? 'Failed to save config.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = selectedBusinessSlug
    ? `${window.location.origin}/register/${selectedBusinessSlug}`
    : null;

  return (
    <SectionCard title="Public Self-Registration" icon={<UserPlus className="w-4 h-4" />} accent="blue">
      <div className="space-y-5">

        {/* Business selector (super admin only) */}
        {isSuperAdmin && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Select Business to Configure
            </label>
            {businessesQuery.isLoading ? (
              <LoadingSpinner label="Loading businesses…" />
            ) : businesses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No businesses found. Register a business first.</p>
            ) : (
              <Select value={selectedBusinessId} onValueChange={handleBusinessSelect}>
                <SelectTrigger className="w-full max-w-sm">
                  <SelectValue placeholder="— Choose a business —">
                    {selectedBusinessId
                      ? (businesses.find(b => b.id === selectedBusinessId)?.name ?? selectedBusinessId)
                      : '— Choose a business —'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      <span className="font-semibold">{b.name}</span>
                      <span className="text-slate-400 text-[10px] ml-2">/{b.slug}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {!selectedBusinessId ? (
          <InfoAlert variant="info" message="Select a business above to configure its registration window." />
        ) : loading ? (
          <LoadingSpinner label="Loading config…" />
        ) : (
          <>
            <InfoAlert
              variant="info"
              message="When enabled, employees can self-register at the public URL. The window closes automatically after the set duration."
            />

            {/* Enable toggle */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div>
                <p className="text-xs font-bold text-slate-900">Enable Public Registration</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Allow employees to create accounts via a public link</p>
              </div>
              <button onClick={() => setConfig(p => ({ ...p, enabled: !p.enabled }))} className="cursor-pointer flex-shrink-0">
                {config.enabled ? <ToggleRight className="w-8 h-8 text-blue-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
              </button>
            </div>

            {config.enabled && (
              <>
                {/* Window config */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Registration Window</span>
                    <button
                      onClick={async () => {
                        const now = new Date();
                        const from  = now.toISOString();
                        const until = new Date(now.getTime() + config.windowDays * 86400_000).toISOString();
                        const next  = { ...config, openFrom: from, openUntil: until };
                        setConfig(next);
                        // Auto-save immediately
                        if (!selectedBusinessId) return;
                        setSaving(true);
                        try {
                          for (const s of [
                            { key: 'public_registration_enabled',   value: next.enabled,   category: 'auth', isPublic: false, businessId: selectedBusinessId },
                            { key: 'public_registration_open_from',  value: from,           category: 'auth', isPublic: false, businessId: selectedBusinessId },
                            { key: 'public_registration_open_until', value: until,          category: 'auth', isPublic: false, businessId: selectedBusinessId },
                            { key: 'auto_approve_registration',      value: next.autoApprove, category: 'auth', isPublic: false, businessId: selectedBusinessId },
                            { key: 'public_registration_ask_intern_payment_type', value: next.askInternPaymentType, category: 'auth', isPublic: false, businessId: selectedBusinessId },
                          ]) { await api.post('/api/v1/settings', s); }
                          showAlert('Registration window opened and saved!', 'success');
                        } catch (err: any) {
                          showAlert(err?.response?.data?.message ?? 'Failed to save.', 'error');
                        } finally { setSaving(false); }
                      }}
                      className="text-[9px] text-blue-600 hover:underline font-bold cursor-pointer normal-case"
                    >
                      Open Now &amp; Save
                    </button>
                  </h4>
                  <FormRow cols={3}>
                    <FormField label="Opens On">
                      <Input type="datetime-local" value={toLocalInput(config.openFrom)} onChange={e => handleFromChange(e.target.value)} />
                    </FormField>
                    <FormField label="Duration (days)">
                      <Input type="number" min={1} max={30} value={config.windowDays}
                        onChange={e => handleWindowDaysChange(Number(e.target.value))} />
                    </FormField>
                    <FormField label="Closes On (auto)">
                      <Input type="datetime-local" value={toLocalInput(config.openUntil)} readOnly
                        className="bg-slate-50 cursor-not-allowed opacity-60" />
                    </FormField>
                  </FormRow>

                  {config.openFrom && config.openUntil && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      Open: <b className="text-slate-800">{new Date(config.openFrom).toLocaleString()}</b>
                      &nbsp;→&nbsp;
                      <b className="text-slate-800">{new Date(config.openUntil).toLocaleString()}</b>
                      &nbsp;({config.windowDays}d)
                    </div>
                  )}
                </div>

                {/* Auto-approve */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Auto-Approve Registrations</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      If off, HR must approve before new accounts can log in
                    </p>
                  </div>
                  <button onClick={() => setConfig(p => ({ ...p, autoApprove: !p.autoApprove }))} className="cursor-pointer flex-shrink-0">
                    {config.autoApprove ? <ToggleRight className="w-8 h-8 text-blue-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                  </button>
                </div>

                {/* Intern payment prompt */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Ask Payment Type for Interns</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      If on, interns choose paid or unpaid; paid interns must enter an Awash account
                    </p>
                  </div>
                  <button onClick={() => setConfig(p => ({ ...p, askInternPaymentType: !p.askInternPaymentType }))} className="cursor-pointer flex-shrink-0">
                    {config.askInternPaymentType ? <ToggleRight className="w-8 h-8 text-blue-600" /> : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                  </button>
                </div>

                {/* Public URL */}
                {publicUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Share this link with employees</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg flex-1 truncate">
                        {publicUrl}
                      </code>
                      <Button variant="outline" size="sm" onClick={() => {
                        navigator.clipboard.writeText(publicUrl);
                        showAlert('URL copied!', 'info');
                      }}>Copy</Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Config'}
              </Button>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );
}
