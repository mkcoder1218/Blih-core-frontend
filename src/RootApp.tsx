import React from "react";
import { useAccessToken } from "./api/authState";
import AuthGuard from "./components/AuthGuard";
import RequiredFullNameModal from "./components/RequiredFullNameModal";
import RequiredDeviceRegistrationModal from "./components/RequiredDeviceRegistrationModal";
import CriticalDisciplineModal from "./components/performance/CriticalDisciplineModal";
import LoginPage from "./pages/LoginPage";
import { useMe } from "./hooks/useMe";
import { setLegacyUser } from "./api/legacyUserStore";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import AppShell from "./pages/AppShell";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import RoleGuard from "./components/RoleGuard";
import BusinessesPage from "./pages/BusinessesPage";
import ModulePage from "./pages/ModulePage";
import PermissionManagement from "./pages/PermissionManagement";
import PublicCareersPage from "./pages/careers/PublicCareersPage";
import PublicJobApplicationPage from "./pages/careers/PublicJobApplicationPage";
import InterviewResponsePage from "./pages/InterviewResponsePage";
import CandidateOnboardingPage from "./pages/CandidateOnboardingPage";
import PublicRegisterPage from "./pages/PublicRegisterPage";
import MyProfilePage from "./pages/MyProfilePage";
import BulkEmployeeImportPage from "./pages/BulkEmployeeImportPage";
import ClientPortalPage from "./pages/ClientPortalPage";
import { ProjectDetailsPage, ProjectsPage } from "./features/projects";
import OfferLetterTemplatePage from "./pages/OfferLetterTemplatePage";

// Wrapper to extract :onboardingId param and pass as prop
function CandidateOnboardingRoute() {
  const { onboardingId } = useParams<{ onboardingId: string }>();
  if (!onboardingId) return <div>Invalid onboarding link.</div>;
  return <CandidateOnboardingPage onboardingId={onboardingId} />;
}

function ProjectDetailsPageWrapper() {
  const { projectId } = useParams<{ projectId: string }>();
  if (!projectId) return <div>Invalid project link.</div>;
  return <ProjectDetailsPage projectId={projectId} />;
}

