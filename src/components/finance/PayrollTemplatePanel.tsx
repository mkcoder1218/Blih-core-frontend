/**
 * PayrollTemplatePanel — Finance creates/edits payroll calculation templates.
 * All percentage and flat-amount fields are optional.
 */
import { useState } from 'react';
import {
  Plus, Pencil, Trash2, X, Percent, DollarSign,
  ChevronDown, ChevronUp, Sparkles, Calculator, AlertCircle,
  Users,
} from 'lucide-react';
import {
  usePayrollTemplates,
  usePayrollDashboard,
  useBulkLinkEmployees,
  useCreatePayrollTemplate,
  useUpdatePayrollTemplate,
  useDeletePayrollTemplate,
  usePreviewPayroll,
  type PayrollTemplate,
  type PendingEmployee,
} from '../../hooks/useWorkforceFinance';

// ── Currencies ─────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'ETB', label: 'ETB – Ethiopian Birr' },
  { code: 'USD', label: 'USD – US Dollar' },
  { code: 'EUR', label: 'EUR – Euro' },
  { code: 'GBP', label: 'GBP – British Pound' },
  { code: 'NGN', label: 'NGN – Nigerian Naira' },
  { code: 'KES', label: 'KES – Kenyan Shilling' },
  { code: 'GHS', label: 'GHS – Ghanaian Cedi' },
  { code: 'ZAR', label: 'ZAR – South African Rand' },
];

// ── Error extraction ───────────────────────────────────────────────────────────
function extractError(e: any, fallback: string): string {
  if (!e) return fallback;
  // axios error shape
  const msg =
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.response?.data?.errors?.[0]?.message ||
    e?.message ||
    fallback;
  return typeof msg === 'string' ? msg : fallback;
}

// ── Form types ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '',
  description: '',
  housingAllowancePct:   '',
  transportAllowancePct: '',
  mealAllowancePct:      '',
  otherAllowancePct:     '',
  taxPct:              '',
  pensionPct:          '',
  healthPct:           '',
  loanRepaymentFlat:   '',
  otherDeductionFlat:  '',
  isDefault: false,
  currency: 'ETB',
};

type FormState = typeof EMPTY_FORM;

// ── Field helpers ──────────────────────────────────────────────────────────────
function PctField({ label, field, form, set }: {
  label: string; field: keyof FormState;
  form: FormState; set: (f: FormState) => void;
}) {
  const val = form[field] as string;
  const outOfRange = val !== '' && (Number(val) < 0 || Number(val) > 100);
  return (
    <div>
      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
        {label} <span className="text-slate-300">(optional)</span>
      </label>
      <div className="relative">
        <input
          type="number" min="0" max="100" step="0.1"
          placeholder="—"
          value={val}
          onChange={e => set({ ...form, [field]: e.currentTarget.value })}
          className={`w-full bg-slate-50 border rounded-xl py-2 pl-3 pr-8 text-xs font-bold focus:outline-none focus:bg-white transition-colors ${
            outOfRange ? 'border-rose-300 focus:border-rose-400' : 'border-slate-100 focus:border-blue-500'
          }`}
        />
        <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-300 pointer-events-none" />
      </div>
      {outOfRange && <p className="text-[9px] text-rose-500 font-bold mt-0.5">Must be 0 – 100</p>}
    </div>
  );
}

function FlatField({ label, field, form, set }: {
  label: string; field: keyof FormState;
  form: FormState; set: (f: FormState) => void;
}) {
  const val = form[field] as string;
  const negative = val !== '' && Number(val) < 0;
  return (
    <div>
      <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
        {label} <span className="text-slate-300">(optional)</span>
      </label>
      <div className="relative">
        <input
          type="number" min="0" step="0.01"
          placeholder="—"
          value={val}
          onChange={e => set({ ...form, [field]: e.currentTarget.value })}
          className={`w-full bg-slate-50 border rounded-xl py-2 pl-14 pr-3 text-xs font-bold focus:outline-none focus:bg-white transition-colors ${
            negative ? 'border-rose-300 focus:border-rose-400' : 'border-slate-100 focus:border-blue-500'
          }`}
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400 pointer-events-none bg-slate-100 px-1.5 py-0.5 rounded">
          {form.currency}
        </span>
      </div>
      {negative && <p className="text-[9px] text-rose-500 font-bold mt-0.5">Must be ≥ 0</p>}
    </div>
  );
}

