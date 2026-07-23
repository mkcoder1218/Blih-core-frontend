import {
  api,
} from "./client";

import type {
  ApiEnvelope,
} from "./types";

export interface MyEmploymentContract {
  id: string;
  businessId: string;
  contractNumber: string;

  candidateName: string;
  candidateEmail: string;

  contractType: string;
  employmentType?: string | null;
  workLocation?: string | null;

  salary?: string | number | null;
  currency: string;

  startDate?: string | null;
  endDate?: string | null;

  subject: string;

  bodyHtml: string;
  renderedHtml?: string | null;

  bodyText: string;
  renderedText?: string | null;

  status:
    | "SENT"
    | "VIEWED"
    | "PARTIALLY_SIGNED"
    | string;

  sentAt?: string | null;
  viewedAt?: string | null;
  employeeSignedAt?: string | null;
  employerSignedAt?: string | null;

  metadata?: Record<
    string,
    unknown
  >;

  template?: {
    id: string;
    name?: string;
    contractType?: string;
  } | null;

  department?: {
    id: string;
    name?: string;
  } | null;

  position?: {
    id: string;
    title?: string;
  } | null;

  reportingManager?: {
    id: string;
    fullName?: string;
    email?: string;
  } | null;
}

export interface MyPendingContractResult {
  required: boolean;
  contract: MyEmploymentContract | null;
}

export interface SignMyEmploymentContractInput {
  consent: true;
  signatureDataUrl: string;
}

const BASE_URL =
  "/api/v1/hr/employment-contracts";

export async function getMyPendingEmploymentContract() {
  return api.get<
    ApiEnvelope<MyPendingContractResult>
  >(
    `${BASE_URL}/me/pending`,
  );
}

export async function signMyEmploymentContract(
  contractId: string,
  input: SignMyEmploymentContractInput,
) {
  return api.post<
    ApiEnvelope<{
      id: string;
      contractNumber: string;
      status: string;
      employeeSignedAt: string;
    }>
  >(
    `${BASE_URL}/${contractId}/sign-employee`,
    input,
  );
}
