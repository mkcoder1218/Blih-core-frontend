import React from "react";
import { useAccessToken } from "./api/authState";
import AuthGuard from "./components/AuthGuard";
import LoginPage from "./pages/LoginPage";
import { useMe } from "./hooks/useMe";
import { setLegacyUser } from "./api/legacyUserStore";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./pages/AppShell";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import RoleGuard from "./components/RoleGuard";
import RecruitmentPage from "./pages/RecruitmentPage";
import BusinessesPage from "./pages/BusinessesPage";
import ModulePage from "./pages/ModulePage";

export default function RootApp() {
  const token = useAccessToken();
  if (!token) return <LoginPage />;

  return (
    <AuthGuard>
      <SyncLegacyUser />
      <BrowserRouter>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<AppShell />}>
            <Route index element={<HomeRedirect />} />
            <Route path="employee/recruitment" element={<RecruitmentPage />} />
            <Route path="employee/recruitment/:tab" element={<RecruitmentPage />} />
            <Route path="employee/:module" element={<ModulePage />} />
            <Route path="employee/:module/:tab" element={<ModulePage />} />
            <Route
              path="business-admin/recruitment"
              element={
                <RoleGuard allow="business_admin">
                  <RecruitmentPage />
                </RoleGuard>
              }
            />
            <Route
              path="business-admin/recruitment/:tab"
              element={
                <RoleGuard allow="business_admin">
                  <RecruitmentPage />
                </RoleGuard>
              }
            />
            <Route
              path="business-admin/:module"
              element={
                <RoleGuard allow="business_admin">
                  <ModulePage />
                </RoleGuard>
              }
            />
            <Route
              path="business-admin/:module/:tab"
              element={
                <RoleGuard allow="business_admin">
                  <ModulePage />
                </RoleGuard>
              }
            />
            <Route
              path="super-admin/businesses"
              element={
                <RoleGuard allow="platform_super_admin">
                  <BusinessesPage />
                </RoleGuard>
              }
            />
            <Route
              path="super-admin/businesses/:tab"
              element={
                <RoleGuard allow="platform_super_admin">
                  <BusinessesPage />
                </RoleGuard>
              }
            />
            <Route path="employee" element={<Navigate to="/employee/recruitment" replace />} />
            <Route path="business-admin" element={<Navigate to="/business-admin/recruitment" replace />} />
            <Route path="super-admin" element={<Navigate to="/super-admin/businesses" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthGuard>
  );
}

function SyncLegacyUser() {
  const me = useMe();
  const u = me.data?.data?.user;
  const roles: string[] = (me.data as any)?.data?.roles || [];

  React.useEffect(() => {
    if (!u) return;
    const isBusinessAdmin = roles.includes("BUSINESS_ADMIN");
    const legacy = {
      name: u.fullName,
      email: u.email,
      role: u.isPlatformSuperAdmin ? "Super Admin" : isBusinessAdmin ? "Business Admin" : "Employee",
    };
    setLegacyUser(legacy);
  }, [u?.id, roles.join(",")]);

  return null;
}

function HomeRedirect() {
  const me = useMe();
  const isSuper = Boolean(me.data?.data?.user?.isPlatformSuperAdmin);
  const roles: string[] = (me.data as any)?.data?.roles || [];
  const isBusinessAdmin = roles.includes("BUSINESS_ADMIN");
  return <Navigate to={isSuper ? "/super-admin/businesses" : isBusinessAdmin ? "/business-admin/recruitment" : "/employee/recruitment"} replace />;
}
