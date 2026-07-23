import {
  api,
} from "./client";

import type {
  ApiEnvelope,
} from "./types";

export const EMPLOYMENT_CONTRACT_STATUSES = [
  "DRAFT",
  "READY",
  "SENT",
  "VIEWED",
  "PARTIALLY_SIGNED",
  "SIGNED",
  "ACTIVE",
  "EXPIRING",
  "EXPIRED",
  "TERMINATED",
  "CANCELLED",
  "SUPERSEDED",
] as const;

export type EmploymentContractStatus =
  (typeof EMPLOYMENT_CONTRACT_STATUSES)[number];

export interface EmploymentContractTemplate {
  id: string;
  businessId: string;
  name: string;
  description?: string | null;
  contractType: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  isDefault: boolean;
  isActive: boolean;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmploymentContractRelation {
  id: string;
  name?: string;
  title?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  contractType?: string;
  candidateName?: string;
  candidateEmail?: string;
}

export interface EmploymentContract {
  id: string;
  businessId: string;
  contractNumber: string;

  templateId?: string | null;
  offerId?: string | null;
  candidateOnboardingId?: string | null;
  employeeRecordId?: string | null;

  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;

  departmentId?: string | null;
  positionId?: string | null;
  reportingManagerId?: string | null;

  contractType: string;
  employmentType?: string | null;
  workLocation?: string | null;

  salary?: string | number | null;
  currency: string;

  startDate?: string | null;
  endDate?: string | null;
  probationStartDate?: string | null;
  probationEndDate?: string | null;
  noticePeriodDays?: number | null;

  subject: string;
  bodyHtml: string;
  bodyText: string;

  renderedSubject?: string | null;
  renderedHtml?: string | null;
  renderedText?: string | null;

  status: EmploymentContractStatus;

  pdfPath?: string | null;
  pdfUrl?: string | null;

  sentAt?: string | null;
  viewedAt?: string | null;
  employeeSignedAt?: string | null;
  employerSignedAt?: string | null;
  activatedAt?: string | null;
  terminatedAt?: string | null;
  terminationReason?: string | null;

  metadata?: Record<string, unknown>;

