import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgeProbationDecision,
  getEmployeeProbation,
  getMyEmployeeProbation,
  initializeEmployeeProbation,
  listEmployeeProbations,
  submitProbationFinalDecision,
  submitProbationHrReview,
  submitProbationManagerReview,
  type EmployeeProbationListParams,
  type InitializeEmployeeProbationPayload,
  type ProbationFinalDecisionPayload,
  type ProbationReviewPayload,
} from "../api/employeeProbation";

export const employeeProbationKeys = {
  all: ["employee-probations"] as const,
  lists: () => [...employeeProbationKeys.all, "list"] as const,
  list: (params: EmployeeProbationListParams) => [...employeeProbationKeys.lists(), params] as const,
  detail: (id: string) => [...employeeProbationKeys.all, "detail", id] as const,
  mine: () => [...employeeProbationKeys.all, "mine"] as const,
};

function useProbationInvalidation() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: employeeProbationKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["probation"] }),
      queryClient.invalidateQueries({ queryKey: ["hr-records"] }),
    ]);
  };
}

export function useEmployeeProbation(id?: string) {
  return useQuery({
    queryKey: employeeProbationKeys.detail(id || ""),
    queryFn: () => getEmployeeProbation(id!),
    enabled: Boolean(id),
  });
}

export function useEmployeeProbations(params: EmployeeProbationListParams) {
  return useQuery({
    queryKey: employeeProbationKeys.list(params),
    queryFn: () => listEmployeeProbations(params),
  });
}

export function useMyEmployeeProbation() {
  return useQuery({
    queryKey: employeeProbationKeys.mine(),
    queryFn: getMyEmployeeProbation,
  });
}

export function useInitializeEmployeeProbation() {
  const invalidate = useProbationInvalidation();
  return useMutation({ mutationFn: (payload: InitializeEmployeeProbationPayload) => initializeEmployeeProbation(payload), onSuccess: invalidate });
}

export function useSubmitProbationManagerReview() {
  const invalidate = useProbationInvalidation();
  return useMutation({
    mutationFn: ({ probationId, payload }: { probationId: string; payload: ProbationReviewPayload }) =>
      submitProbationManagerReview(probationId, payload),
    onSuccess: invalidate,
  });
}

export function useSubmitProbationHrReview() {
  const invalidate = useProbationInvalidation();
  return useMutation({
    mutationFn: ({ probationId, payload }: { probationId: string; payload: ProbationReviewPayload }) =>
      submitProbationHrReview(probationId, payload),
    onSuccess: invalidate,
  });
}

export function useSubmitProbationFinalDecision() {
  const invalidate = useProbationInvalidation();
  return useMutation({
    mutationFn: ({ probationId, payload }: { probationId: string; payload: ProbationFinalDecisionPayload }) =>
      submitProbationFinalDecision(probationId, payload),
    onSuccess: invalidate,
  });
}

export function useAcknowledgeProbationDecision() {
  const invalidate = useProbationInvalidation();
  return useMutation({ mutationFn: acknowledgeProbationDecision, onSuccess: invalidate });
}
