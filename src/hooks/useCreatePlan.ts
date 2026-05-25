import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, CreatePlanRequest, Plan } from "../api/types";

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePlanRequest) => {
      const res = await api.post<ApiEnvelope<{ plan: Plan }>>("/api/v1/plans", payload);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

