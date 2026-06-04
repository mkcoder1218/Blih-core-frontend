/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Sparkles,
  DollarSign,
  TrendingUp,
  Clock,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  AlertTriangle,
  Download,
  Check,
  X,
  MapPin,
  ChevronRight,
  Calendar,
  Layers,
  Percent,
  Coins,
  ShieldCheck,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useCreateBudgetReallocation, useFinanceApprovalAction, useWorkforceFinance, usePayrollTemplates, useCreatePayrollTemplate, useUpdatePayrollTemplate, useDeletePayrollTemplate, usePreviewPayroll, usePayrollDashboard, useLinkEmployee, useUnlinkEmployee } from '../../hooks/useWorkforceFinance';
import type { PayrollTemplate, LinkedEmployee, PendingEmployee } from '../../hooks/useWorkforceFinance';
import { exportWorkforceFinance } from '../../api/finance';
import PayrollTemplatePanel from './PayrollTemplatePanel';
import PayrollLinkPanel from './PayrollLinkPanel';

interface WorkforceFinanceViewProps {
  currentTab: 'overview' | 'salary_payroll' | 'payroll_template' | 'budget' | 'expense' | 'benefits';
  onDraftAiSuggestion: (context: string) => void;
  showAlert: (message: string, type?: 'success' | 'info' | 'error') => void;
}

