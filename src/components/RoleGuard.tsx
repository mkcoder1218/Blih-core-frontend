import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { useTesterSession } from "../hooks/useTesterControl";

export type AllowedRole = "platform_super_admin" | "business_admin" | "hr_manager" | "any";

export default function RoleGuard(props: { allow: AllowedRole; children: React.ReactNode }) {
  const me = useMe();
  const testerSession = useTesterSession();
  const location = useLocation();

  const user = me.data?.data?.user;
  if (!user || testerSession.isLoading) return null;

  const roles: string[] = (me.data as any)?.data?.roles || [];
  const isMasterTester = Boolean(testerSession.data?.isMasterTester);
  const ok =
    isMasterTester ||
    props.allow === "any"
      ? true
      : props.allow === "platform_super_admin"
        ? Boolean(user.isPlatformSuperAdmin)
        : props.allow === "business_admin"
          ? roles.includes("BUSINESS_ADMIN")
          : props.allow === "hr_manager"
            ? roles.includes("HR_MANAGER")
          : false;

  if (!ok) {
    return <Navigate to="/unauthorized" replace state={{ from: location.pathname }} />;
  }

  return <>{props.children}</>;
}
