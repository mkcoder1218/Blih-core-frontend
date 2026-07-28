import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  policyCategoriesApi,
  policyDocumentsApi,
  CreatePolicyCategoryInput,
  PolicyCategoryListParams,
  UpdatePolicyCategoryInput,
  CreatePolicyDocumentInput,
  PolicyDocumentListParams,
  UpdatePolicyDocumentInput,
  PolicyAssignmentItem,
} from "../api/policies";

// ── Policy Categories Hooks ──

export function usePolicyCategories(params?: PolicyCategoryListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["policy", "categories", params],
    queryFn: () => policyCategoriesApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function usePolicyCategory(id: string | null | undefined) {
  return useQuery({
    queryKey: ["policy", "category", id],
    queryFn: () => policyCategoriesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePolicyCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePolicyCategoryInput) => policyCategoriesApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", "categories"] });
    },
  });
}

export function useUpdatePolicyCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePolicyCategoryInput }) =>
      policyCategoriesApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["policy", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["policy", "category", variables.id] });
    },
  });
}

export function useDeletePolicyCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => policyCategoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", "categories"] });
    },
  });
}

export function useRestorePolicyCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => policyCategoriesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", "categories"] });
    },
  });
}

// ── Policy Documents Hooks ──

export function usePolicyList(params?: PolicyDocumentListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["policy", "list", params],
    queryFn: () => policyDocumentsApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function usePolicyDetail(id: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["policy", "detail", id],
    queryFn: () => policyDocumentsApi.get(id!),
    enabled: Boolean(id) && (options?.enabled ?? true),
  });
}

export function useCreatePolicyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePolicyDocumentInput) => policyDocumentsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy", "list"] });
    },
  });
}

export function useUpdatePolicyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePolicyDocumentInput }) =>
      policyDocumentsApi.update(id, input),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["policy", "list"] });
      queryClient.invalidateQueries({ queryKey: ["policy", "detail", variables.id] });
    },
  });
}

export function useDeletePolicyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => policyDocumentsApi.delete(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["policy", "list"] });
      queryClient.invalidateQueries({ queryKey: ["policy", "detail", id] });
    },
  });
}

export function useRestorePolicyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => policyDocumentsApi.restore(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["policy", "list"] });
      queryClient.invalidateQueries({ queryKey: ["policy", "detail", id] });
    },
  });
}

// ── Policy Assignments Hooks ──

export function usePolicyAssignments(policyId: string | null | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["policy", "assignments", policyId],
    queryFn: () => policyDocumentsApi.listAssignments(policyId!),
    enabled: Boolean(policyId) && (options?.enabled ?? true),
  });
}

export function useUpdatePolicyAssignments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, assignments }: { policyId: string; assignments: PolicyAssignmentItem[] }) =>
      policyDocumentsApi.updateAssignments(policyId, assignments),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["policy", "assignments", variables.policyId] });
      queryClient.invalidateQueries({ queryKey: ["policy", "detail", variables.policyId] });
    },
  });
}

// ── Legacy Onboarding Compatibility Hooks ──

export function useActivePolicies() {
  return useQuery({
    queryKey: ["policy", "active-user-policies"],
    queryFn: async () => {
      const res = await policyDocumentsApi.list({ status: "published", page: 1, size: 50 });
      return (res.rows || []).map((doc) => ({
        _id: doc.id,
        policyType: doc.policyType,
        title: doc.title,
        slug: doc.slug,
        version: doc.version,
        isRequired: doc.isRequired,
        publishedAt: doc.publishedAt || null,
        contentHtml: doc.contentHtml || "",
        contentJson: doc.contentJson || {},
        contentText: doc.contentText || "",
        isAccepted: false,
        acceptedAt: null,
      }));
    },
  });
}

export function usePolicyMutations() {
  const queryClient = useQueryClient();
  const acceptPolicy = useMutation({
    mutationFn: async (id: string) => {
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["policy"] });
    },
  });
  return { acceptPolicy };
}
