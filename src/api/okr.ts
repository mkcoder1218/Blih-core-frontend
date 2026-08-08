import { api } from "./client";
import type { ApiEnvelope } from "./types";

export interface OkrImpact {
  id?: string;
  objectiveId?: string;
  text: string;
}

export interface OkrCheckIn {
  id: string;
  businessId: string;
  keyResultId: string;
  progressValue: number;
  date: string;
  note?: string;
  createdById: string;
  createdAt: string;
}

export interface OkrKeyResult {
  id?: string;
  businessId?: string;
  objectiveId?: string;
  title: string;
  trackingType: 'AUTOMATIC' | 'MANUAL';
  moduleSelector?: string;
  metricSelector?: string;
  baselineValue: number;
  targetValue: number;
  currentValue: number;
  weight: number;
  unit?: string;
  measurementType?: string;
  direction?: string;
  metricVersion?: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'COMPLETED';
  baselinePeriodStart?: string;
  baselinePeriodEnd?: string;
  lastCalculatedAt?: string;
  checkIns?: OkrCheckIn[];
}

export interface OkrObjective {
  id?: string;
  businessId?: string;
  ownerType: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'EMPLOYEE';
  ownerId?: string | null;
  title: string;
  description?: string;
  periodStart: string;
  periodEnd: string;
  lifecycleStatus: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  healthStatus: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'COMPLETED';
  overallScore: number;
  createdById?: string;
  keyResults: OkrKeyResult[];
  keyImpacts: OkrImpact[];
  ownerEmployee?: { id: string; fullName: string; email: string };
  ownerDepartment?: { id: string; name: string };
}

export interface OkrMetricTemplate {
  id: string;
  module: string;
  metricKey: string;
  title: string;
  unit: string;
  measurementType: string;
  direction: string;
}

export interface OkrListResponse {
  objectives: OkrObjective[];
  summary: {
    totalCount: number;
    avgCompletion: number;
    onTrackCount: number;
    atRiskCount: number;
    offTrackCount: number;
  };
  metricTemplates: OkrMetricTemplate[];
}

export async function getOkrObjectives(params?: Record<string, string>) {
  const res = await api.get<OkrListResponse>("/api/v1/okr/objectives", { params });
  return res.data;
}

export async function createOkrObjective(data: Partial<OkrObjective>) {
  const res = await api.post<{ objective: OkrObjective }>("/api/v1/okr/objectives", data);
  return res.data.objective;
}

export async function updateOkrObjective(id: string, data: Partial<OkrObjective>) {
  const res = await api.patch<{ objective: OkrObjective }>(`/api/v1/okr/objectives/${id}`, data);
  return res.data.objective;
}

export async function deleteOkrObjective(id: string) {
  const res = await api.delete<{ success: boolean }>(`/api/v1/okr/objectives/${id}`);
  return res.data.success;
}

export async function logOkrCheckIn(data: { keyResultId: string; currentValue: number; date?: string; note?: string }) {
  const res = await api.post<{ checkIn: OkrCheckIn }>("/api/v1/okr/progress", data);
  return res.data.checkIn;
}

export async function refreshOkrMetrics(objectiveId?: string) {
  const res = await api.post<{ success: boolean }>("/api/v1/okr/refresh", { objectiveId });
  return res.data.success;
}
