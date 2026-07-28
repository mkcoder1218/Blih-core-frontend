import { KnowledgeArticle } from "../../api/brain";

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
 * Check if the article's workflow status permits editing.
 * Backend contract: Only "draft" and "changes_requested" status articles can be edited directly.
 */
export function isArticleEditableStatus(article: KnowledgeArticle | null | undefined): boolean {
  if (!article) return false;
  return ["draft", "changes_requested"].includes(article.status);
}

/**
 * Check if the article's workflow status permits deletion.
 * Backend contract: Only "draft", "changes_requested", and "archived" articles can be deleted.
 */
export function isArticleDeletableStatus(article: KnowledgeArticle | null | undefined): boolean {
  if (!article) return false;
  return ["draft", "changes_requested", "archived"].includes(article.status);
}

/**
 * Check if user can create new knowledge articles.
 */
export function canCreateArticle(userCtx: UserPermissionContext): boolean {
  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;
  const perms = new Set(userCtx.permissions || []);
  return perms.has("brain.article.create");
}

/**
 * Check if user can edit a specific knowledge article.
 */
export function canEditArticle(
  userCtx: UserPermissionContext,
  article: KnowledgeArticle | null | undefined
): boolean {
  if (!article) return false;
  if (!isArticleEditableStatus(article)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  if (perms.has("brain.article.update_any")) return true;

  const isAuthor = Boolean(userCtx.userId && article.authorUserId === userCtx.userId);
  if (isAuthor && perms.has("brain.article.update_own")) return true;

  return false;
}

/**
 * Check if user can delete a specific knowledge article.
 */
export function canDeleteArticle(
  userCtx: UserPermissionContext,
  article: KnowledgeArticle | null | undefined
): boolean {
  if (!article) return false;
  if (!isArticleDeletableStatus(article)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("brain.article.delete");
}

/**
 * Check if user can restore a soft-deleted knowledge article.
 */
export function canRestoreArticle(
  userCtx: UserPermissionContext,
  article: KnowledgeArticle | null | undefined
): boolean {
  if (!article) return false;
  if (!article.deletedAt) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("brain.article.restore");
}

/**
 * Check if user can restore a historical revision.
 */
export function canRestoreRevision(
  userCtx: UserPermissionContext,
  article: KnowledgeArticle | null | undefined
): boolean {
  if (!article) return false;
  if (!["draft", "changes_requested"].includes(article.status)) return false;

  if (userCtx.isSuperAdmin || userCtx.isBusinessAdmin) return true;

  const perms = new Set(userCtx.permissions || []);
  return perms.has("brain.article.restore_revision");
}

/**
 * Centralized evaluation helper for valid workflow transitions on an article.
 */
export function getAvailableWorkflowActions(
  userCtx: UserPermissionContext,
  article: KnowledgeArticle | null | undefined
): WorkflowActionType[] {
  if (!article) return [];

  const actions: WorkflowActionType[] = [];
  const perms = new Set(userCtx.permissions || []);
  const isAdmin = userCtx.isSuperAdmin || userCtx.isBusinessAdmin;
  const isAuthor = Boolean(userCtx.userId && article.authorUserId === userCtx.userId);

  // 1. Submit for Review
  if (["draft", "changes_requested"].includes(article.status)) {
    if (isAdmin || perms.has("brain.article.submit_review") || perms.has("brain.article.update_any") || (isAuthor && perms.has("brain.article.update_own"))) {
      actions.push("submit_review");
    }
  }

  // 2. Approve (Submitting user cannot approve unless platform super admin)
  if (article.status === "in_review") {
    const isSubmitter = Boolean(userCtx.userId && article.submittedByUserId === userCtx.userId);
    if ((isAdmin || perms.has("brain.article.review")) && (!isSubmitter || userCtx.isSuperAdmin)) {
      actions.push("approve");
    }
  }

  // 3. Request Changes
  if (article.status === "in_review") {
    if (isAdmin || perms.has("brain.article.review")) {
      actions.push("request_changes");
    }
  }

  // 4. Publish
  if (article.status === "approved") {
    if (isAdmin || perms.has("brain.article.publish")) {
      actions.push("publish");
    }
  }

  // 5. Unpublish
  if (article.status === "published") {
    if (isAdmin || perms.has("brain.article.publish")) {
      actions.push("unpublish");
    }
  }

  // 6. Archive
  if (["draft", "changes_requested", "approved", "published"].includes(article.status)) {
    if (isAdmin || perms.has("brain.article.archive")) {
      actions.push("archive");
    }
  }

  // 7. Delete
  if (["draft", "changes_requested", "archived"].includes(article.status) && !article.deletedAt) {
    if (isAdmin || perms.has("brain.article.delete")) {
      actions.push("delete");
    }
  }

  // 8. Restore
  if (article.deletedAt) {
    if (isAdmin || perms.has("brain.article.restore")) {
      actions.push("restore");
    }
  }

  return actions;
}
