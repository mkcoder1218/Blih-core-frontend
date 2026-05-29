import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";

export function useDeleteBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (businessId: string) => {
      // Purge permanently removes the business and all associated data
      const res = await api.delete<ApiEnvelope<{ ok: true }>>(`/api/v1/businesses/${businessId}/purge`);
      return res.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["businesses"] });
    },
  });
}

