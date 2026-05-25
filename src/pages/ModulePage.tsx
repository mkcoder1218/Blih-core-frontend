import React from "react";
import { Navigate, useParams } from "react-router-dom";
import PeopleProfilesView from "../components/people/PeopleProfilesView";
import AttendanceView from "../components/attendance/AttendanceView";
import OnboardingView from "../components/onboarding/OnboardingView";
import WorkforceFinanceView from "../components/finance/WorkforceFinanceView";
import CareerManagementView from "../components/career/CareerManagementView";
import ExitOffboardingView from "../components/offboarding/ExitOffboardingView";
import PerformanceView from "../components/performance/PerformanceView";

const ALLOWED = new Set(["onboarding", "profiles", "attendance", "performance", "talent", "exit", "finance"]);

export default function ModulePage() {
  const params = useParams();
  const module = String(params.module || "");
  const tab = String(params.tab || "overview");

  if (!ALLOWED.has(module)) return <Navigate to=".." replace />;

  if (module === "profiles") return <PeopleProfilesView currentProfilesTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "attendance") return <AttendanceView currentAttendanceTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "onboarding") return <OnboardingView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "finance") return <WorkforceFinanceView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "talent") return <CareerManagementView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "exit") return <ExitOffboardingView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;
  if (module === "performance") return <PerformanceView currentTab={tab as any} onDraftAiSuggestion={() => {}} showAlert={() => {}} />;

  return null;
}
