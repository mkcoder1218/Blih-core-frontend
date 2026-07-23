import {
  api,
} from "./client";

import type {
  ApiEnvelope,
} from "./types";

export interface SignEmployerContractInput {
  consent: true;

  signatureDataUrl: string;
}

export interface SignEmployerContractResult {
  contract: {
    id: string;

    contractNumber: string;

    status: string;

    employeeSignedAt?: string | null;

    employerSignedAt?: string | null;

    metadata?: Record<
      string,
      unknown
    >;
  };
}

const BASE_URL =
  "/api/v1/hr/employment-contracts";

export async function signEmploymentContractAsEmployer(
  contractId: string,
  input: SignEmployerContractInput,
) {
  return api.post<
    ApiEnvelope<SignEmployerContractResult>
  >(
    `${BASE_URL}/${contractId}/sign-employer`,
    input,
  );
}
