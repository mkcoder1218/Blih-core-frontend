import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, Plan, UpdatePlanRequest } from "../api/types";

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; data: UpdatePlanRequest }) => {
      const res = await api.patch<ApiEnvelope<{ plan: Plan }>>(`/api/v1/plans/${payload.id}`, payload.data);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

