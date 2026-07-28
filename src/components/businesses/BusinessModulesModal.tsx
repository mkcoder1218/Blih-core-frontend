import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, X, Loader2, ShieldCheck } from "lucide-react";
import { useBusinessModules, useToggleBusinessModule } from "../../hooks/useBusinessModules";

interface BusinessModulesModalProps {
  business: { id: string; name: string; slug: string } | null;
  isOpen: boolean;
  onClose: () => void;
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
}

const ALL_SYSTEM_MODULES = [
  {
    key: "brain",
    name: "Brain Knowledge System",
    description: "Knowledge categories, articles, revisions, training & workspace",
    badge: "Core AI",
  },
  {
    key: "policy",
    name: "E-Policy Engine",
    description: "Company policy documents, immutable versions & digital signatures",
    badge: "Compliance",
  },
  {
    key: "hr",
    name: "HR & Onboarding",
    description: "Employee profiles, department hierarchy & contracts",
    badge: "Core HR",
  },
  {
    key: "crm",
    name: "CRM Portal",
    description: "Deals, client leads & customer relationships",
    badge: "Sales",
  },
  {
    key: "projects",
    name: "Projects & Tasks",
    description: "Project milestones, task tracking & change requests",
    badge: "Operations",
  },
  {
    key: "finance",
    name: "Finance & Invoicing",
    description: "Budgeting, expense tracking & invoices",
    badge: "Accounting",
  },
  {
    key: "okr",
    name: "Performance & OKR",
    description: "Objectives, key results & performance reviews",
    badge: "Growth",
  },
  {
    key: "attendance",
    name: "Attendance Monitoring",
    description: "Check-in tracking, late reasons & schedules",
    badge: "Workforce",
  },
  {
    key: "recruitment",
    name: "Recruitment & Jobs",
    description: "Job postings, applicant pipeline & interviewing",
    badge: "Hiring",
  },
];

export function BusinessModulesModal({
  business,
  isOpen,
  onClose,
  showAlert,
}: BusinessModulesModalProps) {
  const { data: modules = [], isLoading } = useBusinessModules(
    business?.id,
    isOpen && Boolean(business?.id)
  );

  const toggleMutation = useToggleBusinessModule();

  if (!isOpen || !business) return null;

  const activeModuleKeys = new Set(
    modules.filter((m) => m.status === "active").map((m) => m.moduleKey)
  );

  const handleToggle = async (moduleKey: string, moduleName: string, currentlyActive: boolean) => {
    const newStatus = currentlyActive ? "inactive" : "active";
    try {
      await toggleMutation.mutateAsync({
        businessId: business.id,
        moduleKey,
        moduleName,
        status: newStatus,
      });
      showAlert(
        `Module "${moduleName}" is now ${newStatus.toUpperCase()} for ${business.name}`,
        "success"
      );
    } catch (err: any) {
      showAlert(
        err?.response?.data?.message || err?.message || "Failed to toggle module status",
        "error"
      );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in p-4">
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100/50 z-20 space-y-5"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  Business Modules Management
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Tenant: <strong className="text-slate-900">{business.name}</strong> ({business.slug})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Intro Notice */}
          <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-semibold">
                Platform Super Admin control plane for business feature activation.
              </span>
            </div>
            <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase text-blue-700">
              Live Gateway
            </span>
          </div>

          {/* Module List */}
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs font-bold">Loading active business modules…</p>
            </div>
          ) : (
            <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-2.5">
              {ALL_SYSTEM_MODULES.map((mod) => {
                const isActive = activeModuleKeys.has(mod.key);
                const isPending = toggleMutation.isPending;

                return (
                  <div
                    key={mod.key}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isActive
                        ? "border-blue-200 bg-blue-50/20 shadow-xs"
                        : "border-slate-100 bg-slate-50/40"
                    }`}
                  >
                    <div className="space-y-0.5 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">{mod.name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9.5px] font-bold text-slate-600">
                          {mod.badge}
                        </span>
                        <code className="text-[10px] font-mono text-slate-400">({mod.key})</code>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{mod.description}</p>
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(mod.key, mod.name, isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? "bg-emerald-600" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium">
              Changes update BusinessModule DB records immediately.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
