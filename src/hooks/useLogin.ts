import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, LoginRequest, LoginResponse } from "../api/types";
import { setAccessToken, setRefreshToken } from "../api/storage";
import { notifyAuthChanged } from "../api/authState";

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const res = await api.post<ApiEnvelope<LoginResponse>>("/api/v1/auth/login", payload);
      return res.data;
    },
    onSuccess: (envelope) => {
      const data: any = envelope.data;
      if (data?.requiresWorkspaceSelection) return;
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      notifyAuthChanged();
    },
  });
}
