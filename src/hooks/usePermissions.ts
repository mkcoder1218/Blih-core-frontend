import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";
import { useMe } from "./useMe";
import { useTesterSession } from "./useTesterControl";

export interface Permission {
  id: string;
  module: string;
  action: string;
  key: string;
  description: string;
  title?: string;
  moduleTitle?: string;
  sortOrder?: number;
  dependencies?: string[];
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
      const res = await api.post("/api/v1/permissions/seed");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-details"] });
    },
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ roleId, permissionKeys }: { roleId: string; permissionKeys: string[] }) => {
      const res = await api.post<ApiEnvelope<{ permissionKeys: string[] }>>("/api/v1/permissions/assign", { roleId, permissionKeys });
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role-details", variables.roleId] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useMyPermissions() {
  const { data: meRes, isLoading: meLoading } = useMe();
  const testerSession = useTesterSession();
  const me = meRes?.data;

  const isMasterTester = Boolean(testerSession.data?.isMasterTester);
  const isSuperAdmin = Boolean(me?.user?.isPlatformSuperAdmin) || isMasterTester;
  const permSet = new Set<string>(me?.permissions ?? []);

  if (me?.user) {
    permSet.add("career.self");
    permSet.add("career.request");
  }

  const can = (key: string): boolean => {
    if (isSuperAdmin) return true;
    return permSet.has(key);
  };

  const hasAny = (...keys: string[]): boolean => {
    if (keys.length === 0) return isSuperAdmin;
    if (isSuperAdmin) return true;
    return keys.some((key) => permSet.has(key));
  };

  const hasAll = (...keys: string[]): boolean => {
    if (keys.length === 0) return isSuperAdmin;
    if (isSuperAdmin) return true;
    return keys.every((key) => permSet.has(key));
  };

  return {
    can,
    hasAny,
    hasAll,
    isSuperAdmin,
    isMasterTester,
    isTestAccount: Boolean(testerSession.data?.isTestAccount),
    testerLevel: testerSession.data?.testerLevel ?? null,
    permissions: permSet,
    isLoading: meLoading || testerSession.isLoading,
  };
}
