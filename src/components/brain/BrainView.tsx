import {
    CheckCircle2,
    Loader2,
    Lock,
    ShieldAlert
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBrainAuthorization } from "../../hooks/useBrainAuthorization";

import CompanyPolicyLibrary from "./CompanyPolicyLibrary";
import { BrainCategoriesTab } from "./tabs/BrainCategoriesTab";
import { BrainKnowledgeTab } from "./tabs/BrainKnowledgeTab";
import { BrainProceduresTab } from "./tabs/BrainProceduresTab";
import { BrainPoliciesTab } from "./tabs/BrainPoliciesTab";

interface BrainViewProps {
  currentTab?: string;
  showAlert?: (message: string, type?: "success" | "info" | "error") => void;
}

function getRolePrefix(pathname: string): string {
  if (pathname.startsWith("/super-admin")) return "/super-admin";
  if (pathname.startsWith("/hr-manager")) return "/hr-manager";
  if (pathname.startsWith("/business-admin")) return "/business-admin";
  return "/employee";
}

export default function BrainView({ currentTab = "overview" }: BrainViewProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Consume canonical authorization utility
  const {
    isLoading,
    canAccessWorkspace,
    hasBrainAccess,
    hasPolicyAccess,
    allowedTabs,
    firstAllowedTabId,
  } = useBrainAuthorization();

  const rolePrefix = getRolePrefix(location.pathname);

  // Active tab selection fallback
  const activeTabId = allowedTabs.some((t) => t.id === currentTab)
    ? currentTab
    : firstAllowedTabId;

  // State 1: Loading
  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-bold">Loading Brain & Policy Workspace…</p>
        </div>
      </div>
    );
  }

  // State 2: Unauthorized / Module Disabled
  if (!canAccessWorkspace) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-rose-950">Access Restricted</h2>
          <p className="mt-2 text-xs font-medium text-rose-800">
            You do not have permission or an active business subscription for Brain or E-Policy resources.
          </p>
          <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-rose-100/70 px-3 py-1.5 text-[11px] font-bold text-rose-800">
            <Lock className="h-3.5 w-3.5" />
            Requires: <code className="font-mono text-rose-900">brain.access</code> or an active company E-Policy module
          </div>
        </div>
      </div>
    );
  }

  // Employee-facing Policy Library intentionally bypasses policy management
  // permissions. The backend still limits this view to published, company-wide
  // policies for the authenticated user's own business.
  if (activeTabId === "company-policies") {
    return <CompanyPolicyLibrary />;
  }

  // Workspace Shell
  return (
    <div className="space-y-6">
      {/* Module Header — compact inline style matching the platform standard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {activeTabId === "policies" ? "E-Policies Gateway" : "Brain Knowledge System"}
          </p>
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight leading-tight">
            {activeTabId === "policies"
              ? "E-Policies Workspace"
              : activeTabId === "categories"
              ? "Knowledge Categories"
              : activeTabId === "procedures"
              ? "Operating Procedures"
              : "Brain Knowledge Base"}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {activeTabId === "categories"
              ? "Organize company knowledge into structured, reusable category hierarchies."
              : activeTabId === "policies"
              ? "Company policy documents, immutable versions & digital signatures."
              : activeTabId === "procedures"
              ? "Standardized checklists, steps, ownership & organizational operating procedures."
              : "Central knowledge articles, guidelines & documentation base."}
          </p>
        </div>

        {/* Access Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {hasBrainAccess && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10.5px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Brain Knowledge System
            </span>
          )}
          {hasPolicyAccess && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10.5px] font-bold text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              E-Policy Engine Access
            </span>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTabId === "categories" ? (
          <BrainCategoriesTab />
        ) : activeTabId === "policies" ? (
          <BrainPoliciesTab
            onNavigateToCategories={() => navigate(`${rolePrefix}/brain/categories`)}
          />
        ) : activeTabId === "procedures" ? (
          <BrainProceduresTab
            onNavigateToCategories={() => navigate(`${rolePrefix}/brain/categories`)}
          />
        ) : (
          <BrainKnowledgeTab
            onNavigateToCategories={() => navigate(`${rolePrefix}/brain/categories`)}
          />
        )}
      </div>
    </div>
  );
}
