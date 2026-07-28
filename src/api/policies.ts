import { api } from "./client";

// Inline to avoid module resolution chain issues with tsc --noEmit
type ApiEnvelope<T> = { success: boolean; message: string; data: T; requestId?: string };

// ── Legacy / Onboarding Policy Types ──

export type PolicyType =
  | "terms-and-conditions"
  | "privacy-policy"
  | "code-of-conduct"
  | "nda"
  | "it-security"
  | "acceptable-use"
  | "data-protection"
  | "other";

export const POLICY_TYPES: PolicyType[] = [
  "terms-and-conditions",
  "privacy-policy",
  "code-of-conduct",
  "nda",
  "it-security",
  "acceptable-use",
  "data-protection",
  "other",
];

export const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  "terms-and-conditions": "Terms & Conditions",
  "privacy-policy":       "Privacy Policy",
  "code-of-conduct":      "Code of Conduct",
  "nda":                  "Non-Disclosure Agreement",
  "it-security":          "IT Security Policy",
  "acceptable-use":       "Acceptable Use Policy",
  "data-protection":      "Data Protection Policy",
  "other":                "Other",
};

export interface ActivePolicy {
  _id: string;
  policyType: PolicyType | string;
  title: string;
  slug: string;
  version: number;
  isRequired: boolean;
  publishedAt: string | null;
  contentHtml: string;
  contentJson: object;
  contentText: string;
  isAccepted: boolean;
  acceptedAt: string | null;
}

// ── Policy Categories Types & API ──

export interface PolicyCategory {
  id: string;
  businessId: string;
  parentCategoryId?: string | null;
  name: string;
  key: string;
  description?: string | null;
  status: "active" | "archived";
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  parentCategory?: PolicyCategory | null;
  childCategories?: PolicyCategory[];
}

export interface PolicyCategoryListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: "active" | "archived";
  parentCategoryId?: string | null;
  includeArchived?: boolean;
}

