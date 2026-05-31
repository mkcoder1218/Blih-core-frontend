import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type AttendanceLateReason = {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  requiresComment: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export async function getHrLateReasons() {
  const res = await api.get<ApiEnvelope<{ reasons: AttendanceLateReason[] }>>("/api/v1/attendance/hr/late-reasons");
  return res.data;
}

export async function createHrLateReason(payload: { name: string; description?: string | null; requiresComment: boolean; isActive?: boolean }) {
  const res = await api.post<ApiEnvelope<{ reason: AttendanceLateReason }>>("/api/v1/attendance/hr/late-reasons", payload);
  return res.data;
}

export async function updateHrLateReason(reasonId: string, payload: Partial<{ name: string; description: string | null; requiresComment: boolean; isActive: boolean }>) {
  const res = await api.put<ApiEnvelope<{ reason: AttendanceLateReason }>>(`/api/v1/attendance/hr/late-reasons/${reasonId}`, payload);
  return res.data;
}

export async function deactivateHrLateReason(reasonId: string) {
  const res = await api.delete<ApiEnvelope<{ reason: AttendanceLateReason }>>(`/api/v1/attendance/hr/late-reasons/${reasonId}`);
  return res.data;
}

