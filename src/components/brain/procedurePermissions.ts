import { Procedure } from "../../api/procedures";

export interface UserPermissionContext {
  userId?: string;
  isSuperAdmin?: boolean;
  isBusinessAdmin?: boolean;
  permissions?: string[];
}

export type WorkflowActionType =
  | "submit_review"
  | "approve"
  | "request_changes"
  | "publish"
  | "unpublish"
  | "archive"
  | "delete"
  | "restore"
  | "restore_revision";

/**
 * Check if the procedure's workflow status permits editing.
 * Backend contract: Only "draft" and "changes_requested" status procedures can be edited directly.
 */
export function isProcedureEditableStatus(procedure: Procedure | null | undefined): boolean {
  if (!procedure) return false;
  return ["draft", "changes_requested"].includes(procedure.status);
}

/**
 * Check if the procedure's workflow status permits deletion.
 * Backend contract: Only "draft", "changes_requested", and "archived" procedures can be deleted.
 */
export function isProcedureDeletableStatus(procedure: Procedure | null | undefined): boolean {
  if (!procedure) return false;
  return ["draft", "changes_requested", "archived"].includes(procedure.status);
}

/**
 * Check if user can create new procedures.
 */
export function canCreateProcedure(userCtx: UserPermissionContext): boolean {
  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;
  const perms = new Set(userCtx.permissions || []);
  return perms.has("procedures.procedure.create");
}

/**
 * Check if user can edit a specific procedure.
 */
export function canEditProcedure(
  userCtx: UserPermissionContext,
  procedure: Procedure | null | undefined
): boolean {
  if (!procedure) return false;
  if (!isProcedureEditableStatus(procedure)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  if (perms.has("procedures.procedure.update_any")) return true;

  const isAuthor = Boolean(userCtx.userId && procedure.authorUserId === userCtx.userId);
  const isOwner = Boolean(userCtx.userId && procedure.ownerUserId === userCtx.userId);
  if ((isAuthor || isOwner) && perms.has("procedures.procedure.update_own")) return true;

  return false;
}

/**
 * Check if user can delete a specific procedure.
 */
export function canDeleteProcedure(
  userCtx: UserPermissionContext,
  procedure: Procedure | null | undefined
): boolean {
  if (!procedure) return false;
  if (!isProcedureDeletableStatus(procedure)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("procedures.procedure.delete");
}

/**
 * Check if user can restore a soft-deleted procedure.
 */
export function canRestoreProcedure(
  userCtx: UserPermissionContext,
  procedure: Procedure | null | undefined
): boolean {
  if (!procedure) return false;
  if (!procedure.deletedAt) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("procedures.procedure.restore");
}

/**
 * Check if user can restore a historical revision.
 */
export function canRestoreRevision(
  userCtx: UserPermissionContext,
  procedure: Procedure | null | undefined
): boolean {
  if (!procedure) return false;
  if (!["draft", "changes_requested"].includes(procedure.status)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("procedures.procedure.restore_revision");
}

/**
 * Centralized evaluation helper for valid workflow transitions on a procedure.
 */
export function getAvailableWorkflowActions(
  userCtx: UserPermissionContext,
  procedure: Procedure | null | undefined
): WorkflowActionType[] {
  if (!procedure) return [];

  const actions: WorkflowActionType[] = [];
  const perms = new Set(userCtx.permissions || []);
  const isAdmin = userCtx.isSuperAdmin || userCtx.isBusinessAdmin;
  const isAuthor = Boolean(userCtx.userId && procedure.authorUserId === userCtx.userId);
  const isOwner = Boolean(userCtx.userId && procedure.ownerUserId === userCtx.userId);

  // 1. Submit for Review
  if (["draft", "changes_requested"].includes(procedure.status)) {
    if (isAdmin || perms.has("procedures.procedure.submit_review") || perms.has("procedures.procedure.update_any") || ((isAuthor || isOwner) && perms.has("procedures.procedure.update_own"))) {
      actions.push("submit_review");
    }
  }

  // 2. Approve (Submitting user cannot approve unless platform super admin)
  if (procedure.status === "in_review") {
    if (isAdmin || perms.has("procedures.procedure.review")) {
      actions.push("approve");
    }
  }

  // 3. Request Changes
  if (procedure.status === "in_review") {
    if (isAdmin || perms.has("procedures.procedure.review")) {
      actions.push("request_changes");
    }
  }

  // 4. Publish
  if (procedure.status === "approved") {
    if (isAdmin || perms.has("procedures.procedure.publish")) {
      actions.push("publish");
    }
  }

  // 5. Unpublish
  if (procedure.status === "published") {
    if (isAdmin || perms.has("procedures.procedure.publish")) {
      actions.push("unpublish");
    }
  }

  // 6. Archive
  if (["draft", "changes_requested", "approved", "published"].includes(procedure.status)) {
    if (isAdmin || perms.has("procedures.procedure.archive")) {
      actions.push("archive");
    }
  }

  // 7. Delete
  if (["draft", "changes_requested", "archived"].includes(procedure.status) && !procedure.deletedAt) {
    if (isAdmin || perms.has("procedures.procedure.delete")) {
      actions.push("delete");
    }
  }

  // 8. Restore
  if (procedure.deletedAt) {
    if (isAdmin || perms.has("procedures.procedure.restore")) {
      actions.push("restore");
    }
  }

  return actions;
}
