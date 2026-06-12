import React from "react";
import { Navigate, useNavigate, useParams, useLocation } from "react-router-dom";
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

const ALLOWED = new Set(["onboarding", "profiles", "attendance", "performance", "talent", "exit", "finance", "projects"]);

export default function ModulePage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [updateEmployeeUserId, setUpdateEmployeeUserId] = React.useState<string | null>(null);
  const module = String(params.module || "");
  const tab = String(params.tab || (module === "exit" ? "offboarding" : "overview"));
  const projectUuid = module === "projects" && /^[0-9a-fA-F-]{36}$/.test(tab) ? tab : "";

  // Employee detail view — triggered when navigating to /*/profiles/employee/:id
  // We pass employee data via router state to avoid a separate API call
  if (module === "profiles" && tab === "employee") {
    const emp = location.state?.employee;
    const fromTab = location.state?.fromTab || "directory";
    const rolePrefix = location.pathname.startsWith("/hr-manager") ? "/hr-manager" :
                       location.pathname.startsWith("/business-admin") ? "/business-admin" : "/employee";
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

  if (module === "profiles") {
    const rolePrefix = location.pathname.startsWith("/hr-manager") ? "/hr-manager" :
                       location.pathname.startsWith("/business-admin") ? "/business-admin" : "/employee";
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
  if (module === "attendance") return <AttendanceView currentAttendanceTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "onboarding") return <OnboardingView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "finance") return <WorkforceFinanceView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "projects") return <ProjectsPage currentTab={(tab === "my-projects" ? "mine" : tab) as any} />;
  if (module === "talent") return <CareerManagementView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "exit") return <ExitOffboardingView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "performance") return <PerformanceView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;

  return null;
}
