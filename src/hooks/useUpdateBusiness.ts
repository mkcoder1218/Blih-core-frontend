import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, UpdateBusinessRequest } from "../api/types";

export function useUpdateBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { businessId: string; data: UpdateBusinessRequest }) => {
      const res = await api.patch<ApiEnvelope<{ business: any }>>(`/api/v1/businesses/${payload.businessId}`, payload.data);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}