// ── Payload helpers ────────────────────────────────────────────────────────────
function formToPayload(form: FormState) {
  const n = (v: string) => v !== '' ? Number(v) : null;
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    housingAllowancePct:   n(form.housingAllowancePct),
    transportAllowancePct: n(form.transportAllowancePct),
    mealAllowancePct:      n(form.mealAllowancePct),
    otherAllowancePct:     n(form.otherAllowancePct),
    taxPct:              n(form.taxPct),
    pensionPct:          n(form.pensionPct),
    healthPct:           n(form.healthPct),
    loanRepaymentFlat:   n(form.loanRepaymentFlat),
    otherDeductionFlat:  n(form.otherDeductionFlat),
    isDefault: form.isDefault,
    currency: form.currency,
  };
}

function tplToForm(t: PayrollTemplate): FormState {
  const s = (v: number | null | undefined) => v != null ? String(v) : '';
  return {
    name: t.name,
    description: t.description ?? '',
    housingAllowancePct:   s(t.housingAllowancePct),
    transportAllowancePct: s(t.transportAllowancePct),
    mealAllowancePct:      s(t.mealAllowancePct),
    otherAllowancePct:     s(t.otherAllowancePct),
    taxPct:     s(t.taxPct),
    pensionPct: s(t.pensionPct),
    healthPct:  s(t.healthPct),
    loanRepaymentFlat:  s(t.loanRepaymentFlat),
    otherDeductionFlat: s(t.otherDeductionFlat),
    isDefault: t.isDefault,
    currency: t.currency,
  };
}

// ── Inline validation ──────────────────────────────────────────────────────────
function validateForm(form: FormState): string | null {
  if (!form.name.trim()) return 'Template name is required.';
  const pctFields: (keyof FormState)[] = [
    'housingAllowancePct', 'transportAllowancePct', 'mealAllowancePct',
    'otherAllowancePct', 'taxPct', 'pensionPct', 'healthPct',
  ];
  for (const f of pctFields) {
    const v = form[f] as string;
    if (v !== '' && (Number(v) < 0 || Number(v) > 100))
      return `Percentage fields must be between 0 and 100. Check "${f.replace(/Pct$/, '').replace(/([A-Z])/g, ' $1').trim()}".`;
  }
  const flatFields: (keyof FormState)[] = ['loanRepaymentFlat', 'otherDeductionFlat'];
  for (const f of flatFields) {
    const v = form[f] as string;
    if (v !== '' && Number(v) < 0)
      return 'Flat deduction amounts must be 0 or greater.';
  }
  return null;
}

