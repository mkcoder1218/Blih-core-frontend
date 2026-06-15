import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export type AttendanceRequestType = "work_from_home" | "memo_log" | "check_in_correction";
export type AttendanceRequestStatus = "pending" | "approved" | "rejected";

export interface AttendanceRequest {
  id: string;
  requestType: AttendanceRequestType;
  category?: string | null;
  title: string;
  reason: string;
  fromAt?: string | null;
  toAt?: string | null;
  durationMinutes?: number | null;
  status: AttendanceRequestStatus;
  createdAt: string;
  actionedAt?: string | null;
  actionNote?: string | null;
  employee?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    BusinessUserProfile?: {
      department?: { id: string; name: string } | null;
      position?: { id: string; title: string } | null;
    } | null;
  } | null;
  actionedBy?: { id: string; fullName: string; email: string } | null;
}

export interface AttendanceRequestPage {
  rows: AttendanceRequest[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export function useAttendanceRequests(params: {
  requestType: AttendanceRequestType;
  status?: string;
  search?: string;
  page?: number;
  size?: number;
}) {
  return useQuery<AttendanceRequestPage>({
    queryKey: ["attendance-requests", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/attendance-requests", { params });
      return res.data as AttendanceRequestPage;
    },
    staleTime: 20_000,
  });
}

export function useSubmitAttendanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      requestType: AttendanceRequestType;
      employeeUserId?: string;
      category?: string;
      title: string;
      reason: string;
      fromAt?: string;
      toAt?: string;
      durationMinutes?: number;
    }) => {
      const res = await api.post("/api/v1/attendance-requests", payload);
      return res.data.attendanceRequest as AttendanceRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-requests"] }),
  });
}

export function useApproveAttendanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/attendance-requests/${id}/approve`);
      return res.data.attendanceRequest as AttendanceRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-requests"] }),
  });
}

export function useRejectAttendanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await api.post(`/api/v1/attendance-requests/${id}/reject`, { reason });
      return res.data.attendanceRequest as AttendanceRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance-requests"] }),
  });
}
