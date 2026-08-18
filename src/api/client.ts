import axios, { AxiosError, type AxiosInstance } from "axios";
import { notifyAuthChanged } from "./authState";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "./storage";
import type { ApiEnvelope } from "./types";
import { getCurrentLanguage } from "../i18n/config";

const baseURL = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (!baseURL) {
  // eslint-disable-next-line no-console
  console.warn("Missing VITE_API_BASE_URL; API calls will likely fail.");
}

export const api: AxiosInstance = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  const language = getCurrentLanguage();
  config.headers = {
    ...(config.headers as any),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Accept-Language": language,
  } as any;
  return config;
});

let refreshing: Promise<string | null> | null = null;

function clearBrowserStorage() {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
}

function redirectToLogin() {
  clearAuthTokens();
  clearBrowserStorage();
  notifyAuthChanged();

  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.assign(`/${getCurrentLanguage()}`);
  }
}

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
    const url = String(originalConfig?.url ?? "");
    const isAuthRequest = url.includes("/api/v1/auth/login") || url.includes("/api/v1/auth/refresh");

    if (status === 401 && isAuthRequest) {
      clearAuthTokens();
      notifyAuthChanged();
      return Promise.reject(error);
    }

    if (status === 401 && originalConfig && !originalConfig.__isRetryRequest) {
      originalConfig.__isRetryRequest = true;
      try {
        if (!refreshing) refreshing = refreshAccessToken().finally(() => (refreshing = null));
        const token = await refreshing;
        if (!token) {
          redirectToLogin();
          return Promise.reject(error);
        }
        originalConfig.headers = { ...(originalConfig.headers as any), Authorization: `Bearer ${token}` } as any;
        return api.request(originalConfig);
      } catch (e) {
        redirectToLogin();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);
