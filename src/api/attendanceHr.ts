import { api } from "./client";
import type { ApiEnvelope, AttendanceHrDailyResponse, AttendanceHrEmployeeResponse, AttendanceHrReportResponse, AttendanceHrSummaryResponse } from "./types";

export async function getAttendanceHrSummary(params: { date?: string; departmentId?: string } = {}) {
  const res = await api.get<ApiEnvelope<AttendanceHrSummaryResponse>>("/api/v1/attendance/hr/summary", { params });
  return res.data;
}

export async function getAttendanceHrDaily(params: {
  date?: string;
  departmentId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
} = {}) {
  const res = await api.get<ApiEnvelope<AttendanceHrDailyResponse>>("/api/v1/attendance/hr/daily", { params });
  return res.data;
}

export async function getAttendanceHrEmployee(employeeId: string, params: { date?: string } = {}) {
  const res = await api.get<ApiEnvelope<AttendanceHrEmployeeResponse>>(`/api/v1/attendance/hr/employees/${employeeId}`, { params });
  return res.data;
}

export async function getLatenessReasonUsage(params: { startDate?: string; endDate?: string; search?: string; size?: number } = {}) {
  const res = await api.get<ApiEnvelope<{ rows: any[]; total: number; startDate: string; endDate: string }>>(
    "/api/v1/attendance/hr/lateness-reason-usage",
    { params }
  );
  return res.data;
}

export async function sendLateNoReasonPenaltyMessage(employeeId: string, payload: { date: string }) {
  const res = await api.post<ApiEnvelope<{ sent: boolean; message: string }>>(
    `/api/v1/attendance/hr/employees/${employeeId}/late-no-reason-message`,
    payload
  );
  return res.data;
}

export async function getAttendanceHrReport(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
  employeeId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
} ) {
  const res = await api.get<ApiEnvelope<AttendanceHrReportResponse>>("/api/v1/attendance/hr/report", { params });
  return res.data;
}

export async function downloadAttendanceHrExport(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
  employeeId?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  format?: "csv";
}) {
  const res = await api.get("/api/v1/attendance/hr/export", {
    params: { ...params, format: params.format || "csv" },
    responseType: "blob",
  });
  return res;
}

export async function downloadAttendanceDailyReportExport(params: {
  date: string;
  departmentId?: string;
  employeeId?: string;
  employmentCategory?: "Managerial" | "Non-Managerial";
  status?: string;
  search?: string;
  format?: "csv" | "excel";
}) {
  const res = await api.get("/api/v1/attendance/hr/reports/daily/export", {
    params: { ...params, format: params.format || "csv" },
    responseType: "blob",
  });
  return res;
}

export async function downloadAttendanceWeeklyReportExport(params: {
  startDate: string;
  endDate: string;
  departmentId?: string;
  employeeId?: string;
  employmentCategory?: "Managerial" | "Non-Managerial";
  status?: string;
  search?: string;
  format?: "csv" | "excel";
}) {
  const res = await api.get("/api/v1/attendance/hr/reports/weekly/export", {
    params: { ...params, format: params.format || "csv" },
    responseType: "blob",
  });
  return res;
}

export async function downloadAttendanceMonthlyReportExport(params: {
  month: string;
  departmentId?: string;
  employeeId?: string;
  employmentCategory?: "Managerial" | "Non-Managerial";
  status?: string;
  search?: string;
  format?: "csv" | "excel";
}) {
  const res = await api.get("/api/v1/attendance/hr/reports/monthly/export", {
    params: { ...params, format: params.format || "csv" },
    responseType: "blob",
  });
  return res;
}
