import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, BusinessesResponse } from "../api/types";

export function useBusinesses() {
  return useQuery({
    queryKey: ["businesses"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<BusinessesResponse>>("/api/v1/businesses");
      return res.data;
    },
  });
}

