import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";
import type { Permission } from "./usePermissions";

export interface Role {
  id: string;
  name: string;
  key: string;
  description?: string;
  isSystemRole: boolean;
  businessId?: string | null;
  Permissions?: Permission[];
}

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
    mutationFn: async (data: Partial<Role>) => {
      const res = await api.post("/api/v1/roles", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
