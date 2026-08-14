import { ALL_BRAIN_TABS } from "../components/layout/sidebarTabs";
import { BRAIN_TAB_PERMISSIONS } from "../config/tabPermissions";
import { useMe } from "./useMe";
import { useMyPermissions } from "./usePermissions";

/**
 * CANONICAL MODULE KEYS:
 * - Brain Knowledge: "brain"
 * - E-Policy: "policy"
 *
 * LEGACY / TEMPORARY ALIASES:
 * - "policies" (plural form used in legacy business configs)
 */
export const CANONICAL_MODULE_KEYS = {
  BRAIN: "brain",
  POLICY: "policy",
} as const;

export const LEGACY_MODULE_ALIASES = {
  POLICY: "policies",
} as const;

/**
 * Check if the canonical Brain Knowledge module is active.
 */
export function isBrainModuleActive(enabledModules: Array<{ moduleKey: string; status?: string }>): boolean {
  return enabledModules.some(
    (m) =>
      m.moduleKey === CANONICAL_MODULE_KEYS.BRAIN &&
      (m.status?.toLowerCase() === "active" || m.status?.toLowerCase() === "enabled")
  );
}

/**
 * Check if the E-Policy module is active (supports canonical "policy" and legacy alias "policies").
 */
export function isPolicyModuleActive(enabledModules: Array<{ moduleKey: string; status?: string }>): boolean {
  return enabledModules.some(
    (m) =>
      (m.moduleKey === CANONICAL_MODULE_KEYS.POLICY || m.moduleKey === LEGACY_MODULE_ALIASES.POLICY) &&
      (m.status?.toLowerCase() === "active" || m.status?.toLowerCase() === "enabled")
  );
}

/**
 * DEPRECATED LEGACY PERMISSION CHECK
 * These broad/legacy permission keys do not exist in the canonical backend schema.
 * Maintained temporarily ONLY for backward compatibility with un-migrated database roles.
 */
function isLegacyPolicyPermissionPresent(can: (key: string) => boolean): boolean {
  return (
    can("policy.document.read") ||
    can("policy.read") ||
    can("policy.document.manage") ||
    can("policy.manage")
  );
}

