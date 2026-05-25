import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, CreateBusinessRequest } from "../api/types";

export function useCreateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateBusinessRequest) => {
      const res = await api.post<ApiEnvelope<{ business: any }>>("/api/v1/businesses", payload);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

