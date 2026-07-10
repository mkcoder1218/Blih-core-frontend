import React from "react";
import { Navigate, useNavigate, useParams, useLocation, useOutletContext } from "react-router-dom";
import PeopleProfilesView from "../components/people/PeopleProfilesView";
import AttendanceView from "../components/attendance/AttendanceView";
import OnboardingView from "../components/onboarding/OnboardingView";
import WorkforceFinanceView from "../components/finance/WorkforceFinanceView";
import CareerManagementView from "../components/career/CareerManagementView";
import ExitOffboardingView from "../components/offboarding/ExitOffboardingView";
import PerformanceView from "../components/performance/PerformanceView";
import EmployeeDetailPage from "../components/people/EmployeeDetailPage";
import CreateEmployeeModal from "../components/people/CreateEmployeeModal";
import { ProjectDetailsPage, ProjectsPage } from "../features/projects";
import RecruitmentPage from "./RecruitmentPage";
import BusinessSettingsView from "../components/settings/BusinessSettingsView";

const ALLOWED = new Set(["onboarding", "profiles", "attendance", "performance", "talent", "exit", "finance", "projects", "settings"]);

export default function ModulePage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const outlet = useOutletContext<{ showAlert?: (msg: string, type?: "success" | "info" | "error") => void } | null>();
  const showAlert = outlet?.showAlert || (() => {});
  const [updateEmployeeUserId, setUpdateEmployeeUserId] = React.useState<string | null>(null);
  const module = String(params.module || (location.pathname.includes("/settings") ? "settings" : ""));
  const tab = String(params.tab || (module === "exit" ? "offboarding" : module === "profiles" ? "directory" : "overview"));
  const projectUuid = module === "projects" && /^[0-9a-fA-F-]{36}$/.test(tab) ? tab : "";
  const rolePrefix = location.pathname.startsWith("/super-admin") ? "/super-admin" :
                     location.pathname.startsWith("/hr-manager") ? "/hr-manager" :
                     location.pathname.startsWith("/business-admin") ? "/business-admin" : "/employee";

  // Employee detail view — triggered when navigating to /*/profiles/employee/:id
  // We pass employee data via router state to avoid a separate API call
  if (module === "profiles" && tab === "employee") {
    const emp = location.state?.employee;
    const fromTab = location.state?.fromTab || "directory";
    if (!emp) return <Navigate to={`${rolePrefix}/profiles/directory`} replace />;
    return (
      <>
        <EmployeeDetailPage
          targetUserId={emp.userId || emp.user?.id || emp.id}
          user={{
            name: emp.user?.fullName || emp.name || "Unknown",
            email: emp.user?.email || emp.email || "",
            role: emp.position?.title || emp.title || emp.department?.name || emp.department || "Staff",
          }}
          onBack={() => navigate(`${rolePrefix}/profiles/${fromTab}`)}
          onEdit={() => setUpdateEmployeeUserId(emp.userId || emp.user?.id || emp.id)}
        />
        <CreateEmployeeModal
          isOpen={Boolean(updateEmployeeUserId)}
          onClose={() => setUpdateEmployeeUserId(null)}
          showAlert={() => {}}
          mode="update"
          targetUserId={updateEmployeeUserId || undefined}
        />
      </>
    );
  }

  if (!ALLOWED.has(module)) return <Navigate to=".." replace />;
  if (projectUuid) return <ProjectDetailsPage projectId={projectUuid} />;

  if (module === "talent") {
    const talentTab = tab === "overview" ? "recruitment-overview" : tab;

    if (talentTab === "profiles-employee") {
      const emp = location.state?.employee;
      const fromTab = location.state?.fromTab || "profiles-directory";
      if (!emp) return <Navigate to={`${rolePrefix}/talent/profiles-directory`} replace />;
      return (
        <>
          <EmployeeDetailPage
            targetUserId={emp.userId || emp.user?.id || emp.id}
            user={{
              name: emp.user?.fullName || emp.name || "Unknown",
              email: emp.user?.email || emp.email || "",
              role: emp.position?.title || emp.title || emp.department?.name || emp.department || "Staff",
            }}
            onBack={() => navigate(`${rolePrefix}/talent/${fromTab}`)}
            onEdit={() => setUpdateEmployeeUserId(emp.userId || emp.user?.id || emp.id)}
          />
          <CreateEmployeeModal
            isOpen={Boolean(updateEmployeeUserId)}
            onClose={() => setUpdateEmployeeUserId(null)}
            showAlert={() => {}}
            mode="update"
            targetUserId={updateEmployeeUserId || undefined}
          />
        </>
      );
    }

    if (talentTab.startsWith("recruitment-")) {
      const recruitmentTab = talentTab.replace("recruitment-", "") || "overview";
      return (
        <RecruitmentPage
          currentTab={recruitmentTab}
          routeForTab={(nextTab) => `${rolePrefix}/talent/recruitment-${nextTab}`}
        />
      );
    }

    if (talentTab.startsWith("onboarding-")) {
      return <OnboardingView currentTab={talentTab.replace("onboarding-", "") as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
    }

    if (talentTab.startsWith("profiles-")) {
      const profilesTab = talentTab.replace("profiles-", "") || "directory";
      return (
        <PeopleProfilesView
          currentProfilesTab={profilesTab as any}
          onDraftAiSuggestion={() => {}}
          showAlert={() => {}}
          onViewProfile={(emp) =>
            navigate(`${rolePrefix}/talent/profiles-employee`, { state: { employee: emp, fromTab: talentTab } })
          }
        />
      );
    }

    if (talentTab.startsWith("career-")) {
      return <CareerManagementView currentTab={talentTab.replace("career-", "") as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
    }

    return <Navigate to={`${rolePrefix}/talent/recruitment-overview`} replace />;
  }

  if (module === "profiles") {
    if (tab === "overview") return <Navigate to={`${rolePrefix}/profiles/directory`} replace />;
    return (
      <PeopleProfilesView
        currentProfilesTab={tab as any}
        onDraftAiSuggestion={() => {}}
        showAlert={() => {}}
        onViewProfile={(emp) =>
          navigate(`${rolePrefix}/profiles/employee`, { state: { employee: emp, fromTab: tab } })
        }
      />
    );
  }
  if (module === "attendance") {
    return (
      <AttendanceView
        currentAttendanceTab={tab as any}
        routeForTab={(nextTab) => `${rolePrefix}/attendance/${nextTab}`}
        onDraftAiSuggestion={() => {}}
        showAlert={() => {}}
      />
    );
  }
  if (module === "onboarding") return <OnboardingView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "finance") return <WorkforceFinanceView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "projects") return <ProjectsPage currentTab={(tab === "my-projects" ? "mine" : tab) as any} />;
  if (module === "settings") return <BusinessSettingsView showAlert={showAlert} />;
  if (module === "exit") return <ExitOffboardingView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "performance") return <PerformanceView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;

  return null;
}
