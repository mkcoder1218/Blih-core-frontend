import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ─── Hook: resolved permissions for the current user ─────────────────────────
//
// Master Tester is a separate testing authority, not a real PLATFORM_SUPER_ADMIN
// role assignment. For UI capability checks it receives the same effective bypass
// so it can exercise every feature without contaminating normal RBAC data.
//
// Career self-service historically has two keys: career.self and career.request.
// The simplified Career Management UI treats either one as employee self-service.
// The built-in EMPLOYEE role also receives this self-service baseline, matching the
// existing Attendance / Profiles / Performance employee self-service behavior.
// Company-wide request review still requires HR/performance permissions in the
// sidebar tab map and is not granted here.

export function useMyPermissions() {
  const { data: meRes, isLoading: meLoading } = useMe();
  const testerSession = useTesterSession();
  const me = meRes?.data;

  const isMasterTester = Boolean(testerSession.data?.isMasterTester);
  const isSuperAdmin = Boolean(me?.user?.isPlatformSuperAdmin) || isMasterTester;

  const permSet = new Set<string>(me?.permissions ?? []);
  const roleKeys = new Set<string>((me?.roles ?? []).map((role) => String(role).toUpperCase()));
  const isBuiltInEmployee = roleKeys.has("EMPLOYEE");

  if (
    isBuiltInEmployee ||
    permSet.has("career.self") ||
    permSet.has("career.request")
  ) {
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
    return keys.some((k) => permSet.has(k));
  };

  const hasAll = (...keys: string[]): boolean => {
    if (keys.length === 0) return isSuperAdmin;
    if (isSuperAdmin) return true;
    return keys.every((k) => permSet.has(k));
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