export function useBrainAuthorization() {
  const { data: meRes, isLoading } = useMe();
  const { can, hasAny, isSuperAdmin } = useMyPermissions();

  const me = meRes?.data;
  const enabledModules = me?.enabledModules || [];

  const brainActive = isBrainModuleActive(enabledModules);
  const policyActive = isPolicyModuleActive(enabledModules);
  const proceduresActive = enabledModules.some(
    (m) =>
      m.moduleKey === "procedures" &&
      (m.status?.toLowerCase() === "active" || m.status?.toLowerCase() === "enabled")
  );

  const isBusinessAdmin =
    Boolean(me?.roles?.includes("BUSINESS_ADMIN")) ||
    Boolean(me?.roles?.includes("Business Admin"));

  const isProjectManager =
    Boolean(me?.roles?.includes("PROJECT_MANAGER")) ||
    Boolean(me?.roles?.includes("Project Manager"));

  const canAccessClientDirectory = isBusinessAdmin || isProjectManager;
  const isAdminUser = isSuperAdmin || isBusinessAdmin;

  // Business Admins & Super Admins bypass module activation restrictions for
  // the existing Brain / E-Policy management areas.
  const isBrainEnabled = isAdminUser || brainActive;
  const isPolicyEnabled = isAdminUser || policyActive;
  const isProceduresEnabled = isAdminUser || proceduresActive;

  // Workspace-level visibility access
  const hasBrainAccess = isAdminUser || can("brain.access");
  const hasPolicyAccess =
    isAdminUser ||
    can("policy.access") ||
    can("policy.document.view") ||
    can("policy.category.view") ||
    isLegacyPolicyPermissionPresent(can);
  const hasProceduresAccess = isAdminUser || can("procedures.access");

  // Management workspaces remain permission protected.
  const canAccessBrainWorkspace = isBrainEnabled && hasBrainAccess;
  const canAccessPolicyWorkspace = isPolicyEnabled && hasPolicyAccess;
  const canAccessProceduresWorkspace = isProceduresEnabled && hasProceduresAccess;

  // The read-only company Policy Library is intentionally available to every
  // authenticated company employee when the E-Policy module is active.
  const canAccessEmployeePolicyLibrary = isPolicyEnabled;

  // Client Directory is a cross-module company directory. It is deliberately
  // role-based and limited to Business Admin + Project Manager, matching the
  // backend guard exactly. It does not require CRM or Brain subscription state.
  const canAccessWorkspace =
    isAdminUser ||
    canAccessBrainWorkspace ||
    canAccessPolicyWorkspace ||
    canAccessProceduresWorkspace ||
    canAccessEmployeePolicyLibrary ||
    canAccessClientDirectory;

  // Filter allowed Brain subtabs for the current user.
  const allowedTabs = ALL_BRAIN_TABS.filter((tab) => {
    // Strict product rule: even generic admin bypass does not make this tab
    // visible. Only these two business roles receive the client directory.
    if (tab.id === "clients") {
      return canAccessClientDirectory;
    }

    if (isAdminUser) return true;

    // Company Policy Library is read-only and permissionless by design. Backend
    // tenant/status/visibility filtering remains authoritative.
    if (tab.id === "company-policies") {
      return isPolicyEnabled;
    }

    // Brain knowledge tabs require the Brain module to be enabled.
    if (["overview", "categories", "knowledge"].includes(tab.id) && !isBrainEnabled) {
      return false;
    }

    if (tab.id === "procedures" && !isProceduresEnabled) {
      return false;
    }

    // Policy management requires the Policy module.
    if (["policies", "acceptance"].includes(tab.id) && !isPolicyEnabled) {
      return false;
    }

    const perm = BRAIN_TAB_PERMISSIONS[tab.id];
    if (!perm) return false;
    return hasAny(...perm.requires);
  });

  // Calculate default / first permitted tab.
  const firstAllowedTabId =
    allowedTabs[0]?.id ||
    (canAccessClientDirectory
      ? "clients"
      : canAccessEmployeePolicyLibrary
        ? "company-policies"
        : canAccessPolicyWorkspace
          ? "policies"
          : "overview");

  // Fine-grained Policy action permissions (strictly matching canonical backend contract)
  const policyActions = {
    canView: can("policy.document.view") || can("policy.access") || isLegacyPolicyPermissionPresent(can),
    canCreate: can("policy.document.create"),
    canUpdateOwn: can("policy.document.update_own"),
    canUpdateAny: can("policy.document.update_any"),
    canSubmitReview: can("policy.document.submit_review"),
    canReview: can("policy.document.review"),
    canApprove: can("policy.document.approve"),
    canSchedule: can("policy.document.schedule"),
    canPublish: can("policy.document.publish"),
    canUnpublish: can("policy.document.unpublish"),
    canSupersede: can("policy.document.supersede"),
    canArchive: can("policy.document.archive"),
    canDelete: can("policy.document.delete"),
    canManageAssignments: can("policy.assignment.manage"),
    canViewAssignments: can("policy.assignment.view"),
    canManagePublicShare: can("policy.public_share.manage"),
    canExportAcceptances: can("policy.acceptance.export"),
    canViewAllAcceptances: can("policy.acceptance.view_all") || can("policy.acceptance.view_team"),
  };

  // Fine-grained Brain action permissions
  const brainActions = {
    canView: can("brain.article.view") || can("brain.access"),
    canCreate: can("brain.article.create"),
    canUpdateOwn: can("brain.article.update_own"),
    canUpdateAny: can("brain.article.update_any"),
    canSubmitReview: can("brain.article.submit_review"),
    canReview: can("brain.article.review"),
    canPublish: can("brain.article.publish"),
    canArchive: can("brain.article.archive"),
    canDelete: can("brain.article.delete"),
  };

  // Fine-grained Procedure action permissions
  const procedureActions = {
    canView: can("procedures.procedure.view") || can("procedures.access"),
    canCreate: can("procedures.procedure.create"),
    canUpdateOwn: can("procedures.procedure.update_own"),
    canUpdateAny: can("procedures.procedure.update_any"),
    canSubmitReview: can("procedures.procedure.submit_review"),
    canReview: can("procedures.procedure.review"),
    canPublish: can("procedures.procedure.publish"),
    canArchive: can("procedures.procedure.archive"),
    canDelete: can("procedures.procedure.delete"),
    canRestore: can("procedures.procedure.restore"),
  };

  // Fine-grained Category action permissions
  const categoryActions = {
    canView: can("brain.category.view"),
    canCreate: can("brain.category.create"),
    canUpdate: can("brain.category.update"),
    canDelete: can("brain.category.delete"),
    canRestore: can("brain.category.restore"),
  };

  return {
    isLoading,
    isSuperAdmin,
    isBusinessAdmin,
    isProjectManager,
    brainActive,
    policyActive,
    proceduresActive,
    isBrainEnabled,
    isPolicyEnabled,
    isProceduresEnabled,
    hasBrainAccess,
    hasPolicyAccess,
    hasProceduresAccess,
    canAccessBrainWorkspace,
    canAccessPolicyWorkspace,
    canAccessProceduresWorkspace,
    canAccessEmployeePolicyLibrary,
    canAccessClientDirectory,
    canAccessWorkspace,
    allowedTabs,
    firstAllowedTabId,
    policyActions,
    brainActions,
    procedureActions,
    categoryActions,
  };
}
