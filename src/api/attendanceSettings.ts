import type { ApiEnvelope } from "./types";
import { api } from "./client";
import type { BusinessAttendanceSettings, UpsertBusinessAttendanceSettingsRequest } from "./types";

export async function getAttendanceSettings(businessId: string) {
  const res = await api.get<ApiEnvelope<{ attendanceSettings: BusinessAttendanceSettings }>>(
    `/api/v1/businesses/${businessId}/attendance-settings`
  );
  return res.data;
}

export async function upsertAttendanceSettings(businessId: string, payload: UpsertBusinessAttendanceSettingsRequest) {
  const res = await api.put<ApiEnvelope<{ attendanceSettings: BusinessAttendanceSettings }>>(
    `/api/v1/businesses/${businessId}/attendance-settings`,
    payload
  );
  return res.data;
}

