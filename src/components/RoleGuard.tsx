import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../hooks/useMe";

export type AllowedRole = "platform_super_admin" | "business_admin" | "hr_manager" | "any";

export default function RoleGuard(props: { allow: AllowedRole; children: React.ReactNode }) {
  const me = useMe();
  const location = useLocation();

  const user = me.data?.data?.user;
  if (!user) return null;

  const roles: string[] = (me.data as any)?.data?.roles || [];
  const ok =
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
