import { api } from "./client";
import type { ApiEnvelope } from "./types";
import type {
  AttendanceMeCreateEventRequest,
  AttendanceMeHistoryResponse,
  AttendanceMeTodayResponse,
} from "./types";

export async function getMyAttendanceToday() {
  const res = await api.get<ApiEnvelope<AttendanceMeTodayResponse>>("/api/v1/attendance/me/today");
  return res.data;
}

export async function createMyAttendanceEvent(payload: AttendanceMeCreateEventRequest) {
  const res = await api.post<ApiEnvelope<AttendanceMeTodayResponse>>("/api/v1/attendance/me/events", payload);
  return res.data;
}

export async function revertMyLastAttendanceEvent() {
  const res = await api.post<ApiEnvelope<AttendanceMeTodayResponse>>("/api/v1/attendance/me/events/revert-last");
  return res.data;
}

export async function getMyAttendanceHistory(params?: { page?: number; size?: number }) {
  const res = await api.get<ApiEnvelope<AttendanceMeHistoryResponse>>("/api/v1/attendance/me/history", { params });
  return res.data;
}