export interface PolicyCategoryListResponse {
  rows: PolicyCategory[];
  count: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreatePolicyCategoryInput {
  name: string;
  key?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  status?: "active" | "archived";
}

export interface UpdatePolicyCategoryInput {
  name?: string;
  key?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  status?: "active" | "archived";
}

export const policyCategoriesApi = {
  list: async (params?: PolicyCategoryListParams): Promise<PolicyCategoryListResponse> => {
    const res = await api.get<ApiEnvelope<PolicyCategoryListResponse>>("/api/v1/policies/categories", { params });
    return res.data.data;
  },

  get: async (id: string): Promise<PolicyCategory> => {
    const res = await api.get<ApiEnvelope<{ category: PolicyCategory }>>(`/api/v1/policies/categories/${id}`);
    return res.data.data.category;
  },

  create: async (input: CreatePolicyCategoryInput): Promise<PolicyCategory> => {
    const res = await api.post<ApiEnvelope<{ category: PolicyCategory }>>("/api/v1/policies/categories", input);
    return res.data.data.category;
  },

  update: async (id: string, input: UpdatePolicyCategoryInput): Promise<PolicyCategory> => {
    const res = await api.patch<ApiEnvelope<{ category: PolicyCategory }>>(`/api/v1/policies/categories/${id}`, input);
    return res.data.data.category;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiEnvelope<null>>(`/api/v1/policies/categories/${id}`);
    return { success: res.data.success, message: res.data.message };
  },

  restore: async (id: string): Promise<PolicyCategory> => {
    const res = await api.patch<ApiEnvelope<{ category: PolicyCategory }>>(`/api/v1/policies/categories/${id}/restore`);
    return res.data.data.category;
  },
};

// ── Policy Document Types & API ──

export type PolicyStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "scheduled"
  | "published"
  | "superseded"
  | "archived";

export type VisibilityScope = "company" | "department" | "private" | "public";
export type ConfidentialityLevel = "normal" | "confidential" | "restricted";

export interface PolicyDocument {
  id: string;
  businessId: string;
  categoryId?: string | null;
  policyType: string;
  title: string;
  slug: string;
  summary?: string | null;
  contentHtml?: string | null;
  contentJson?: any;
  contentText?: string | null;
  version: number;
  versionLabel?: string | null;
  status: PolicyStatus;
  visibility: VisibilityScope;
  confidentialityLevel: ConfidentialityLevel;
  isRequired: boolean;
  requiresAcceptance: boolean;
  requiresSignature: boolean;
  requiresReacceptanceOnUpdate: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  reviewDueAt?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
  ownerUserId?: string | null;
  ownerDepartmentId?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  submittedByUserId?: string | null;
  reviewedByUserId?: string | null;
  approvedByUserId?: string | null;
  publishedByUserId?: string | null;
  archivedByUserId?: string | null;
  appliesToAllEmployees: boolean;
  publicShareEnabled: boolean;
  supersededByPolicyId?: string | null;
  supersededByVersionId?: string | null;
  acceptanceCount: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  category?: PolicyCategory | null;
  owner?: { id: string; fullName?: string; email?: string } | null;
  ownerDepartment?: { id: string; name: string } | null;
}

export interface PolicyDocumentListParams {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: string;
  policyType?: string;
  status?: PolicyStatus;
  visibility?: VisibilityScope;
  confidentialityLevel?: ConfidentialityLevel;
  ownerUserId?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  reviewDueFrom?: string;
  reviewDueTo?: string;
  mine?: boolean;
  requiresAcceptance?: boolean;
  requiresSignature?: boolean;
  includeArchived?: boolean;
  sortBy?: "title" | "createdAt" | "updatedAt" | "effectiveFrom" | "effectiveUntil" | "reviewDueAt" | "publishedAt" | "version";
  sortDirection?: "ASC" | "DESC" | "asc" | "desc";
}

export interface PolicyDocumentListResponse {
  rows: PolicyDocument[];
  count: number;
  page: number;
  size: number;
  pages: number;
}

export interface CreatePolicyDocumentInput {
  title: string;
  slug?: string;
  policyType?: string;
  categoryId?: string | null;
  summary?: string | null;
  contentHtml: string;
  contentJson?: any;
  visibility?: VisibilityScope;
  confidentialityLevel?: ConfidentialityLevel;
  versionLabel?: string | null;
  isRequired?: boolean;
  requiresAcceptance?: boolean;
  requiresSignature?: boolean;
  requiresReacceptanceOnUpdate?: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  reviewDueAt?: string | null;
  ownerUserId?: string | null;
  ownerDepartmentId?: string | null;
  appliesToAllEmployees?: boolean;
  metadata?: any;
}

export interface UpdatePolicyDocumentInput {
  title?: string;
  slug?: string;
  policyType?: string;
  categoryId?: string | null;
  summary?: string | null;
  contentHtml?: string;
  contentJson?: any;
  visibility?: VisibilityScope;
  confidentialityLevel?: ConfidentialityLevel;
  versionLabel?: string | null;
  isRequired?: boolean;
  requiresAcceptance?: boolean;
  requiresSignature?: boolean;
  requiresReacceptanceOnUpdate?: boolean;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  reviewDueAt?: string | null;
  ownerUserId?: string | null;
  ownerDepartmentId?: string | null;
  appliesToAllEmployees?: boolean;
  metadata?: any;
  changeSummary?: string | null;
}

// ── Policy Assignment Types & API ──

export type SubjectType = "COMPANY" | "DEPARTMENT" | "POSITION" | "ROLE" | "EMPLOYEE";
export type AssignmentType = "INCLUDE" | "EXCLUDE";

export interface PolicyAssignmentItem {
  subjectType: SubjectType;
  subjectId: string;
  assignmentType: AssignmentType;
  isRequired?: boolean;
  requiresAcceptance?: boolean;
  requiresSignature?: boolean;
  dueAt?: string | null;
}

export interface PolicyAssignment extends PolicyAssignmentItem {
  id: string;
  businessId: string;
  policyId: string;
  policyVersionId: string;
  assignedAt: string;
  assignedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export const policyDocumentsApi = {
  list: async (params?: PolicyDocumentListParams): Promise<PolicyDocumentListResponse> => {
    const res = await api.get<ApiEnvelope<PolicyDocumentListResponse>>("/api/v1/policies", { params });
    return res.data.data;
  },

  get: async (id: string): Promise<PolicyDocument> => {
    const res = await api.get<ApiEnvelope<{ policy: PolicyDocument }>>(`/api/v1/policies/${id}`);
    return res.data.data.policy;
  },

  create: async (input: CreatePolicyDocumentInput): Promise<PolicyDocument> => {
    const res = await api.post<ApiEnvelope<{ policy: PolicyDocument }>>("/api/v1/policies", input);
    return res.data.data.policy;
  },

  update: async (id: string, input: UpdatePolicyDocumentInput): Promise<PolicyDocument> => {
    const res = await api.patch<ApiEnvelope<{ policy: PolicyDocument }>>(`/api/v1/policies/${id}`, input);
    return res.data.data.policy;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete<ApiEnvelope<null>>(`/api/v1/policies/${id}`);
    return { success: res.data.success, message: res.data.message };
  },

  restore: async (id: string): Promise<PolicyDocument> => {
    const res = await api.patch<ApiEnvelope<{ policy: PolicyDocument }>>(`/api/v1/policies/${id}/restore`);
    return res.data.data.policy;
  },

  // Assignments
  listAssignments: async (id: string): Promise<PolicyAssignment[]> => {
    const res = await api.get<ApiEnvelope<{ assignments: PolicyAssignment[] }>>(`/api/v1/policies/${id}/assignments`);
    return res.data.data.assignments;
  },

  updateAssignments: async (id: string, assignments: PolicyAssignmentItem[]): Promise<PolicyAssignment[]> => {
    const res = await api.put<ApiEnvelope<{ assignments: PolicyAssignment[] }>>(`/api/v1/policies/${id}/assignments`, { assignments });
    return res.data.data.assignments;
  },
};
