import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";

export function useDeleteBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      const res = await api.delete<ApiEnvelope<{ ok: true }>>(`/api/v1/businesses/${businessId}`);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

