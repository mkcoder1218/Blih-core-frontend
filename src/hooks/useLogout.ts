import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope } from "../api/types";
import { clearAuthTokens } from "../api/storage";
import { notifyAuthChanged } from "../api/authState";

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiEnvelope<{ ok: true }>>("/api/v1/auth/logout");
      return res.data;
    },
    onSettled: async () => {
      clearAuthTokens();
      notifyAuthChanged();
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