function TalentRecruitmentRedirect({ rolePrefix }: { rolePrefix: string }) {
  const { tab } = useParams<{ tab?: string }>();
  return <Navigate to={`/${rolePrefix}/talent/recruitment-${tab || "overview"}`} replace />;
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
        <Route path="/onboarding/:onboardingId" element={<CandidateOnboardingRoute />} />
        <Route path="/career/onboarding/:onboardingId" element={<CandidateOnboardingRoute />} />
        <Route path="/register/:businessSlug" element={<PublicRegisterPage />} />
        
        {/* Auth Required Routes */}
        <Route
          path="/*"
          element={
            !token ? (
              <LoginPage />
            ) : (
              <AuthGuard>
                <SyncLegacyUser />
                <InternalUserModals />
                <Routes>
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/client-portal" element={<ClientPortalPage />} />
                  <Route path="/" element={<InternalShellGuard />}>
                    <Route index element={<HomeRedirect />} />
                    <Route path="projects" element={<ProjectsPage currentTab="overview" />} />
                    <Route path="projects/all" element={<ProjectsPage currentTab="all" />} />
                    <Route path="projects/my-projects" element={<ProjectsPage currentTab="mine" />} />
                    <Route path="projects/my-tasks" element={<ProjectsPage currentTab="my-tasks" />} />
                    <Route path="projects/board" element={<ProjectsPage currentTab="board" />} />
                    <Route path="projects/:projectId" element={<ProjectDetailsPageWrapper />} />
                    <Route path="employees/bulk-import" element={<BulkEmployeeImportPage />} />
                    <Route path="employee/my-profile" element={<MyProfilePage />} />
                    <Route path="employee/recruitment" element={<Navigate to="/employee/attendance/check-me-in" replace />} />
                    <Route path="employee/recruitment/:tab" element={<Navigate to="/employee/attendance/check-me-in" replace />} />
                    <Route path="employee/:module" element={<ModulePage />} />
                    <Route path="employee/:module/:tab" element={<ModulePage />} />
                    <Route
                      path="hr-manager/offer-letters/templates/new"
                      element={
                        <RoleGuard allow="hr_manager">
                          <OfferLetterTemplatePage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="hr-manager/recruitment"
                      element={
                        <RoleGuard allow="hr_manager">
                          <TalentRecruitmentRedirect rolePrefix="hr-manager" />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="hr-manager/recruitment/:tab"
                      element={
                        <RoleGuard allow="hr_manager">
                          <TalentRecruitmentRedirect rolePrefix="hr-manager" />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="hr-manager/my-profile"
                      element={
                        <RoleGuard allow="hr_manager">
                          <MyProfilePage />
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
                      path="business-admin/offer-letters/templates/new"
                      element={
                        <RoleGuard allow="business_admin">
                          <OfferLetterTemplatePage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="business-admin/recruitment"
                      element={
                        <RoleGuard allow="business_admin">
                          <TalentRecruitmentRedirect rolePrefix="business-admin" />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="business-admin/recruitment/:tab"
                      element={
                        <RoleGuard allow="business_admin">
                          <TalentRecruitmentRedirect rolePrefix="business-admin" />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="business-admin/my-profile"
                      element={
                        <RoleGuard allow="business_admin">
                          <MyProfilePage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="business-admin/subscription"
                      element={<RoleGuard allow="business_admin"><Navigate to="/business-admin/settings/subscription" replace /></RoleGuard>}
                    />
                    <Route
                      path="business-admin/settings"
                      element={<RoleGuard allow="business_admin"><ModulePage /></RoleGuard>}
                    />
                    <Route
                      path="business-admin/settings/:tab"
                      element={<RoleGuard allow="business_admin"><ModulePage /></RoleGuard>}
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
                      path="super-admin/subscription"
                      element={<RoleGuard allow="platform_super_admin"><Navigate to="/super-admin/settings/subscription" replace /></RoleGuard>}
                    />
                    <Route
                      path="super-admin/settings"
                      element={<RoleGuard allow="platform_super_admin"><ModulePage /></RoleGuard>}
                    />
                    <Route
                      path="super-admin/settings/:tab"
                      element={<RoleGuard allow="platform_super_admin"><ModulePage /></RoleGuard>}
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
                    <Route
                      path="super-admin/my-profile"
                      element={
                        <RoleGuard allow="platform_super_admin">
                          <MyProfilePage />
                        </RoleGuard>
                      }
                    />
                    <Route path="employee" element={<Navigate to="/employee/attendance/check-me-in" replace />} />
                    <Route path="hr-manager" element={<Navigate to="/hr-manager/talent/recruitment-overview" replace />} />
                    <Route path="business-admin" element={<Navigate to="/business-admin/talent/recruitment-overview" replace />} />
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
  const profile = (me.data as any)?.data?.profile;
  const roles: string[] = (me.data as any)?.data?.roles || [];

  React.useEffect(() => {
    if (!u) return;
    const isHrManager = roles.includes("HR_MANAGER");
    const isBusinessAdmin = roles.includes("BUSINESS_ADMIN");
    const legacy = {
      name: u.fullName,
      email: u.email,
      role: u.isPlatformSuperAdmin ? "Super Admin" : isHrManager ? "HR Manager" : isBusinessAdmin ? "Business Admin" : "Employee",
      positionTitle: profile?.position?.title || profile?.Position?.title || null,
      departmentName: profile?.department?.name || null,
      employmentType: u.employmentType || null,
      employmentStatus: u.employmentStatus || null,
    };
    setLegacyUser(legacy);
  }, [u?.id, roles.join(","), profile?.department?.name, profile?.position?.title, profile?.Position?.title, u?.employmentType, u?.employmentStatus]);

  return null;
}

function HomeRedirect() {
  const me = useMe();
  const isSuper = Boolean(me.data?.data?.user?.isPlatformSuperAdmin);
  const isClientPortal = Boolean((me.data as any)?.data?.portalUser);
  const roles: string[] = (me.data as any)?.data?.roles || [];
  const isBusinessAdmin = roles.includes("BUSINESS_ADMIN");
  const isHrManager = roles.includes("HR_MANAGER");
  return <Navigate to={isClientPortal ? "/client-portal" : isSuper ? "/super-admin/businesses" : isBusinessAdmin ? "/business-admin/talent/recruitment-overview" : isHrManager ? "/hr-manager/talent/recruitment-overview" : "/employee/attendance/check-me-in"} replace />;
}

function InternalUserModals() {
  const me = useMe();
  if ((me.data as any)?.data?.portalUser) return null;
  return (
    <>
      <RequiredFullNameModal />
      <RequiredDeviceRegistrationModal />
      <CriticalDisciplineModal />
    </>
  );
}

function InternalShellGuard() {
  const me = useMe();
  if ((me.data as any)?.data?.portalUser) return <Navigate to="/client-portal" replace />;
  return <AppShell />;
}
