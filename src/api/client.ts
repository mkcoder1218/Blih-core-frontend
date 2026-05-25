import axios, { AxiosError, type AxiosInstance } from "axios";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./storage";
import type { ApiEnvelope } from "./types";

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (!baseURL) {
  // eslint-disable-next-line no-console
  console.warn("Missing VITE_API_BASE_URL; API calls will likely fail.");
}

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = { ...(config.headers as any), Authorization: `Bearer ${token}` } as any;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = getRefreshToken();
  if (!rt) return null;
  const res = await api.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>("/api/v1/auth/refresh", {
    refreshToken: rt,
  });
  const accessToken = res.data.data?.accessToken;
  const refreshToken = res.data.data?.refreshToken;
  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
  return accessToken ?? null;
}

api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig: any = error.config;
    if (status === 401 && originalConfig && !originalConfig.__isRetryRequest) {
        originalConfig.__isRetryRequest = true;
      try {
        if (!refreshing) refreshing = refreshAccessToken().finally(() => (refreshing = null));
        const token = await refreshing;
        if (!token) {
          clearAuthTokens();
          return Promise.reject(error);
        }
        originalConfig.headers = { ...(originalConfig.headers as any), Authorization: `Bearer ${token}` } as any;
        return api.request(originalConfig);
      } catch (e) {
        clearAuthTokens();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);
