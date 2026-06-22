import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveApprovalStage = "dept_head" | "admin" | "approved" | "rejected" | "cancelled";
export type LeaveType = "annual" | "sick" | "maternity" | "paternity" | "casual" | "unpaid" | string;

export interface LeaveTemplate {
  id: string;
  businessId: string;
  name: string;
  leaveType: LeaveType;
  hasAmount?: boolean;
  totalDays: number;
  description?: string | null;
  requiresEvidence?: boolean;
  evidenceInstructions?: string | null;
  isActive: boolean;
  createdAt: string;
  creator?: { id: string; fullName: string } | null;
}

export interface LeaveRequest {
  id: string;
  businessId: string;
  employeeUserId: string;
  leaveTemplateId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  evidenceUrl?: string | null;
  evidenceNote?: string | null;
  approvalStage: LeaveApprovalStage;
  status: LeaveStatus;
  deptHeadComment?: string | null;
  adminComment?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  employee?: { id: string; fullName: string; email: string } | null;
  template?: { id: string; name: string; leaveType: string; hasAmount?: boolean; totalDays: number; requiresEvidence?: boolean; evidenceInstructions?: string | null } | null;
  deptHeadApprover?: { id: string; fullName: string } | null;
  businessAdminApprover?: { id: string; fullName: string } | null;
  adminApprover?: { id: string; fullName: string } | null;
}

export interface LeavePage {
  rows: LeaveRequest[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  stage?: string;
}

export interface LeaveBalance {
  id: string;
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
}

// ── Templates ─────────────────────────────────────────────────────────────────

export function useLeaveTemplates(onlyActive?: boolean) {
  return useQuery<LeaveTemplate[]>({
    queryKey: ["leave-templates", onlyActive],
    queryFn: async () => {
      const res = await api.get("/api/v1/leave-requests/templates", {
        params: onlyActive ? { onlyActive: "true" } : {},
      });
      return res.data.templates as LeaveTemplate[];
    },
    staleTime: 30_000,
  });
}

export function useCreateLeaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      leaveType: LeaveType;
      hasAmount?: boolean;
      totalDays: number;
      description?: string;
      requiresEvidence?: boolean;
      evidenceInstructions?: string;
    }) => {
      const res = await api.post("/api/v1/leave-requests/templates", data);
      return res.data.template as LeaveTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-templates"] }),
  });
}

export function useUpdateLeaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<LeaveTemplate> & { id: string }) => {
      const res = await api.patch(`/api/v1/leave-requests/templates/${id}`, data);
      return res.data.template as LeaveTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-templates"] }),
  });
}

export function useToggleLeaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/v1/leave-requests/templates/${id}/toggle`);
      return res.data.template as LeaveTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-templates"] }),
  });
}

export function useDeleteLeaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/v1/leave-requests/templates/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-templates"] }),
  });
}

// ── Leave Requests ─────────────────────────────────────────────────────────────

export function useMyLeaveRequests(params: { page?: number; size?: number; status?: string } = {}) {
  return useQuery<LeavePage>({
    queryKey: ["leave-mine", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/leave-requests/mine", { params });
      return res.data as LeavePage;
    },
    staleTime: 30_000,
  });
}

export function usePendingLeaveRequests(params: { page?: number; size?: number } = {}) {
  return useQuery<LeavePage>({
    queryKey: ["leave-pending", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/leave-requests/pending", { params });
      return res.data as LeavePage;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useAllLeaveRequests(
  params: { page?: number; size?: number; status?: string; leaveType?: string } = {}
) {
  return useQuery<LeavePage>({
    queryKey: ["leave-all", params],
    queryFn: async () => {
      const res = await api.get("/api/v1/leave-requests", { params });
      return res.data as LeavePage;
    },
    staleTime: 30_000,
  });
}

export function useSubmitLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      leaveTemplateId: string;
      startDate: string;
      endDate: string;
      reason: string;
      evidenceUrl?: string;
      evidenceNote?: string;
    }) => {
      const res = await api.post("/api/v1/leave-requests", data);
      return res.data.leaveRequest as LeaveRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-mine"] });
      qc.invalidateQueries({ queryKey: ["leave-all"] });
      qc.invalidateQueries({ queryKey: ["leave-balances"] });
    },
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      const res = await api.post(`/api/v1/leave-requests/${id}/approve`, { comment });
      return res.data.leaveRequest as LeaveRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-pending"] });
      qc.invalidateQueries({ queryKey: ["leave-all"] });
      qc.invalidateQueries({ queryKey: ["leave-mine"] });
    },
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/api/v1/leave-requests/${id}/reject`, { reason });
      return res.data.leaveRequest as LeaveRequest;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave-pending"] });
      qc.invalidateQueries({ queryKey: ["leave-all"] });
      qc.invalidateQueries({ queryKey: ["leave-mine"] });
    },
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/api/v1/leave-requests/${id}/cancel`);
      return res.data.leaveRequest as LeaveRequest;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-mine"] }),
  });
}

export function useMyLeaveBalances() {
  return useQuery<LeaveBalance[]>({
    queryKey: ["leave-balances"],
    queryFn: async () => {
      const res = await api.get("/api/v1/leave-requests/my-balances");
      return res.data.balances as LeaveBalance[];
    },
    staleTime: 60_000,
  });
}
