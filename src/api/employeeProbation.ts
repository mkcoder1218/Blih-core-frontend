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
  notes?: string | null;
  criteria?: EmployeeProbationCriterion[];
  employee?: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  manager?: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  finalApprover?: {
    id: string;
    fullName: string;
    email?: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
  };
  position?: {
    id: string;
    title: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export async function initializeEmployeeProbation(
  payload: InitializeEmployeeProbationPayload,
) {
  const response = await api.post<
    ApiEnvelope<EmployeeProbationRecord>
  >(
    "/api/v1/hr/probation/initialize",
    payload,
  );

  return response.data.data;
}

export async function getEmployeeProbation(
  probationId: string,
) {
  const response = await api.get<
    ApiEnvelope<EmployeeProbationRecord>
  >(
    `/api/v1/hr/probation/${probationId}`,
  );

  return response.data.data;
}
