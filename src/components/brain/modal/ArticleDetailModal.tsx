import React, { useState, useMemo } from "react";
import {
  X,
  FileText,
  Clock,
  User,
  Globe,
  Building2,
  Lock,
  Edit2,
  CheckCircle2,
  Send,
  RotateCcw,
  Archive,
  Trash2,
  AlertTriangle,
  History,
  AlertCircle,
  Eye,
  Info,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import {
  KnowledgeArticle,
  KnowledgeCategory,
  KnowledgeRevision,
} from "../../../api/brain";
import {
  useBrainArticle,
  useBrainRevisions,
  useSubmitBrainArticleReview,
  useApproveBrainArticle,
  useRequestBrainArticleChanges,
  usePublishBrainArticle,
  useUnpublishBrainArticle,
  useArchiveBrainArticle,
  useDeleteBrainArticle,
  useRestoreBrainArticle,
  useRestoreBrainRevision,
} from "../../../hooks/useBrain";
import {
  UserPermissionContext,
  getAvailableWorkflowActions,
  canEditArticle,
  canRestoreRevision,
  WorkflowActionType,
} from "../articlePermissions";

interface ArticleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string | null;
  userPermissionCtx: UserPermissionContext;
  onEditArticle?: (article: KnowledgeArticle) => void;
}

