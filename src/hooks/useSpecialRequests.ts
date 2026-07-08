import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export type SpecialRequestStatus = "pending" | "approved" | "rejected";
export type SpecialRequestLunchUsageType = "FULL" | "PARTIAL";

export interface SpecialRequest {
  id: string;
  requestType: "Special Request";
  requestedDate: string;
  lunchUsageType: SpecialRequestLunchUsageType;
  requestedMinutes: number;
  reason: string;
  status: SpecialRequestStatus;
  submittedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectedReason?: string | null;
  createdAt: string;
  requester?: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    BusinessUserProfile?: {
      department?: { id: string; name: string } | null;
      position?: { id: string; title: string } | null;
    } | null;
  } | null;
  approver?: { id: string; fullName: string; email: string } | null;
  rejecter?: { id: string; fullName: string; email: string } | null;
}

export interface SpecialRequestPage {
  rows: SpecialRequest[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export function useSpecialRequests(params: {
  status?: "all" | SpecialRequestStatus;
  requestedDate?: string;
  search?: string;
  page?: number;
  size?: number;
  mine?: boolean;
  enabled?: boolean;
}) {
  return useQuery<SpecialRequestPage>({
    queryKey: ["special-requests", params],
    queryFn: async () => {
      const { mine, enabled, ...query } = params;
      const res = await api.get(mine ? "/api/v1/attendance-special-requests/mine" : "/api/v1/attendance-special-requests", { params: query });
      return res.data as SpecialRequestPage;
    },
    enabled: params.enabled ?? true,
    staleTime: 20_000,
  });
}

export function useSubmitSpecialRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      requestedDate: string;
      lunchUsageType: SpecialRequestLunchUsageType;
      requestedMinutes?: number;
      reason: string;
    }) => {
      const res = await api.post("/api/v1/attendance-special-requests", payload);
      return res.data.specialRequest as SpecialRequest;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["special-requests"] });
      await qc.invalidateQueries({ queryKey: ["attendanceMe", "today"] });
      await qc.invalidateQueries({ queryKey: ["attendanceHr"] });
    },
  });
}

export function useApproveSpecialRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/api/v1/attendance-special-requests/${id}/approve`);
      return res.data.specialRequest as SpecialRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["special-requests"] });
      qc.invalidateQueries({ queryKey: ["attendanceHr"] });
    },
  });
}

export function useRejectSpecialRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/api/v1/attendance-special-requests/${id}/reject`, { reason });
      return res.data.specialRequest as SpecialRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["special-requests"] }),
  });
}
