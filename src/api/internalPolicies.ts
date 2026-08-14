import { api } from "./client";

export type InternalPolicyCategory = {
  id: string;
  name: string;
  key: string;
};

export type InternalPolicySummary = {
  id: string;
  categoryId?: string | null;
  policyType: string;
  title: string;
  slug: string;
  summary?: string | null;
  contentHtml?: string | null;
  contentText?: string | null;
  version: number;
  versionLabel?: string | null;
  status: "published";
  visibility: "company";
  confidentialityLevel: "normal" | "confidential" | "restricted";
  isRequired: boolean;
  requiresAcceptance: boolean;
  requiresSignature: boolean;
  appliesToAllEmployees: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  publishedAt?: string | null;
  updatedAt: string;
  category?: InternalPolicyCategory | null;
};

export type InternalPolicyDetail = InternalPolicySummary & {
  owner?: {
    id: string;
    fullName?: string | null;
  } | null;
};

export type InternalPolicyListResponse = {
  rows: InternalPolicySummary[];
  count: number;
  page: number;
  size: number;
  pages: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  requestId?: string;
};

export type InternalPolicyListParams = {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: string;
  policyType?: string;
  sortBy?: "title" | "publishedAt" | "effectiveFrom" | "updatedAt";
  sortDirection?: "ASC" | "DESC" | "asc" | "desc";
};

export const internalPoliciesApi = {
  list: async (params?: InternalPolicyListParams): Promise<InternalPolicyListResponse> => {
    const response = await api.get<ApiEnvelope<InternalPolicyListResponse>>(
      "/api/v1/policies/library",
      { params },
    );

    return response.data.data;
  },

  get: async (id: string): Promise<InternalPolicyDetail> => {
    const response = await api.get<ApiEnvelope<{ policy: InternalPolicyDetail }>>(
      `/api/v1/policies/library/${id}`,
    );

    return response.data.data.policy;
  },
};
