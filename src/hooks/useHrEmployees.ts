import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

// Employee Directory

export function useEmployees(params?: {
  limit?: number;
  offset?: number;
  employmentType?: string;
  employmentStatus?: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: [
      "hr-records",
      params?.limit,
      params?.offset,
      params?.employmentType,
      params?.employmentStatus,
      params?.departmentId,
    ],
    queryFn: async () => {
      const limit = params?.limit ?? 10;
      const offset = params?.offset ?? 0;
      const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      if (params?.employmentType) qs.set("employmentType", params.employmentType);
      if (params?.employmentStatus) qs.set("employmentStatus", params.employmentStatus);
      if (params?.departmentId) qs.set("departmentId", params.departmentId);
      const res = await api.get(`/api/v1/hr/records?${qs.toString()}`);
      return {
        employees: (res.data?.data as any[]) ?? [],
        total: res.data?.meta?.total ?? 0,
      };
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/api/v1/hr/records/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
    },
  });
}

// Organogram

export function useUpdateEmployeePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      api.patch(`/api/v1/users/${userId}`, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
    },
  });
}

export function useUpdateEmployeeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleKey }: { userId: string; roleKey: string }) =>
      api.patch(`/api/v1/users/${userId}`, { roleKeys: [roleKey] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useAllRoles() {
  return useQuery({
    queryKey: ["roles", "all"],
    queryFn: async () => {
      const res = await api.get("/api/v1/roles");
      return (res.data?.data?.roles || res.data?.roles || res.data?.data || []) as any[];
    },
  });
}

export type UserExemptionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserExemption {
  id: string;
  userId: string;
  reason: string;
  excludeFromPayroll: boolean;
  status: UserExemptionStatus;
  requestedBy: string;
  approvedBy?: string | null;
  rejectedBy?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: { id: string; fullName: string; email?: string };
  requester?: { id: string; fullName: string; email?: string };
  approver?: { id: string; fullName: string; email?: string };
  rejecter?: { id: string; fullName: string; email?: string };
}

export function useUserExemptions(params?: { status?: string; userId?: string; page?: number; size?: number; search?: string }) {
  return useQuery({
    queryKey: ["user-exemptions", params],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.userId) qs.set("userId", params.userId);
      if (params?.search) qs.set("search", params.search);
      qs.set("page", String(params?.page ?? 1));
      qs.set("size", String(params?.size ?? 20));
      const res = await api.get(`/api/v1/user-exemptions?${qs.toString()}`);
      return {
        rows: (res.data?.rows ?? []) as UserExemption[],
        total: res.data?.total ?? 0,
        page: res.data?.page ?? 1,
        totalPages: res.data?.totalPages ?? 1,
      };
    },
  });
}

export function useCreateUserExemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; reason: string; excludeFromPayroll: boolean }) =>
      api.post("/api/v1/user-exemptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-exemptions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
    },
  });
}

export function useApproveUserExemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/user-exemptions/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-exemptions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-hr"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today"] });
    },
  });
}

export function useRejectUserExemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/user-exemptions/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-exemptions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
    },
  });
}

export function useRevokeUserExemption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/user-exemptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-exemptions"] });
      queryClient.invalidateQueries({ queryKey: ["hr-records"] });
      queryClient.invalidateQueries({ queryKey: ["employee-salaries"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["attendance-hr"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance-today"] });
    },
  });
}

export function useOrganogram() {
  return useQuery({
    queryKey: ["organogram"],
    queryFn: async () => {
      const res = await api.get("/api/v1/hr/organogram");
      return (res.data?.data?.tree ?? res.data?.tree ?? []) as any[];
    },
  });
}

// Exit / Offboarding
