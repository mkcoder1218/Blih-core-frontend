import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { getProbationDashboard, updateProbationWeights } from "./api";
import type { ProbationFilters, ProbationWeights } from "./types";

export const probationQueryKeys = {
  all: ["probation"] as const,
  dashboards: () => [...probationQueryKeys.all, "dashboard"] as const,
  dashboard: (params: Record<string, string>) => [...probationQueryKeys.dashboards(), params] as const,
};

export function toProbationParams(filters: ProbationFilters): Record<string, string> {
  const params: Record<string, string> = {};
  const search = filters.search.trim();

  if (search) params.search = search;
  if (filters.departmentId) params.departmentId = filters.departmentId;
  if (filters.status) params.status = filters.status;
  if (filters.endFrom) params.endFrom = filters.endFrom;
  if (filters.endTo) params.endTo = filters.endTo;

  return params;
}

export function useProbationDashboard(params: Record<string, string>) {
  return useQuery({
    queryKey: probationQueryKeys.dashboard(params),
    queryFn: () => getProbationDashboard(params),
  });
}

interface UseUpdateProbationWeightsOptions {
  onSuccess?: () => void | Promise<void>;
  onError?: (message: string) => void;
}

export function useUpdateProbationWeights(options: UseUpdateProbationWeightsOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (weights: ProbationWeights) => updateProbationWeights(weights),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: probationQueryKeys.all });
      await options.onSuccess?.();
    },
    onError: (error: unknown) => options.onError?.(
      getProbationErrorMessage(error, "Unable to update probation settings."),
    ),
  });
}

export function getProbationErrorMessage(
  error: unknown,
  fallback = "Unable to load probation information.",
): string {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}