  createdById?: string | null;
  updatedById?: string | null;

  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  template?: EmploymentContractRelation | null;
  offer?: EmploymentContractRelation | null;
  department?: EmploymentContractRelation | null;
  position?: EmploymentContractRelation | null;
  reportingManager?: EmploymentContractRelation | null;
}

export interface EmploymentContractListParams {
  status?: EmploymentContractStatus | "";
  search?: string;
  offerId?: string;
  employeeRecordId?: string;
  limit?: number;
  offset?: number;
}

export interface EmploymentContractListResult {
  rows: EmploymentContract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmploymentContractTemplateInput {
  name: string;
  description?: string | null;
  contractType: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface EmploymentContractCreateInput {
  templateId?: string | null;
  offerId?: string | null;
  candidateOnboardingId?: string | null;
  employeeRecordId?: string | null;

  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;

  departmentId?: string | null;
  positionId?: string | null;
  reportingManagerId?: string | null;

  contractType: string;
  employmentType?: string | null;
  workLocation?: string | null;

  salary?: string | number | null;
  currency?: string;

  startDate?: string | null;
  endDate?: string | null;
  probationStartDate?: string | null;
  probationEndDate?: string | null;
  noticePeriodDays?: number | null;

  subject: string;
  bodyHtml: string;
  bodyText?: string;

  metadata?: Record<string, unknown>;
}

export type EmploymentContractUpdateInput =
  Partial<
    Omit<
      EmploymentContractCreateInput,
      "offerId"
    >
  >;

export interface CreateContractFromOfferInput {
  templateId: string;
  candidateOnboardingId?: string | null;
  contractType?: string;
  endDate?: string | null;
  probationStartDate?: string | null;
  probationEndDate?: string | null;
  noticePeriodDays?: number | null;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  metadata?: Record<string, unknown>;
}

export interface EmploymentContractPreviewInput {
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  data?: Record<
    string,
    string | number | boolean | null | undefined
  >;
}

export interface EmploymentContractPreview {
  renderedSubject: string;
  renderedHtml: string;
  renderedText: string;
  missingVariables: string[];
  usedVariables: string[];
  data?: Record<string, unknown>;
}

export interface EmploymentContractMissingField {
  key: string;
  label: string;
}

export interface EmploymentContractEmployeePrefill {
  employeeRecordId: string;
  userId: string;

  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;

  departmentId?: string | null;
  departmentName: string;

  positionId?: string | null;
  positionName: string;

  reportingManagerId?: string | null;
  managerName: string;

  contractType: string;
  employmentType?: string | null;
  workLocation: string;

  salary?: string | number | null;
  currency: string;

  startDate?: string | null;
  endDate?: string | null;

  probationStartDate?: string | null;
  probationEndDate?: string | null;

  noticePeriodDays?: number | null;

  companyName: string;
  companyAddress: string;
}

export interface EmploymentContractPrefillResult {
  employee: EmploymentContractEmployeePrefill;
  missingFields: EmploymentContractMissingField[];
}

export interface AssignEmploymentContractInput {
  templateId: string;

  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;

  departmentId?: string | null;
  departmentName: string;

  positionId?: string | null;
  positionName: string;

  reportingManagerId?: string | null;
  managerName?: string | null;

  contractType: string;
  employmentType?: string | null;
  workLocation: string;

  salary?: string | number | null;
  currency: string;

  startDate?: string | null;
  endDate?: string | null;

  probationStartDate?: string | null;
  probationEndDate?: string | null;

  noticePeriodDays?: number | null;

  companyName: string;
  companyAddress: string;

  subject: string;
  bodyHtml: string;
  bodyText?: string;

  metadata?: Record<string, unknown>;
}

const BASE_URL =
  "/api/v1/hr/employment-contracts";

function normalizeListResponse(
  envelope:
    | ApiEnvelope<EmploymentContract[]>
    | undefined,
): EmploymentContractListResult {
  const rows =
    Array.isArray(envelope?.data)
      ? envelope.data
      : [];

  const meta =
    envelope?.meta ?? {};

  const limit =
    Number(
      meta.limit ??
        meta.size ??
        20,
    ) || 20;

  const page =
    Number(
      meta.page ??
        1,
    ) || 1;

  const total =
    Number(
      meta.total ??
        rows.length,
    ) || 0;

  const totalPages =
    Number(
      meta.totalPages ??
        Math.ceil(
          total / limit,
        ),
    ) || 0;

  return {
    rows,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getEmploymentContractStatuses() {
  return api.get<
    ApiEnvelope<EmploymentContractStatus[]>
  >(
    `${BASE_URL}/statuses`,
  );
}

export async function getEmploymentContractTemplates(
  params?: {
    contractType?: string;
    includeInactive?: boolean;
  },
) {
  return api.get<
    ApiEnvelope<EmploymentContractTemplate[]>
  >(
    `${BASE_URL}/templates`,
    {
      params,
    },
  );
}

export async function createEmploymentContractTemplate(
  input: EmploymentContractTemplateInput,
) {
  return api.post<
    ApiEnvelope<EmploymentContractTemplate>
  >(
    `${BASE_URL}/templates`,
    input,
  );
}

export async function updateEmploymentContractTemplate(
  id: string,
  input: Partial<EmploymentContractTemplateInput>,
) {
  return api.patch<
    ApiEnvelope<EmploymentContractTemplate>
  >(
    `${BASE_URL}/templates/${id}`,
    input,
  );
}

export async function deleteEmploymentContractTemplate(
  id: string,
) {
  return api.delete<
    ApiEnvelope<null>
  >(
    `${BASE_URL}/templates/${id}`,
  );
}

export async function getEmploymentContracts(
  params?: EmploymentContractListParams,
): Promise<EmploymentContractListResult> {
  const response =
    await api.get<
      ApiEnvelope<EmploymentContract[]>
    >(
      BASE_URL,
      {
        params,
      },
    );

  return normalizeListResponse(
    response.data,
  );
}

export async function getEmploymentContract(
  id: string,
) {
  return api.get<
    ApiEnvelope<EmploymentContract>
  >(
    `${BASE_URL}/${id}`,
  );
}

export async function createEmploymentContract(
  input: EmploymentContractCreateInput,
) {
  return api.post<
    ApiEnvelope<EmploymentContract>
  >(
    BASE_URL,
    input,
  );
}

export async function createEmploymentContractFromOffer(
  offerId: string,
  input: CreateContractFromOfferInput,
) {
  return api.post<
    ApiEnvelope<EmploymentContract>
  >(
    `${BASE_URL}/from-offer/${offerId}`,
    input,
  );
}

export async function updateEmploymentContract(
  id: string,
  input: EmploymentContractUpdateInput,
) {
  return api.patch<
    ApiEnvelope<EmploymentContract>
  >(
    `${BASE_URL}/${id}`,
    input,
  );
}

export async function deleteEmploymentContract(
  id: string,
) {
  return api.delete<
    ApiEnvelope<null>
  >(
    `${BASE_URL}/${id}`,
  );
}

export async function previewEmploymentContract(
  input: EmploymentContractPreviewInput,
) {
  return api.post<
    ApiEnvelope<EmploymentContractPreview>
  >(
    `${BASE_URL}/preview`,
    input,
  );
}

export async function previewSavedEmploymentContract(
  id: string,
) {
  return api.post<
    ApiEnvelope<EmploymentContractPreview>
  >(
    `${BASE_URL}/${id}/preview`,
  );
}

export async function getEmploymentContractEmployeePrefill(
  employeeRecordId: string,
) {
  return api.get<
    ApiEnvelope<EmploymentContractPrefillResult>
  >(
    `${BASE_URL}/employee/${employeeRecordId}/prefill`,
  );
}

export async function assignEmploymentContract(
  employeeRecordId: string,
  input: AssignEmploymentContractInput,
) {
  return api.post<
    ApiEnvelope<EmploymentContract>
  >(
    `${BASE_URL}/employee/${employeeRecordId}/assign`,
    input,
  );
}
