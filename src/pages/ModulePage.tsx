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
import { ProjectDetailsPage, ProjectsPage } from "../features/projects";

const ALLOWED = new Set(["onboarding", "profiles", "attendance", "performance", "talent", "exit", "finance", "projects"]);

export default function ModulePage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const module = String(params.module || "");
  const tab = String(params.tab || (module === "exit" ? "offboarding" : "overview"));
  const projectUuid = module === "projects" && /^[0-9a-fA-F-]{36}$/.test(tab) ? tab : "";

  // Employee detail view — triggered when navigating to /*/profiles/employee/:id
  // We pass employee data via router state to avoid a separate API call
  if (module === "profiles" && tab === "employee") {
    const emp = location.state?.employee;
    const rolePrefix = location.pathname.startsWith("/hr-manager") ? "/hr-manager" :
                       location.pathname.startsWith("/business-admin") ? "/business-admin" : "/employee";
    if (!emp) return <Navigate to={`${rolePrefix}/profiles/directory`} replace />;
    return (
      <EmployeeDetailPage
        targetUserId={emp.userId || emp.user?.id}
        user={{
          name: emp.user?.fullName || "Unknown",
          email: emp.user?.email || "",
          role: emp.position?.title || emp.department?.name || "Staff",
        }}
        onBack={() => navigate(`${rolePrefix}/profiles/directory`)}
      />
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
          navigate(`${rolePrefix}/profiles/employee`, { state: { employee: emp } })
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
