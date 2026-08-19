import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";
import type { Permission } from "./usePermissions";

export interface Role {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  domain?: string | null;
  isSystemRole: boolean;
  businessId?: string | null;
  userCount?: number;
  Permissions?: Permission[];
}

export type CreateRoleInput = {
  name: string;
  key: string;
  description?: string | null;
  domain?: string | null;
  businessId?: string;
  copyFromRoleId?: string;
  permissionKeys?: string[];
};

export type UpdateRoleInput = Partial<Pick<Role, "name" | "key" | "description" | "domain">>;

export type RoleUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  lastLoginAt?: string | null;
};

export type RoleUsersPage = {
  rows: RoleUser[];
  count: number;
  page: number;
  size: number;
  pages: number;
};

export function useRoles(businessId?: string) {
  return useQuery({
    queryKey: ["roles", businessId ?? "all"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ roles: Role[] }>>("/api/v1/roles", {
        params: businessId ? { businessId } : undefined,
      });
      return res.data.data.roles;
    },
  });
}

export function useRoleDetails(id: string | null) {
  return useQuery({
    queryKey: ["role-details", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get<ApiEnvelope<{ role: Role }>>(`/api/v1/roles/${id}`);
      return res.data.data.role;
    },
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRoleInput) => {
      const res = await api.post<ApiEnvelope<{ role: Role }>>("/api/v1/roles", data);
      return res.data.data.role;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.setQueryData(["role-details", role.id], role);
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoleInput }) => {
      const res = await api.patch<ApiEnvelope<{ role: Role }>>(`/api/v1/roles/${id}`, data);
      return res.data.data.role;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.setQueryData(["role-details", role.id], role);
    },
  });
}

export function useDuplicateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateRoleInput }) => {
      const res = await api.post<ApiEnvelope<{ role: Role }>>(`/api/v1/roles/${id}/duplicate`, data);
      return res.data.data.role;
    },
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.setQueryData(["role-details", role.id], role);
    },
  });
}

export function useArchiveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiEnvelope<{ role: Role; userCount: number }>>(`/api/v1/roles/${id}/archive`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.removeQueries({ queryKey: ["role-details", id] });
    },
  });
}

export function useRoleUsers(
  roleId: string | null,
  params: { page: number; size?: number; search?: string; businessId?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: ["role-users", roleId, params],
    queryFn: async () => {
      if (!roleId) return null;
      const res = await api.get<ApiEnvelope<RoleUsersPage>>(`/api/v1/roles/${roleId}/users`, { params });
      return res.data.data;
    },
    enabled: Boolean(roleId && enabled),
  });
}
