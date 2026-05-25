import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, PlansResponse } from "../api/types";

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<PlansResponse>>("/api/v1/plans");
      return res.data;
    },
  });
}

