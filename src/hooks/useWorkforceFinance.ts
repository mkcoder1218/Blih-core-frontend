import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBudgetReallocation,
  decideFinanceApproval,
  getWorkforceFinance,
  listPayrollTemplates,
  createPayrollTemplate,
  updatePayrollTemplate,
  deletePayrollTemplate,
  previewPayrollCalculation,
  getPayrollDashboard,
  listEmployeeSalaries,
  updateEmployeeBaseSalary,
  linkEmployeeToTemplate,
  bulkLinkEmployeesToTemplate,
  unlinkEmployee,
} from "../api/finance";

export function useWorkforceFinance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["workforce-finance", params],
    queryFn: async () => {
      const res = await getWorkforceFinance(params);
      return res.data?.data ?? {};
    },
    staleTime: 15_000,
  });
}

// ── Self-scoped: my own payslip, payroll records, benefit enrollments ──────────
export function useMyFinanceData() {
  return useQuery({
    queryKey: ["my-finance-data"],
    queryFn: async () => {
      const { api } = await import("../api/client");
      const res = await api.get("/api/v1/finance/workforce/me");
      return res.data?.data ?? { expenses: [], payrollRecords: [], enrollments: [] };
    },
    staleTime: 30_000,
  });
}

export function useFinanceApprovalAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, action }: { kind: "salary" | "expense" | "budget"; id: string; action: "approve" | "reject" }) =>
      decideFinanceApproval(kind, id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workforce-finance"] });
    },
  });
}

export function useCreateBudgetReallocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createBudgetReallocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workforce-finance"] });
    },
  });
}

// ── Payroll Templates ──────────────────────────────────────────────────────────
export function usePayrollTemplates() {
  return useQuery({
    queryKey: ["payroll-templates"],
    queryFn: async () => {
      const res = await listPayrollTemplates();
      return (res.data?.data ?? []) as PayrollTemplate[];
    },
    staleTime: 30_000,
  });
}

export function useCreatePayrollTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createPayrollTemplate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll-templates"] }),
  });
}

export function useUpdatePayrollTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updatePayrollTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-templates"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
    },
  });
}

export function useDeletePayrollTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePayrollTemplate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll-templates"] }),
  });
}

export function usePreviewPayroll() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => previewPayrollCalculation(data),
  });
}

// ── Employee Payroll Links ─────────────────────────────────────────────────────
export function usePayrollDashboard() {
  return useQuery({
    queryKey: ["payroll-dashboard"],
    queryFn: async () => {
      const res = await getPayrollDashboard();
      return (res.data?.data ?? {}) as PayrollDashboard;
    },
    staleTime: 15_000,
  });
}

export function useEmployeeSalaries(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ["employee-salaries", params],
    queryFn: async () => {
      const res = await listEmployeeSalaries(params);
      return {
        rows: (res.data?.data ?? []) as EmployeeSalaryRow[],
        pagination: res.data?.meta ?? {},
        meta: res.data?.meta ?? {},
      };
    },
    staleTime: 10_000,
  });
}

export function useUpdateEmployeeBaseSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, baseSalary, netSalary, salaryInputMode }: { userId: string; baseSalary?: number; netSalary?: number; salaryInputMode?: "base" | "net" }) =>
      updateEmployeeBaseSalary(userId, { baseSalary, netSalary, salaryInputMode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
    },
  });
}

export function useLinkEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeUserId: string;
      templateId: string;
      baseSalaryOverride?: number;
      netSalaryOverride?: number;
      salaryInputMode?: "base" | "net";
      calculationMode?: "ethiopian" | "template";
      pensionableSalary?: number;
      transportAllowance?: number;
      perDiemAllowance?: number;
      perDiemDays?: number;
      medicalBenefit?: number;
      telecomAllowance?: number;
      housingAllowance?: number;
      mealAllowance?: number;
      otherAllowance?: number;
      employeePensionRate?: number;
      employerPensionRate?: number;
    }) =>
      linkEmployeeToTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
    },
  });
}

export function useBulkLinkEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeUserIds: string[]; templateId: string }) =>
      bulkLinkEmployeesToTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
    },
  });
}

