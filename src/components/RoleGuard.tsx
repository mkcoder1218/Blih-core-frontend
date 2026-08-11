import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { useTesterSession } from "../hooks/useTesterControl";

export type AllowedRole =
  | "platform_super_admin"
  | "business_admin"
  | "hr_manager"
  | "any";

export default function RoleGuard(props: {
  allow: AllowedRole;
  children: React.ReactNode;
}) {
  const me = useMe();
  const testerSession = useTesterSession();
  const location = useLocation();

  const user = me.data?.data?.user;

  if (!user) {
    return me.isLoading ? null : (
      <Navigate
        to="/unauthorized"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  const roles: string[] =
    (me.data as any)?.data?.roles || [];

  const normalRoleAllowed =
    props.allow === "any"
      ? true
      : props.allow === "platform_super_admin"
        ? Boolean(user.isPlatformSuperAdmin) ||
          roles.includes("PLATFORM_SUPER_ADMIN")
        : props.allow === "business_admin"
          ? roles.includes("BUSINESS_ADMIN")
          : props.allow === "hr_manager"
            ? roles.includes("HR_MANAGER")
            : false;

  // Normal users must never wait for the separate tester-session request.
  // This keeps HR/Business Admin/Super Admin module routes responsive even
  // when tester-control is slow, unavailable, or still loading.
  if (normalRoleAllowed) {
    return <>{props.children}</>;
  }

  // Only users who failed the normal RBAC check may need to wait briefly:
  // a Master Tester gets a separate authority bypass without receiving a
  // real PLATFORM_SUPER_ADMIN role in the business RBAC tables.
  if (testerSession.isLoading) {
    return null;
  }

  if (testerSession.data?.isMasterTester) {
    return <>{props.children}</>;
  }

  return (
    <Navigate
      to="/unauthorized"
      replace
      state={{ from: location.pathname }}
    />
  );
}