export function ArticleDetailModal({
  isOpen,
  onClose,
  articleId,
  userPermissionCtx,
  onEditArticle,
}: ArticleDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"content" | "workflow" | "versions">("content");
  const [revisionPage, setRevisionPage] = useState(1);
  const [selectedRevision, setSelectedRevision] = useState<KnowledgeRevision | null>(null);

  // Workflow Confirmation Modal state
  const [activeAction, setActiveAction] = useState<WorkflowActionType | null>(null);
  const [requestComment, setRequestComment] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Revision Restore Confirmation Modal state
  const [restoringRevision, setRestoringRevision] = useState<KnowledgeRevision | null>(null);
  const [restoreErrorMessage, setRestoreErrorMessage] = useState<string | null>(null);

  // Queries
  const { data: fetchedArticle, isLoading: isArticleLoading, isError, error } = useBrainArticle(
    articleId,
    { enabled: isOpen }
  );

  const { data: revisionsData, isLoading: isRevisionsLoading } = useBrainRevisions(
    articleId,
    { page: revisionPage, size: 10 },
    { enabled: isOpen && activeTab === "versions" }
  );

  // Mutations
  const submitReviewMut = useSubmitBrainArticleReview();
  const approveMut = useApproveBrainArticle();
  const requestChangesMut = useRequestBrainArticleChanges();
  const publishMut = usePublishBrainArticle();
  const unpublishMut = useUnpublishBrainArticle();
  const archiveMut = useArchiveBrainArticle();
  const deleteMut = useDeleteBrainArticle();
  const restoreArticleMut = useRestoreBrainArticle();
  const restoreRevisionMut = useRestoreBrainRevision();

  const article = fetchedArticle;
  const revisions = revisionsData?.rows || [];
  const totalRevisionPages = revisionsData?.pages || 1;

  const availableActions = useMemo(
    () => getAvailableWorkflowActions(userPermissionCtx, article),
    [userPermissionCtx, article]
  );

  const editable = useMemo(
    () => canEditArticle(userPermissionCtx, article),
    [userPermissionCtx, article]
  );

  const canRestoreRev = useMemo(
    () => canRestoreRevision(userPermissionCtx, article),
    [userPermissionCtx, article]
  );

  if (!isOpen) return null;

  // Handle Workflow Action Dispatch
  const handleExecuteWorkflowAction = async () => {
    if (!article || !activeAction) return;
    setActionErrorMessage(null);

    try {
      if (activeAction === "submit_review") {
        await submitReviewMut.mutateAsync(article.id);
      } else if (activeAction === "approve") {
        await approveMut.mutateAsync(article.id);
      } else if (activeAction === "request_changes") {
        if (!requestComment.trim()) {
          setActionErrorMessage("Review comment is required when requesting changes.");
          return;
        }
        await requestChangesMut.mutateAsync({ id: article.id, comment: requestComment.trim() });
      } else if (activeAction === "publish") {
        await publishMut.mutateAsync(article.id);
      } else if (activeAction === "unpublish") {
        await unpublishMut.mutateAsync(article.id);
      } else if (activeAction === "archive") {
        await archiveMut.mutateAsync(article.id);
      } else if (activeAction === "delete") {
        await deleteMut.mutateAsync(article.id);
        onClose();
        return;
      } else if (activeAction === "restore") {
        await restoreArticleMut.mutateAsync(article.id);
      }
      setActiveAction(null);
      setRequestComment("");
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        `Failed to execute workflow action ${activeAction}.`;
      setActionErrorMessage(serverMsg);
    }
  };

  // Handle Revision Restore
  const handleExecuteRestoreRevision = async () => {
    if (!article || !restoringRevision) return;
    setRestoreErrorMessage(null);

    try {
      await restoreRevisionMut.mutateAsync({
        articleId: article.id,
        revisionId: restoringRevision.id,
      });
      setRestoringRevision(null);
      setActiveTab("content");
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to restore article revision.";
      setRestoreErrorMessage(serverMsg);
    }
  };

  const isMutating =
    submitReviewMut.isPending ||
    approveMut.isPending ||
    requestChangesMut.isPending ||
    publishMut.isPending ||
    unpublishMut.isPending ||
    archiveMut.isPending ||
    deleteMut.isPending ||
    restoreArticleMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  {article?.title || "Knowledge Article Details"}
                </h2>
                {article && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600">
                    v{article.version}
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500">
                {article?.category ? article.category.name : "Uncategorized Category"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editable && article && onEditArticle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditArticle(article);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Edit Article</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Headers */}
        <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50/60 p-1 mt-3 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "content"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Article Content</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "workflow"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Send className="h-4 w-4" />
            <span>Workflow & Actions</span>
            {availableActions.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-800">
                {availableActions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("versions")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "versions"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Revision History</span>
          </button>
        </div>

        {/* Modal Body */}
        {isArticleLoading ? (
          <div className="flex h-64 w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="text-xs font-bold">Loading article detail…</p>
            </div>
          </div>
        ) : isError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-600 mb-2" />
            <h4 className="font-black text-rose-950 text-sm">Failed to Load Article</h4>
            <p className="mt-1 font-medium">
              {(error as any)?.response?.data?.message || (error as any)?.message || "Article not found or inaccessible."}
            </p>
          </div>
        ) : !article ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No article data available.
          </div>
        ) : (
          <div className="mt-4 overflow-y-auto flex-1 pr-1 space-y-4">
            {/* ── TAB 1: CONTENT ── */}
            {activeTab === "content" && (
              <div className="space-y-5">
                {/* Metadata KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          article.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : article.status === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : article.status === "in_review"
                            ? "bg-indigo-100 text-indigo-800"
                            : article.status === "changes_requested"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : article.status === "archived"
                            ? "bg-slate-200 text-slate-600"
                            : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {article.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visibility</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      {article.visibility === "company" ? (
                        <><Globe className="h-3.5 w-3.5 text-blue-600" /> Company Wide</>
                      ) : article.visibility === "department" ? (
                        <><Building2 className="h-3.5 w-3.5 text-amber-600" /> Department</>
                      ) : (
                        <><Lock className="h-3.5 w-3.5 text-slate-600" /> Private</>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Author</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{article.author?.fullName || article.author?.email || "System User"}</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Updated Date</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(article.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Review Comment Banner (if changes requested) */}
                {article.status === "changes_requested" && article.metadata?.reviewComment && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-1">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <MessageSquare className="h-4 w-4 text-amber-600" />
                      <span>Reviewer Feedback / Requested Changes</span>
                    </div>
                    <p className="text-xs text-amber-800 font-medium pl-6 leading-relaxed">
                      "{article.metadata.reviewComment}"
                    </p>
                  </div>
                )}

                {/* Article Summary */}
                {article.summary && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Article Abstract / Summary
                    </h4>
                    <p className="text-xs font-medium text-slate-700 leading-relaxed">{article.summary}</p>
                  </div>
                )}

                {/* Rich Text Body Content */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900">Article Content</h4>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm min-h-[220px] max-h-[450px] overflow-y-auto">
                    {article.content ? (
                      <div
                        className="prose prose-sm max-w-none text-slate-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                      />
                    ) : (
                      <p className="text-xs text-slate-400 italic">No content body written yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: WORKFLOW & ACTIONS ── */}
            {activeTab === "workflow" && (
              <div className="space-y-6">
                {/* Workflow Status Timeline */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Article Lifecycle & Audit Log
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <span className="text-[10px] font-bold text-slate-400 block">Created</span>
                      <span className="font-bold text-slate-800">{new Date(article.createdAt).toLocaleDateString()}</span>
                    </div>

                    {article.submittedAt && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                        <span className="text-[10px] font-bold text-indigo-500 block">Submitted Review</span>
                        <span className="font-bold text-indigo-900">{new Date(article.submittedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {article.reviewedAt && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                        <span className="text-[10px] font-bold text-blue-500 block">Reviewed</span>
                        <span className="font-bold text-blue-900">{new Date(article.reviewedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {article.publishedAt && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                        <span className="text-[10px] font-bold text-emerald-500 block">Published</span>
                        <span className="font-bold text-emerald-900">{new Date(article.publishedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Action Buttons Grid */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-900">Permitted Workflow Actions</h3>
                    <span className="text-[11px] font-medium text-slate-400">
                      Based on current status (<strong className="uppercase">{article.status}</strong>) & permissions
                    </span>
                  </div>

                  {availableActions.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-xs font-medium text-slate-500">
                      No workflow actions are currently available for your user account on this article.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableActions.includes("submit_review") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("submit_review");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                        >
                          <Send className="h-4 w-4" />
                          <span>Submit for Review</span>
                        </button>
                      )}

                      {availableActions.includes("approve") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("approve");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approve Article</span>
                        </button>
                      )}

                      {availableActions.includes("request_changes") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("request_changes");
                            setRequestComment("");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Request Changes</span>
                        </button>
                      )}

                      {availableActions.includes("publish") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("publish");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          <span>Publish Article</span>
                        </button>
                      )}

                      {availableActions.includes("unpublish") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("unpublish");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Unpublish to Draft</span>
                        </button>
                      )}

                      {availableActions.includes("archive") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("archive");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
                        >
                          <Archive className="h-4 w-4" />
                          <span>Archive Article</span>
                        </button>
                      )}

                      {availableActions.includes("delete") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("delete");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Article</span>
                        </button>
                      )}

                      {availableActions.includes("restore") && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveAction("restore");
                            setActionErrorMessage(null);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Restore Soft-Deleted</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 3: REVISION HISTORY ── */}
            {activeTab === "versions" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900">Immutable Revision History</h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      Audit trail of edits, status changes, and content snapshots.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    Current v{article.version}
                  </span>
                </div>

                {isRevisionsLoading ? (
                  <div className="flex h-48 w-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  </div>
                ) : revisions.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-xs font-medium text-slate-500">
                    No historical revisions logged yet.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                    {revisions.map((rev) => (
                      <div key={rev.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-black text-blue-700 border border-blue-100">
                              v{rev.version}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {rev.changeSummary || "Article snapshot created"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedRevision(rev)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" />
                              View Snapshot
                            </button>

                            {canRestoreRev && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRestoringRevision(rev);
                                  setRestoreErrorMessage(null);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restore
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <User className="h-3 w-3 text-slate-400" />
                            {rev.revisedBy?.fullName || rev.revisedBy?.email || "System"}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {new Date(rev.createdAt).toLocaleString()}
                          </span>
                          {rev.contentSnapshot?.status && (
                            <>
                              <span>•</span>
                              <span className="uppercase text-[10px] font-bold text-slate-600">
                                Status: {rev.contentSnapshot.status}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalRevisionPages > 1 && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 text-xs">
                        <button
                          type="button"
                          disabled={revisionPage <= 1}
                          onClick={() => setRevisionPage((p) => Math.max(1, p - 1))}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-bold text-slate-600 disabled:opacity-40"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" /> Prev
                        </button>
                        <span className="font-bold text-slate-600">
                          Page {revisionPage} of {totalRevisionPages}
                        </span>
                        <button
                          type="button"
                          disabled={revisionPage >= totalRevisionPages}
                          onClick={() => setRevisionPage((p) => p + 1)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-bold text-slate-600 disabled:opacity-40"
                        >
                          Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── WORKFLOW ACTION CONFIRMATION MODAL ── */}
      {activeAction && article && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 capitalize">
              Confirm Workflow Action: {activeAction.replace("_", " ")}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-600">
              Are you sure you want to execute action <strong>"{activeAction}"</strong> on article{" "}
              <strong>"{article.title}"</strong>?
            </p>

            {/* Request Changes Comment Input */}
            {activeAction === "request_changes" && (
              <div className="mt-3 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Reviewer Feedback / Comments <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={requestComment}
                  onChange={(e) => setRequestComment(e.target.value)}
                  placeholder="Detail the necessary edits or revisions required before approval..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            )}

            {actionErrorMessage && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{actionErrorMessage}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveAction(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteWorkflowAction}
                disabled={isMutating}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isMutating ? "Executing..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVISION RESTORE CONFIRMATION MODAL ── */}
      {restoringRevision && article && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-3">
            <div className="flex items-center gap-3 text-blue-600">
              <RotateCcw className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-black text-slate-900">
                Restore Revision v{restoringRevision.version}?
              </h3>
            </div>

            {/* MANDATORY WARNING NOTICE */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 font-medium leading-relaxed flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> Restoring this revision creates a new version. Existing history will not be overwritten.
              </div>
            </div>

            {restoreErrorMessage && (
              <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{restoreErrorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoringRevision(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestoreRevision}
                disabled={restoreRevisionMut.isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {restoreRevisionMut.isPending ? "Restoring..." : "Confirm Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REVISION SNAPSHOT VIEW MODAL ── */}
      {selectedRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[85vh] flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-black text-blue-700 border border-blue-100">
                  v{selectedRevision.version} Snapshot
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  {selectedRevision.contentSnapshot?.title || "Revision Content"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRevision(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Change Summary</span>
                <p className="font-bold text-slate-800">{selectedRevision.changeSummary || "No summary provided"}</p>
              </div>

              {selectedRevision.contentSnapshot?.content && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Snapshot Content Body</span>
                  <div
                    className="rounded-xl border border-slate-200 bg-white p-4 prose prose-sm max-w-none text-slate-800 max-h-[300px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selectedRevision.contentSnapshot.content }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRevision(null)}
                className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
