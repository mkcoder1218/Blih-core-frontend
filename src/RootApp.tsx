import React from "react";
import { useAccessToken } from "./api/authState";
import AuthGuard from "./components/AuthGuard";
import LoginPage from "./pages/LoginPage";
import { useMe } from "./hooks/useMe";
import { setLegacyUser } from "./api/legacyUserStore";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import AppShell from "./pages/AppShell";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import RoleGuard from "./components/RoleGuard";
import RecruitmentPage from "./pages/RecruitmentPage";
import BusinessesPage from "./pages/BusinessesPage";
import ModulePage from "./pages/ModulePage";
import PermissionManagement from "./pages/PermissionManagement";
import PublicCareersPage from "./pages/careers/PublicCareersPage";
import PublicJobApplicationPage from "./pages/careers/PublicJobApplicationPage";
import InterviewResponsePage from "./pages/InterviewResponsePage";
import CandidateOnboardingPage from "./pages/CandidateOnboardingPage";

// Wrapper to extract :onboardingId param and pass as prop
function CandidateOnboardingRoute() {
  const { onboardingId } = useParams<{ onboardingId: string }>();
  if (!onboardingId) return <div>Invalid onboarding link.</div>;
  return <CandidateOnboardingPage onboardingId={onboardingId} />;
}

export default function RootApp() {
  const token = useAccessToken();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - No Auth Required */}
        <Route path="/careers/:businessSlug" element={<PublicCareersPage />} />
        <Route path="/careers/:businessSlug/apply/:jobId" element={<PublicJobApplicationPage />} />
        <Route path="/interview/respond" element={<InterviewResponsePage />} />
        <Route path="/career/onboarding/:onboardingId" element={<CandidateOnboardingRoute />} />
        
        {/* Auth Required Routes */}
        <Route
          path="/*"
          element={
            !token ? (
              <LoginPage />
            ) : (
              <AuthGuard>
                <SyncLegacyUser />
                <Routes>
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/" element={<AppShell />}>
                    <Route index element={<HomeRedirect />} />
                    <Route path="employee/recruitment" element={<RecruitmentPage />} />
                    <Route path="employee/recruitment/:tab" element={<RecruitmentPage />} />
                    <Route path="employee/:module" element={<ModulePage />} />
                    <Route path="employee/:module/:tab" element={<ModulePage />} />
                    <Route
                      path="hr-manager/recruitment"
                      element={
                        <RoleGuard allow="hr_manager">
                          <RecruitmentPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="hr-manager/recruitment/:tab"
                      element={
                        <RoleGuard allow="hr_manager">
                          <RecruitmentPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="hr-manager/:module"
                      element={
                        <RoleGuard allow="hr_manager">
                          <ModulePage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="hr-manager/:module/:tab"
                      element={
                        <RoleGuard allow="hr_manager">
                          <ModulePage />
                        </RoleGuard>
                      }
                    />
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
                      path="business-admin/permissions"
                      element={
                        <RoleGuard allow="business_admin">
                          <PermissionManagement />
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
                    <Route
                      path="super-admin/permissions"
                      element={
                        <RoleGuard allow="platform_super_admin">
                          <PermissionManagement />
                        </RoleGuard>
                      }
                    />
                    <Route path="employee" element={<Navigate to="/employee/recruitment" replace />} />
                    <Route path="hr-manager" element={<Navigate to="/hr-manager/recruitment" replace />} />
                    <Route path="business-admin" element={<Navigate to="/business-admin/recruitment" replace />} />
                    <Route path="super-admin" element={<Navigate to="/super-admin/businesses" replace />} />
                    <Route path="*" element={<HomeRedirect />} />
                  </Route>
                </Routes>
              </AuthGuard>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function SyncLegacyUser() {
  const me = useMe();
  const u = me.data?.data?.user;
  const roles: string[] = (me.data as any)?.data?.roles || [];

  React.useEffect(() => {
    if (!u) return;
    const isHrManager = roles.includes("HR_MANAGER");
    const isBusinessAdmin = roles.includes("BUSINESS_ADMIN");
    const legacy = {
      name: u.fullName,
      email: u.email,
      role: u.isPlatformSuperAdmin ? "Super Admin" : isHrManager ? "HR Manager" : isBusinessAdmin ? "Business Admin" : "Employee",
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
  const isHrManager = roles.includes("HR_MANAGER");
  return <Navigate to={isSuper ? "/super-admin/businesses" : isBusinessAdmin ? "/business-admin/recruitment" : isHrManager ? "/hr-manager/recruitment" : "/employee/recruitment"} replace />;
}
