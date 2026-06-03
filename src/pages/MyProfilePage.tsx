import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmployeeDetailPage from "../components/people/EmployeeDetailPage";
import { useLegacyUser } from "../api/legacyUserStore";

export default function MyProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useLegacyUser() || undefined;
  const fallback = location.pathname.startsWith("/super-admin")
    ? "/super-admin/businesses"
    : location.pathname.startsWith("/business-admin")
    ? "/business-admin/recruitment"
    : location.pathname.startsWith("/hr-manager")
    ? "/hr-manager/recruitment"
    : "/employee/recruitment";

  return <EmployeeDetailPage user={user} onBack={() => navigate(fallback)} />;
}
