import { api } from "./client";

export interface KpiValueHistory {
  id: string;
  businessId: string;
  kpiId: string;
  value: number;
  previousValue?: number | null;
  source: 'MANUAL' | 'AUTOMATIC';
  date: string;
  note?: string;
  calculatedAt: string;
  calculationMetadata?: any;
  createdById?: string;
}

export interface Kpi {
  id?: string;
  businessId?: string;
  title: string;
  description?: string;
  category: string;
  ownerType: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'EMPLOYEE';
  ownerId?: string | null;
  measurementType: 'PERCENTAGE' | 'NUMBER' | 'DURATION';
  unit: string;
  direction: 'INCREASE' | 'DECREASE';
  baselineValue: number;
  currentValue: number;
  targetValue: number;
  updateFrequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  trackingType: 'AUTOMATIC' | 'MANUAL';
  moduleSelector?: string;
  metricSelector?: string;
  status: 'EXCEEDING_TARGET' | 'ON_TARGET' | 'BELOW_TARGET';
  isActive: boolean;
  createdById?: string;
  ownerEmployee?: { id: string; fullName: string; email: string };
  ownerDepartment?: { id: string; name: string };
}

export interface KpiMetricTemplate {
  id: string;
  module: string;
  metricKey: string;
  title: string;
  unit: string;
  measurementType: string;
  direction: string;
}

export interface KpiListResponse {
  kpis: Kpi[];
  count: number;
  metricTemplates: KpiMetricTemplate[];
}

export interface KpiDashboardSummary {
  totalCount: number;
  exceedingCount: number;
  onTargetCount: number;
  belowTargetCount: number;
  avgScoreRate: number;
}

export async function getKpis(params?: Record<string, string>) {
  const res = await api.get<KpiListResponse>("/api/v1/kpis", { params });
  return res.data;
}

export async function createKpi(data: Partial<Kpi>) {
  const res = await api.post<{ kpi: Kpi }>("/api/v1/kpis", data);
  return res.data.kpi;
}

export async function updateKpi(id: string, data: Partial<Kpi>) {
  const res = await api.patch<{ kpi: Kpi }>(`/api/v1/kpis/${id}`, data);
  return res.data.kpi;
}

export async function deleteKpi(id: string) {
  const res = await api.delete<{ message: string }>(`/api/v1/kpis/${id}`);
  return res.data;
}

export async function logKpiManualValue(id: string, data: { value: number; note?: string }) {
  const res = await api.post<{ kpi: Kpi; history: KpiValueHistory }>(`/api/v1/kpis/${id}/check-in`, data);
  return res.data;
}

export async function syncAutomaticKpis() {
  const res = await api.post<{ message: string }>("/api/v1/kpis/sync");
  return res.data;
}

export async function getKpiTrend(id: string) {
  const res = await api.get<{ history: KpiValueHistory[] }>(`/api/v1/kpis/${id}/trend`);
  return res.data.history;
}

export async function getKpisDashboard() {
  const res = await api.get<{ summary: KpiDashboardSummary }>("/api/v1/kpis/dashboard");
  return res.data.summary;
}
