import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";
import { useMe } from "./useMe";

export interface Permission {
  id: string;
  module: string;
  action: string;
  key: string;
  description: string;
}

// ─── Hook: fetch all system permissions (admin use) ───────────────────────────

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
      // Re-fetch /me so the sidebar rebuilds immediately when permissions are saved
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ─── Hook: resolved permissions for the current user ─────────────────────────
//
// Returns a `can(key)` function that is true when the logged-in user holds
// the given permission key, or when they are a platform super admin (which
// bypasses all permission checks, but only for platform-level views).
//
// Usage:
//   const { can, isSuperAdmin, isLoading } = useMyPermissions();
//   if (can("job.read")) { ... }

export function useMyPermissions() {
  const { data: meRes, isLoading } = useMe();
  const me = meRes?.data;

  const isSuperAdmin = Boolean(me?.user?.isPlatformSuperAdmin);
  // Permissions come back from /me as a flat string array
  const permSet = new Set<string>(me?.permissions ?? []);

  const can = (key: string): boolean => {
    if (isSuperAdmin) return true;
    return permSet.has(key);
  };

  const hasAny = (...keys: string[]): boolean => {
    // Empty key list = super-admin-only gate — never grant to regular users
    if (keys.length === 0) return isSuperAdmin;
    if (isSuperAdmin) return true;
    return keys.some((k) => permSet.has(k));
  };

  const hasAll = (...keys: string[]): boolean => {
    if (keys.length === 0) return isSuperAdmin;
    if (isSuperAdmin) return true;
    return keys.every((k) => permSet.has(k));
  };

  return { can, hasAny, hasAll, isSuperAdmin, permissions: permSet, isLoading };
}
