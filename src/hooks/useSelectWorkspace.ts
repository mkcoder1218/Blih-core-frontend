import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import type { ApiEnvelope, LoginSuccessResponse } from "../api/types";
import { setAccessToken, setRefreshToken } from "../api/storage";
import { notifyAuthChanged } from "../api/authState";
import { useNavigate } from "react-router-dom";

export function useSelectWorkspace() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: async (payload: { businessId: string; email: string; password: string }) => {
      const res = await api.post<ApiEnvelope<LoginSuccessResponse>>("/api/v1/auth/select-workspace", payload);
      return res.data;
    },
    onSuccess: (envelope) => {
      setAccessToken(envelope.data.accessToken);
      setRefreshToken(envelope.data.refreshToken);
      notifyAuthChanged();
      if ((envelope.data as any).portalUser) navigate("/client-portal", { replace: true });
    },
  });
}
