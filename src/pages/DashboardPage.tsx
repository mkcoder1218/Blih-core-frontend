import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import {
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../api/storage";
import type { ApiEnvelope } from "../api/types";
import { useLogout } from "../hooks/useLogout";
import { useMe } from "../hooks/useMe";
import PlatformAdminProvisioning from "./PlatformAdminProvisioning";
export default function DashboardPage() {
  const me = useMe();
  const logout = useLogout();
  const [refreshError, setRefreshError] = useState<string>("");

  const user = me.data?.data?.user;
  const isPlatformSuperAdmin = Boolean(user?.isPlatformSuperAdmin);

  // Refresh token every 0 minutes (requirement). UseEffect is OK here (timer orchestration).
  useEffect(() => {
    const interval = setInterval(
      async () => {
        try {
          const rt = getRefreshToken();
          if (!rt) return;
          const res = await api.post<
            ApiEnvelope<{ accessToken: string; refreshToken: string }>
          >("/api/v1/auth/refresh", {
            refreshToken: rt,
          });
          setAccessToken(res.data.data.accessToken);
          setRefreshToken(res.data.data.refreshToken);
          setRefreshError("");
        } catch (e: any) {
          setRefreshError(
            e?.response?.data?.message || e?.message || "Refresh failed",
          );
        }
      },
      30 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  const header = useMemo(() => {
    if (!user) return "Dashboard";
    return `${user.fullName} (${user.email})`;
  }, [user]);

  if (me.isLoading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen w-screen bg-slate-50 font-sans p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">
              {header}
            </div>
            <div className="text-xs text-slate-600">
              Business: {me.data?.data?.business?.name || "n/a"} (
              {me.data?.data?.business?.slug || "n/a"})
            </div>
          </div>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold py-2 px-3 rounded-xl"
          >
            {logout.isPending ? "Signing out..." : "Sign out"}
          </button>
        </div>

        {refreshError ? (
          <div className="bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-2xl p-3">
            {refreshError}
          </div>
        ) : null}

        {isPlatformSuperAdmin ? (
          <PlatformAdminProvisioning />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="text-sm font-bold text-slate-900">Dashboard</div>
            <div className="text-xs text-slate-600 mt-1">
              Signed in successfully.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
