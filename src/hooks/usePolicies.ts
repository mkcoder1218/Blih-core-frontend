/**
 * React Query hooks for the Policies module.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptPolicy,
  archivePolicy,
  createPolicy,
  getActivePolicies,
  getComplianceReport,
  getPolicies,
  getPolicyAcceptances,
  getPolicyById,
  getPolicyByType,
  updatePolicy,
  type ActivePolicy,
  type ComplianceReport,
  type PolicyDetail,
  type PolicySummary,
  type PolicyType,
} from "../api/policies";

// ── Employee-facing ────────────────────────────────────────────────────────────

/** All active policies with the current user's acceptance status. */
export function useActivePolicies() {
  return useQuery<ActivePolicy[]>({
    queryKey: ["policies", "public"],
    queryFn: getActivePolicies,
    staleTime: 60_000,
  });
}

// ── Admin ──────────────────────────────────────────────────────────────────────

/** Paginated list of all policies (admin). */
export function usePolicies(filters?: {
  page?: number;
  limit?: number;
  status?: "draft" | "active" | "archived";
}) {
  return useQuery({
    queryKey: ["policies", "list", filters],
    queryFn: () => getPolicies(filters),
    staleTime: 30_000,
  });
}

/** Single policy by its fixed enum type (admin). */
export function usePolicyByType(policyType: PolicyType | null) {
  return useQuery<PolicyDetail>({
    queryKey: ["policies", "type", policyType],
    queryFn: () => getPolicyByType(policyType!),
    enabled: !!policyType,
    staleTime: 60_000,
  });
}

/** Single policy detail by MongoDB ID (admin). */
export function usePolicyDetail(id: string | null) {
  return useQuery<PolicyDetail>({
    queryKey: ["policies", "detail", id],
    queryFn: () => getPolicyById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Who accepted a specific policy (admin). */
export function usePolicyAcceptances(id: string | null, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["policies", "acceptances", id, params],
    queryFn: () => getPolicyAcceptances(id!, params),
    enabled: !!id,
    staleTime: 30_000,
  });
}

/** Compliance report (admin). */
export function useComplianceReport() {
  return useQuery<ComplianceReport>({
    queryKey: ["policies", "compliance"],
    queryFn: getComplianceReport,
    staleTime: 60_000,
  });
}

/** All write operations bundled together. */
export function usePolicyMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["policies"] });
  };

  const createPolicyMut = useMutation({
    mutationFn: (data: Partial<PolicyDetail>) => createPolicy(data),
    onSuccess: invalidate,
  });

  const updatePolicyMut = useMutation({
    mutationFn: ({ id, ...data }: Partial<PolicyDetail> & { id: string }) =>
      updatePolicy(id, data),
    onSuccess: invalidate,
  });

  const deletePolicyMut = useMutation({
    mutationFn: (id: string) => archivePolicy(id),
    onSuccess: invalidate,
  });

  const acceptPolicyMut = useMutation({
    mutationFn: (id: string) => acceptPolicy(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["policies", "public"] }),
  });

  return {
    createPolicy: createPolicyMut,
    updatePolicy: updatePolicyMut,
    deletePolicy: deletePolicyMut,
    acceptPolicy: acceptPolicyMut,
  };
}
