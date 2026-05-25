import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, MeResponse } from "../api/types";
import { getAccessToken } from "../api/storage";

export function useMe() {
  const token = getAccessToken();
  return useQuery({
    queryKey: ["me"],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<MeResponse>>("/api/v1/auth/me");
      return res.data;
    },
  });
}

