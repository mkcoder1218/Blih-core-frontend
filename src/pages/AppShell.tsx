import React, { useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { clearAuthTokens } from "../api/storage";
import { notifyAuthChanged } from "../api/authState";
import { setLegacyUser, useLegacyUser } from "../api/legacyUserStore";
import type { BusinessesTab, ProjectsTab, RecruitmentTab } from "../types";

export default function AppShell() {
  const activeUser = useLegacyUser();
  const location = useLocation();
  const [currentRecruitmentTab, setCurrentRecruitmentTab] = useState<RecruitmentTab>("overview");
  const [currentProfilesTab, setCurrentProfilesTab] = useState<"overview" | "create" | "bulk_create" | "organogram" | "directory" | "organization" | "events" | "archive">("overview");
  const [currentAttendanceTab, setCurrentAttendanceTab] = useState<
    "overview" | "check-in" | "check-me-in" | "history" | "late-reasons" | "requests" | "timesheet" | "leaves" | "overtime" | "memo-log" | "work-from-home"
  >("overview");
  const [currentTalentTab, setCurrentTalentTab] = useState<"overview" | "career" | "training" | "culture">("overview");
  const [currentExitTab, setCurrentExitTab] = useState<"overview" | "resign" | "interviews" | "documents" | "clearance" | "forms" | "offboarding">("offboarding");
  const [currentFinanceTab, setCurrentFinanceTab] = useState<"overview" | "salary_payroll" | "payroll_template" | "budget" | "expense" | "benefits">("overview");
  const [currentProjectsTab, setCurrentProjectsTab] = useState<ProjectsTab>("overview");
  const [currentOnboardingTab, setCurrentOnboardingTab] = useState<"overview" | "contract" | "progress" | "probation" | "checklists" | "policy">("overview");
  const [currentPerformanceTab, setCurrentPerformanceTab] = useState<"overview" | "performance_review" | "okrs" | "kpis" | "discipline" | "evaluation_form">("overview");
  const [currentBusinessesTab, setCurrentBusinessesTab] = useState<BusinessesTab>("overview");
  const [isDetailedView, setIsDetailedView] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; title: string; type: "success" | "info" | "error" }>({
    show: false,
    title: "",
    type: "success",
  });

  const showAlert = (title: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ show: true, title, type });
    setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), 4500);
  };

  const userRole = activeUser?.role || "Employee";
  const currentModule = useMemo(() => {
    const p = location.pathname || "/";
    if (p.includes("/businesses")) return "businesses";
    if (p.includes("/recruitment")) return "recruitment";
    if (p.includes("/onboarding")) return "onboarding";
    if (p.includes("/profiles")) return "profiles";
    if (p.includes("/attendance")) return "attendance";
    if (p.includes("/performance")) return "performance";
    if (p.includes("/talent")) return "talent";
    if (p.includes("/exit")) return "exit";
    if (p.includes("/finance")) return "finance";
    if (p.includes("/projects")) return "projects";
    if (p.includes("/permissions")) return "permissions";
    return userRole === "Super Admin" ? "businesses" : userRole === "Employee" ? "attendance" : "recruitment";
  }, [location.pathname, userRole]);

  React.useEffect(() => {
    const segments = location.pathname.split("/");
    if (segments[1] === "projects") {
      const tab = segments[2] === "all" ? "all" : segments[2] === "my-projects" ? "mine" : segments[2] === "my-tasks" ? "my-tasks" : segments[2] === "board" ? "board" : "overview";
      setCurrentProjectsTab(tab as ProjectsTab);
      return;
    }
    if (segments.length >= 3) {
      const module = segments[2];
      const tab = segments[3] || "overview";
      if (module === "recruitment") setCurrentRecruitmentTab(tab as any);
      if (module === "profiles") setCurrentProfilesTab(tab as any);
      if (module === "attendance") setCurrentAttendanceTab(tab as any);
      if (module === "talent") setCurrentTalentTab(tab as any);
      if (module === "exit") setCurrentExitTab(tab as any);
      if (module === "finance") setCurrentFinanceTab(tab as any);
      if (module === "projects") setCurrentProjectsTab(tab as any);
      if (module === "onboarding") setCurrentOnboardingTab(tab as any);
      if (module === "performance") setCurrentPerformanceTab(tab as any);
      if (module === "businesses") setCurrentBusinessesTab(tab as any);
    }
  }, [location.pathname]);

  if (!activeUser) return null;

  return (
    <div id="app-window" className="flex h-screen w-screen bg-[#f8fafc] text-slate-800 relative font-sans select-none antialiased">
      {/* Mobile backdrop — sits above content, below sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={activeUser}
        onLogout={() => {
          setLegacyUser(null);
          clearAuthTokens();
          notifyAuthChanged();
        }}
        currentModule={currentModule}
        setCurrentModule={() => {}}
        currentRecruitmentTab={currentRecruitmentTab}
        setCurrentRecruitmentTab={setCurrentRecruitmentTab}
        currentProfilesTab={currentProfilesTab}
        setCurrentProfilesTab={setCurrentProfilesTab}
        currentAttendanceTab={currentAttendanceTab}
        setCurrentAttendanceTab={setCurrentAttendanceTab}
        currentTalentTab={currentTalentTab}
        setCurrentTalentTab={setCurrentTalentTab}
        currentExitTab={currentExitTab}
        setCurrentExitTab={setCurrentExitTab}
        currentFinanceTab={currentFinanceTab}
        setCurrentFinanceTab={setCurrentFinanceTab}
        currentProjectsTab={currentProjectsTab}
        setCurrentProjectsTab={setCurrentProjectsTab}
        currentOnboardingTab={currentOnboardingTab}
        setCurrentOnboardingTab={setCurrentOnboardingTab}
        currentPerformanceTab={currentPerformanceTab}
        setCurrentPerformanceTab={setCurrentPerformanceTab}
        currentBusinessesTab={currentBusinessesTab}
        setCurrentBusinessesTab={setCurrentBusinessesTab}
        isDetailedView={isDetailedView}
        setIsDetailedView={setIsDetailedView}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <Header
          currentModule={currentModule}
          currentRecruitmentTab={currentRecruitmentTab}
          isDetailedView={isDetailedView}
          onOpenAiHelper={() => {}}
          onMobileMenuOpen={() => setMobileSidebarOpen(true)}
        />
        <AnimatePresence>
          {notification.show && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-20 right-4 sm:right-8 z-[200] bg-slate-900 border border-slate-800 text-white shadow-xl px-4 py-3.5 rounded-xl flex items-center gap-3 max-w-[calc(100vw-2rem)]"
            >
              {notification.type === "success" ? (
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-xs font-bold font-sans">{notification.title}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#fafbfc]">
          <Outlet context={{ showAlert }} />
        </main>
      </div>
    </div>
  );
}
