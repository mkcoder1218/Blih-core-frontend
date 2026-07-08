import React from "react";
import { createPortal } from "react-dom";
import { Calculator, Check, Download, Eye, Filter, Pencil, Search, Trash2, X } from "lucide-react";
import { DataTable, LoadingSpinner, SectionCard, StatCard, StatCardGrid } from "@/components/ui/blih";
import {
  useEmployeeSalaries,
  useLinkEmployee,
  usePayrollTemplates,
  useUpdateEmployeeBaseSalary,
  type EthiopianTaxAllowanceLine,
  type EmployeeSalaryRow,
  type SalaryDeductionItem,
} from "../../hooks/useWorkforceFinance";
import { useDepartments } from "../../hooks/useDepartments";
import { EMPLOYMENT_STATUS_OPTIONS } from "../../constants/employee";
import { exportEmployeeSalaries, removeSalaryDeduction } from "../../api/finance";

type Props = {
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function currentMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

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

function dateText(value?: string | null) {
  return value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

function inputMoney(value?: number | null) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? String(Math.round(numeric * 100) / 100) : "0";
}

function inputNumber(value: string, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function incomeTaxBracket(taxableIncome: number) {
  if (taxableIncome >= 2001 && taxableIncome <= 4000) return { rate: 0.15, deduction: 300 };
  if (taxableIncome >= 4001 && taxableIncome <= 7000) return { rate: 0.20, deduction: 500 };
  if (taxableIncome >= 7001 && taxableIncome <= 10000) return { rate: 0.25, deduction: 850 };
  if (taxableIncome >= 10001 && taxableIncome <= 14000) return { rate: 0.30, deduction: 1350 };
  if (taxableIncome > 14000) return { rate: 0.35, deduction: 2050 };
  return { rate: 0, deduction: 0 };
}

function taxTreatmentLabel(value?: string) {
  if (!value) return "-";
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function deductionGroupLabel(value?: string) {
  const key = String(value || "other").toLowerCase();
  if (key.includes("attendance")) return "Attendance deductions";
  if (key.includes("leave")) return "Leave deductions";
  if (key.includes("missed")) return "Missed day deductions";
  if (key.includes("late")) return "Late arrival deductions";
  if (key.includes("early")) return "Early checkout deductions";
  if (key.includes("penalty")) return "Attendance penalty deductions";
  if (key.includes("tax")) return "Income tax deductions";
  if (key.includes("pension")) return "Pension deductions";
  if (key.includes("loan")) return "Loan deductions";
  return "Other deductions";
}

function groupDeductions(items: SalaryDeductionItem[] = []) {
  return items
    .filter((item) => item.status === "active")
    .reduce((groups, item) => {
      const label = deductionGroupLabel(item.reasonType);
      groups[label] ||= [];
      groups[label].push(item);
      return groups;
    }, {} as Record<string, SalaryDeductionItem[]>);
}

function isUnpaidSalaryMarker(row: EmployeeSalaryRow) {
  return Number(row.baseSalary || 0) === 1
    && Number(row.grossPay || 0) === 1
    && Number(row.taxableAmount || 0) === 1;
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
  const [dateFrom, setDateFrom] = React.useState(currentMonthStart);
  const [dateTo, setDateTo] = React.useState(todayText);
  const [activeRow, setActiveRow] = React.useState<EmployeeSalaryRow | null>(null);
  const [editRow, setEditRow] = React.useState<EmployeeSalaryRow | null>(null);
  const [editingBaseUserId, setEditingBaseUserId] = React.useState<string | null>(null);
  const [baseDraft, setBaseDraft] = React.useState("");
  const [exporting, setExporting] = React.useState(false);
  const [showMoreDetails, setShowMoreDetails] = React.useState(false);
  const [revealedBankAccounts, setRevealedBankAccounts] = React.useState<Record<string, boolean>>({});
  const [deductionRow, setDeductionRow] = React.useState<EmployeeSalaryRow | null>(null);
  const [deductionToRemove, setDeductionToRemove] = React.useState<SalaryDeductionItem | null>(null);
  const [removingDeduction, setRemovingDeduction] = React.useState(false);

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
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, limit, search, payrollStatus, templateId, departmentId, employmentStatus, dateFrom, dateTo]
  );

  const salaries = useEmployeeSalaries(params);
  const templates = usePayrollTemplates();
  const departments = useDepartments({ size: 200 });
  const updateBaseSalary = useUpdateEmployeeBaseSalary();
  const rows = (salaries.data?.rows ?? []).filter((row) => !isUnpaidSalaryMarker(row));
  const pagination = salaries.data?.pagination ?? {};
  const totals = salaries.data?.meta?.totals ?? {};
  const total = Number(pagination.total ?? pagination.count ?? 0);
  const totalPages = Math.max(Number((salaries.data?.meta?.totalPages ?? pagination.totalPages ?? Math.ceil(total / limit)) || 1), 1);
  const columns = React.useMemo(
    () => [
      "Employee ID",
      "Full Name",
      "TIN",
      "Pay Period",
      "Payment Date",
      "Basic Salary",
      "Gross Salary",
      "Taxable Amount",
      "Income Tax (PAYE)",
      "Employee Pension",
      "Total Deductions",
      "Net Salary",
      "Employer Pension",
      "Total Cost",
      "Bank Account",
      "Payment Status",
      "Remarks",
      ...(showMoreDetails ? [
        "Housing",
        "Transport",
        "Other Allowances",
        "Overtime",
        "Bonus",
        "Arrears",
        "Loan",
        "Other Deductions",
        "Working Days",
        "Days Paid",
        "Generated By",
        "Approved By",
        "Last Updated",
      ] : []),
      "Actions",
    ],
    [showMoreDetails]
  );

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await exportEmployeeSalaries({
        q: search || undefined,
        payrollStatus: payrollStatus || undefined,
        templateId: templateId || undefined,
        departmentId: departmentId || undefined,
        employmentStatus: employmentStatus || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        showMoreDetails,
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

  const confirmRemoveDeduction = async () => {
    if (!deductionToRemove) return;
    setRemovingDeduction(true);
    try {
      await removeSalaryDeduction(deductionToRemove.id, { dateFrom, dateTo });
      showAlert("Deduction reason removed and salary total recalculated.", "success");
      setDeductionToRemove(null);
      await salaries.refetch();
    } catch (error: any) {
      showAlert(error?.response?.data?.error || "Could not remove deduction reason.", "error");
    } finally {
      setRemovingDeduction(false);
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
              onClick={() => setShowMoreDetails((value) => !value)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-black hover:bg-slate-50 inline-flex items-center gap-2"
            >
              <Filter className="w-3.5 h-3.5" />
              {showMoreDetails ? "Hide More" : "Show More Details"}
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
          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_140px_150px_150px_170px_110px] gap-3">
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
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => { setPage(1); setDateFrom(event.target.value); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
              title="Deduction period start"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(event) => { setPage(1); setDateTo(event.target.value); }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
              title="Deduction period end"
            />
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
            columns={columns}
            rows={rows}
            loading={salaries.isLoading}
            emptyMessage="No employee salary records match these filters."
            renderRow={(row) => {
              return (
              <tr
                key={row.userId}
                className="border-b border-slate-100 hover:bg-slate-50/70 cursor-pointer"
                onClick={() => setDeductionRow(row)}
              >
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.employeeCode || row.userId.slice(0, 8)}</td>
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
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.tin || "-"}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.payPeriod || "-"}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{dateText(row.paymentDate)}</td>
                <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap" onDoubleClick={() => startBaseEdit(row)}>
                  {editingBaseUserId === row.userId ? (
                    <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
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
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.grossPay, row.currency)}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.taxableAmount, row.currency)}</td>
                <td className="px-4 py-3 text-xs font-bold text-rose-600 whitespace-nowrap">{money(row.taxDeduction, row.currency)}</td>
                <td className="px-4 py-3 text-xs font-bold text-rose-600 whitespace-nowrap">{money(row.employeePensionContribution ?? row.pensionDeduction, row.currency)}</td>
                <td className="px-4 py-3 text-xs font-bold text-rose-600 whitespace-nowrap">
                  <div className="inline-flex flex-col">
                    <span>{money(row.deductionTotal ?? row.totalDeductions, row.currency)}</span>
                    <span className="text-[10px] font-bold text-slate-400">{Number(row.deductionCount || 0)} reasons</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-black text-emerald-700 whitespace-nowrap">{money(row.netPay, row.currency)}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.employerPensionContribution, row.currency)}</td>
                <td className="px-4 py-3 text-xs font-black text-slate-900 whitespace-nowrap">{money(row.totalCostToCompany, row.currency)}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <span>{revealedBankAccounts[row.userId] ? (row.bankAccount || "-") : (row.bankAccountMasked || "-")}</span>
                    {row.bankAccount && (
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); setRevealedBankAccounts((current) => ({ ...current, [row.userId]: !current[row.userId] })); }}
                        className="w-7 h-7 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 inline-flex items-center justify-center"
                        title={revealedBankAccounts[row.userId] ? "Hide bank account" : "View bank account"}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-50 text-amber-700">{row.paymentStatus || "Pending"}</span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-500 min-w-[160px]">{row.remarks || "-"}</td>
                {showMoreDetails && (
                  <>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.housingAllowance, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.transportAllowance, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.otherAllowance, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.overtimePay, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.bonusIncentive, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{money(row.arrearsAdjustments, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-rose-600 whitespace-nowrap">{money(row.loanDeduction, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-rose-600 whitespace-nowrap">{money(row.otherDeduction, row.currency)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.workingDaysInPeriod || "-"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.daysPaid || "-"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.generatedBy || "-"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{row.approvedBy || "-"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{dateText(row.lastUpdated)}</td>
                  </>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                    <button onClick={() => setDeductionRow(row)} className="w-8 h-8 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 inline-flex items-center justify-center" title="Show deduction reasons">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveRow(row)} className="w-8 h-8 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 inline-flex items-center justify-center" title="View calculation">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditRow(row)} className="w-8 h-8 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 inline-flex items-center justify-center" title="Update salary calculation">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );}}
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
      {deductionRow && (
        <DeductionDetailsModal
          row={deductionRow}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onClose={() => setDeductionRow(null)}
          onRemove={(item) => setDeductionToRemove(item)}
        />
      )}
      {deductionToRemove && (
        <DeductionRemoveConfirm
          loading={removingDeduction}
          onClose={() => setDeductionToRemove(null)}
          onConfirm={confirmRemoveDeduction}
        />
      )}
      {editRow && (
        <UpdateSalaryModal
          row={editRow}
          templates={templates.data ?? []}
          templatesLoading={templates.isLoading}
          onClose={() => setEditRow(null)}
          onSaved={() => salaries.refetch()}
          showAlert={showAlert}
        />
      )}
    </div>
  );
}

function DeductionRemoveConfirm({
  loading,
  onClose,
  onConfirm,
}: {
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[10050] bg-slate-950/55 p-4 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-100 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 inline-flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Remove Deduction Reason</h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">Are you sure you want to remove this deduction reason?</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-10 rounded-xl bg-rose-600 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DeductionDetailsModal({
  row,
  dateFrom,
  dateTo,
  onClose,
  onRemove,
}: {
  row: EmployeeSalaryRow;
  dateFrom: string;
  dateTo: string;
  onClose: () => void;
  onRemove: (item: SalaryDeductionItem) => void;
}) {
  const deductionGroups = groupDeductions(row.deductionItems);
  const activeDeductions = row.deductionItems?.filter((item) => item.status === "active") ?? [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/50 p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full h-full max-w-[1600px] max-h-[94vh] rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Deduction Details</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">{row.name} - {dateFrom || "-"} to {dateTo || "-"} - {activeDeductions.length} salary-impacting reason(s)</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <span className="text-[10px] font-black uppercase text-blue-500">Payroll Net Before These Deductions</span>
              <p className="text-lg font-black text-blue-900 mt-1">{money(Number(row.netPay || 0) + Number(row.deductionTotal || 0), row.currency)}</p>
            </div>
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <span className="text-[10px] font-black uppercase text-rose-600">Attendance / Leave Deductions</span>
              <p className="text-lg font-black text-rose-900 mt-1">{money(row.deductionTotal, row.currency)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <span className="text-[10px] font-black uppercase text-emerald-600">Final Net Salary</span>
              <p className="text-lg font-black text-emerald-900 mt-1">{money(row.netPay, row.currency)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-900">Saved Deduction Snapshot</h4>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Payroll deductions such as income tax and pension are not listed here because they are already included in the payroll net calculation.</p>
            </div>
            <div className="divide-y divide-slate-100">
              {Object.entries(deductionGroups).length ? Object.entries(deductionGroups).map(([label, items]) => (
                <div key={label} className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h5 className="text-[11px] font-black uppercase text-slate-500">{label}</h5>
                    <span className="text-[11px] font-black text-rose-700">{money(items.reduce((sum, item) => sum + Number(item.amount || 0), 0), row.currency)}</span>
                  </div>
                  <div className="grid gap-2">
                    {items.map((item) => (
                      <div key={item.id} className="grid grid-cols-1 lg:grid-cols-[1fr_120px_120px_150px_90px] gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-xs">
                        <div>
                          <p className="font-black text-slate-800">{item.reasonLabel || item.reasonType}</p>
                          <p className="font-semibold text-slate-500 mt-0.5">{item.description}</p>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-400">Amount</span>
                          <strong className="text-rose-700">{money(item.amount, item.currency || row.currency)}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-400">Date</span>
                          <span className="font-bold text-slate-700">{dateText(item.relatedDate)}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-black uppercase text-slate-400">Source</span>
                          <span className="font-bold text-slate-700">{item.sourceModule}{item.sourceTable ? ` / ${item.sourceTable}` : ""}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">{item.status}</span>
                          <button type="button" onClick={() => onRemove(item)} className="w-8 h-8 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50 inline-flex items-center justify-center" title="Remove deduction reason">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="px-4 py-8 text-xs font-bold text-slate-400">No attendance, leave, missed-day, late-arrival, early-checkout, or incomplete-attendance deduction has been saved for this salary row.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
  onSaved,
  showAlert,
}: {
  row: EmployeeSalaryRow;
  templates: { id: string; name: string; currency: string }[];
  templatesLoading: boolean;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
  showAlert: Props["showAlert"];
}) {
  const [templateId, setTemplateId] = React.useState(row.templateId || templates[0]?.id || "");
  const [salaryInputMode, setSalaryInputMode] = React.useState<"base" | "net">(row.salaryInputMode === "net" ? "net" : "base");
  const [baseSalary, setBaseSalary] = React.useState(String(row.baseSalaryOverride ?? row.baseSalary ?? ""));
  const [netSalary, setNetSalary] = React.useState(inputMoney(row.targetNetSalary ?? row.netPay));
  const [pensionableSalary, setPensionableSalary] = React.useState(row.taxMeta?.pensionableSalary ? inputMoney(row.taxMeta.pensionableSalary) : "");
  const [transportAllowance, setTransportAllowance] = React.useState(inputMoney(row.transportAllowance));
  const [perDiemAllowance, setPerDiemAllowance] = React.useState(inputMoney(row.perDiemAllowance));
  const [perDiemDays, setPerDiemDays] = React.useState(inputMoney(row.perDiemDays));
  const [medicalBenefit, setMedicalBenefit] = React.useState(inputMoney(row.medicalBenefit));
  const [telecomAllowance, setTelecomAllowance] = React.useState(inputMoney(row.telecomAllowance));
  const [housingAllowance, setHousingAllowance] = React.useState(inputMoney(row.housingAllowance));
  const [mealAllowance, setMealAllowance] = React.useState(inputMoney(row.mealAllowance));
  const [otherAllowance, setOtherAllowance] = React.useState(inputMoney(row.otherAllowance));
  const [employeePensionRate, setEmployeePensionRate] = React.useState(inputMoney(row.taxMeta?.employeePensionRate ?? 7));
  const [employerPensionRate, setEmployerPensionRate] = React.useState(inputMoney(row.taxMeta?.employerPensionRate ?? 11));
  const linkEmployee = useLinkEmployee();
  const calculatePreview = React.useCallback((base: number, pensionableOverride?: number | null) => {
    const transport = inputNumber(transportAllowance);
    const perDiem = inputNumber(perDiemAllowance);
    const perDiemDaysValue = inputNumber(perDiemDays);
    const medical = inputNumber(medicalBenefit);
    const telecom = inputNumber(telecomAllowance);
    const housing = inputNumber(housingAllowance);
    const meal = inputNumber(mealAllowance);
    const other = inputNumber(otherAllowance);
    const salaryCap = base * 0.25;
    const transportCap = Math.min(2200, salaryCap);
    const perDiemDailyCap = Math.max(225, base * 0.04) * Math.max(perDiemDaysValue, 0);
    const perDiemCap = Math.min(2200, salaryCap, perDiemDaysValue > 0 ? perDiemDailyCap : 2200);
    const transportExempt = Math.min(transport, transportCap);
    const perDiemExempt = Math.min(perDiem, perDiemCap);
    const transportTaxable = Math.max(transport - transportExempt, 0);
    const perDiemTaxable = Math.max(perDiem - perDiemExempt, 0);
    const grossPay = base + transport + perDiem + medical + telecom + housing + meal + other;
    const taxableIncomeBeforeFringe = base + housing + meal + transportTaxable + perDiemTaxable;
    const fringeTaxable = telecom + other;
    const taxableIncome = taxableIncomeBeforeFringe + fringeTaxable;
    const baseTax = incomeTaxBracket(taxableIncomeBeforeFringe);
    const fullTax = incomeTaxBracket(taxableIncome);
    const incomeTaxBeforeFringe = Math.max(taxableIncomeBeforeFringe * baseTax.rate - baseTax.deduction, 0);
    const fullIncomeTax = Math.max(taxableIncome * fullTax.rate - fullTax.deduction, 0);
    const fringeTax = Math.min(Math.max(fullIncomeTax - incomeTaxBeforeFringe, 0), base * 0.1);
    const incomeTax = incomeTaxBeforeFringe + fringeTax;
    const pensionable = pensionableOverride && pensionableOverride > 0 ? pensionableOverride : base;
    const employeePension = pensionable * (inputNumber(employeePensionRate, 7) / 100);
    const employerPension = pensionable * (inputNumber(employerPensionRate, 11) / 100);
    const totalDeductions = incomeTax + employeePension;
    const netPay = Math.max(grossPay - totalDeductions, 0);
    return {
      baseSalary: base,
      grossPay,
      taxableIncome,
      incomeTax,
      employeePension,
      employerPension,
      totalDeductions,
      netPay,
      totalCostToCompany: grossPay + employerPension,
      transportExempt,
      transportTaxable,
      perDiemExempt,
      perDiemTaxable,
      medicalExempt: medical,
      fringeTax,
    };
  }, [
    employeePensionRate,
    employerPensionRate,
    housingAllowance,
    mealAllowance,
    medicalBenefit,
    otherAllowance,
    perDiemAllowance,
    perDiemDays,
    telecomAllowance,
    transportAllowance,
  ]);
  const calculationPreview = React.useMemo(() => {
    const pensionableOverride = pensionableSalary ? inputNumber(pensionableSalary) : null;
    if (salaryInputMode === "base") return calculatePreview(inputNumber(baseSalary), pensionableOverride);
    const calculateBaseOnlyNet = (base: number) => {
      const taxableIncome = base;
      const tax = incomeTaxBracket(taxableIncome);
      const incomeTax = Math.max(taxableIncome * tax.rate - tax.deduction, 0);
      const employeePension = base * (inputNumber(employeePensionRate, 7) / 100);
      return Math.max(base - incomeTax - employeePension, 0);
    };
    const targetNet = inputNumber(netSalary);
    let lower = 0;
    let upper = Math.max(targetNet * 2, 1000);
    while (calculateBaseOnlyNet(upper) < targetNet && upper < 1_000_000_000) upper *= 2;
    for (let i = 0; i < 70; i += 1) {
      const mid = (lower + upper) / 2;
      if (calculateBaseOnlyNet(mid) < targetNet) lower = mid;
      else upper = mid;
    }
    const base = Math.round(upper * 100) / 100;
    return calculatePreview(base, pensionableOverride ?? base);
  }, [baseSalary, calculatePreview, employeePensionRate, netSalary, pensionableSalary, salaryInputMode]);
  const effectivePensionableSalary = pensionableSalary || inputMoney(calculationPreview.baseSalary);

  React.useEffect(() => {
    if (!templateId && templates[0]?.id) setTemplateId(templates[0].id);
  }, [templateId, templates]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!templateId) {
      showAlert("Select a payroll template first.", "error");
      return;
    }
    const parsedSalary = Number(salaryInputMode === "net" ? netSalary : baseSalary);
    if (!Number.isFinite(parsedSalary) || parsedSalary < 0) {
      showAlert(`Enter a valid ${salaryInputMode === "net" ? "net" : "base"} salary.`, "error");
      return;
    }
    await linkEmployee.mutateAsync({
      employeeUserId: row.userId,
      templateId,
      salaryInputMode,
      calculationMode: "ethiopian",
      pensionableSalary: inputNumber(effectivePensionableSalary, calculationPreview.baseSalary),
      transportAllowance: Number(transportAllowance || 0),
      perDiemAllowance: Number(perDiemAllowance || 0),
      perDiemDays: Number(perDiemDays || 0),
      medicalBenefit: Number(medicalBenefit || 0),
      telecomAllowance: Number(telecomAllowance || 0),
      housingAllowance: Number(housingAllowance || 0),
      mealAllowance: Number(mealAllowance || 0),
      otherAllowance: Number(otherAllowance || 0),
      employeePensionRate: Number(employeePensionRate || 7),
      employerPensionRate: Number(employerPensionRate || 11),
      ...(salaryInputMode === "net" ? { netSalaryOverride: parsedSalary } : { baseSalaryOverride: parsedSalary }),
    });
    await onSaved();
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
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">Income tax mode</p>
            <p className="text-xs font-bold text-emerald-900 mt-0.5">Ethiopian statutory PAYE with pension defaults</p>
          </div>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">Payroll Template</span>
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500">
              <option value="">Select template</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 border border-slate-100 p-1">
            {(["base", "net"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSalaryInputMode(mode)}
                className={[
                  "h-9 rounded-lg text-xs font-black transition-colors",
                  salaryInputMode === mode ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700",
                ].join(" ")}
              >
                {mode === "base" ? "Base Salary" : "Net Salary"}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-400">{salaryInputMode === "net" ? "Net Salary Target" : "Base Salary Override"}</span>
            <input
              value={salaryInputMode === "net" ? netSalary : baseSalary}
              onChange={(event) => salaryInputMode === "net" ? setNetSalary(event.target.value) : setBaseSalary(event.target.value)}
              inputMode="decimal"
              className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ["Pensionable salary", effectivePensionableSalary, setPensionableSalary, "Uses base salary"],
              ["Transport allowance", transportAllowance, setTransportAllowance, "0"],
              ["Per diem allowance", perDiemAllowance, setPerDiemAllowance, "0"],
              ["Per diem travel days", perDiemDays, setPerDiemDays, "0"],
              ["Medical benefit / insurance", medicalBenefit, setMedicalBenefit, "0"],
              ["Telecom / phone / data", telecomAllowance, setTelecomAllowance, "0"],
              ["Housing allowance", housingAllowance, setHousingAllowance, "0"],
              ["Meal allowance", mealAllowance, setMealAllowance, "0"],
              ["Other allowance", otherAllowance, setOtherAllowance, "0"],
              ["Employee pension %", employeePensionRate, setEmployeePensionRate, "7"],
              ["Employer pension %", employerPensionRate, setEmployerPensionRate, "11"],
            ].map(([label, value, setter, placeholder]) => (
              <label key={label as string} className="block space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400">{label as string}</span>
                <input
                  value={value as string}
                  onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                  inputMode="decimal"
                  placeholder={placeholder as string}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                />
              </label>
            ))}
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-blue-100 bg-white/70">
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-700">Live payroll update note</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                {salaryInputMode === "net"
                  ? `${money(inputNumber(netSalary), row.currency)} target net derives ${money(calculationPreview.baseSalary, row.currency)} base salary and ${money(calculationPreview.netPay, row.currency)} final net after allowances.`
                  : `${money(calculationPreview.baseSalary, row.currency)} base salary produces ${money(calculationPreview.netPay, row.currency)} net pay.`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-blue-100 text-xs">
              {[
                ["Base", calculationPreview.baseSalary],
                ["Gross", calculationPreview.grossPay],
                ["Taxable", calculationPreview.taxableIncome],
                ["PAYE", calculationPreview.incomeTax],
                ["Transport Exempt", calculationPreview.transportExempt],
                ["Transport Taxable", calculationPreview.transportTaxable],
                ["Per Diem Exempt", calculationPreview.perDiemExempt],
                ["Per Diem Taxable", calculationPreview.perDiemTaxable],
                ["Medical Exempt", calculationPreview.medicalExempt],
                ["Fringe Tax", calculationPreview.fringeTax],
                ["Employee Pension", calculationPreview.employeePension],
                ["Deductions", calculationPreview.totalDeductions],
                ["Net Pay", calculationPreview.netPay],
                ["Employer Pension", calculationPreview.employerPension],
                ["Company Cost", calculationPreview.totalCostToCompany],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-white/85 px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="text-xs font-black text-slate-800 mt-0.5">{money(value as number, row.currency)}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-px bg-blue-100 border-t border-blue-100 text-xs">
              {[
                ["Transportation allowance", "Partially exempt", "Exempt up to ETB 2,200/month or 25% of salary, lower amount applies"],
                ["Per diem (official travel)", "Partially exempt", "Exempt up to ETB 225/day or 4% of salary per day, with ETB 2,200/month and 25% salary caps"],
                ["Medical treatment / insurance", "Generally exempt", "Actual cost is treated as exempt in this preview"],
                ["Housing and meal allowances", "Fully taxable", "Included in PAYE taxable income"],
                ["Telecom and other allowances", "Fringe benefit", "Tax on combined fringe benefits capped at 10% of salary"],
              ].map(([benefit, treatment, cap]) => (
                <div key={benefit} className="grid grid-cols-[1fr_0.8fr_1.4fr] gap-2 bg-white/85 px-3 py-2">
                  <p className="text-[10px] font-black text-slate-700">{benefit}</p>
                  <p className="text-[10px] font-bold text-blue-700">{treatment}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{cap}</p>
                </div>
              ))}
            </div>
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
