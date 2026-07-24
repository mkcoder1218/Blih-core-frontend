import { api } from "./client";
import type { ApiEnvelope } from "./types";

export type EmployeeProbationSource =
  | "MANUAL_EMPLOYEE_CREATION"
  | "PORTAL_REGISTRATION"
  | "EXISTING_EMPLOYEE"
  | "PROBATION_EXTENSION";

export type EmployeeProbationStatus =
  | "DRAFT"
  | "ACTIVE"
  | "REVIEW_DUE"
  | "MANAGER_REVIEW_PENDING"
  | "HR_REVIEW_PENDING"
  | "FINAL_APPROVAL_PENDING"
  | "CONTRACT_PENDING"
  | "CONFIRMED"
  | "EXTENDED"
  | "TERMINATED"
  | "CANCELLED";

export type EmployeeProbationDecision =
  | "CONFIRM_EMPLOYMENT"
  | "EXTEND_PROBATION"
  | "TERMINATE_EMPLOYMENT"
  | "REQUEST_MORE_INFORMATION";

export interface InitializeEmployeeProbationPayload {
  employeeUserId: string;
  startDate: string;
  durationMonths: number;
  expectedEndDate?: string;
  managerUserId?: string;
  finalApproverUserId?: string | null;
  source: EmployeeProbationSource;
  status?: EmployeeProbationStatus;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EmployeeProbationCriterion {
  id: string;
  probationId: string;
  name: string;
  description?: string | null;
  weight: number | string;
  isRequired: boolean;
  sortOrder: number;
  managerScore?: number | string | null;
  managerComment?: string | null;
  hrScore?: number | string | null;
  hrComment?: string | null;
  finalScore?: number | string | null;
}

export interface ProbationPerson {
  id: string;
  fullName: string;
  email?: string | null;
}

export interface ProbationHistoryEvent {
  type: string;
  at: string;
  actorUserId?: string;
  score?: number;
  recommendation?: EmployeeProbationDecision;
  decision?: EmployeeProbationDecision;
  comments?: string | null;
}

export interface EmployeeProbationRecord {
  id: string;
  businessId: string;
  employeeRecordId: string;
  employeeUserId: string;
  positionId: string;
  departmentId: string;
  managerUserId: string;
  finalApproverUserId?: string | null;
  source: EmployeeProbationSource;
  status: EmployeeProbationStatus;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string | null;
  durationMonths: number;
  managerRecommendation?: EmployeeProbationDecision | null;
  hrRecommendation?: EmployeeProbationDecision | null;
  finalDecision?: EmployeeProbationDecision | null;
  finalScore?: number | string | null;
  notes?: string | null;
  managerReviewSubmittedAt?: string | null;
  hrReviewSubmittedAt?: string | null;
  decisionApprovedAt?: string | null;
  employeeAcknowledgedAt?: string | null;
  parentProbationId?: string | null;
  metadata?: {
    history?: ProbationHistoryEvent[];
    reminders?: Record<string, string>;
    [key: string]: unknown;
  };
  criteria?: EmployeeProbationCriterion[];
  employee?: ProbationPerson;
  manager?: ProbationPerson;
  finalApprover?: ProbationPerson | null;
  department?: { id: string; name: string };
  position?: { id: string; title: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeProbationListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: EmployeeProbationStatus | "";
  departmentId?: string;
  positionId?: string;
  managerUserId?: string;
  employeeUserId?: string;
  endingFrom?: string;
  endingTo?: string;
}

export interface EmployeeProbationListResponse {
  rows: EmployeeProbationRecord[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

export interface ProbationReviewPayload {
  recommendation: EmployeeProbationDecision;
  comments?: string | null;
  scores: Array<{
    criterionId: string;
    score: number;
    comment?: string | null;
  }>;
}

export interface ProbationFinalDecisionPayload {
  decision: Exclude<EmployeeProbationDecision, "REQUEST_MORE_INFORMATION">;
  comments?: string | null;
  extensionMonths?: number;
  newExpectedEndDate?: string;
}

export async function initializeEmployeeProbation(payload: InitializeEmployeeProbationPayload) {
  const response = await api.post<ApiEnvelope<EmployeeProbationRecord>>(
    "/api/v1/hr/probation/initialize",
    payload,
  );
  return response.data.data;
}

export async function listEmployeeProbations(params: EmployeeProbationListParams = {}) {
  const response = await api.get<ApiEnvelope<EmployeeProbationListResponse>>(
    "/api/v1/hr/probation",
    { params },
  );
  return response.data.data;
}

export async function getEmployeeProbation(probationId: string) {
  const response = await api.get<ApiEnvelope<EmployeeProbationRecord>>(
    `/api/v1/hr/probation/${probationId}`,
  );
  return response.data.data;
}

export async function getMyEmployeeProbation() {
  const response = await api.get<ApiEnvelope<EmployeeProbationRecord | null>>(
    "/api/v1/hr/probation/mine/current",
  );
  return response.data.data;
}

export async function submitProbationManagerReview(probationId: string, payload: ProbationReviewPayload) {
  const response = await api.post<ApiEnvelope<EmployeeProbationRecord>>(
    `/api/v1/hr/probation/${probationId}/manager-review`,
    payload,
  );
  return response.data.data;
}

export async function submitProbationHrReview(probationId: string, payload: ProbationReviewPayload) {
  const response = await api.post<ApiEnvelope<EmployeeProbationRecord>>(
    `/api/v1/hr/probation/${probationId}/hr-review`,
    payload,
  );
  return response.data.data;
}

export async function submitProbationFinalDecision(probationId: string, payload: ProbationFinalDecisionPayload) {
  const response = await api.post<ApiEnvelope<{ probation: EmployeeProbationRecord; childProbationId?: string | null }>>(
    `/api/v1/hr/probation/${probationId}/final-decision`,
    payload,
  );
  return response.data.data;
}

export async function acknowledgeProbationDecision(probationId: string) {
  const response = await api.post<ApiEnvelope<EmployeeProbationRecord>>(
    `/api/v1/hr/probation/${probationId}/acknowledge`,
  );
  return response.data.data;
}
