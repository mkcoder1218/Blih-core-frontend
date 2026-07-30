import { api } from "./client";

export async function getWorkforceFinance(params?: Record<string, unknown>) {
  return api.get("/api/v1/finance/workforce", { params });
}

export async function decideFinanceApproval(kind: "salary" | "expense" | "budget", id: string, action: "approve" | "reject") {
  if (kind === "salary") return api.post(`/api/v1/finance/salary-adjustments/${id}/${action}`);
  if (kind === "budget") return api.post(`/api/v1/finance/budget-reallocations/${id}/${action}`);
  return api.post(`/api/v1/finance/expenses/${id}/${action}`);
}

export async function exportWorkforceFinance(tab: string) {
  return api.get(`/api/v1/finance/workforce/export/${tab}`, { responseType: "blob" });
}

export async function createBudgetReallocation(data: Record<string, unknown>) {
  return api.post("/api/v1/finance/budget-reallocations", data);
}

// ── Payroll Templates ──────────────────────────────────────────────────────────
export async function listPayrollTemplates() {
  return api.get("/api/v1/finance/payroll-templates");
}

export async function createPayrollTemplate(data: Record<string, unknown>) {
  return api.post("/api/v1/finance/payroll-templates", data);
}

export async function updatePayrollTemplate(id: string, data: Record<string, unknown>) {
  return api.put(`/api/v1/finance/payroll-templates/${id}`, data);
}

export async function deletePayrollTemplate(id: string) {
  return api.delete(`/api/v1/finance/payroll-templates/${id}`);
}

export async function previewPayrollCalculation(data: Record<string, unknown>) {
  return api.post("/api/v1/finance/payroll-templates/preview", data);
}

// ── Employee Payroll Links ─────────────────────────────────────────────────────
export async function getPayrollDashboard() {
  return api.get("/api/v1/finance/payroll-dashboard");
}

export async function listEmployeeSalaries(params?: Record<string, unknown>) {
  return api.get("/api/v1/finance/employee-salaries", { params });
}

export async function exportEmployeeSalaries(params?: Record<string, unknown>) {
  return api.get("/api/v1/finance/employee-salaries/export", { params, responseType: "blob" });
}

export async function markSelectedEmployeeSalariesPaid(data: {
  selectedUserIds: string[];
  dateFrom: string;
  dateTo: string;
  payDate?: string;
}) {
  return api.post("/api/v1/finance/employee-salaries/pay-selected", data);
}

export async function listSalaryDeductions(payrollLinkId: string, params?: Record<string, unknown>) {
  return api.get(`/api/v1/finance/employee-salaries/${payrollLinkId}/deductions`, { params });
}

export async function removeSalaryDeduction(deductionId: string, params?: Record<string, unknown>) {
  return api.delete(`/api/v1/finance/employee-salaries/deductions/${deductionId}`, { params });
}

export async function updateEmployeeBaseSalary(userId: string, data: { baseSalary?: number; netSalary?: number; salaryInputMode?: "base" | "net" }) {
  return api.patch(`/api/v1/finance/employee-salaries/${userId}/base-salary`, data);
}

export async function linkEmployeeToTemplate(data: {
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
}) {
  return api.post("/api/v1/finance/payroll-links", data);
}

export async function bulkLinkEmployeesToTemplate(data: { employeeUserIds: string[]; templateId: string }) {
  return api.post("/api/v1/finance/payroll-links/bulk", data);
}

export async function unlinkEmployee(userId: string) {
  return api.delete(`/api/v1/finance/payroll-links/${userId}`);
}
