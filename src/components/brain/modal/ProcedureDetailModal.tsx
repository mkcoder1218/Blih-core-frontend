import React, { useState } from "react";
import {
  X,
  Calendar,
  User,
  Building2,
  Lock,
  Globe,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  History,
  FileText,
  Bookmark,
  FileCheck,
  Send,
  CornerUpLeft,
} from "lucide-react";
import { Procedure, ProcedureRevision } from "../../../api/procedures";
import {
  useProcedureRevisions,
  useRestoreProcedureRevision,
  useSubmitProcedureReview,
  useApproveProcedure,
  useRequestProcedureChanges,
  usePublishProcedure,
  useUnpublishProcedure,
  useArchiveProcedure,
} from "../../../hooks/useProcedures";
import { getAvailableWorkflowActions, UserPermissionContext } from "../procedurePermissions";

interface ProcedureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedureId: string | null;
  procedure: Procedure | null;
  userPermissionCtx: UserPermissionContext;
  onEdit: () => void;
}

export function ProcedureDetailModal({
  isOpen,
  onClose,
  procedureId,
  procedure,
  userPermissionCtx,
  onEdit,
}: ProcedureDetailModalProps) {
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisionPage, setRevisionPage] = useState(1);
  const [changesComment, setChangesComment] = useState("");
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  // Workflow Action mutations
  const submitReviewMut = useSubmitProcedureReview();
  const approveMut = useApproveProcedure();
  const requestChangesMut = useRequestProcedureChanges();
  const publishMut = usePublishProcedure();
  const unpublishMut = useUnpublishProcedure();
  const archiveMut = useArchiveProcedure();
  const restoreRevisionMut = useRestoreProcedureRevision();

  // Fetch revisions list
  const { data: revisionData } = useProcedureRevisions(
    procedureId,
    { page: revisionPage, size: 10 },
    { enabled: isOpen && showRevisions }
  );
  const revisions = revisionData?.rows || [];

  if (!isOpen || !procedure) return null;

  const availableActions = getAvailableWorkflowActions(userPermissionCtx, procedure);

  const handleAction = async (action: string) => {
    setWorkflowError(null);
    try {
      if (action === "submit_review") {
        await submitReviewMut.mutateAsync(procedure.id);
      } else if (action === "approve") {
        await approveMut.mutateAsync(procedure.id);
      } else if (action === "publish") {
        await publishMut.mutateAsync(procedure.id);
      } else if (action === "unpublish") {
        await unpublishMut.mutateAsync(procedure.id);
      } else if (action === "archive") {
        await archiveMut.mutateAsync(procedure.id);
      }
    } catch (err: any) {
      setWorkflowError(err?.response?.data?.message || err?.message || `Workflow transition failed.`);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changesComment.trim()) return;
    setWorkflowError(null);
    try {
      await requestChangesMut.mutateAsync({ id: procedure.id, comment: changesComment.trim() });
      setIsRequestingChanges(false);
      setChangesComment("");
    } catch (err: any) {
      setWorkflowError(err?.response?.data?.message || err?.message || "Failed to submit change request.");
    }
  };

  const handleRestoreRevision = async (revisionId: string) => {
    if (!window.confirm("Are you sure you want to restore this revision? This will overwrite the current draft content.")) return;
    setWorkflowError(null);
    try {
      await restoreRevisionMut.mutateAsync({ procedureId: procedure.id, revisionId });
      setShowRevisions(false);
    } catch (err: any) {
      setWorkflowError(err?.response?.data?.message || err?.message || "Failed to restore revision.");
    }
  };

  // Helper to format date
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-tight">
                {procedure.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400">
                  Version v{procedure.version}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    procedure.status === "published"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : procedure.status === "in_review"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : procedure.status === "approved"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : procedure.status === "changes_requested"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  {procedure.status.replace("_", " ")}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                  {procedure.visibility === "company" ? (
                    <Globe className="h-3 w-3 text-blue-500" />
                  ) : procedure.visibility === "department" ? (
                    <Building2 className="h-3 w-3 text-amber-500" />
                  ) : (
                    <Lock className="h-3 w-3 text-slate-500" />
                  )}
                  {procedure.visibility}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRevisions((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                showRevisions
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <History className="h-4 w-4" />
              History
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex flex-1 overflow-hidden min-h-0 mt-4 gap-6">
          {/* Main Document Content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {workflowError && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-bold">{workflowError}</span>
              </div>
            )}

            {/* General Meta Information Card */}
            <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Responsible Dept</p>
                  <p className="text-xs font-bold text-slate-800">
                    {procedure.responsibleDepartment?.name || "All Departments"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Effective Date</p>
                  <p className="text-xs font-bold text-slate-800">
                    {formatDate(procedure.effectiveDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Review Due</p>
                  <p className="text-xs font-bold text-slate-800">
                    {formatDate(procedure.reviewDueDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Sections */}
            {[
              { title: "Purpose", html: procedure.purpose },
              { title: "Scope", html: procedure.scope },
              { title: "Responsibilities", html: procedure.responsibilities },
              { title: "Prerequisites", html: procedure.prerequisites },
            ].map((section, idx) => (
              <div key={idx} className="space-y-1.5 border-b border-slate-50 pb-4">
                <h3 className="text-xs font-black text-slate-900 border-l-2 border-indigo-500 pl-2">
                  {section.title}
                </h3>
                {section.html ? (
                  <div
                    className="prose prose-slate max-w-none text-xs font-medium leading-relaxed text-slate-700 mt-2 pl-2"
                    dangerouslySetInnerHTML={{ __html: section.html }}
                  />
                ) : (
                  <p className="text-xs italic text-slate-400 font-medium pl-2">Section is empty.</p>
                )}
              </div>
            ))}

            {/* Steps checklist display */}
            <div className="space-y-3 border-b border-slate-50 pb-4">
              <h3 className="text-xs font-black text-slate-900 border-l-2 border-indigo-500 pl-2">
                Step-by-Step Instructions
              </h3>
              {(!procedure.steps || procedure.steps.length === 0) ? (
                <p className="text-xs italic text-slate-400 font-medium pl-2">No steps listed.</p>
              ) : (
                <div className="space-y-3 mt-2 pl-2">
                  {procedure.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-xs font-medium text-slate-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                        {idx + 1}
                      </span>
                      <div className="space-y-1 prose prose-slate max-w-none text-xs">
                        <div className="font-bold text-slate-900" dangerouslySetInnerHTML={{ __html: step.instruction }} />
                        {step.expectedResult && (
                          <div className="text-[11px] text-slate-500 flex gap-1.5 items-start">
                            <span className="font-bold text-slate-400 shrink-0">Expected Result:</span>
                            <div dangerouslySetInnerHTML={{ __html: step.expectedResult }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expected Result (Overall Summary) */}
            <div className="space-y-1.5 border-b border-slate-50 pb-4">
              <h3 className="text-xs font-black text-slate-900 border-l-2 border-indigo-500 pl-2">
                Expected Result (Summary)
              </h3>
              {procedure.expectedResult ? (
                <div
                  className="prose prose-slate max-w-none text-xs font-medium leading-relaxed text-slate-700 mt-2 pl-2"
                  dangerouslySetInnerHTML={{ __html: procedure.expectedResult }}
                />
              ) : (
                <p className="text-xs italic text-slate-400 font-medium pl-2">Section is empty.</p>
              )}
            </div>
          </div>

          {/* Sidebar: Revision History */}
          {showRevisions && (
            <div className="w-80 border-l border-slate-100 pl-6 flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right duration-200">
              <h3 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5 shrink-0">
                <History className="h-4 w-4 text-indigo-600" />
                Revision History
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {revisions.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium text-center py-8">
                    No revisions recorded.
                  </p>
                ) : (
                  revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2 hover:border-slate-200"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-900">
                          Version v{rev.version}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatDate(rev.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">
                        {rev.changeSummary || "No description provided."}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>By {rev.revisedBy?.fullName || "System"}</span>
                        {["draft", "changes_requested"].includes(procedure.status) && (
                          <button
                            type="button"
                            onClick={() => handleRestoreRevision(rev.id)}
                            className="inline-flex items-center gap-1 text-indigo-600 font-extrabold hover:text-indigo-800"
                          >
                            <CornerUpLeft className="h-3 w-3" />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls / Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-4 mt-4 shrink-0 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Standard actions */}
            {availableActions.includes("submit_review") && (
              <button
                type="button"
                onClick={() => handleAction("submit_review")}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                Submit for Review
              </button>
            )}

            {availableActions.includes("approve") && (
              <button
                type="button"
                onClick={() => handleAction("approve")}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                Approve Procedure
              </button>
            )}

            {availableActions.includes("request_changes") && !isRequestingChanges && (
              <button
                type="button"
                onClick={() => setIsRequestingChanges(true)}
                className="rounded-xl bg-rose-50 hover:bg-rose-100 px-4 py-2 text-xs font-bold text-rose-700 border border-rose-200 transition-colors"
              >
                Request Changes
              </button>
            )}

            {availableActions.includes("publish") && (
              <button
                type="button"
                onClick={() => handleAction("publish")}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                Publish Procedure
              </button>
            )}

            {availableActions.includes("unpublish") && (
              <button
                type="button"
                onClick={() => handleAction("unpublish")}
                className="rounded-xl bg-amber-50 hover:bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700 border border-amber-200 transition-colors"
              >
                Unpublish
              </button>
            )}

            {availableActions.includes("archive") && (
              <button
                type="button"
                onClick={() => handleAction("archive")}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Archive
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            {["draft", "changes_requested"].includes(procedure.status) && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors"
              >
                Edit Content
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>

        {/* Pop-up Overlay Modal: Request Changes Message */}
        {isRequestingChanges && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <form
              onSubmit={handleRequestChanges}
              className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h4 className="text-xs font-black text-slate-900">Provide Review Comment</h4>
                <button
                  type="button"
                  onClick={() => setIsRequestingChanges(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Change Request / Feedback Comments
                </label>
                <textarea
                  required
                  value={changesComment}
                  onChange={(e) => setChangesComment(e.target.value)}
                  placeholder="e.g. Please clarify step 3 credentials management policy..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setIsRequestingChanges(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm inline-flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
