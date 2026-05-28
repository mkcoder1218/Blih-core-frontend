import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";

export interface Permission {
  id: string;
  module: string;
  action: string;
  key: string;
  description: string;
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<{ permissions: Permission[] }>>("/api/v1/permissions");
      return res.data.data.permissions;
    },
  });
}

export function useSeedPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/api/v1/permissions/seed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
    },
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, permissionKeys }: { roleId: string; permissionKeys: string[] }) => {
      await api.post("/api/v1/permissions/assign", { roleId, permissionKeys });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-details", variables.roleId] });
      queryClient.invalidateQueries({ queryKey: ["me"] }); // Permissions might have changed for current user
    },
  });
}
