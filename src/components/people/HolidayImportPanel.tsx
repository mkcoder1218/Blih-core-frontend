/**
 * HolidayImportPanel
 * Allows HR / Admin to configure the Calendarific API key + country,
 * then run a worker that fetches public holidays and saves them as HREvent records.
 */
import { useState, useEffect } from 'react';
import { Globe, Key, Download, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { SectionCard, FormField, FormRow, InfoAlert, LoadingSpinner } from '@/components/ui/blih';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '../../api/client';

// ── Country list (subset — most common + full list supported by Calendarific) ──
const COUNTRIES = [
  { code: 'ET', name: 'Ethiopia' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'GH', name: 'Ghana' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SN', name: 'Senegal' },
  { code: 'IN', name: 'India' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

interface ImportResult {
  country: string;
  year: number;
  total: number;
  created: number;
  skipped: number;
}

interface HolidayImportPanelProps {
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function HolidayImportPanel({ showAlert }: HolidayImportPanelProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [apiKey,     setApiKey]     = useState('');
  const [country,    setCountry]    = useState('ET');
  const [year,       setYear]       = useState(String(CURRENT_YEAR));
  const [hasApiKey,  setHasApiKey]  = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [result,     setResult]     = useState<ImportResult | null>(null);

  // Load stored config on mount
  useEffect(() => {
    api.get('/api/v1/people/events/holiday-config')
      .then(res => {
        const d = res.data?.data ?? res.data ?? {};
        setCountry(d.country || 'ET');
        setHasApiKey(Boolean(d.hasApiKey));
      })
      .catch(() => {});
  }, []);

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) return showAlert('API key is required.', 'error');
    setSaving(true);
    try {
      await api.post('/api/v1/people/events/holiday-config', { apiKey: apiKey.trim(), country });
      setHasApiKey(true);
      setConfigOpen(false);
      setApiKey('');
      showAlert('Calendarific config saved.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error ?? 'Failed to save config.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async () => {
    if (!hasApiKey) {
      setConfigOpen(true);
      return showAlert('Configure your API key first.', 'info');
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/api/v1/people/events/import-holidays', { country, year: Number(year) });
      const d: ImportResult = res.data?.data ?? res.data;
      setResult(d);
      showAlert(res.data?.message ?? `Imported ${d.created} holidays.`, 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error ?? 'Import failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionCard
      title="Import Public Holidays"
      icon={<Globe className="w-4 h-4" />}
      accent="blue"
      action={
        <button onClick={() => setConfigOpen(v => !v)}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
          <Settings className="w-3.5 h-3.5" />
          {hasApiKey ? 'Update API Key' : 'Setup API Key'}
        </button>
      }
    >
      <div className="space-y-4">
        {/* API key config panel */}
        {configOpen && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Key className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Calendarific API Configuration</span>
            </div>
            <InfoAlert
              variant="info"
              message="Get your free API key at calendarific.com. The key is stored securely in your business settings and never exposed to the frontend."
            />
            <FormRow cols={2}>
              <FormField label="API Key" required>
                <Input
                  type="password"
                  placeholder="Paste your Calendarific API key…"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
              </FormField>
              <FormField label="Default Country">
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </FormRow>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfigOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={!apiKey.trim() || saving} onClick={handleSaveConfig}>
                {saving ? 'Saving…' : 'Save Config'}
              </Button>
            </div>
          </div>
        )}

        {/* Import controls */}
        <div className="flex flex-wrap items-end gap-4">
          <FormField label="Country" className="min-w-[180px]">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Year" className="min-w-[120px]">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {YEARS.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="pb-0.5">
            <Button
              onClick={handleImport}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <><span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" /> Importing…</>
              ) : (
                <><Download className="w-3.5 h-3.5" /> Run Import</>
              )}
            </Button>
          </div>
        </div>

        {!hasApiKey && !configOpen && (
          <InfoAlert
            variant="warning"
            message="No API key configured yet. Click 'Setup API Key' above to connect Calendarific."
          />
        )}

        {/* Import result */}
        {result && (
          <div className={`rounded-xl border p-4 space-y-2 ${result.created > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              {result.created > 0
                ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : <AlertTriangle className="w-4 h-4 text-amber-600" />}
              <span className="text-xs font-bold text-slate-800">
                Import complete — {COUNTRIES.find(c => c.code === result.country)?.name ?? result.country} {result.year}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="bg-white rounded-lg p-2 border border-slate-100">
                <p className="text-lg font-black text-slate-900">{result.total}</p>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Fetched</span>
              </div>
              <div className="bg-white rounded-lg p-2 border border-emerald-100">
                <p className="text-lg font-black text-emerald-600">{result.created}</p>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Created</span>
              </div>
              <div className="bg-white rounded-lg p-2 border border-slate-100">
                <p className="text-lg font-black text-slate-500">{result.skipped}</p>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Already Existed</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
