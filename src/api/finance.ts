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
