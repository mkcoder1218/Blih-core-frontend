import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, CreateBusinessAdminRequest, CreateBusinessAdminResponse } from "../api/types";

export function useCreateBusinessAdmin(businessId: string) {
  return useMutation({
    mutationFn: async (payload: CreateBusinessAdminRequest) => {
      const res = await api.post<ApiEnvelope<CreateBusinessAdminResponse>>(`/api/v1/businesses/${businessId}/admin`, payload);
      return res.data;
    },
  });
}

