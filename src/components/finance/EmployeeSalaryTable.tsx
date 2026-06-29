import React from "react";
import { AlertTriangle, Calculator, Check, Download, Eye, Filter, Pencil, RefreshCw, Search, X } from "lucide-react";
import { DataTable, LoadingSpinner, SectionCard, StatCard, StatCardGrid } from "@/components/ui/blih";
import {
  useEmployeeSalaries,
  useLinkEmployee,
  usePayrollTemplates,
  useSyncEthiopianSalaryTax,
  useUpdateEmployeeBaseSalary,
  type EthiopianTaxAllowanceLine,
  type EmployeeSalaryRow,
} from "../../hooks/useWorkforceFinance";
import { useDepartments } from "../../hooks/useDepartments";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../constants/employee";
import { exportEmployeeSalaries } from "../../api/finance";

type Props = {
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function money(value?: number | null, currency = "ETB") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function pct(value?: number | null) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "EM";
}

function payrollSetupLabel(status: EmployeeSalaryRow["payrollStatus"]) {
  return status === "linked" ? "Configured" : "Needs setup";
}

function taxTreatmentLabel(value?: string) {
  if (!value) return "-";
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default function EmployeeSalaryTable({ showAlert }: Props) {
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [payrollStatus, setPayrollStatus] = React.useState("");
  const [templateId, setTemplateId] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [employmentStatus, setEmploymentStatus] = React.useState("");
  const [activeRow, setActiveRow] = React.useState<EmployeeSalaryRow | null>(null);
  const [editRow, setEditRow] = React.useState<EmployeeSalaryRow | null>(null);
  const [editingBaseUserId, setEditingBaseUserId] = React.useState<string | null>(null);
  const [baseDraft, setBaseDraft] = React.useState("");
  const [showSyncWarning, setShowSyncWarning] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const params = React.useMemo(
    () => ({
      page,
      limit,
      q: search || undefined,
      payrollStatus: payrollStatus || undefined,
      templateId: templateId || undefined,
      departmentId: departmentId || undefined,
      employmentStatus: employmentStatus || undefined,
    }),
    [page, limit, search, payrollStatus, templateId, departmentId, employmentStatus]
  );

  const salaries = useEmployeeSalaries(params);
  const templates = usePayrollTemplates();
  const departments = useDepartments({ size: 200 });
  const updateBaseSalary = useUpdateEmployeeBaseSalary();
  const syncEthiopianTax = useSyncEthiopianSalaryTax();
  const rows = salaries.data?.rows ?? [];
  const pagination = salaries.data?.pagination ?? {};
  const totals = salaries.data?.meta?.totals ?? {};
  const total = Number(pagination.total ?? pagination.count ?? 0);
  const totalPages = Math.max(Number((salaries.data?.meta?.totalPages ?? pagination.totalPages ?? Math.ceil(total / limit)) || 1), 1);
  const syncFilters = React.useMemo(() => ({
    q: search || undefined,
    payrollStatus: payrollStatus || undefined,
    templateId: templateId || undefined,
    departmentId: departmentId || undefined,
    employmentStatus: employmentStatus || undefined,
  }), [search, payrollStatus, templateId, departmentId, employmentStatus]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await exportEmployeeSalaries({
        q: search || undefined,
        payrollStatus: payrollStatus || undefined,
        templateId: templateId || undefined,
        departmentId: departmentId || undefined,
        employmentStatus: employmentStatus || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "employee-salaries.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showAlert("Could not export employee salaries.", "error");
    } finally {
      setExporting(false);
    }
  };

  const startBaseEdit = (row: EmployeeSalaryRow) => {
    setEditingBaseUserId(row.userId);
    setBaseDraft(String(row.baseSalary || ""));
  };

  const cancelBaseEdit = () => {
    setEditingBaseUserId(null);
    setBaseDraft("");
  };

  const saveBaseEdit = async (row: EmployeeSalaryRow) => {
    const parsed = Number(baseDraft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      showAlert("Enter a valid base salary.", "error");
      return;
    }
    try {
      await updateBaseSalary.mutateAsync({ userId: row.userId, baseSalary: parsed });
      showAlert("Base salary updated and recalculated.", "success");
      cancelBaseEdit();
    } catch (error: any) {
      showAlert(error?.response?.data?.error || "Could not update base salary.", "error");
    }
  };

  const confirmSync = async () => {
    try {
      const res = await syncEthiopianTax.mutateAsync(syncFilters);
      const data = res.data?.data;
      const autoLinked = Number(data?.autoLinkedCount ?? 0);
      showAlert(
        autoLinked > 0
          ? `Synced ${data?.syncedCount ?? 0} salary records and configured ${autoLinked}.`
          : `Synced ${data?.syncedCount ?? 0} salary records.`,
        "success"
      );
      setShowSyncWarning(false);
    } catch (error: any) {
      showAlert(error?.response?.data?.error || "Could not sync Ethiopian tax.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <StatCardGrid cols={4}>
        <StatCard label="Base Salary" value={money(totals.baseSalary)} icon={<Calculator className="w-4 h-4" />} tone="blue" />
        <StatCard label="Gross Payroll" value={money(totals.grossPay)} icon={<Calculator className="w-4 h-4" />} tone="emerald" />
        <StatCard label="Net Payroll" value={money(totals.netPay)} icon={<Calculator className="w-4 h-4" />} tone="blue" />
        <StatCard label="Linked Employees" value={Number(totals.linked || 0)} icon={<Filter className="w-4 h-4" />} tone="amber" />
      </StatCardGrid>

      <SectionCard
        title="Employee Salaries"
        description="Approved employee salary records with payroll setup and calculation details."
        icon={<Calculator className="w-4 h-4 stroke-[3]" />}
        accent="blue"
        action={
          <>
            <button
              onClick={() => setShowSyncWarning(true)}
              disabled={syncEthiopianTax.isPending}
              className="h-9 px-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-black hover:bg-amber-100 disabled:opacity-60 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Ethiopian Tax
            </button>
            <button
              onClick={exportCsv}
              disabled={exporting}
              className="h-9 px-3 rounded-lg bg-blue-600 text-white text-xs font-black hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_160px_180px_200px_110px] gap-3">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by employee name or email"
                className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
              />
            </label>
            <select
              value={departmentId}
              onChange={(event) => { setPage(1); setDepartmentId(event.target.value); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All departments</option>
              {(departments.data?.departments ?? []).map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
            <select
              value={employmentStatus}
              onChange={(event) => { setPage(1); setEmploymentStatus(event.target.value); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All employment</option>
              {EMPLOYMENT_STATUS_OPTIONS.filter((option) => option.value !== "terminated").map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={payrollStatus}
              onChange={(event) => { setPage(1); setPayrollStatus(event.target.value); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All statuses</option>
              <option value="linked">Configured</option>
              <option value="pending">Needs setup</option>
            </select>
            <select
              value={templateId}
              onChange={(event) => { setPage(1); setTemplateId(event.target.value); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All templates</option>
              {(templates.data ?? []).map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <select
              value={limit}
              onChange={(event) => { setPage(1); setLimit(Number(event.target.value)); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}/page</option>)}
            </select>
          </div>

          <DataTable
            columns={["Employee", "Department", "Template", "Base", "Gross", "Deductions", "Net", "Payroll setup", "Actions"]}
            rows={rows}
            loading={salaries.isLoading}
            emptyMessage="No employee salary records match these filters."
            renderRow={(row) => (
              <tr key={row.userId} className="border-b border-slate-100 hover:bg-slate-50/70">
                <td className="px-4 py-3 min-w-[230px]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-xs font-black">
                      {initials(row.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{row.name}</p>
                      <p className="text-[10px] font-semibold text-slate-400 truncate">{row.email || row.employeeCode || "No email"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                  {row.department?.name || "Unassigned"}
                  <span className="block text-[10px] font-semibold text-slate-400 mt-0.5">{row.position?.title || row.employmentType || "Employee"}</span>
                </td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.templateName || "Not linked"}</td>
                <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap" onDoubleClick={() => startBaseEdit(row)}>
                  {editingBaseUserId === row.userId ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={baseDraft}
                        onChange={(event) => setBaseDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveBaseEdit(row);
                          if (event.key === "Escape") cancelBaseEdit();
                        }}
                        autoFocus
                        inputMode="decimal"
                        className="w-28 h-8 rounded-lg border border-blue-200 bg-white px-2 text-xs font-black text-slate-900 outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => saveBaseEdit(row)}
                        disabled={updateBaseSalary.isPending}
                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center justify-center disabled:opacity-50"
                        title="Save base salary"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={cancelBaseEdit}
                        className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center justify-center"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="cursor-text" title="Double-click to edit">{money(row.baseSalary, row.currency)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.payrollStatus === "linked" ? money(row.grossPay, row.currency) : "-"}</td>
                <td className="px-4 py-3 text-xs font-bold text-rose-600 whitespace-nowrap">{row.payrollStatus === "linked" ? money(row.totalDeductions, row.currency) : "-"}</td>
                <td className="px-4 py-3 text-xs font-black text-emerald-700 whitespace-nowrap">{row.payrollStatus === "linked" ? money(row.netPay, row.currency) : "-"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-full ${row.payrollStatus === "linked" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {payrollSetupLabel(row.payrollStatus)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveRow(row)} className="w-8 h-8 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 inline-flex items-center justify-center" title="View calculation">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditRow(row)} className="w-8 h-8 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 inline-flex items-center justify-center" title="Update salary calculation">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>{total ? `${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total} employees` : "No employees"}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1 || salaries.isFetching} onClick={() => setPage((value) => Math.max(value - 1, 1))} className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-bold">Previous</button>
              <span className="px-2 text-slate-700 font-black">Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages || salaries.isFetching} onClick={() => setPage((value) => value + 1)} className="px-3 py-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-bold">Next</button>
            </div>
          </div>
        </div>
      </SectionCard>

      {activeRow && <CalculationModal row={activeRow} onClose={() => setActiveRow(null)} />}
      {editRow && (
        <UpdateSalaryModal
          row={editRow}
          templates={templates.data ?? []}
          templatesLoading={templates.isLoading}
          onClose={() => setEditRow(null)}
          showAlert={showAlert}
        />
      )}
      {showSyncWarning && (
        <EthiopianTaxWarningModal
          loading={syncEthiopianTax.isPending}
          onCancel={() => setShowSyncWarning(false)}
          onConfirm={confirmSync}
        />
      )}
    </div>
  );
}

function EthiopianTaxWarningModal({
  loading,
  onCancel,
  onConfirm,
}: {
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[10000] bg-white">
      <div className="w-full h-full bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Sync Ethiopian Tax Deduction?</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Ethiopian proclamation tax policy</p>
          </div>
          <button onClick={onCancel} disabled={loading} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center disabled:opacity-60">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-amber-700 border border-amber-100 inline-flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">This will replace template tax changes</h4>
              <p className="text-xs font-semibold text-amber-800 mt-1 leading-relaxed">
                This button is created for Ethiopian proclamation salary tax deduction. It recalculates taxable income, tax, total deductions, gross pay, and net pay using Ethiopian brackets plus transport, per-diem, and fringe benefit caps.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="text-xs font-black text-slate-900">What will happen</h4>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">Configured and needs-setup employees in the current filters will be synced.</div>
              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">Needs-setup employees will be linked to the default active payroll template.</div>
              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">Transport exemption cap will be applied.</div>
              <div className="rounded-lg bg-white border border-slate-100 px-3 py-2">Per-diem monthly cap will be applied.</div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-black hover:bg-amber-700 disabled:opacity-60"
          >
            {loading ? "Syncing..." : "Yes, sync tax"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CalculationModal({ row, onClose }: { row: EmployeeSalaryRow; onClose: () => void }) {
  const allowanceTotal = row.housingAllowance + row.transportAllowance + row.mealAllowance + row.otherAllowance;
  const deductionRate = row.grossPay ? (row.totalDeductions / row.grossPay) * 100 : 0;
  const taxMeta = row.taxMeta;
  const allowanceBreakdown = taxMeta?.allowanceBreakdown;
  const taxRows: Array<[string, EthiopianTaxAllowanceLine]> = (allowanceBreakdown ? [
    ["Basic Salary", allowanceBreakdown.baseSalary],
    ["Transportation", allowanceBreakdown.transport],
    ["Per Diem / Meal", allowanceBreakdown.perDiem],
    ["Medical", allowanceBreakdown.medical],
    ["Housing", allowanceBreakdown.housing],
    ["Fringe / Other", allowanceBreakdown.fringeBenefits],
  ] as Array<[string, EthiopianTaxAllowanceLine | undefined]> : [])
    .filter((rowItem): rowItem is [string, EthiopianTaxAllowanceLine] => Boolean(rowItem[1]));
  const values = [
    ["Base Salary", row.baseSalary],
    ["Allowances", allowanceTotal],
    ["Gross Pay", row.grossPay],
    ["Tax", row.taxDeduction],
    ["Pension", row.pensionDeduction],
    ["Health", row.healthDeduction],
    ["Loan", row.loanDeduction],
    ["Other Deduction", row.otherDeduction],
    ["Total Deductions", row.totalDeductions],
    ["Net Pay", row.netPay],
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <div className="w-full h-full bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Salary Calculation</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{row.name} - {row.templateName || "No payroll template"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <span className="text-[10px] font-black uppercase text-blue-500">Base</span>
              <p className="text-lg font-black text-blue-900 mt-1">{money(row.baseSalary, row.currency)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <span className="text-[10px] font-black uppercase text-emerald-600">Net Pay</span>
              <p className="text-lg font-black text-emerald-900 mt-1">{money(row.netPay, row.currency)}</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <span className="text-[10px] font-black uppercase text-rose-600">Deduction Rate</span>
              <p className="text-lg font-black text-rose-900 mt-1">{pct(deductionRate)}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {values.map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-xs">
                <span className="font-bold text-slate-500">{label}</span>
                <strong className="text-slate-900">{money(value as number, row.currency)}</strong>
              </div>
            ))}
          </div>
          {taxMeta?.mode === "ethiopian_proclamation" && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Ethiopian Tax Policy Breakdown</h4>
                    <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                      Taxable income: {money(taxMeta.taxableIncome, row.currency)} | bracket rate: {pct(Number(taxMeta.rate || 0) * 100)}
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wide text-amber-700 bg-amber-100 rounded-full px-2 py-1">
                    Allowance caps applied
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["Component", "Treatment", "Amount", "Exempt", "Taxable", "Cap"].map((label) => (
                        <th key={label} className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {taxRows.map(([label, item]) => (
                      <tr key={label as string}>
                        <td className="px-4 py-3 text-xs font-black text-slate-800 whitespace-nowrap">{label}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{taxTreatmentLabel(item?.treatment)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(item?.amount, row.currency)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-700 whitespace-nowrap">{money(item?.exempt, row.currency)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-rose-700 whitespace-nowrap">{money(item?.taxable, row.currency)}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-500 whitespace-nowrap">
                          {item?.cap != null ? money(item.cap, row.currency) : item?.taxCap != null ? money(item.taxCap, row.currency) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-amber-100 bg-amber-50/60 text-[11px] font-semibold text-amber-800 leading-relaxed">
                Transport uses the lower of ETB 2,200 or 25% of base salary. Per-diem currently uses the monthly cap because payroll templates do not yet store official travel days.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UpdateSalaryModal({
  row,
  templates,
  templatesLoading,
  onClose,
  showAlert,
}: {
  row: EmployeeSalaryRow;
  templates: { id: string; name: string; currency: string }[];
  templatesLoading: boolean;
  onClose: () => void;
  showAlert: Props["showAlert"];
}) {
  const [templateId, setTemplateId] = React.useState(row.templateId || templates[0]?.id || "");
  const [baseSalary, setBaseSalary] = React.useState(String(row.baseSalaryOverride ?? row.baseSalary ?? ""));
  const linkEmployee = useLinkEmployee();

  React.useEffect(() => {
    if (!templateId && templates[0]?.id) setTemplateId(templates[0].id);
  }, [templateId, templates]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!templateId) {
      showAlert("Select a payroll template first.", "error");
      return;
    }
    const parsedSalary = Number(baseSalary);
    if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
      showAlert("Enter a valid base salary.", "error");
      return;
    }
    await linkEmployee.mutateAsync({ employeeUserId: row.userId, templateId, baseSalaryOverride: parsedSalary });
    showAlert("Salary calculation updated.", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-white">
      <form onSubmit={submit} className="w-full h-full bg-white overflow-y-auto">
        <div className="sticky top-0 z-10 px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Update Salary Calculation</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{row.name}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 lg:p-8 space-y-4 max-w-2xl mx-auto">
          {templatesLoading ? <LoadingSpinner label="Loading templates..." /> : null}
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Payroll Template</span>
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
              <option value="">Select template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Base Salary Override</span>
            <input value={baseSalary} onChange={(event) => setBaseSalary(event.target.value)} inputMode="decimal" className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" />
          </label>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[11px] font-semibold text-slate-500">
            Saving recalculates allowances, deductions, gross pay, and net pay from the selected template.
          </div>
        </div>
        <div className="sticky bottom-0 px-6 py-4 border-t border-slate-100 bg-white flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={linkEmployee.isPending} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black hover:bg-blue-700 disabled:opacity-60">
            {linkEmployee.isPending ? "Saving..." : "Save calculation"}
          </button>
        </div>
      </form>
    </div>
  );
}
