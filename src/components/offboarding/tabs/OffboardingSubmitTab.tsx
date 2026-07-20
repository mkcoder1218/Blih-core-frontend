import { useMe } from "../../../hooks/useMe";

import ExitRequestsPage from "../pages/ExitRequestsPage";
import MyExitPage from "../pages/MyExitPage";

interface OffboardingSubmitTabProps {
  showAlert: (
    message: string,
    type?: "success" | "error" | "info",
  ) => void;
}

/**
 * Legacy compatibility wrapper.
 *
 * Older routes may still render this component.
 * New routes should use MyExitPage or ExitRequestsPage directly.
 */
export default function OffboardingSubmitTab({
  showAlert,
}: OffboardingSubmitTabProps) {
  const { data: meResponse } = useMe();

  const me = meResponse?.data;

  const permissions: string[] =
    me?.permissions ?? [];

  const roles: string[] = (
    me?.roles ?? []
  ).map((role: any) =>
    typeof role === "string"
      ? role
      : role?.key,
  );

  const isExitManager =
    permissions.includes("hr.write") ||
    permissions.includes("hr.read") ||
    roles.includes("BUSINESS_ADMIN") ||
    roles.includes("HR_MANAGER");

  if (isExitManager) {
    return (
      <ExitRequestsPage
        showAlert={showAlert}
      />
    );
  }

  return (
    <MyExitPage
      showAlert={showAlert}
    />
  );
}