export function useUnlinkEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => unlinkEmployee(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] }),
  });
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface PayrollTemplate {
  id: string;
  name: string;
  description?: string;
  housingAllowancePct?: number | null;
  transportAllowancePct?: number | null;
  mealAllowancePct?: number | null;
  otherAllowancePct?: number | null;
  taxPct?: number | null;
  pensionPct?: number | null;
  healthPct?: number | null;
  loanRepaymentFlat?: number | null;
  otherDeductionFlat?: number | null;
  currency: string;
  isDefault: boolean;
  status: string;
  createdAt?: string;
}

export interface LinkedEmployee {
  id: string;
  employeeUserId: string;
  name: string;
  email?: string;
  templateId: string;
  templateName: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  perDiemAllowance: number;
  perDiemDays?: number;
  medicalBenefit: number;
  telecomAllowance: number;
  mealAllowance: number;
  otherAllowance: number;
  grossPay: number;
  taxDeduction: number;
  pensionDeduction: number;
  healthDeduction: number;
  loanDeduction: number;
  otherDeduction: number;
  totalDeductions: number;
  netPay: number;
  currency: string;
  status: string;
  linkedAt?: string;
}

export interface PendingEmployee {
  id: string;
  userId: string;
  name: string;
  email?: string;
  department: string;
  role: string;
  hireDate?: string;
  baseSalary: number;
}

export interface EmployeeSalaryRow {
  id: string;
  userId: string;
  employeeCode?: string;
  name: string;
  email?: string;
  department?: { id: string; name: string } | null;
  position?: { id: string; title: string } | null;
  employmentType?: string;
  employmentStatus?: string;
  hireDate?: string;
  tin?: string;
  payPeriod?: string;
  paymentDate?: string | null;
  payrollStatus: "linked" | "pending";
  templateId?: string | null;
  templateName?: string | null;
  currency: string;
  baseSalary: number;
  baseSalaryOverride?: number | null;
  targetNetSalary?: number | null;
  salaryInputMode?: "base" | "net" | null;
  housingAllowance: number;
  transportAllowance: number;
  perDiemAllowance: number;
  perDiemDays?: number;
  medicalBenefit: number;
  telecomAllowance: number;
  mealAllowance: number;
  otherAllowance: number;
  grossPay: number;
  taxDeduction: number;
  pensionDeduction: number;
  healthDeduction: number;
  loanDeduction: number;
  otherDeduction: number;
  totalDeductions: number;
  netPay: number;
  computedNetPay?: number;
  taxableAmount?: number;
  employeePensionContribution?: number;
  employerPensionContribution?: number;
  totalCostToCompany?: number;
  bankAccount?: string;
  bankAccountMasked?: string;
  paymentStatus?: string;
  remarks?: string;
  overtimePay?: number;
  bonusIncentive?: number;
  arrearsAdjustments?: number;
  workingDaysInPeriod?: string | number;
  daysPaid?: string | number;
  generatedBy?: string;
  approvedBy?: string;
  lastUpdated?: string | null;
  taxMeta?: EthiopianTaxMeta | null;
  linkedAt?: string | null;
}

export interface EthiopianTaxAllowanceLine {
  amount: number;
  exempt: number;
  taxable: number;
  cap?: number;
  dailyCap?: number;
  taxCap?: number;
  treatment?: string;
  rule?: string;
}

export interface EthiopianTaxMeta {
  mode?: string;
  policyVersion?: string;
  taxableIncome?: number;
  taxableIncomeBeforeFringe?: number;
  rate?: number;
  deduction?: number;
  incomeTaxBeforeFringe?: number;
  fringeTax?: number;
  fringeTaxCap?: number;
  pensionableSalary?: number;
  employeePensionRate?: number;
  employerPensionRate?: number;
  employeePensionContribution?: number;
  employerPensionContribution?: number;
  totalCostToCompany?: number;
  allowanceBreakdown?: {
    baseSalary?: EthiopianTaxAllowanceLine;
    transport?: EthiopianTaxAllowanceLine;
    perDiem?: EthiopianTaxAllowanceLine;
    medical?: EthiopianTaxAllowanceLine;
    housing?: EthiopianTaxAllowanceLine;
    meal?: EthiopianTaxAllowanceLine;
    telecom?: EthiopianTaxAllowanceLine;
    fringeBenefits?: EthiopianTaxAllowanceLine;
  };
}

export interface PayrollDashboard {
  summary: {
    totalEmployees: number;
    pendingCount: number;
    linkedCount: number;
    totalNetPayroll: number;
    totalGross: number;
  };
  pending: PendingEmployee[];
  linked: LinkedEmployee[];
  templates: PayrollTemplate[];
}
