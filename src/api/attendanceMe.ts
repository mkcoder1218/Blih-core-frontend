import { api } from "./client";
import type { ApiEnvelope } from "./types";
import type {
  AttendanceMeCreateEventRequest,
  AttendanceMeHistoryResponse,
  AttendanceMeTodayResponse,
} from "./types";

export interface AttendanceMeHistoryParams {
  startDate?: string;
  endDate?: string;
  status?: string;
  sortBy?: "date" | "status" | "workedMinutes";
  sortOrder?: "asc" | "desc";
  page?: number;
  size?: number;
}

export async function getMyAttendanceToday() {
  const response =
    await api.get<ApiEnvelope<AttendanceMeTodayResponse>>(
      "/api/v1/attendance/me/today",
    );

  return response.data;
}

export async function createMyAttendanceEvent(
  payload: AttendanceMeCreateEventRequest,
) {
  const response =
    await api.post<ApiEnvelope<AttendanceMeTodayResponse>>(
      "/api/v1/attendance/me/events",
      payload,
    );

  return response.data;
}

export async function revertMyLastAttendanceEvent() {
  const response =
    await api.post<ApiEnvelope<AttendanceMeTodayResponse>>(
      "/api/v1/attendance/me/events/revert-last",
    );

  return response.data;
}

export async function getMyAttendanceHistory(
  params?: AttendanceMeHistoryParams,
) {
  const response =
    await api.get<ApiEnvelope<AttendanceMeHistoryResponse>>(
      "/api/v1/attendance/me/history",
      {
        params,
      },
    );

  return response.data;
}
