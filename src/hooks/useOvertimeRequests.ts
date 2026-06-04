import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export type OvertimeType = "Regular" | "Weekend" | "Public Holiday";
export type ApprovalStage =
  | "department_head"
  | "admin"
  | "finance"
  | "approved"
  | "rejected"
  | "cancelled";

export interface OvertimeRequest {
  id: string;
  businessId: string;
  employeeUserId: string;
  overtimeDate: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  overtimeType: OvertimeType;
  reason: string;
  approvalStage: ApprovalStage;
  status: "pending" | "approved" | "rejected" | "cancelled";
  deptHeadComment?: string | null;
  adminComment?: string | null;
  financeComment?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  employee?: { id: string; fullName: string; email: string } | null;
  deptHeadApprover?: { id: string; fullName: string; email: string } | null;
  adminApprover?: { id: string; fullName: string; email: string } | null;
  financeApprover?: { id: string; fullName: string; email: string } | null;
}

export interface OvertimePage {
  rows: OvertimeRequest[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  stage?: string;
}

function minutesToHours(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
export { minutesToHours };

// ── Employee: my submissions ─────────────────────────────────────────────────
export function useMyOvertimeRequests(params: { page?: number; size?: number; status?: string } = {}) {
  return useQuery<OvertimePage>({
    queryKey: ["overtime-mine", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/overtime-requests/mine", { params });
      return res.data as OvertimePage;
    },
    staleTime: 30_000,
  });
}

// ── Approver: pending requests for my stage ──────────────────────────────────
export function useOvertimePending(params: { page?: number; size?: number } = {}) {
  return useQuery<OvertimePage>({
    queryKey: ["overtime-pending", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/overtime-requests/pending", { params });
      return res.data as OvertimePage;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ── HR/Admin: all requests ───────────────────────────────────────────────────
export function useAllOvertimeRequests(
  params: { page?: number; size?: number; status?: string; approvalStage?: string } = {}
) {
  return useQuery<OvertimePage>({
    queryKey: ["overtime-all", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/overtime-requests", { params });
      return res.data as OvertimePage;
    },
    staleTime: 30_000,
  });
}

// ── Submit new overtime request ──────────────────────────────────────────────
export function useSubmitOvertimeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      overtimeDate: string;
      startTime: string;
      endTime: string;
      overtimeType: OvertimeType;
      reason: string;
    }) => {
      const res = await api.post("/api/v1/overtime-requests", data);
      return res.data.overtimeRequest as OvertimeRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overtime-mine"] });
      qc.invalidateQueries({ queryKey: ["overtime-all"] });
    },
  });
}

// ── Approve ──────────────────────────────────────────────────────────────────
export function useApproveOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const res = await api.post(`/api/v1/overtime-requests/${id}/approve`, { comment });
      return res.data.overtimeRequest as OvertimeRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overtime-pending"] });
      qc.invalidateQueries({ queryKey: ["overtime-all"] });
      qc.invalidateQueries({ queryKey: ["overtime-mine"] });
    },
  });
}

// ── Reject ───────────────────────────────────────────────────────────────────
export function useRejectOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/api/v1/overtime-requests/${id}/reject`, { reason });
      return res.data.overtimeRequest as OvertimeRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overtime-pending"] });
      qc.invalidateQueries({ queryKey: ["overtime-all"] });
      qc.invalidateQueries({ queryKey: ["overtime-mine"] });
    },
  });
}

// ── Cancel ───────────────────────────────────────────────────────────────────
export function useCancelOvertime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/v1/overtime-requests/${id}/cancel`);
      return res.data.overtimeRequest as OvertimeRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overtime-mine"] });
    },
  });
}
