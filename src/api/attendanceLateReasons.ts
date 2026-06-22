import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type LatenessReasonBehavior = "BLOCK" | "MARK_INVALID" | "HR_REVIEW";
export type LatenessCreditMode = "PER_REASON" | "GLOBAL_POOL";

export type LatenessCreditConfig = {
  mode: LatenessCreditMode;
  globalMonthlyLimit: number;
  globalCoversMinutes: number;
  behaviorWhenExceeded: LatenessReasonBehavior;
};

export type AttendanceLateReason = {
  id: string;
  businessId: string;
  reasonCode: string;
  label: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  isActive: boolean;
  requiresComment: boolean;
  monthlyLimit: number;
  coversMinutes: number;
  requiresApproval: boolean;
  requiresAttachment: boolean;
  allowAfterDeadline: boolean;
  behaviorWhenExceeded: LatenessReasonBehavior;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceLateReasonPayload = Partial<AttendanceLateReason> & {
  reasonCode: string;
  label: string;
};

function normalizeEnvelope(data: any): ApiEnvelope<{ reasons: AttendanceLateReason[] }> {
  const rows = data?.data?.rows || data?.data?.reasons || data?.rows || data?.reasons || [];
  return { ...data, data: { ...(data?.data || {}), reasons: rows } };
}

export async function getHrLateReasons() {
  const res = await api.get<ApiEnvelope<{ rows: AttendanceLateReason[] }>>("/api/v1/attendance/hr/lateness-reason-rules");
  return normalizeEnvelope(res.data);
}

export async function createHrLateReason(payload: AttendanceLateReasonPayload) {
  const res = await api.post<ApiEnvelope<{ rule: AttendanceLateReason }>>("/api/v1/attendance/hr/lateness-reason-rules", payload);
  return res.data;
}

export async function updateHrLateReason(reasonId: string, payload: Partial<AttendanceLateReasonPayload>) {
  const res = await api.patch<ApiEnvelope<{ rule: AttendanceLateReason }>>(`/api/v1/attendance/hr/lateness-reason-rules/${reasonId}`, payload);
  return res.data;
}

export async function deactivateHrLateReason(reasonId: string) {
  const res = await api.patch<ApiEnvelope<{ rule: AttendanceLateReason }>>(`/api/v1/attendance/hr/lateness-reason-rules/${reasonId}/disable`);
  return res.data;
}

export async function getLatenessCreditConfig() {
  const res = await api.get<ApiEnvelope<{ config: LatenessCreditConfig }>>("/api/v1/attendance/hr/lateness-credit-config");
  return res.data;
}

export async function updateLatenessCreditConfig(payload: LatenessCreditConfig) {
  const res = await api.patch<ApiEnvelope<{ config: LatenessCreditConfig }>>("/api/v1/attendance/hr/lateness-credit-config", payload);
  return res.data;
}
