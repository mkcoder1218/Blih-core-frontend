import { PolicyDocument, PolicyCategory } from "../../api/policies";

export interface UserPermissionContext {
  userId?: string;
  isSuperAdmin?: boolean;
  isBusinessAdmin?: boolean;
  permissions?: string[];
}

/**
 * Check if the policy's status permits editing.
 * Backend contract: Only "draft" and "changes_requested" status policies are editable directly.
 */
export function isPolicyEditableStatus(policy: PolicyDocument | null | undefined): boolean {
  if (!policy) return false;
  return ["draft", "changes_requested"].includes(policy.status);
}

/**
 * Check if the policy's status permits deletion.
 * Backend contract: Only "draft", "changes_requested", and "archived" policies can be deleted.
 */
export function isPolicyDeletableStatus(policy: PolicyDocument | null | undefined): boolean {
  if (!policy) return false;
  return ["draft", "changes_requested", "archived"].includes(policy.status);
}

/**
 * Check if user can create new policy documents.
 */
export function canCreatePolicy(userCtx: UserPermissionContext): boolean {
  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;
  const perms = new Set(userCtx.permissions || []);
  return perms.has("policy.document.create");
}

/**
 * Check if user can edit a specific policy document.
 */
export function canEditPolicy(
  userCtx: UserPermissionContext,
  policy: PolicyDocument | null | undefined
): boolean {
  if (!policy) return false;
  if (!isPolicyEditableStatus(policy)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  if (perms.has("policy.document.update_any")) return true;

  const isOwner = Boolean(userCtx.userId && policy.ownerUserId === userCtx.userId);
  if (isOwner && perms.has("policy.document.update_own")) return true;

  return false;
}

/**
 * Check if user can delete a specific policy document.
 */
export function canDeletePolicy(
  userCtx: UserPermissionContext,
  policy: PolicyDocument | null | undefined
): boolean {
  if (!policy) return false;
  if (!isPolicyDeletableStatus(policy)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("policy.document.delete");
}

/**
 * Check if user can restore a soft-deleted policy document.
 */
export function canRestorePolicy(
  userCtx: UserPermissionContext,
  policy: PolicyDocument | null | undefined
): boolean {
  if (!policy) return false;
  if (!policy.deletedAt) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("policy.document.restore");
}

/**
 * Check category management permissions
 */
export function canCreatePolicyCategory(userCtx: UserPermissionContext): boolean {
  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;
  const perms = new Set(userCtx.permissions || []);
  return perms.has("policy.category.create");
}

export function canEditPolicyCategory(userCtx: UserPermissionContext): boolean {
  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;
  const perms = new Set(userCtx.permissions || []);
  return perms.has("policy.category.update");
}

export function canDeletePolicyCategory(userCtx: UserPermissionContext): boolean {
  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;
  const perms = new Set(userCtx.permissions || []);
  return perms.has("policy.category.delete");
}

export function canRestorePolicyCategory(userCtx: UserPermissionContext): boolean {
  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;
  const perms = new Set(userCtx.permissions || []);
  return perms.has("policy.category.restore");
}