// ─── Salary & Payroll merged panel ───────────────────────────────────────────
function SalaryPayrollPanel({
  salary, payroll, salaryAdjustRequests, searchQuery, setSearchQuery,
  formatMoney, formatDate, pct, scatterData, deptSalaryData,
  handleAction, handleExport, onDraftAiSuggestion, showAlert,
}: {
  salary: any; payroll: any; salaryAdjustRequests: any[];
  searchQuery: string; setSearchQuery: (v: string) => void;
  formatMoney: (v?: number, compact?: boolean) => string;
  formatDate: (v?: string | null) => string;
  pct: (v?: number) => string;
  scatterData: any[]; deptSalaryData: any[];
  handleAction: (id: string, action: 'approve' | 'reject', listType: 'pending' | 'salary' | 'expense') => void;
  handleExport: (tab: string) => void;
  onDraftAiSuggestion: (ctx: string) => void;
  showAlert: (msg: string, type?: 'success' | 'info' | 'error') => void;
}) {
  const [subTab, setSubTab] = useState<'salary' | 'payroll'>('salary');
  // Pull linked employee net-pay map for the salary tab
  const { data: payrollDash } = usePayrollDashboard();
  const linkedMap = new Map<string, any>(
    (payrollDash?.linked ?? []).map((l: any) => [l.employeeUserId, l])
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Sub-tab switcher */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 w-fit shadow-xs">
        <button
          onClick={() => setSubTab('salary')}
          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            subTab === 'salary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Salary
        </button>
        <button
          onClick={() => setSubTab('payroll')}
          className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            subTab === 'payroll'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Payroll
        </button>
      </div>

      {/* ── SALARY CONTENT ── */}
      {subTab === 'salary' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Salary</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(salary.totals?.avgSalary)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payroll</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(salary.totals?.totalPayroll, true)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{salaryAdjustRequests.length}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Increase</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{pct(salary.totals?.avgIncreasePercent)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Salary Adjustment Requests */}
          <div className="bg-white rounded-2xl border border-blue-500/20 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-blue-600"><DollarSign className="w-4 h-4 stroke-[3]" /></span>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Salary Adjustment Requests</h4>
              </div>
              <button
                onClick={() => onDraftAiSuggestion('salary adjustment guidelines')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer select-none transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Compensation Guidance</span>
              </button>
            </div>
            <div className="space-y-3">
              {salaryAdjustRequests.length > 0 ? salaryAdjustRequests.map((sar) => (
                <div key={sar.id} className="bg-slate-50/70 rounded-2xl border border-slate-100 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs font-mono">
                      {sar.employee?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'NA'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900">{sar.employee}</h5>
                        <span className="text-[10px] text-slate-400 font-semibold">{sar.department}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        Status: <strong className="text-emerald-600">{sar.status}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-3.5 rounded-xl border border-slate-100/80 flex-1 max-w-2xl text-[11px] font-semibold">
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Current Salary</span>
                      <span className="text-slate-800">{formatMoney(sar.currentSalary)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Requested Salary</span>
                      <span className="text-[#2563eb] font-extrabold">{formatMoney(sar.requestedSalary)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Increase</span>
                      <span className="text-emerald-600 font-extrabold">+{formatMoney(sar.increase)} ({pct(sar.pct)})</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Requested Date</span>
                      <span className="text-slate-700">{formatDate(sar.date)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-[11px] font-medium leading-normal bg-white/70 p-3 rounded-xl border border-slate-100 text-slate-650 max-w-xs flex-1">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Reason</span>
                    <p className="line-clamp-2">{sar.reason}</p>
                  </div>
                  <div className="flex gap-2 self-end md:self-center">
                    <button onClick={() => handleAction(sar.id, 'reject', 'salary')} className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-bold rounded-lg text-xs transition-colors cursor-pointer">Reject</button>
                    <button onClick={() => handleAction(sar.id, 'approve', 'salary')} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs">Approve</button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                  <span className="text-xs font-semibold">All salary adjustments fully reviewed.</span>
                </div>
              )}
            </div>
          </div>

          {/* Charts + Dept breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Salary vs Performance Correlation</h4>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="Salary" unit="k" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                    <YAxis type="number" dataKey="y" name="Performance" min={3} max={5} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Employees" data={scatterData} fill="#2563eb" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Salary by Department</h4>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptSalaryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Staffing Breakdowns</h4>
              <div className="space-y-3.5 overflow-y-auto max-h-[220px]">
                {(deptSalaryData ?? []).map((dep: any, idx: number) => (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100/80 flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-bold text-slate-800">{dep.name}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold">{dep.count} employees</span>
                    </div>
                    <div className="text-right font-semibold">
                      <p className="text-slate-800">{formatMoney(dep.amount, true)} avg</p>
                      <span className="text-[10px] text-blue-600 font-bold block">{formatMoney(dep.total, true)} Total</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Salary Details */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-50">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Employee Salary Details</h4>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:bg-white focus:border-blue-500 font-semibold text-slate-700"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(salary.employees ?? []).filter((emp: any) =>
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.role.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((emp: any, i: number) => {
                const linked = linkedMap.get(emp.userId);
                return (
                <div key={i} className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-between hover:shadow-xs transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {emp.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <div>
                        <h5 className="text-[12px] font-black text-slate-800 leading-none">{emp.name}</h5>
                        <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">{emp.department}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {linked ? (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 font-extrabold px-2 py-0.5 rounded-full">Linked</span>
                      ) : (
                        <span className="text-[9px] bg-amber-50 text-amber-600 font-extrabold px-2 py-0.5 rounded-full">Pending</span>
                      )}
                      <button onClick={() => showAlert(`Inspecting records for ${emp.name}`, 'info')} className="text-[10px] bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer">View</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-slate-100/80 text-[10.5px] font-semibold text-slate-700">
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase tracking-wider mb-0.5">Base</span>
                      <strong className="text-slate-700 font-bold">{formatMoney(linked?.baseSalary ?? emp.salary)}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-450 uppercase tracking-wider mb-0.5">Gross</span>
                      <strong className="text-slate-700 font-bold">{linked ? formatMoney(linked.grossPay) : '—'}</strong>
                    </div>
                    <div>
                      <span className="block text-[8px] text-emerald-600 uppercase tracking-wider mb-0.5 font-extrabold">Net Pay</span>
                      <strong className={`font-extrabold ${linked ? 'text-blue-600' : 'text-slate-400'}`}>
                        {linked ? formatMoney(linked.netPay) : 'Not set'}
                      </strong>
                    </div>
                  </div>
                  {linked && (
                    <div className="mt-2 pt-2 border-t border-slate-100/60 flex justify-between text-[10px] font-semibold text-slate-500">
                      <span>Template: <strong className="text-slate-700">{linked.templateName}</strong></span>
                      <span className="text-rose-500">-{formatMoney(linked.totalDeductions)} deducted</span>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>

          {/* Salary Audit Log */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest pb-1 border-b border-slate-50">Salary Audit Log</h4>
            <div className="space-y-3">
              {(salary.auditLogs ?? []).length > 0 ? salary.auditLogs.map((log: any, i: number) => (
                <div key={i} className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/70 flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-slate-900">{log.entityType}</h5>
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-md">{log.action}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                      <span>{formatMoney(log.beforeData?.currentSalary ?? log.beforeData?.amount)}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-[#2563eb]">{formatMoney(log.afterData?.requestedSalary ?? log.afterData?.amount)}</span>
                      <span className="text-[9.5px] text-slate-400 font-bold ml-1">({log.entityId})</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-bold"><p>{formatDate(log.date)}</p></div>
                </div>
              )) : (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs font-semibold">No salary audit events yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYROLL CONTENT ── */}
      {subTab === 'payroll' && (
        <PayrollLinkPanel showAlert={showAlert} />
      )}
    </div>
  );
}

export default function WorkforceFinanceView({
  currentTab,
  onDraftAiSuggestion,
  showAlert,
}: WorkforceFinanceViewProps) {
  // Common states
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const { data = {}, isLoading, isError, error } = useWorkforceFinance({ tab: currentTab, q: searchQuery, department: deptFilter });
  const approvalAction = useFinanceApprovalAction();
  const createReallocation = useCreateBudgetReallocation();

  const formatMoney = (value: number = 0, compact = false) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0 }).format(Number(value || 0));
  const formatDate = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 10) : 'Not scheduled';
  const pct = (value: number = 0) => `${Number(value || 0).toFixed(1)}%`;

  const overview = (data as any).overview ?? {};
  const salary = (data as any).salary ?? {};
  const payroll = (data as any).payroll ?? {};
  const budget = (data as any).budget ?? {};
  const expense = (data as any).expense ?? {};
  const benefits = (data as any).benefits ?? {};

  const pendingApprovals = overview.pendingApprovals ?? [];
  const salaryAdjustRequests = salary.requests ?? [];
  const expenseAwaiting = expense.requests ?? [];
  const payrollTrendData = overview.payrollTrend ?? [];
  const deptBudgetUtilizationData = overview.departmentBudgetUtilization ?? budget.departmentBudgetUtilization ?? [];
  const scatterData = salary.performanceComparison ?? [];
  const deptSalaryData = salary.departmentSalary ?? [];
  const expensePieData = expense.breakdown ?? [];
  const expenseTrendData = expense.trend ?? [];
  const benefitsDeptData = benefits.departmentValues ?? [];

  const handleAction = async (id: string, action: 'approve' | 'reject', listType: 'pending' | 'salary' | 'expense') => {
    const source = listType === 'salary'
      ? salaryAdjustRequests.find((item: any) => item.id === id)
      : listType === 'expense'
        ? expenseAwaiting.find((item: any) => item.id === id)
        : pendingApprovals.find((item: any) => item.id === id);
    const kind = source?.kind === 'budget' ? 'budget' : source?.kind === 'expense' || listType === 'expense' ? 'expense' : 'salary';

    try {
      await approvalAction.mutateAsync({ kind, id, action });
      showAlert(`Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${source?.type || 'finance request'}.`, 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error || `Unable to ${action} finance request.`, 'error');
    }
  };

  const handleExport = async (tab: string) => {
    try {
      const res = await exportWorkforceFinance(tab);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workforce-finance-${tab}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert('Finance export prepared.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error || 'Unable to export finance data.', 'error');
    }
  };

  const handleBudgetReallocationRequest = async () => {
    try {
      await createReallocation.mutateAsync({ amount: 0, reason: 'Budget reallocation requested from Workforce Finance' });
      showAlert('Budget reallocation request created.', 'success');
    } catch (err: any) {
      showAlert(err?.response?.data?.error || 'Unable to create reallocation request.', 'error');
    }
  };

  if (isLoading) {
    return <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-xs font-bold text-slate-400">Loading workforce finance data...</div>;
  }

  if (isError) {
    return <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center text-xs font-bold text-rose-600">{(error as any)?.response?.data?.error || 'Unable to load workforce finance data.'}</div>;
  }

  return (
    <div className="space-y-6">
      {/* 1. OVERVIEW VIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</p>
                    <span className="bg-blue-50 text-blue-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {pendingApprovals.length} items
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{formatMoney(overview.totals?.pendingApprovalAmount)}</h3>
                </div>
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expenses This Month</p>
                    <span className="bg-blue-50 text-blue-600 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      {overview.totals?.monthlyExpenseItems ?? 0} items
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{formatMoney(overview.totals?.monthlyExpenses)}</h3>
                </div>
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Budget</p>
                    <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> {pct(overview.totals?.totalBudgetDeltaPercent)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">{formatMoney(overview.totals?.totalBudget, true)}</h3>
                </div>
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Panel with blue outline */}
          <div className="bg-white rounded-2xl border border-blue-500/30 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-50">
              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">i</span>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Recent Notifications</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(overview.notifications ?? []).length > 0 ? overview.notifications.map((notice: any) => (
                <div key={notice.id} className={`${notice.priority === 'high' || notice.priority === 'urgent' ? 'bg-red-50/40 border-red-50' : 'bg-slate-50/70 border-slate-100'} rounded-xl p-3.5 flex items-start gap-3 border`}>
                  <div className={`${notice.priority === 'high' || notice.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'} w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {notice.priority === 'high' || notice.priority === 'urgent' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
                  </div>
                  <div>
                    <h5 className="text-[11.5px] font-bold text-slate-800 leading-tight">{notice.title}</h5>
                    <span className="text-[9.5px] text-slate-400 font-bold block mt-1">{formatDate(notice.date)}</span>
                  </div>
                </div>
              )) : (
                <div className="md:col-span-2 p-5 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-xs font-semibold">No recent finance notifications.</div>
              )}
            </div>
          </div>

          {/* Pending Approval Requests Section */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">Pending Approval Requests</h4>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Review and Approve Salary adjustment requests</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((req) => (
                  <div key={req.id} className="bg-slate-50/55 rounded-2xl border border-slate-100 p-4.5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-extrabold text-slate-800">{req.type}</h5>
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              req.priority === 'High' ? 'bg-red-50 text-red-600' : req.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {req.priority}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Requester: {req.employee}</p>
                        </div>
                        <h4 className="text-sm font-black text-blue-600">${req.amount.toLocaleString()}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-2.5 bg-white p-2.5 rounded-xl border border-slate-100/70">{req.descr}</p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3.5 border-t border-slate-100/90">
                      <span className="text-[10px] text-slate-400 font-bold">Requested: {req.date}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, 'reject', 'pending')}
                          className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(req.id, 'approve', 'pending')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <span className="text-xs font-semibold">No pending workforce requests for approval at this time.</span>
                </div>
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Monthly Payroll Trend</h4>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={payrollTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Monthly Cost']} />
                    <Line type="monotone" dataKey="amount" stroke="#1d4ed8" strokeWidth={3} dot={{ fill: '#1d4ed8', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Department Budget Utilization</h4>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptBudgetUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700, pt: 10 }} />
                    <Bar dataKey="spent" name="Spent" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="allocated" name="Allocated" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SALARY & PAYROLL (merged) */}
      {currentTab === 'salary_payroll' && (
        <SalaryPayrollPanel
          salary={salary}
          payroll={payroll}
          salaryAdjustRequests={salaryAdjustRequests}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          formatMoney={formatMoney}
          formatDate={formatDate}
          pct={pct}
          scatterData={scatterData}
          deptSalaryData={deptSalaryData}
          handleAction={handleAction}
          handleExport={handleExport}
          onDraftAiSuggestion={onDraftAiSuggestion}
          showAlert={showAlert}
        />
      )}

      {/* 2b. PAY TEMPLATES */}
      {currentTab === 'payroll_template' && (
        <PayrollTemplatePanel showAlert={showAlert} />
      )}

      {/* 3. BUDGET TABS */}
      {currentTab === 'budget' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Allocated</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(budget.totals?.allocated, true)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(budget.totals?.spent, true)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(budget.totals?.remaining, true)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilization</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{pct(budget.totals?.utilization)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Budget Management Banner */}
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div>
              <h4 className="text-[14px] font-black text-slate-900 tracking-tight">Budget Management</h4>
              <p className="text-[11px] text-slate-400 font-semibold font-sans">Create and manage different budget types for your organization</p>
            </div>
            <button
              onClick={handleBudgetReallocationRequest}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Request Budget Reallocation</span>
            </button>
          </div>

          {/* Department Budgets double columns chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Department Budget vs Actual Spending</h4>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptBudgetUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                  <Bar dataKey="allocated" name="Allocated" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="spent" name="Spent" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current Budget Allocations cards */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Current Budget Allocations</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ...(budget.allocations ?? [])
              ].map((bud: any, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4 hover:shadow-xs transition-shadow">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-50">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">{bud.name}</h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1.5">{bud.periodType}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-650 font-bold px-2.5 py-0.5 rounded-md">
                      Pending
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{bud.metadata?.description || bud.department || 'Organization budget allocation'}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {([bud.department, bud.status].filter(Boolean)).map((tag) => (
                      <span key={tag} className="text-[9px] bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-3.5 border-t border-slate-50 text-[10.5px] font-semibold text-slate-700">
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider mb-0.5">Allocated</span>
                      <strong className="text-slate-900 font-extrabold">{formatMoney(bud.allocated)}</strong>
                    </div>
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider text-blue-600">Spent</span>
                      <strong className="text-blue-600 font-extrabold">{formatMoney(bud.spent)}</strong>
                    </div>
                    <div>
                      <span className="block text-[8.5px] text-slate-400 uppercase tracking-wider">Remaining</span>
                      <strong className="text-slate-800 font-extrabold">{formatMoney(bud.remaining)}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>UTILIZATION</span>
                      <span className="text-slate-700">{pct(bud.utilization)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(bud.utilization || 0, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Annual Budgets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Previous Annual Budgets</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ...(budget.annualSummaries ?? [])
              ].map((an: any, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-100/60">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-none">{an.year}</h4>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
                        Variance: {an.variance >= 0 ? 'Under' : 'Over'} by {formatMoney(Math.abs(an.variance))}
                      </p>
                    </div>
                    <h3 className="text-sm font-black text-blue-700">{formatMoney(an.allocated, true)}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold">
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Total Allocated</span>
                      <strong className="text-slate-800">{formatMoney(an.allocated)}</strong>
                    </div>
                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <span className="block text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Total Spent</span>
                      <strong className="text-slate-800">{formatMoney(an.spent)}</strong>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-2.5">Department Breakdown</span>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-550">
                      {(an.departments ?? []).map((dep: any) => (
                        <div key={dep.name} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                          <span>{dep.name}:</span>
                          <strong className="text-blue-600 font-bold">{formatMoney(dep.allocated, true)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. EXPENSE TABS */}
      {currentTab === 'expense' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expense</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(expense.totals?.totalExpense, true)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Compass className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{expenseAwaiting.length}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Clock className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unexpected</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{expense.totals?.unexpected ?? 0}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-650 flex items-center justify-center"><AlertTriangle className="w-4 h-4" /></div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Month</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(expense.totals?.thisMonth, true)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Breakdown / Pie Charts & Line charts split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Expense Breakdown</h4>
              <div className="flex items-center justify-between gap-4">
                <div className="w-[140px] h-[140px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value">
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 flex-1 text-[10.5px] font-bold text-slate-600">
                  {expensePieData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-1.5 rounded border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 block" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="text-slate-800 font-extrabold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Monthly Expense Trend</h4>
              <div className="h-[148px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Expense Requests Awaiting Approval */}
          <div className="bg-white rounded-2xl border border-blue-500/20 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-1">
              <span />
              <span>Expense Requests Awaiting Approval ({expenseAwaiting.length})</span>
            </h4>

            <div className="space-y-4">
              {expenseAwaiting.length > 0 ? (
                expenseAwaiting.map((exp) => (
                  <div key={exp.id} className="bg-slate-50/50 p-4.5 rounded-2xl border border-slate-105 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-slate-900">{exp.title}</h4>
                        <span className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          exp.priority === 'High' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {exp.priority}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 font-bold uppercase">{exp.dept}</p>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">{exp.reason}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-slate-200/50 text-[10px] font-semibold text-slate-600 flex-none w-full md:w-80">
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Project</span>
                        <span className="text-slate-800 font-bold block truncate">{exp.budget}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Requested By</span>
                        <span className="text-slate-800 font-bold block truncate">{exp.requestedBy}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 uppercase tracking-wider">Requested Date</span>
                        <span className="text-slate-700 block">{formatDate(exp.date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 justify-between md:justify-center">
                      <h4 className="text-base font-black text-blue-600">{formatMoney(exp.amount)}</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(exp.id, 'reject', 'expense')}
                          className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(exp.id, 'approve', 'expense')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white">
                  <span>All expense requests processed.</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses cards list */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recent Expenses</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                ...(expense.recent ?? [])
              ].map((rec: any, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-105 p-5 space-y-4 shadow-xs">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-50">
                    <div>
                      <h5 className="text-xs font-black text-slate-900 leading-none">{rec.title}</h5>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block mt-2 ${
                        rec.status === 'approved' || rec.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rec.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-950">{formatMoney(rec.amount)}</h4>
                  </div>

                  <div className="text-[10.5px] font-semibold text-slate-600 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Part Budget:</span>
                      <strong className="text-slate-800 truncate block max-w-[140px]">{rec.budget}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Responsibility:</span>
                      <strong className="text-slate-800">{rec.requestedBy}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Date:</span>
                      <strong className="text-slate-700">{formatDate(rec.date)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unexpected Expenses Warnings */}
          <div className="bg-red-50/20 rounded-2xl border border-rose-500/20 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-red-700 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Unexpected Expenses ({expense.unexpected?.length ?? 0})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(expense.unexpected ?? []).map((item: any) => (
              <div key={item.id} className="bg-red-500/[0.04] p-4 rounded-xl border border-red-50 border-l-4 border-l-red-500 flex justify-between items-start">
                <div>
                  <h5 className="text-xs font-extrabold text-red-800">{item.title}</h5>
                  <p className="text-[10.5px] text-slate-505 font-bold mt-1">Date: {formatDate(item.date)}</p>
                  <span className="text-[9.5px] uppercase font-bold text-slate-400 block mt-2">Covered by Buffer Budget</span>
                </div>
                <div className="text-right font-semibold">
                  <h5 className="font-extrabold text-red-700">{formatMoney(item.amount)}</h5>
                  <span className="text-[10px] text-slate-400 mt-1 block">Status: {item.status}</span>
                </div>
              </div>
              ))}
            </div>
          </div>

          {/* Expense History Cards */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-404 uppercase tracking-wider block font-sans">Expense History</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ...(expense.history ?? [])
              ].map((hist: any, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100/60">
                    <h4 className="text-xs font-black text-slate-900">{hist.period}</h4>
                    <span className="text-sm font-black text-blue-600">Total Expenses: {formatMoney(hist.total)}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-semibold text-slate-600">
                    {Object.entries(hist.categories ?? {}).map(([name, amount]: any, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px]">
                        {name}: <strong className="text-slate-800">{formatMoney(amount)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. BENEFITS VIEW */}
      {currentTab === 'benefits' && (
        <div className="space-y-6 animate-fade-in font-sans">
          {/* Top Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Benefits Value</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(benefits.totals?.totalValue, true)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-emerald-600 font-bold text-xs flex items-center justify-center">+12%</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg per Employee</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{formatMoney(benefits.totals?.avgPerEmployee)}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs flex items-center justify-center">-5%</div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Enrollments</p>
                <h3 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">{benefits.totals?.activeEnrollments ?? 0}</h3>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1a56db] flex items-center justify-center"><Percent className="w-4 h-4" /></div>
            </div>
          </div>

          {/* Annual Profit Sharing */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Annual Profit Sharing</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold font-sans">
              <div className="bg-[#eff6ff] p-4.5 rounded-2xl border border-blue-100 text-center">
                <span className="block text-[9.5px] text-blue-500 uppercase tracking-widest">Total Pool</span>
                <h3 className="text-xl font-black text-blue-600 mt-1.5">{formatMoney((benefits.benefits ?? []).filter((b: any) => b.category === 'profit_sharing').reduce((sum: number, b: any) => sum + b.annualBudget, 0))}</h3>
              </div>
              <div className="bg-slate-50 p-4.5 rounded-2xl text-center border border-slate-150">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest">Eligible Employees</span>
                <h3 className="text-xl font-black text-slate-800 mt-1.5">{benefits.totals?.activeEnrollments ?? 0}</h3>
              </div>
              <div className="bg-slate-50 p-4.5 rounded-2xl text-center border border-slate-150">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest">Payout per Employee</span>
                <h3 className="text-xl font-black text-slate-850 mt-1.5">{formatMoney(benefits.totals?.avgPerEmployee)}</h3>
              </div>
            </div>

            <div className="space-y-1 block">
              <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Division-by-Tier details</span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  ...(benefits.departmentValues ?? [])
                ].map((tier: any, i) => (
                  <div key={i} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-2">
                    <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-700">
                      <span>{tier.name}</span>
                      <span className="text-slate-450">{formatMoney(tier.avg)} avg</span>
                    </div>
                    {/* Linear enrollment indicator */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min((tier.employees || 0) * 10, 100)}%` }} />
                    </div>
                    <span className="text-[9.5px] text-slate-400 font-bold block">{tier.employees} enrollments</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Annual Performance Bonuses */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Annual Performance Bonuses</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest font-bold">Total Budget</span>
                <h3 className="text-lg font-black text-slate-900 mt-1.5">{formatMoney((benefits.benefits ?? []).filter((b: any) => b.category === 'bonus').reduce((sum: number, b: any) => sum + b.annualBudget, 0))}</h3>
              </div>
              <div className="bg-blue-50 p-4.5 rounded-2xl border border-blue-100">
                <span className="block text-[9.5px] text-blue-500 uppercase tracking-widest font-bold">Paid Out</span>
                <h3 className="text-lg font-black text-blue-600 mt-1.5">{formatMoney((benefits.enrollments ?? []).reduce((sum: number, e: any) => sum + e.value, 0))}</h3>
              </div>
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <span className="block text-[9.5px] text-slate-400 uppercase tracking-widest font-bold">Pending</span>
                <h3 className="text-lg font-black text-slate-800 mt-1.5">{formatMoney(0)}</h3>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">Top Recipients</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {(benefits.enrollments ?? []).slice(0, 4).map((rec: any) => (
                  <div key={rec.id} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black">JS</div>
                      <div>
                        <h5 className="font-bold text-slate-800 leading-none">{rec.department || 'Employee'}</h5>
                        <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase leading-none truncate">{rec.status}</p>
                      </div>
                    </div>
                    <strong className="text-blue-600 font-black">{formatMoney(rec.value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Allowances */}
          <div className="space-y-1.5 animate-fade-in block">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Monthly Allowances</span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                ...(benefits.benefits ?? []).filter((b: any) => b.category === 'allowance')
              ].map((all: any, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3 shadow-xs">
                  <div className="flex justify-between items-start pb-2 border-b border-slate-50">
                    <h5 className="text-[11.5px] font-black text-slate-900 leading-tight block max-w-[140px]">{all.name}</h5>
                    <span className="text-[10px] bg-[#eff6ff] text-blue-600 font-extrabold px-1.5 py-0.5 rounded-md">
                      {pct(all.monthlyBudget ? ((benefits.enrollments ?? []).filter((e: any) => e.benefitId === all.id).length / Math.max(benefits.totals?.activeEnrollments ?? 1, 1)) * 100 : 0)}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-[10.5px] font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Monthly Budget:</span>
                      <strong className="text-slate-800">{formatMoney(all.monthlyBudget)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Enrolled Employees:</span>
                      <strong className="text-slate-800">{(benefits.enrollments ?? []).filter((e: any) => e.benefitId === all.id).length} employees</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase text-[9px]">Per Employee Max:</span>
                      <strong className="text-blue-600 font-bold">{formatMoney(all.perEmployeeMax)}</strong>
                    </div>
                  </div>

                  {/* Slider indicator */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(((benefits.enrollments ?? []).filter((e: any) => e.benefitId === all.id).length / Math.max(benefits.totals?.activeEnrollments ?? 1, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insurance columns */}
          <div className="space-y-1.5 block">
            <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Insurance Benefits</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ...(benefits.benefits ?? []).filter((b: any) => b.category === 'insurance')
              ].map((ins: any, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <h5 className="text-[12.5px] font-black text-slate-900 leading-none">{ins.name}</h5>
                    <span className="text-sm font-black text-blue-600">{formatMoney(ins.monthlyBudget)}/mo</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-[10.5px] font-semibold text-slate-600">
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100/80">
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Employer</span>
                      <strong className="text-slate-900">{pct(ins.employerSharePercent)}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100/80">
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Employee</span>
                      <strong className="text-slate-900">{pct(ins.employeeSharePercent)}</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100/80">
                      <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Enrolled</span>
                      <strong className="text-[#2563eb]">{(benefits.enrollments ?? []).filter((e: any) => e.benefitId === ins.id).length} employees</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retirement benefits matches Image 4 */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Retirement Benefits</h4>
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="flex-1 md:pr-6 pb-4 md:pb-0 space-y-1.5">
                <h5 className="text-xs font-extrabold text-slate-900">401(k) with Company Match</h5>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  The company matches 100% of employee contributions up to 4% of their structural base salary. Immediate vesting rules apply.
                </p>
              </div>

              <div className="flex-1 md:px-6 py-4 md:py-0 grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Participants</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">{(benefits.enrollments ?? []).filter((e: any) => (benefits.benefits ?? []).find((b: any) => b.id === e.benefitId)?.category === 'retirement').length}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-105">
                  <span className="block text-[9px] text-slate-400 uppercase font-bold tracking-wider">Participation Rate</span>
                  <span className="text-sm font-extrabold text-slate-900 mt-1 block">{pct((benefits.enrollments ?? []).length ? ((benefits.enrollments ?? []).filter((e: any) => (benefits.benefits ?? []).find((b: any) => b.id === e.benefitId)?.category === 'retirement').length / (benefits.enrollments ?? []).length) * 100 : 0)}</span>
                </div>
              </div>

              <div className="flex-1 md:pl-6 pt-4 md:pt-0 grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <span className="block text-[9px] text-blue-500 uppercase font-bold tracking-wider">Employer Match</span>
                  <span className="text-sm font-extrabold text-blue-600 mt-1 block">{formatMoney((benefits.benefits ?? []).filter((b: any) => b.category === 'retirement').reduce((sum: number, b: any) => sum + b.monthlyBudget, 0), true)}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[9px] text-slate-450 uppercase font-bold tracking-wider">Total Contributions</span>
                  <span className="text-sm font-extrabold text-[#111827] mt-1 block">{formatMoney((benefits.enrollments ?? []).filter((e: any) => (benefits.benefits ?? []).find((b: any) => b.id === e.benefitId)?.category === 'retirement').reduce((sum: number, e: any) => sum + e.value, 0), true)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Benefits & Perks Grid Section */}
          <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-50">
              <span className="text-blue-600"><Compass className="w-4 h-4 stroke-[2.5]" /></span>
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Additional Benefits & Perks</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                ...(benefits.benefits ?? []).filter((b: any) => !['allowance', 'insurance', 'retirement', 'bonus', 'profit_sharing'].includes(b.category))
              ].map((perk: any, i) => {
                return (
                  <div key={i} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70 flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-blue-600 bg-blue-50">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h5 className="text-[11.5px] font-black text-slate-900 leading-tight">{perk.name}</h5>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">Budget: {formatMoney(perk.annualBudget || perk.monthlyBudget)} - Participants: {(benefits.enrollments ?? []).filter((e: any) => e.benefitId === perk.id).length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart value by department bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Benefits Value by Department</h4>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={benefitsDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-5 space-y-3.5">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Benefits Department metrics</h4>
              <div className="space-y-3">
                {[
                  ...(benefits.departmentValues ?? [])
                ].map((item: any, idx) => (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div>
                      <h5 className="font-bold text-slate-800">{item.name}</h5>
                      <span className="text-[10px] text-slate-400 font-semibold">{item.employees} employees</span>
                    </div>
                    <strong className="text-blue-600 font-extrabold">{formatMoney(item.avg, true)} avg</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
