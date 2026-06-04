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
  linkEmployeeToTemplate,
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

export function useLinkEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeUserId: string; templateId: string; baseSalaryOverride?: number }) =>
      linkEmployeeToTemplate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] }),
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
