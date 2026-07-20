import { api } from "../../api/client";
import type { ApiEnvelope } from "../../api/types";
import type { ProbationDashboardResponse, ProbationWeights } from "./types";

export async function getProbationDashboard(params?: Record<string, string>) {
  const response = await api.get<ApiEnvelope<ProbationDashboardResponse>>(
    "/api/v1/hr/performance/probation",
    { params },
  );

  return response.data.data;
}

export async function updateProbationWeights(payload: ProbationWeights) {
  const response = await api.put<ApiEnvelope<ProbationWeights>>(
    "/api/v1/hr/performance/probation/weights",
    payload,
  );

  return response.data.data;
}

