import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export type AttendanceRequestType = "work_from_home" | "memo_log" | "check_in_correction" | "not_available" | "lateness_notice";
export type AttendanceRequestStatus = "pending" | "approved" | "rejected" | "invalid" | "expired" | "cancelled";

export interface AttendanceRequest {
  id: string;
  requestType: AttendanceRequestType;
  category?: string | null;
  title: string;
  reason: string;
  fromAt?: string | null;
  toAt?: string | null;
  durationMinutes?: number | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  reasonCategory?: string | null;
  reasonText?: string | null;
  validityStatus?: string | null;
  deadlineAt?: string | null;
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
  mine?: boolean;
  enabled?: boolean;
}) {
  return useQuery<AttendanceRequestPage>({
    queryKey: ["attendance-requests", params],
    queryFn: async () => {
      const { mine, enabled, ...query } = params;
      const res = await api.get(mine ? "/api/v1/attendance-requests/mine" : "/api/v1/attendance-requests", { params: query });
      return res.data as AttendanceRequestPage;
    },
    enabled: params.enabled ?? true,
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
      reasonCategory?: string;
      reasonText?: string;
    }) => {
      const res = await api.post("/api/v1/attendance-requests", payload);
      return res.data.attendanceRequest as AttendanceRequest;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["attendance-requests"] });
      await qc.invalidateQueries({ queryKey: ["attendanceMe", "today"] });
    },
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

export function useFixManualAttendanceTimes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { date?: string; employeeUserId?: string } = {}) => {
      const res = await api.post("/api/v1/attendance-requests/fix-manual-times", payload);
      return res.data.data as { scanned: number; created: number; updated: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-requests"] });
      qc.invalidateQueries({ queryKey: ["attendanceHr"] });
    },
  });
}
