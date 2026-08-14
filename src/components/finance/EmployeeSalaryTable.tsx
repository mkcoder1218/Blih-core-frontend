import React from "react";
import { createPortal } from "react-dom";
import { Calculator, Check, Download, Filter, MoreHorizontal, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { LoadingSpinner, SectionCard, StatCard, StatCardGrid } from "@/components/ui/blih";
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
import { exportEmployeeSalaries, markSelectedEmployeeSalariesPaid, removeSalaryDeduction } from "../../api/finance";

type Props = {
  showAlert: (message: string, type?: "success" | "info" | "error") => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const COLUMN_STORAGE_KEY = "employee-salaries-visible-columns";
const REQUIRED_COLUMN_IDS = ["employee", "salarySummary", "actions"];
const DEFAULT_COLUMN_IDS = ["employee", "payPeriod", "salarySummary", "status", "actions"];
const OLD_DEFAULT_COLUMN_IDS = ["employee", "payPeriod", "grossSalary", "totalDeductions", "netSalary", "status", "actions"];
const MORE_DETAIL_COLUMN_IDS = [
  "employee",
  "payPeriod",
  "department",
  "employmentType",
  "salaryTemplate",
  "salarySummary",
  "basicSalary",
  "grossSalary",
  "taxableAmount",
  "incomeTaxPaye",
  "employeePension",
  "totalDeductions",
  "deductionReasonsCount",
  "attendanceDeduction",
  "overtime",
  "netSalary",
  "status",
  "actions",
];

type SalaryColumnGroup = "Default View" | "Employee Details" | "Salary Details" | "Tax and Pension" | "Deductions" | "Metadata";
type SalaryColumnId =
  | "employee"
  | "payPeriod"
  | "salarySummary"
  | "grossSalary"
  | "totalDeductions"
  | "netSalary"
  | "status"
  | "actions"
  | "employeeId"
  | "tin"
  | "paymentDate"
  | "basicSalary"
  | "taxableAmount"
  | "incomeTaxPaye"
  | "employeePension"
  | "employerPension"
  | "deductionReasonsCount"
  | "department"
  | "employmentType"
  | "salaryTemplate"
  | "approvedLeave"
  | "attendanceDeduction"
  | "overtime"
  | "createdAt"
  | "updatedAt";

type SalaryColumnConfig = {
  id: SalaryColumnId;
  label: string;
  group: SalaryColumnGroup;
  required?: boolean;
  cellClassName?: string;
};

const SALARY_COLUMNS: SalaryColumnConfig[] = [
  { id: "employee", label: "Employee", group: "Default View", required: true, cellClassName: "min-w-[240px]" },
  { id: "payPeriod", label: "Pay Period", group: "Default View" },
  { id: "salarySummary", label: "Salary Summary", group: "Default View", required: true, cellClassName: "min-w-[360px]" },
  { id: "grossSalary", label: "Gross Salary", group: "Default View" },
  { id: "totalDeductions", label: "Total Deductions", group: "Default View" },
  { id: "netSalary", label: "Net Salary", group: "Default View" },
  { id: "status", label: "Status", group: "Default View" },
  { id: "actions", label: "Actions", group: "Default View", required: true },
  { id: "employeeId", label: "Employee ID", group: "Employee Details" },
  { id: "tin", label: "TIN", group: "Employee Details" },
  { id: "department", label: "Department", group: "Employee Details" },
  { id: "employmentType", label: "Employment Type", group: "Employee Details" },
  { id: "salaryTemplate", label: "Salary Template", group: "Employee Details" },
  { id: "paymentDate", label: "Payment Date", group: "Salary Details" },
  { id: "basicSalary", label: "Basic Salary", group: "Salary Details" },
  { id: "taxableAmount", label: "Taxable Amount", group: "Salary Details" },
  { id: "overtime", label: "Overtime", group: "Salary Details" },
  { id: "incomeTaxPaye", label: "Income Tax PAYE", group: "Tax and Pension" },
  { id: "employeePension", label: "Employee Pension", group: "Tax and Pension" },
  { id: "employerPension", label: "Employer Pension", group: "Tax and Pension" },
  { id: "deductionReasonsCount", label: "Deduction Reasons Count", group: "Deductions" },
  { id: "approvedLeave", label: "Approved Leave", group: "Deductions" },
  { id: "attendanceDeduction", label: "Attendance Deduction", group: "Deductions" },
  { id: "createdAt", label: "Created At", group: "Metadata" },
  { id: "updatedAt", label: "Updated At", group: "Metadata" },
];
const SALARY_COLUMN_IDS = SALARY_COLUMNS.map((column) => column.id);
const SALARY_COLUMN_GROUPS: SalaryColumnGroup[] = ["Default View", "Employee Details", "Salary Details", "Tax and Pension", "Deductions", "Metadata"];

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

function nextDateValue(value?: string | null) {
  if (!value) return "";
  const next = new Date(`${value}T00:00:00`);
  if (Number.isNaN(next.getTime())) return "";
  next.setDate(next.getDate() + 1);
  return next.toISOString().slice(0, 10);
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
  const salaryInfo = row.salaryInfo || {};
  const originalSalaryValues = [
    salaryInfo.baseSalary,
    salaryInfo.monthlySalary,
    salaryInfo.salary,
    salaryInfo.netSalary,
    salaryInfo.targetNetSalary,
    salaryInfo.targetNetPay,
    salaryInfo.netPay,
    row.targetNetSalary,
  ].map((value) => Number(value || 0)).filter((value) => value > 0);
  const hasUnpaidOriginalSalary = originalSalaryValues.some((value) => value <= 1);
  const hasTokenPayroll = [
    row.baseSalary,
    row.grossPay,
    row.taxableAmount,
    row.netPay,
    row.totalCostToCompany,
  ].some((value) => {
    const numeric = Number(value || 0);
    return numeric > 0 && numeric <= 2;
  });
  return hasUnpaidOriginalSalary || hasTokenPayroll;
}

function normalizeColumnIds(value: unknown): SalaryColumnId[] {
  const source = Array.isArray(value) ? value : DEFAULT_COLUMN_IDS;
  const seen = new Set<string>();
  const ids = source
    .filter((id): id is SalaryColumnId => typeof id === "string" && SALARY_COLUMN_IDS.includes(id as SalaryColumnId))
    .filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  REQUIRED_COLUMN_IDS.forEach((id) => {
    if (!seen.has(id)) ids.push(id as SalaryColumnId);
  });
  return SALARY_COLUMN_IDS.filter((id) => ids.includes(id));
}

function loadVisibleColumnIds() {
  if (typeof window === "undefined") return normalizeColumnIds(DEFAULT_COLUMN_IDS);
  try {
    const saved = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : DEFAULT_COLUMN_IDS;
    if (Array.isArray(parsed) && parsed.join(",") === OLD_DEFAULT_COLUMN_IDS.join(",")) return normalizeColumnIds(DEFAULT_COLUMN_IDS);
    return normalizeColumnIds(parsed);
  } catch {
    return normalizeColumnIds(DEFAULT_COLUMN_IDS);
  }
}

function activeDeductionItems(row: EmployeeSalaryRow, matcher: (item: SalaryDeductionItem) => boolean) {
  return (row.deductionItems ?? []).filter((item) => item.status === "active" && matcher(item));
}

function deductionAmount(row: EmployeeSalaryRow, matcher: (item: SalaryDeductionItem) => boolean) {
  return activeDeductionItems(row, matcher).reduce((sum, item) => sum + Number(item.amount || 0), 0);
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
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [activeRow, setActiveRow] = React.useState<EmployeeSalaryRow | null>(null);
  const [editRow, setEditRow] = React.useState<EmployeeSalaryRow | null>(null);
  const [editingBaseUserId, setEditingBaseUserId] = React.useState<string | null>(null);
  const [baseDraft, setBaseDraft] = React.useState("");
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [payingSelected, setPayingSelected] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [showMoreDetails, setShowMoreDetails] = React.useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = React.useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = React.useState(false);
  const [actionMenuUserId, setActionMenuUserId] = React.useState<string | null>(null);
  const [visibleColumnIds, setVisibleColumnIds] = React.useState<SalaryColumnId[]>(loadVisibleColumnIds);
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

  React.useEffect(() => {
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumnIds));
  }, [visibleColumnIds]);

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
  const selectedUserIdSet = React.useMemo(() => new Set(selectedUserIds), [selectedUserIds]);
  const visibleRowIds = React.useMemo(() => rows.map((row) => row.userId), [rows]);
  const selectedRowsOnPageCount = React.useMemo(
    () => visibleRowIds.filter((userId) => selectedUserIdSet.has(userId)).length,
    [visibleRowIds, selectedUserIdSet]
  );
  const allRowsOnPageSelected = visibleRowIds.length > 0 && selectedRowsOnPageCount === visibleRowIds.length;
  const hasSomeRowsOnPageSelected = selectedRowsOnPageCount > 0 && !allRowsOnPageSelected;
  const selectPageCheckboxRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (selectPageCheckboxRef.current) {
      selectPageCheckboxRef.current.indeterminate = hasSomeRowsOnPageSelected;
    }
  }, [hasSomeRowsOnPageSelected]);

  const pagination = salaries.data?.pagination ?? {};
  const totals = salaries.data?.meta?.totals ?? {};
  const total = Number(pagination.total ?? pagination.count ?? 0);
  const totalPages = Math.max(Number((salaries.data?.meta?.totalPages ?? pagination.totalPages ?? Math.ceil(total / limit)) || 1), 1);
  const visibleColumns = React.useMemo(
    () => SALARY_COLUMNS.filter((column) => visibleColumnIds.includes(column.id)),
    [visibleColumnIds]
  );
  const activeFilters = React.useMemo(() => {
    const chips: Array<{ key: string; label: string }> = [];
    const department = (departments.data?.departments ?? []).find((item) => item.id === departmentId);
    const template = (templates.data ?? []).find((item) => item.id === templateId);
    const employment = EMPLOYMENT_STATUS_OPTIONS.find((item) => item.value === employmentStatus);
    if (departmentId) chips.push({ key: "department", label: `Department: ${department?.name || "Selected"}` });
    if (employmentStatus) chips.push({ key: "employment", label: `Employment: ${employment?.label || employmentStatus}` });
    if (payrollStatus) chips.push({ key: "status", label: `Status: ${payrollStatus === "linked" ? "Configured" : "Needs setup"}` });
    if (dateFrom || dateTo) chips.push({ key: "period", label: `Salary period: ${dateFrom || "-"} to ${dateTo || "-"}` });
    if (templateId) chips.push({ key: "template", label: `Template: ${template?.name || "Selected"}` });
    if (limit !== 10) chips.push({ key: "limit", label: `${limit}/page` });
    return chips;
  }, [departmentId, departments.data?.departments, employmentStatus, payrollStatus, dateFrom, dateTo, templateId, templates.data, limit]);

  const setColumns = (ids: string[]) => setVisibleColumnIds(normalizeColumnIds(ids));

  const resetColumns = () => {
    setShowMoreDetails(false);
    setColumns(DEFAULT_COLUMN_IDS);
  };

  const clearFilters = () => {
    setPage(1);
    setDepartmentId("");
    setEmploymentStatus("");
    setPayrollStatus("");
    setTemplateId("");
    setDateFrom("");
    setDateTo("");
    setLimit(10);
  };

  const toggleShowMoreDetails = () => {
    setShowMoreDetails((current) => {
      const next = !current;
      setColumns(next ? MORE_DETAIL_COLUMN_IDS : DEFAULT_COLUMN_IDS);
      return next;
    });
  };

  const toggleColumn = (id: SalaryColumnId) => {
    if (REQUIRED_COLUMN_IDS.includes(id)) return;
    setVisibleColumnIds((current) => {
      const next = current.includes(id) ? current.filter((columnId) => columnId !== id) : [...current, id];
      return normalizeColumnIds(next);
    });
  };

  const toggleSelectedUser = React.useCallback((userId: string) => {
    setSelectedUserIds((current) => current.includes(userId)
      ? current.filter((value) => value !== userId)
      : [...current, userId]);
  }, []);

  const toggleSelectCurrentPage = React.useCallback(() => {
    setSelectedUserIds((current) => {
      const next = new Set(current);
      const shouldClearPage = visibleRowIds.length > 0 && visibleRowIds.every((userId) => next.has(userId));
      visibleRowIds.forEach((userId) => {
        if (shouldClearPage) next.delete(userId);
        else next.add(userId);
      });
      return Array.from(next);
    });
  }, [visibleRowIds]);

  const clearSelectedUsers = React.useCallback(() => {
    setSelectedUserIds([]);
  }, []);

  const renderActions = (row: EmployeeSalaryRow) => (
    <div className="relative inline-flex" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={() => setActionMenuUserId((current) => current === row.userId ? null : row.userId)}
        className="w-8 h-8 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-700 inline-flex items-center justify-center"
        title="Row actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {actionMenuUserId === row.userId && (
        <div className="absolute right-0 top-9 z-30 w-44 rounded-xl border border-slate-100 bg-white shadow-xl py-1 text-xs font-bold text-slate-700 flex flex-col overflow-hidden">
          <button type="button" onClick={() => { setActiveRow(row); setActionMenuUserId(null); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">View Details</button>
          <button type="button" onClick={() => { setDeductionRow(row); setActionMenuUserId(null); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">View Deductions</button>
          <button type="button" onClick={() => { setEditRow(row); setActionMenuUserId(null); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Edit Salary</button>
          {String(row.paymentStatus || "").toLowerCase() !== "paid" && (
            <button type="button" onClick={() => { setEditRow(row); setActionMenuUserId(null); }} className="block w-full px-3 py-2 text-left hover:bg-slate-50">Mark Paid</button>
          )}
        </div>
      )}
    </div>
  );

  const renderCell = (row: EmployeeSalaryRow, columnId: SalaryColumnId) => {
    const approvedLeaveCount = activeDeductionItems(row, (item) => item.reasonType === "leave").length;
    const attendanceTotal = deductionAmount(row, (item) => item.sourceModule === "attendance");
    switch (columnId) {
      case "employee":
        return (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center text-[11px] font-black">
              {initials(row.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">{row.name}</p>
              <p className="text-[9px] font-semibold text-slate-400 truncate">{row.email || row.employeeCode || "No email"}</p>
            </div>
          </div>
        );
      case "employeeId":
        return row.employeeCode || row.userId.slice(0, 8);
      case "tin":
        return row.tin || "-";
      case "payPeriod":
        return row.payPeriod || "-";
      case "paymentDate":
        return dateText(row.paymentDate);
      case "salarySummary":
        return (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-5">
            <span className="font-black text-slate-900">Gross: {money(row.grossPay, row.currency)}</span>
            <span className="text-slate-300">.</span>
            <span className="font-black text-rose-600">Deduct: {money(row.deductionTotal ?? row.totalDeductions, row.currency)}</span>
            <span className="text-slate-300">.</span>
            <span className="font-black text-emerald-700">Net: {money(row.netPay, row.currency)}</span>
          </div>
        );
      case "basicSalary":
        return (
          <div onDoubleClick={(event) => { event.stopPropagation(); startBaseEdit(row); }}>
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
                <button onClick={() => saveBaseEdit(row)} disabled={updateBaseSalary.isPending} className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 inline-flex items-center justify-center disabled:opacity-50" title="Save base salary">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={cancelBaseEdit} className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center justify-center" title="Cancel">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="cursor-text" title="Double-click to edit">{money(row.baseSalary, row.currency)}</span>
            )}
          </div>
        );
      case "grossSalary":
        return money(row.grossPay, row.currency);
      case "taxableAmount":
        return money(row.taxableAmount, row.currency);
      case "incomeTaxPaye":
        return money(row.taxDeduction, row.currency);
      case "employeePension":
        return money(row.employeePensionContribution ?? row.pensionDeduction, row.currency);
      case "employerPension":
        return money(row.employerPensionContribution, row.currency);
      case "totalDeductions":
        return money(row.deductionTotal ?? row.totalDeductions, row.currency);
      case "deductionReasonsCount":
        return `${Number(row.deductionCount || 0)} reasons`;
      case "approvedLeave":
        return approvedLeaveCount ? `${approvedLeaveCount} record${approvedLeaveCount === 1 ? "" : "s"}` : "-";
      case "attendanceDeduction":
        return money(attendanceTotal, row.currency);
      case "netSalary":
        return money(row.netPay, row.currency);
      case "department":
        return row.department?.name || "-";
      case "employmentType":
        return row.employmentType || "-";
      case "salaryTemplate":
        return row.templateName || "-";
      case "overtime":
        return money(row.overtimePay, row.currency);
      case "createdAt":
        return dateText(row.createdAt || row.linkedAt || row.hireDate);
      case "updatedAt":
        return dateText(row.lastUpdated);
      case "status":
        return <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{row.paymentStatus || "Pending"}</span>;
      case "actions":
        return renderActions(row);
      default:
        return "-";
    }
  };

  const cellTone = (columnId: SalaryColumnId) => {
    if (["totalDeductions", "incomeTaxPaye", "employeePension", "attendanceDeduction"].includes(columnId)) return "text-rose-600 font-bold";
    if (columnId === "netSalary") return "text-emerald-700 font-black";
    if (["grossSalary", "basicSalary", "salarySummary"].includes(columnId)) return "text-slate-900 font-black";
    return "text-slate-700 font-bold";
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const selectionParams = selectedUserIds.length
        ? {
            selectedUserIds: selectedUserIds.join(","),
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            columns: visibleColumnIds.join(","),
          }
        : {
            q: search || undefined,
            payrollStatus: payrollStatus || undefined,
            templateId: templateId || undefined,
            departmentId: departmentId || undefined,
            employmentStatus: employmentStatus || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            columns: visibleColumnIds.join(","),
          };
      const res = await exportEmployeeSalaries(selectionParams);
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

  const markSelectedPaid = async () => {
    if (!selectedUserIds.length) {
      showAlert("Select at least one employee first.", "error");
      return;
    }
    if (!dateFrom || !dateTo) {
      showAlert("Choose both start and end dates before marking the selected salary interval as paid.", "error");
      return;
    }

    setPayingSelected(true);
    try {
      const response = await markSelectedEmployeeSalariesPaid({
        selectedUserIds,
        dateFrom,
        dateTo,
        payDate: dateTo,
      });
      const result = response.data?.data || {};
      clearSelectedUsers();
      setPage(1);
      setDateFrom(nextDateValue(dateTo));
      setDateTo("");
      showAlert(
        result.skippedCount
          ? `${result.paidCount || 0} salary interval(s) marked paid. ${result.skippedCount} skipped.`
          : `${result.paidCount || 0} salary interval(s) marked paid and the next interval has started.`,
        result.skippedCount ? "info" : "success"
      );
    } catch (error: any) {
      showAlert(error?.response?.data?.error || "Could not mark the selected salary interval as paid.", "error");
    } finally {
      setPayingSelected(false);
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
            <div className="relative">
              <button
                type="button"
                onClick={() => setColumnMenuOpen((value) => !value)}
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-black hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Configure Columns
              </button>
              {columnMenuOpen && (
                <ColumnConfigPopover
                  columns={SALARY_COLUMNS}
                  groups={SALARY_COLUMN_GROUPS}
                  visibleColumnIds={visibleColumnIds}
                  requiredColumnIds={REQUIRED_COLUMN_IDS}
                  onToggle={toggleColumn}
                  onReset={resetColumns}
                  onClose={() => setColumnMenuOpen(false)}
                />
              )}
            </div>
            <button
              onClick={toggleShowMoreDetails}
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
              {exporting ? "Exporting..." : selectedUserIds.length ? `Export Selected (${selectedUserIds.length})` : "Export CSV"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_150px_150px_auto] gap-3">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search by employee name or email"
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                />
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => { setPage(1); setDateFrom(event.target.value); }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                title="Account created from"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(event) => { setPage(1); setDateTo(event.target.value); }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                title="Account created to"
              />
              <button
                type="button"
                onClick={() => setFilterPanelOpen((value) => !value)}
                className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-black hover:bg-slate-50 inline-flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilters.length > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] inline-flex items-center justify-center">{activeFilters.length}</span>}
              </button>
            </div>

            {filterPanelOpen && (
              <div className="absolute right-0 top-12 z-20 w-[min(94vw,560px)] rounded-2xl border border-slate-100 bg-white shadow-2xl p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <button type="button" onClick={clearFilters} className="h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700 hover:bg-slate-100">
                    Clear filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {(activeFilters.length > 0 || selectedUserIds.length > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((chip) => (
                <span key={chip.key} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{chip.label}</span>
              ))}
              {selectedUserIds.length > 0 ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">
                  {selectedUserIds.length} selected
                </span>
              ) : null}
              {activeFilters.length > 0 ? (
                <button type="button" onClick={clearFilters} className="text-[10px] font-black text-blue-700 hover:text-blue-800">
                  Clear filters
                </button>
              ) : null}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
            <div className="text-[11px] font-bold text-slate-600">
              {selectedUserIds.length
                ? `${selectedUserIds.length} employees selected for export or interval payment`
                : "Select employees across pages, then use export or mark the filtered interval as paid."}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={markSelectedPaid}
                disabled={!selectedUserIds.length || !dateFrom || !dateTo || payingSelected}
                className="h-8 px-3 rounded-lg bg-emerald-600 text-[11px] font-black text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                title={!dateFrom || !dateTo ? "Select a start and end date to mark the salary interval as paid." : "Mark the selected salary interval as paid"}
              >
                <Check className="w-3.5 h-3.5" />
                {payingSelected ? "Paying..." : selectedUserIds.length ? `Make Paid (${selectedUserIds.length})` : "Make Paid"}
              </button>
              <button
                type="button"
                onClick={toggleSelectCurrentPage}
                disabled={!visibleRowIds.length}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allRowsOnPageSelected ? "Unselect Page" : "Select Page"}
              </button>
              {selectedUserIds.length > 0 ? (
                <button
                  type="button"
                  onClick={clearSelectedUsers}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[11px] font-black text-slate-700 hover:bg-slate-50"
                >
                  Clear Selection
                </button>
              ) : null}
            </div>
          </div>

          <div className="hidden md:block rounded-2xl border border-slate-100 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
                    <input
                      ref={selectPageCheckboxRef}
                      type="checkbox"
                      checked={allRowsOnPageSelected}
                      onChange={() => toggleSelectCurrentPage()}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      aria-label={allRowsOnPageSelected ? "Unselect current page employees" : "Select current page employees"}
                    />
                  </th>
                  {visibleColumns.map((column) => (
                    <th key={column.id} className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {salaries.isLoading ? (
                  <tr>
                    <td className="px-4 py-10 text-center" colSpan={visibleColumns.length + 1}>
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : rows.length ? rows.map((row) => (
                  <tr key={row.userId} className="hover:bg-slate-50/70 cursor-pointer" onClick={() => setDeductionRow(row)}>
                    <td className="px-4 py-2" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUserIdSet.has(row.userId)}
                        onChange={() => toggleSelectedUser(row.userId)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    {visibleColumns.map((column) => (
                      <td key={column.id} className={`px-3 py-2 text-xs whitespace-nowrap ${column.cellClassName || ""} ${cellTone(column.id)}`}>
                        {renderCell(row, column.id)}
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-xs font-bold text-slate-400" colSpan={visibleColumns.length + 1}>
                      No employee salary records match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden grid gap-3">
            {salaries.isLoading ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 flex justify-center"><LoadingSpinner /></div>
            ) : rows.length ? rows.map((row) => (
              <div key={row.userId} role="button" tabIndex={0} onClick={() => setDeductionRow(row)} onKeyDown={(event) => { if (event.key === "Enter") setDeductionRow(row); }} className="text-left rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedUserIdSet.has(row.userId)}
                        onChange={() => toggleSelectedUser(row.userId)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select ${row.name}`}
                      />
                    </div>
                    {renderCell(row, "employee")}
                  </div>
                  {renderActions(row)}
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400">Pay Period</span>
                    <span className="text-xs font-bold text-slate-700">{renderCell(row, "payPeriod")}</span>
                  </div>
                  <div>{renderCell(row, "salarySummary")}</div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
                    <span>{renderCell(row, "status")}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-xs font-bold text-slate-400">
                No employee salary records match these filters.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-500">
            <span>{total ? `${(page - 1) * limit + 1}-${Math.min(page * limit, total)} of ${total} employees` : "No employees"}{selectedUserIds.length ? ` . ${selectedUserIds.length} selected` : ""}</span>
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

function ColumnConfigPopover({
  columns,
  groups,
  visibleColumnIds,
  requiredColumnIds,
  onToggle,
  onReset,
  onClose,
}: {
  columns: SalaryColumnConfig[];
  groups: SalaryColumnGroup[];
  visibleColumnIds: SalaryColumnId[];
  requiredColumnIds: string[];
  onToggle: (id: SalaryColumnId) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-11 z-30 w-[min(92vw,360px)] rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-900">Configure Columns</h3>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{visibleColumnIds.length} visible columns</p>
        </div>
        <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-50 text-slate-500 inline-flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-3 space-y-3">
        {groups.map((group) => {
          const groupedColumns = columns.filter((column) => column.group === group);
          if (!groupedColumns.length) return null;
          return (
            <div key={group}>
              <p className="px-1 pb-1 text-[10px] font-black uppercase text-slate-400">{group}</p>
              <div className="grid gap-1">
                {groupedColumns.map((column) => {
                  const checked = visibleColumnIds.includes(column.id);
                  const required = column.required || requiredColumnIds.includes(column.id);
                  return (
                    <label key={column.id} className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs font-bold ${required ? "bg-slate-50 text-slate-400" : "hover:bg-blue-50 text-slate-700 cursor-pointer"}`}>
                      <span>{column.label}</span>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={required}
                        onChange={() => onToggle(column.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
        <button type="button" onClick={onReset} className="text-xs font-black text-blue-700 hover:text-blue-800">
          Reset to Default
        </button>
        <button type="button" onClick={onClose} className="h-8 px-3 rounded-lg bg-slate-900 text-white text-xs font-black hover:bg-slate-800">
          Done
        </button>
      </div>
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
