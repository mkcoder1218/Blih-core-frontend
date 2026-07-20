/**
 * PayrollLinkPanel — Payroll sub-tab (inside Salary & Payroll).
 *
 * Shows:
 *   1. Summary stat cards
 *   2. Pending employees — newly added, no payroll assignment yet
 *   3. Linked employees — matched to a template, full breakdown shown
 *
 * Finance selects a pending employee → picks a template → optionally overrides
 * base salary → system calculates and links them.
 */
import { useState } from 'react';
import { UserPlus, Link2, DollarSign, X, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import {
  usePayrollDashboard,
  usePayrollTemplates,
  useLinkEmployee,
  useUnlinkEmployee,
  type PendingEmployee,
  type LinkedEmployee,
  type PayrollTemplate,
} from '../../hooks/useWorkforceFinance';
import { StatCard, StatCardGrid, UserAvatar, EmptyState, InfoAlert } from '@/components/ui/blih';

interface Props {
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

function avatar(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── Link modal ────────────────────────────────────────────────────────────────
function LinkModal({
  employee,
  templates,
  onClose,
  onLink,
  isLoading,
}: {
  employee: PendingEmployee;
  templates: PayrollTemplate[];
  onClose: () => void;
  onLink: (templateId: string, base?: number) => void;
  isLoading: boolean;
}) {
  const [templateId, setTemplateId] = useState(templates.find(t => t.isDefault)?.id ?? templates[0]?.id ?? '');
  const [baseOverride, setBaseOverride] = useState(employee.baseSalary > 0 ? String(employee.baseSalary) : '');

  const selectedTemplate = templates.find(t => t.id === templateId);

  const formatMoney = (v = 0) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedTemplate?.currency || 'USD', maximumFractionDigits: 0 }).format(v);

  // Live preview
  function preview() {
    if (!selectedTemplate || !baseOverride) return null;
    const base = Number(baseOverride);
    const m = (v: any) => Number(v ?? 0);
    const pct = (b: number, r: any) => r != null ? b * (m(r) / 100) : 0;
    const housing   = pct(base, selectedTemplate.housingAllowancePct);
    const transport = pct(base, selectedTemplate.transportAllowancePct);
    const meal      = pct(base, selectedTemplate.mealAllowancePct);
    const other     = pct(base, selectedTemplate.otherAllowancePct);
    const gross     = base + housing + transport + meal + other;
    const tax       = pct(gross, selectedTemplate.taxPct);
    const pension   = pct(gross, selectedTemplate.pensionPct);
    const health    = pct(gross, selectedTemplate.healthPct);
    const loan      = m(selectedTemplate.loanRepaymentFlat);
    const otherD    = m(selectedTemplate.otherDeductionFlat);
    const totalDed  = tax + pension + health + loan + otherD;
    const net       = Math.max(gross - totalDed, 0);
    return { gross, totalDed, net };
  }

  const prev = preview();

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <div className="w-full h-full bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <div>
          <h4 className="text-sm font-black text-slate-900">Link to Payroll Template</h4>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{employee.name} · {employee.department}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        </div>

        <div className="p-6 lg:p-8 space-y-5 max-w-2xl mx-auto">

        {/* Template selector */}
        <div>
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Select Template</label>
          {templates.length === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              No templates yet. Create one in the Pay Templates tab first.
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {templates.map(t => (
                <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${templateId === t.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                  <input
                    type="radio"
                    name="template"
                    value={t.id}
                    checked={templateId === t.id}
                    onChange={() => setTemplateId(t.id)}
                    className="accent-blue-600"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-slate-800">{t.name}</span>
                    {t.isDefault && <span className="ml-2 text-[9px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">Default</span>}
                    {t.description && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.description}</p>}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Base salary */}
        <div>
          <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
            Base Salary <span className="text-slate-300 normal-case font-semibold">(leave blank to use employee record value)</span>
          </label>
          <input
            type="number" min="0"
            value={baseOverride}
            onChange={e => setBaseOverride(e.currentTarget.value)}
            placeholder={employee.baseSalary > 0 ? `Current: ${employee.baseSalary}` : 'Enter base salary...'}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Live preview */}
        {prev && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Gross</span>
              <span className="block text-xs font-extrabold text-slate-800 mt-0.5">{formatMoney(prev.gross)}</span>
            </div>
            <div className="bg-rose-50/60 rounded-xl p-3 text-center border border-rose-50">
              <span className="block text-[9px] text-rose-500 uppercase font-bold tracking-wider">Deductions</span>
              <span className="block text-xs font-extrabold text-rose-700 mt-0.5">{formatMoney(prev.totalDed)}</span>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
              <span className="block text-[9px] text-blue-500 uppercase font-bold tracking-wider">Net Pay</span>
              <span className="block text-xs font-extrabold text-blue-700 mt-0.5">{formatMoney(prev.net)}</span>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 bg-white flex gap-2 pt-4 pb-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onLink(templateId, baseOverride ? Number(baseOverride) : undefined)}
            disabled={isLoading || !templateId}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs cursor-pointer transition-colors"
          >
            {isLoading ? 'Linking...' : 'Link Employee'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export default function PayrollLinkPanel({ showAlert }: Props) {
  const { data, isLoading } = usePayrollDashboard();
  const { data: templates = [] } = usePayrollTemplates();
  const linkEmployee   = useLinkEmployee();
  const unlinkEmployee = useUnlinkEmployee();

  const [linkTarget, setLinkTarget] = useState<PendingEmployee | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const summary   = data?.summary;
  const pending   = data?.pending  ?? [];
  const linked    = data?.linked   ?? [];

  const formatMoney = (v = 0, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(v);

  async function handleLink(templateId: string, baseSalaryOverride?: number) {
    if (!linkTarget) return;
    try {
      await linkEmployee.mutateAsync({ employeeUserId: linkTarget.userId, templateId, baseSalaryOverride });
      showAlert(`${linkTarget.name} linked to payroll successfully`, 'success');
      setLinkTarget(null);
    } catch (e: any) {
      showAlert(e?.response?.data?.error || 'Link failed', 'error');
    }
  }

  async function handleUnlink(emp: LinkedEmployee) {
    try {
      await unlinkEmployee.mutateAsync(emp.employeeUserId);
      showAlert(`${emp.name} moved back to pending`, 'info');
    } catch (e: any) {
      showAlert(e?.response?.data?.error || 'Unlink failed', 'error');
    }
  }

  if (isLoading) {
    return <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-xs font-bold text-slate-400">Loading payroll data...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Stat cards */}
      <StatCardGrid cols={4}>
        <StatCard label="Total Employees" value={summary?.totalEmployees ?? 0}            icon={<UserPlus className="w-4 h-4" />}      tone="slate" />
        <StatCard label="Pending Setup"   value={summary?.pendingCount ?? 0}              icon={<AlertTriangle className="w-4 h-4" />} tone="amber" />
        <StatCard label="Linked"          value={summary?.linkedCount ?? 0}               icon={<Link2 className="w-4 h-4" />}         tone="emerald" />
        <StatCard label="Total Net Payroll" value={formatMoney(summary?.totalNetPayroll)} icon={<DollarSign className="w-4 h-4" />}   tone="blue" />
      </StatCardGrid>

      {/* ── Pending employees ── */}
      <div className="bg-white rounded-2xl border border-amber-500/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Pending Payroll Setup
              <span className="ml-2 bg-amber-50 text-amber-600 font-extrabold text-[9px] px-2 py-0.5 rounded-full">{pending.length}</span>
            </h4>
          </div>
          {pending.length > 0 && (
            <p className="text-[10px] text-slate-400 font-semibold">Click a row to assign a template</p>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-slate-400 font-semibold border border-dashed border-slate-200 rounded-xl">
            All employees are linked to a payroll template.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((emp) => (
              <div
                key={emp.userId}
                onClick={() => setLinkTarget(emp)}
                className="flex items-center justify-between bg-slate-50/70 hover:bg-amber-50/40 border border-slate-100 hover:border-amber-200 rounded-xl p-3.5 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={emp.name} size="sm" color="amber" />
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900">{emp.name}</h5>
                    <span className="text-[10px] text-slate-400 font-semibold">{emp.role} · {emp.department}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {emp.baseSalary > 0 && (
                    <span className="text-[10px] font-bold text-slate-500 hidden sm:block">
                      Base: {formatMoney(emp.baseSalary)}
                    </span>
                  )}
                  <span className="text-[9px] bg-amber-50 text-amber-600 font-extrabold px-2.5 py-1 rounded-lg group-hover:bg-amber-100 transition-colors">
                    Assign Template →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Linked employees ── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Linked Employees
            <span className="ml-2 bg-emerald-50 text-emerald-600 font-extrabold text-[9px] px-2 py-0.5 rounded-full">{linked.length}</span>
          </h4>
        </div>

        {linked.length === 0 ? (
          <div className="py-6 text-center text-[11px] text-slate-400 font-semibold border border-dashed border-slate-200 rounded-xl">
            No employees linked yet. Assign a template to pending employees above.
          </div>
        ) : (
          <div className="space-y-2">
            {linked.map((emp: LinkedEmployee) => {
              const isExpanded = expandedId === emp.id;
              return (
                <div key={emp.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                  {/* Summary row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={emp.name} size="sm" color="blue" />
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-900">{emp.name}</h5>
                        <span className="text-[10px] text-slate-400 font-semibold">{emp.templateName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Net pay highlight */}
                      <div className="text-right hidden sm:block">
                        <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Net Pay</span>
                        <span className="text-sm font-black text-blue-700">{formatMoney(emp.netPay, emp.currency)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleUnlink(emp); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Unlink"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-50 px-4 pb-4 pt-3 bg-slate-50/30 space-y-3">
                      {/* Allowances */}
                      {(emp.housingAllowance + emp.transportAllowance + emp.mealAllowance + emp.otherAllowance) > 0 && (
                        <div>
                          <p className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider mb-2">Allowances</p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Housing',   val: emp.housingAllowance },
                              { label: 'Transport', val: emp.transportAllowance },
                              { label: 'Meal',      val: emp.mealAllowance },
                              { label: 'Other',     val: emp.otherAllowance },
                            ].filter(a => a.val > 0).map(({ label, val }) => (
                              <div key={label} className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 text-center min-w-[80px]">
                                <span className="block text-[9px] text-emerald-600 font-extrabold uppercase tracking-wider">{label}</span>
                                <span className="block text-xs font-black text-emerald-800 mt-0.5">+{formatMoney(val, emp.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full breakdown grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
                        {[
                          { label: 'Base', val: emp.baseSalary, cls: 'bg-white border-slate-100 text-slate-800' },
                          { label: 'Gross Pay', val: emp.grossPay, cls: 'bg-slate-100/70 border-slate-200 text-slate-800' },
                          { label: 'Tax', val: -emp.taxDeduction, cls: 'bg-rose-50/60 border-rose-50 text-rose-700' },
                          { label: 'Pension', val: -emp.pensionDeduction, cls: 'bg-rose-50/60 border-rose-50 text-rose-700' },
                          { label: 'Health', val: -emp.healthDeduction, cls: 'bg-rose-50/60 border-rose-50 text-rose-700' },
                          { label: 'Net Pay', val: emp.netPay, cls: 'bg-blue-50 border-blue-100 text-blue-800 font-black' },
                        ].map(({ label, val, cls }) => (
                          <div key={label} className={`rounded-xl border p-3 ${cls}`}>
                            <span className="block text-[8.5px] font-extrabold uppercase tracking-wider opacity-70">{label}</span>
                            <span className={`block text-xs font-extrabold mt-0.5 ${label === 'Net Pay' ? 'text-sm' : ''}`}>
                              {val < 0 ? `-${formatMoney(Math.abs(val), emp.currency)}` : formatMoney(val, emp.currency)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Loan / Other deductions if any */}
                      {(emp.loanDeduction + emp.otherDeduction) > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {emp.loanDeduction > 0 && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-center">
                              <span className="block text-[9px] text-rose-600 font-extrabold uppercase tracking-wider">Loan</span>
                              <span className="block text-xs font-black text-rose-800">-{formatMoney(emp.loanDeduction, emp.currency)}</span>
                            </div>
                          )}
                          {emp.otherDeduction > 0 && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-center">
                              <span className="block text-[9px] text-rose-600 font-extrabold uppercase tracking-wider">Other Ded.</span>
                              <span className="block text-xs font-black text-rose-800">-{formatMoney(emp.otherDeduction, emp.currency)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Link modal */}
      {linkTarget && (
        <LinkModal
          employee={linkTarget}
          templates={templates}
          onClose={() => setLinkTarget(null)}
          onLink={handleLink}
          isLoading={linkEmployee.isPending}
        />
      )}
    </div>
  );
}
