/**
 * Policies API
 * Base: https://blih-knowledge-base-backend.onrender.com/api/v1
 * Configured via VITE_POLICIES_API_BASE_URL
 */
import axios from "axios";
import { getAccessToken } from "./storage";

const policiesBaseURL = import.meta.env.VITE_POLICIES_API_BASE_URL as string | undefined;
if (!policiesBaseURL) {
  console.warn("Missing VITE_POLICIES_API_BASE_URL; Policies API calls will fail.");
}

/** Dedicated axios instance for the knowledge-base / policies service. */
const policiesApi = axios.create({
  baseURL: policiesBaseURL,
  headers: { "Content-Type": "application/json" },
});

// Forward the same auth token so the policies service can identify the user
policiesApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = { ...(config.headers as any), Authorization: `Bearer ${token}` } as any;
  }
  return config;
});

// ── Types ──────────────────────────────────────────────────────────────────────

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

export interface UserRef {
  _id: string;
  name: string;
  email: string;
}

export interface PolicySummary {
  _id: string;
  policyType: PolicyType;
  title: string;
  slug: string;
  version: number;
  status: "draft" | "active" | "archived";
  isRequired: boolean;
  publishedAt: string | null;
  createdBy: UserRef | null;
  updatedBy: UserRef | null;
  createdAt: string;
  updatedAt: string;
  acceptanceCount: number;
}

export interface PolicyDetail extends PolicySummary {
  contentHtml: string;
  contentJson: object;
  contentText: string;
}

export interface ActivePolicy {
  _id: string;
  policyType: PolicyType;
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

export interface PolicyAcceptance {
  _id: string;
  policy: string;
  user: string;
  policyVersion: number;
  acceptedAt: string;
  ipAddress: string;
}

export interface PoliciesPage {
  policies: PolicySummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ComplianceReport {
  policies: {
    _id: string;
    title: string;
    version: number;
    acceptedCount: number;
    pendingCount: number;
  }[];
  totalEmployees: number;
  fullyCompliant: number;
  nonCompliant: {
    _id: string;
    name: string;
    email: string;
    position: string;
    department: { name: string };
  }[];
}

export interface AcceptancesPage {
  acceptances: PolicyAcceptance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Unwrap the standard { success, message, data } envelope. */
function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

// ── Employee-facing (public) ───────────────────────────────────────────────────

/** GET /policies/public — all active policies with acceptance status */
export async function getActivePolicies(): Promise<ActivePolicy[]> {
  const res = await policiesApi.get("/policies/public");
  return res.data as ActivePolicy[];
}

/** POST /policies/public/:id/accept — accept a specific policy */
export async function acceptPolicy(id: string): Promise<PolicyAcceptance> {
  const res = await policiesApi.post(`/policies/public/${id}/accept`);
  return unwrap(res);
}

// ── Admin ──────────────────────────────────────────────────────────────────────

/** GET /policies — paginated list (admin) */
export async function getPolicies(params?: {
  page?: number;
  limit?: number;
  status?: "draft" | "active" | "archived";
}): Promise<PoliciesPage> {
  const res = await policiesApi.get("/policies", { params });
  return res.data as PoliciesPage;
}

/** GET /policies/type/:policyType — single policy by enum type (admin) */
export async function getPolicyByType(policyType: PolicyType): Promise<PolicyDetail> {
  const res = await policiesApi.get(`/policies/type/${policyType}`);
  return unwrap(res);
}

/** GET /policies/:id — single policy by ID (admin) */
export async function getPolicyById(id: string): Promise<PolicyDetail> {
  const res = await policiesApi.get(`/policies/${id}`);
  return unwrap(res);
}

/** POST /policies — create a new policy (admin) */
export async function createPolicy(data: Partial<PolicyDetail>): Promise<PolicyDetail> {
  const res = await policiesApi.post("/policies", data);
  return unwrap(res);
}

/** PUT /policies/:id — update a policy (admin) */
export async function updatePolicy(id: string, data: Partial<PolicyDetail>): Promise<PolicyDetail> {
  const res = await policiesApi.put(`/policies/${id}`, data);
  return unwrap(res);
}

/** DELETE /policies/:id — archive (soft-delete) a policy (admin) */
export async function archivePolicy(id: string): Promise<void> {
  await policiesApi.delete(`/policies/${id}`);
}

/** GET /policies/compliance — compliance report (admin) */
export async function getComplianceReport(): Promise<ComplianceReport> {
  const res = await policiesApi.get("/policies/compliance");
  return unwrap(res);
}

/** GET /policies/:id/acceptances — who accepted a policy (admin) */
export async function getPolicyAcceptances(
  id: string,
  params?: { page?: number; limit?: number }
): Promise<AcceptancesPage> {
  const res = await policiesApi.get(`/policies/${id}/acceptances`, { params });
  return unwrap(res);
}