// ── Inline error banner ────────────────────────────────────────────────────────
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 font-semibold">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="text-rose-400 hover:text-rose-700 cursor-pointer flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface Props {
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function BulkAssignModal({
  template,
  employees,
  onClose,
  onAssign,
  isLoading,
}: {
  template: PayrollTemplate;
  employees: PendingEmployee[];
  onClose: () => void;
  onAssign: (employeeUserIds: string[]) => void;
  isLoading: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(employees.map((employee) => employee.userId));
  const selectedSet = new Set(selectedIds);
  const allSelected = employees.length > 0 && selectedIds.length === employees.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : employees.map((employee) => employee.userId));
  }

  function toggleEmployee(userId: string) {
    setSelectedIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <div className="w-full h-screen bg-white grid grid-rows-[auto_1fr_auto] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-900">Bulk Assign Template</h4>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              {template.name} - {employees.length} employees need payroll setup
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto bg-slate-50/50 px-6 py-5">
          <div className="max-w-6xl mx-auto">
          {employees.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-500">No employees need payroll setup.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th colSpan={5} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-blue-600" />
                          <span className="text-xs font-bold text-slate-800">Select all</span>
                        </label>
                        <span className="text-xs font-bold text-blue-600">{selectedIds.length} selected</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-12 px-4 py-3" />
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Employee</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Role</th>
                    <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Base Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.userId}
                      onClick={() => toggleEmployee(employee.userId)}
                      className={`border-b border-slate-100 last:border-b-0 cursor-pointer ${
                        selectedSet.has(employee.userId) ? 'bg-blue-50/40' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(employee.userId)}
                          onChange={() => toggleEmployee(employee.userId)}
                          onClick={(event) => event.stopPropagation()}
                          className="accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-900">{employee.name}</div>
                        <div className="text-[10px] font-semibold text-slate-400">{employee.email || employee.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{employee.role}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{employee.department}</td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                        {employee.baseSalary > 0 ? `${template.currency} ${employee.baseSalary.toLocaleString()}` : 'No base set'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onAssign(selectedIds)}
            disabled={isLoading || selectedIds.length === 0}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs cursor-pointer transition-colors"
          >
            {isLoading ? 'Assigning...' : `Assign ${selectedIds.length} Employees`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollTemplatePanel({ showAlert }: Props) {
  const { data: templates = [], isLoading, isError } = usePayrollTemplates();
  const { data: payrollData } = usePayrollDashboard();
  const createTpl   = useCreatePayrollTemplate();
  const updateTpl   = useUpdatePayrollTemplate();
  const deleteTpl   = useDeletePayrollTemplate();
  const previewCalc = usePreviewPayroll();
  const bulkLinkEmployees = useBulkLinkEmployees();

  const [showForm, setShowForm]         = useState(false);
  const [editId, setEditId]             = useState<string | null>(null);
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [previewing, setPreviewing]     = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const [previewBase, setPreviewBase]   = useState('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [bulkTemplate, setBulkTemplate] = useState<PayrollTemplate | null>(null);
  const pendingEmployees = payrollData?.pending ?? [];

  // Format money respecting the template's currency
  const formatMoney = (v = 0, currency = form.currency) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency,
        maximumFractionDigits: 0,
      }).format(v);
    } catch {
      return `${currency} ${v.toLocaleString()}`;
    }
  };

  const pct = (v: number | null | undefined) => v != null ? `${v}%` : '—';

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError(null);
    setPreviewResult(null);
    setPreviewBase('');
    setPreviewError(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(tpl: PayrollTemplate) {
    setForm(tplToForm(tpl));
    setEditId(tpl.id);
    setFormError(null);
    setPreviewResult(null);
    setPreviewBase('');
    setPreviewError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  // ── Preview ──────────────────────────────────────────────────────────────────
  async function handlePreview() {
    if (!previewBase || previewing) return;
    setPreviewError(null);
    setPreviewResult(null);
    setPreviewing(true);
    try {
      const res = await previewCalc.mutateAsync({
        baseSalary: Number(previewBase),
        ...formToPayload(form),
      });
      const result = res.data?.data ?? null;
      if (!result) throw new Error('No calculation result returned.');
      setPreviewResult(result);
    } catch (e: any) {
      setPreviewError(extractError(e, 'Calculation preview failed. Check your values.'));
    } finally {
      setPreviewing(false);
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setFormError(null);
    const validationError = validateForm(form);
    if (validationError) { setFormError(validationError); return; }
    if (saving) return;
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editId) {
        await updateTpl.mutateAsync({ id: editId, data: payload });
        showAlert('Template updated successfully', 'success');
      } else {
        await createTpl.mutateAsync(payload);
        showAlert('Payroll template created', 'success');
      }
      closeForm();
    } catch (e: any) {
      setFormError(extractError(e, 'Failed to save template. Please try again.'));
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(id: string, name: string) {
    if (deleting) return;
    setDeleting(id);
    try {
      await deleteTpl.mutateAsync(id);
      showAlert(`"${name}" deleted`, 'success');
    } catch (e: any) {
      showAlert(extractError(e, `Failed to delete "${name}". It may still have linked employees.`), 'error');
    } finally {
      setDeleting(null);
    }
  }

  async function handleBulkAssign(employeeUserIds: string[]) {
    if (!bulkTemplate) return;
    try {
      await bulkLinkEmployees.mutateAsync({ templateId: bulkTemplate.id, employeeUserIds });
      showAlert(`${employeeUserIds.length} employees assigned to "${bulkTemplate.name}"`, 'success');
      setBulkTemplate(null);
    } catch (e: any) {
      showAlert(extractError(e, 'Bulk assignment failed. Please try again.'), 'error');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* Page header */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Payroll Templates</h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
            Define reusable calculation formulas. All allowance and deduction fields are optional.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs select-none"
        >
          <Plus className="w-3.5 h-3.5" />
          New Template
        </button>
      </div>

      {/* List error */}
      {isError && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Failed to load templates. Check your connection and try refreshing.
        </div>
      )}

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-blue-500/20 p-6 space-y-5 shadow-xs">

          {/* Form header */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              {editId ? 'Edit Template' : 'New Payroll Template'}
            </h4>
            <button
              onClick={closeForm}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Inline error */}
          {formError && (
            <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />
          )}

          {/* Name + description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Template Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.currentTarget.value }); setFormError(null); }}
                placeholder="e.g. Standard Employee"
                className={`w-full bg-slate-50 border rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:bg-white transition-colors ${
                  formError && !form.name.trim() ? 'border-rose-300' : 'border-slate-100 focus:border-blue-500'
                }`}
              />
            </div>
            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.currentTarget.value })}
                placeholder="Brief description..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Allowances */}
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Allowances
              <span className="text-slate-300 font-semibold normal-case text-[10px]">— added to base salary</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <PctField label="Housing"        field="housingAllowancePct"   form={form} set={setForm} />
              <PctField label="Transport"      field="transportAllowancePct" form={form} set={setForm} />
              <PctField label="Meal"           field="mealAllowancePct"      form={form} set={setForm} />
              <PctField label="Other Allowance" field="otherAllowancePct"   form={form} set={setForm} />
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-3">
            <p className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Deductions
              <span className="text-slate-300 font-semibold normal-case text-[10px]">— subtracted from gross pay</span>
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <PctField label="Tax"              field="taxPct"     form={form} set={setForm} />
              <PctField label="Pension / NHIF"   field="pensionPct" form={form} set={setForm} />
              <PctField label="Health Insurance" field="healthPct"  form={form} set={setForm} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FlatField label="Loan Repayment (flat)"  field="loanRepaymentFlat"  form={form} set={setForm} />
              <FlatField label="Other Deduction (flat)" field="otherDeductionFlat" form={form} set={setForm} />
            </div>
          </div>

          {/* Options row */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 select-none">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={e => setForm({ ...form, isDefault: e.currentTarget.checked })}
                className="rounded accent-blue-600"
              />
              Set as default template
            </label>
            <div className="flex items-center gap-2">
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Currency</label>
              <select
                value={form.currency}
                onChange={e => { setForm({ ...form, currency: e.currentTarget.value }); setPreviewResult(null); }}
                className="bg-slate-50 border border-slate-100 rounded-lg py-1.5 px-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-100 p-4 space-y-3">
            <p className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-blue-500" />
              Preview Calculation
              <span className="text-slate-300 font-semibold normal-case text-[10px]">— test this template before saving</span>
            </p>
            <div className="flex items-center gap-3">
              <div className="relative w-48">
                <input
                  type="number" min="0"
                  placeholder="Enter base salary..."
                  value={previewBase}
                  onChange={e => {
                    setPreviewBase(e.currentTarget.value);
                    setPreviewResult(null);
                    setPreviewError(null);
                  }}
                  onKeyDown={e => e.key === 'Enter' && handlePreview()}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handlePreview}
                disabled={!previewBase || previewing}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors select-none"
              >
                <Sparkles className="w-3 h-3" />
                {previewing ? 'Calculating...' : 'Calculate'}
              </button>
            </div>

            {previewError && (
              <div className="flex items-center gap-2 text-[11px] text-rose-600 font-semibold bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {previewError}
              </div>
            )}

            {previewResult && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Base Salary',  value: previewResult.baseSalary,      cls: 'text-slate-800' },
                    { label: 'Gross Pay',    value: previewResult.grossPay,         cls: 'text-emerald-700' },
                    { label: 'Total Deductions', value: previewResult.totalDeductions, cls: 'text-rose-600' },
                    { label: 'Net Pay',      value: previewResult.netPay,           cls: 'text-blue-700 text-sm font-black' },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
                      <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">{label}</span>
                      <span className={`block text-xs font-extrabold mt-1 ${cls}`}>
                        {formatMoney(value, form.currency)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Allowance breakdown */}
                {(previewResult.housingAllowance + previewResult.transportAllowance +
                  previewResult.mealAllowance + previewResult.otherAllowance) > 0 && (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'Housing',   v: previewResult.housingAllowance },
                      { label: 'Transport', v: previewResult.transportAllowance },
                      { label: 'Meal',      v: previewResult.mealAllowance },
                      { label: 'Other',     v: previewResult.otherAllowance },
                    ].filter(a => a.v > 0).map(({ label, v }) => (
                      <div key={label} className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-100">
                        <span className="block text-[8px] text-emerald-600 font-extrabold uppercase tracking-wider">{label}</span>
                        <span className="block text-[11px] font-extrabold text-emerald-800">+{formatMoney(v, form.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Deduction breakdown */}
                {previewResult.totalDeductions > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { label: 'Tax',     v: previewResult.taxDeduction },
                      { label: 'Pension', v: previewResult.pensionDeduction },
                      { label: 'Health',  v: previewResult.healthDeduction },
                      { label: 'Loan',    v: previewResult.loanDeduction },
                      { label: 'Other',   v: previewResult.otherDeduction },
                    ].filter(d => d.v > 0).map(({ label, v }) => (
                      <div key={label} className="bg-rose-50 rounded-lg p-2 text-center border border-rose-100">
                        <span className="block text-[8px] text-rose-600 font-extrabold uppercase tracking-wider">{label}</span>
                        <span className="block text-[11px] font-extrabold text-rose-800">-{formatMoney(v, form.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit row */}
          <div className="flex justify-end gap-2 pt-1 border-t border-slate-50">
            <button
              onClick={closeForm}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer transition-colors select-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs cursor-pointer transition-colors shadow-xs select-none min-w-[120px] text-center"
            >
              {saving
                ? (editId ? 'Updating...' : 'Creating...')
                : (editId ? 'Save Changes' : 'Create Template')
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Templates list ── */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="inline-block w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2" />
          <p className="text-xs font-bold text-slate-400">Loading templates...</p>
        </div>
      ) : templates.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <DollarSign className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="text-xs font-bold text-slate-400">No payroll templates yet</p>
          <p className="text-[11px] text-slate-300 max-w-xs mx-auto">
            Create your first template to start linking employees and calculating their payroll.
          </p>
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors select-none mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Create First Template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(templates as PayrollTemplate[]).map((tpl) => {
            const isExpanded  = expandedId === tpl.id;
            const isDeleting  = deleting === tpl.id;
            const hasAllowances = [
              tpl.housingAllowancePct, tpl.transportAllowancePct,
              tpl.mealAllowancePct, tpl.otherAllowancePct,
            ].some(v => v != null);
            const hasDeductions = [
              tpl.taxPct, tpl.pensionPct, tpl.healthPct,
              tpl.loanRepaymentFlat, tpl.otherDeductionFlat,
            ].some(v => v != null);

            const formatTplMoney = (v = 0) => {
              try {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency', currency: tpl.currency, maximumFractionDigits: 0,
                }).format(v);
              } catch {
                return `${tpl.currency} ${v}`;
              }
            };

            return (
              <div
                key={tpl.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${
                  isDeleting ? 'opacity-50 pointer-events-none' : 'border-slate-100 hover:shadow-xs'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                      {tpl.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-xs font-extrabold text-slate-900 truncate">{tpl.name}</h5>
                        {tpl.isDefault && (
                          <span className="text-[9px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded-full flex-shrink-0">Default</span>
                        )}
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0">{tpl.currency}</span>
                      </div>
                      {tpl.description && (
                        <p className="text-[10.5px] text-slate-400 font-medium mt-0.5 truncate">{tpl.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                    <div className="hidden sm:flex items-center gap-1.5 mr-1">
                      {hasAllowances && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Allowances</span>
                      )}
                      {hasDeductions && (
                        <span className="text-[9px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full">Deductions</span>
                      )}
                      {!hasAllowances && !hasDeductions && (
                        <span className="text-[9px] bg-slate-50 text-slate-400 font-bold px-2 py-0.5 rounded-full">Empty</span>
                      )}
                    </div>
                    <button
                      onClick={() => setBulkTemplate(tpl)}
                      className="px-2.5 py-1.5 text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                      title="Bulk assign this template"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Bulk assign
                    </button>
                    <button
                      onClick={() => openEdit(tpl)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit template"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id, tpl.name)}
                      disabled={!!deleting}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : tpl.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-50 px-5 pb-5 pt-4 space-y-4">
                    {hasAllowances && (
                      <div>
                        <p className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider mb-2">
                          Allowances (% of base)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: 'Housing',   val: tpl.housingAllowancePct },
                            { label: 'Transport', val: tpl.transportAllowancePct },
                            { label: 'Meal',      val: tpl.mealAllowancePct },
                            { label: 'Other',     val: tpl.otherAllowancePct },
                          ].filter(a => a.val != null).map(({ label, val }) => (
                            <div key={label} className="bg-emerald-50/60 rounded-xl p-3 text-center border border-emerald-50">
                              <span className="block text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider">{label}</span>
                              <span className="block text-xs font-black text-emerald-800 mt-0.5">{pct(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasDeductions && (
                      <div>
                        <p className="text-[9px] font-extrabold text-rose-600 uppercase tracking-wider mb-2">Deductions</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {[
                            { label: 'Tax',     val: tpl.taxPct,            isFlat: false },
                            { label: 'Pension', val: tpl.pensionPct,        isFlat: false },
                            { label: 'Health',  val: tpl.healthPct,         isFlat: false },
                            { label: 'Loan',    val: tpl.loanRepaymentFlat,  isFlat: true },
                            { label: 'Other',   val: tpl.otherDeductionFlat, isFlat: true },
                          ].filter(d => d.val != null).map(({ label, val, isFlat }) => (
                            <div key={label} className="bg-rose-50/60 rounded-xl p-3 text-center border border-rose-50">
                              <span className="block text-[9px] text-rose-600 font-extrabold uppercase tracking-wider">{label}</span>
                              <span className="block text-xs font-black text-rose-800 mt-0.5">
                                {isFlat ? formatTplMoney(val!) : `${val}%`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!hasAllowances && !hasDeductions && (
                      <div className="text-center py-3">
                        <p className="text-[11px] text-slate-400 font-semibold">
                          No components configured yet.
                        </p>
                        <button
                          onClick={() => openEdit(tpl)}
                          className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer mt-1"
                        >
                          Click to edit and add allowances or deductions →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {bulkTemplate && (
        <BulkAssignModal
          template={bulkTemplate}
          employees={pendingEmployees}
          onClose={() => setBulkTemplate(null)}
          onAssign={handleBulkAssign}
          isLoading={bulkLinkEmployees.isPending}
        />
      )}
    </div>
  );
}
