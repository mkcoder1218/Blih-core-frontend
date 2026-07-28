import React, { useState, useEffect, useMemo } from "react";
import { X, AlertCircle, AlertTriangle, FileCheck, Building2, Lock, Globe, Shield, Calendar } from "lucide-react";
import RichTextEditor from "../../shared/RichTextEditor";
import { PolicyAssignmentForm } from "../PolicyAssignmentForm";
import {
  PolicyDocument,
  PolicyCategory,
  CreatePolicyDocumentInput,
  UpdatePolicyDocumentInput,
  PolicyAssignmentItem,
  VisibilityScope,
  ConfidentialityLevel,
} from "../../../api/policies";
import { usePolicyAssignments, useUpdatePolicyAssignments } from "../../../hooks/usePolicies";

interface PolicyEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePolicyDocumentInput | UpdatePolicyDocumentInput) => Promise<PolicyDocument>;
  initialData?: PolicyDocument | null;
  categories: PolicyCategory[];
  isSubmitting?: boolean;
}

export function PolicyEditorModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  isSubmitting = false,
}: PolicyEditorModalProps) {
  const isEditing = Boolean(initialData?.id);
  const isEditable = !isEditing || ["draft", "changes_requested"].includes(initialData?.status || "");

  const [activeTab, setActiveTab] = useState<"general" | "content" | "compliance" | "assignments">("general");

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [policyType, setPolicyType] = useState("GENERAL");
  const [categoryId, setCategoryId] = useState("");
  const [summary, setSummary] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [visibility, setVisibility] = useState<VisibilityScope>("company");
  const [confidentialityLevel, setConfidentialityLevel] = useState<ConfidentialityLevel>("normal");
  const [versionLabel, setVersionLabel] = useState("");

  const [isRequired, setIsRequired] = useState(true);
  const [requiresAcceptance, setRequiresAcceptance] = useState(true);
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [requiresReacceptanceOnUpdate, setRequiresReacceptanceOnUpdate] = useState(true);
  const [appliesToAllEmployees, setAppliesToAllEmployees] = useState(true);

  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [reviewDueAt, setReviewDueAt] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  const [assignments, setAssignments] = useState<PolicyAssignmentItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Fetch existing assignments if editing
  const { data: existingAssignments } = usePolicyAssignments(initialData?.id, {
    enabled: isOpen && isEditing,
  });

  const updateAssignmentsMut = useUpdatePolicyAssignments();

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setSlug(initialData.slug || "");
      setPolicyType(initialData.policyType || "GENERAL");
      setCategoryId(initialData.categoryId || "");
      setSummary(initialData.summary || "");
      setContentHtml(initialData.contentHtml || "");
      setVisibility(initialData.visibility || "company");
      setConfidentialityLevel(initialData.confidentialityLevel || "normal");
      setVersionLabel(initialData.versionLabel || "");

      setIsRequired(initialData.isRequired ?? true);
      setRequiresAcceptance(initialData.requiresAcceptance ?? true);
      setRequiresSignature(initialData.requiresSignature ?? false);
      setRequiresReacceptanceOnUpdate(initialData.requiresReacceptanceOnUpdate ?? true);
      setAppliesToAllEmployees(initialData.appliesToAllEmployees ?? true);

      setEffectiveFrom(initialData.effectiveFrom ? initialData.effectiveFrom.split("T")[0] : "");
      setEffectiveUntil(initialData.effectiveUntil ? initialData.effectiveUntil.split("T")[0] : "");
      setReviewDueAt(initialData.reviewDueAt ? initialData.reviewDueAt.split("T")[0] : "");
      setChangeSummary("");
    } else {
      setTitle("");
      setSlug("");
      setPolicyType("GENERAL");
      setCategoryId("");
      setSummary("");
      setContentHtml("");
      setVisibility("company");
      setConfidentialityLevel("normal");
      setVersionLabel("");

      setIsRequired(true);
      setRequiresAcceptance(true);
      setRequiresSignature(false);
      setRequiresReacceptanceOnUpdate(true);
      setAppliesToAllEmployees(true);

      setEffectiveFrom("");
      setEffectiveUntil("");
      setReviewDueAt("");
      setChangeSummary("");
      setAssignments([]);
    }
    setErrorMessage(null);
    setShowUnsavedWarning(false);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (existingAssignments) {
      setAssignments(
        existingAssignments.map((a) => ({
          subjectType: a.subjectType,
          subjectId: a.subjectId,
          assignmentType: a.assignmentType,
          isRequired: a.isRequired,
          requiresAcceptance: a.requiresAcceptance,
          requiresSignature: a.requiresSignature,
          dueAt: a.dueAt,
        }))
      );
    }
  }, [existingAssignments]);

  if (!isOpen) return null;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Policy title is required.");
      return;
    }

    if (!contentHtml.trim()) {
      setErrorMessage("Policy document content body is required.");
      return;
    }

    // Validate date ordering
    if (effectiveFrom && effectiveUntil && new Date(effectiveUntil) <= new Date(effectiveFrom)) {
      setErrorMessage("Effective until date must be after effective from date.");
      return;
    }

    try {
      let savedPolicy: PolicyDocument;

      if (isEditing) {
        const payload: UpdatePolicyDocumentInput = {
          title: title.trim(),
          slug: slug.trim() || undefined,
          policyType,
          categoryId: categoryId || null,
          summary: summary.trim() || null,
          contentHtml,
          visibility,
          confidentialityLevel,
          versionLabel: versionLabel.trim() || null,
          isRequired,
          requiresAcceptance,
          requiresSignature,
          requiresReacceptanceOnUpdate,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : null,
          effectiveUntil: effectiveUntil ? new Date(effectiveUntil).toISOString() : null,
          reviewDueAt: reviewDueAt ? new Date(reviewDueAt).toISOString() : null,
          appliesToAllEmployees,
          changeSummary: changeSummary.trim() || undefined,
        };

        savedPolicy = await onSubmit(payload);
      } else {
        const payload: CreatePolicyDocumentInput = {
          title: title.trim(),
          slug: slug.trim() || undefined,
          policyType,
          categoryId: categoryId || null,
          summary: summary.trim() || null,
          contentHtml,
          visibility,
          confidentialityLevel,
          versionLabel: versionLabel.trim() || null,
          isRequired,
          requiresAcceptance,
          requiresSignature,
          requiresReacceptanceOnUpdate,
          effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : null,
          effectiveUntil: effectiveUntil ? new Date(effectiveUntil).toISOString() : null,
          reviewDueAt: reviewDueAt ? new Date(reviewDueAt).toISOString() : null,
          appliesToAllEmployees,
        };

        savedPolicy = await onSubmit(payload);
      }

      // If assignments configured, submit assignments payload
      if (assignments.length > 0 && savedPolicy?.id) {
        await updateAssignmentsMut.mutateAsync({
          policyId: savedPolicy.id,
          assignments,
        });
      }

      onClose();
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "An error occurred while saving the policy document.";
      setErrorMessage(serverMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isEditing ? "Edit Policy Document" : "Create Policy Document"}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                {isEditing
                  ? `Modifying draft version v${initialData?.version || 1}`
                  : "Draft a new company policy or compliance document"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Read-only warning */}
        {!isEditable && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold">Policy is read-only.</span> Current status is{" "}
              <strong className="uppercase">{initialData?.status}</strong>. Only policies in{" "}
              <strong className="lowercase">draft</strong> or{" "}
              <strong className="lowercase">changes_requested</strong> status can be edited directly.
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50/60 p-1 mt-3 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "general" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            }`}
          >
            1. General Metadata
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "content" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            }`}
          >
            2. Policy Document Body
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("compliance")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "compliance" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            }`}
          >
            3. Compliance & Schedule
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("assignments")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "assignments" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"
            }`}
          >
            4. Target Assignments
          </button>
        </div>

        {/* Form Body */}
        <form id="policyForm" onSubmit={handleFormSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* TAB 1: GENERAL METADATA */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Policy Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    placeholder="e.g. Information Security & Data Protection Policy"
                    required
                    maxLength={255}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Policy Type</label>
                  <select
                    value={policyType}
                    onChange={(e) => setPolicyType(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="GENERAL">General Policy</option>
                    <option value="CODE_OF_CONDUCT">Code of Conduct</option>
                    <option value="IT_SECURITY">IT Security & Access</option>
                    <option value="SAFETY">Health & Safety</option>
                    <option value="HR">HR & Personnel</option>
                    <option value="FINANCE">Finance & Expenses</option>
                    <option value="COMPLIANCE">Regulatory Compliance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visibility Scope</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    disabled={!isEditable || isSubmitting}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="company">Company Wide</option>
                    <option value="department">Department Restricted</option>
                    <option value="private">Private (Owner & Admins Only)</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confidentiality Level</label>
                  <select
                    value={confidentialityLevel}
                    onChange={(e) => setConfidentialityLevel(e.target.value as any)}
                    disabled={!isEditable || isSubmitting}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="confidential">Confidential</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Summary / Executive Abstract</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={!isEditable || isSubmitting}
                  placeholder="Short description of this policy and key compliance expectations..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {isEditing && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-1">
                  <label className="block text-xs font-bold text-blue-900">
                    Change Summary / Revision Notes
                  </label>
                  <input
                    type="text"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    placeholder="Describe modifications made to this policy version"
                    maxLength={1000}
                    className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: POLICY DOCUMENT BODY */}
          {activeTab === "content" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Policy HTML Document Content <span className="text-rose-500">*</span>
              </label>
              <RichTextEditor
                value={contentHtml}
                onChange={setContentHtml}
                disabled={!isEditable || isSubmitting}
                placeholder="Compose complete policy clauses, guidelines, terms, and requirements..."
                minHeight={280}
                maxHeight={420}
              />
            </div>
          )}

          {/* TAB 3: COMPLIANCE & SCHEDULE */}
          {activeTab === "compliance" && (
            <div className="space-y-4">
              {/* Compliance Toggles */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Employee Compliance & Signature Rules
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-slate-700">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                      disabled={!isEditable || isSubmitting}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mandatory Policy Requirement</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresAcceptance}
                      onChange={(e) => setRequiresAcceptance(e.target.checked)}
                      disabled={!isEditable || isSubmitting}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Requires Formal Employee Acceptance</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresSignature}
                      onChange={(e) => setRequiresSignature(e.target.checked)}
                      disabled={!isEditable || isSubmitting}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Requires Digital Signature (Typed / Drawn)</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requiresReacceptanceOnUpdate}
                      onChange={(e) => setRequiresReacceptanceOnUpdate(e.target.checked)}
                      disabled={!isEditable || isSubmitting}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require Re-acceptance on Version Updates</span>
                  </label>
                </div>
              </div>

              {/* Effective Dates & Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective From Date</label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective Until Date</label>
                  <input
                    type="date"
                    value={effectiveUntil}
                    onChange={(e) => setEffectiveUntil(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Review Due Date</label>
                  <input
                    type="date"
                    value={reviewDueAt}
                    onChange={(e) => setReviewDueAt(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TARGET ASSIGNMENTS */}
          {activeTab === "assignments" && (
            <div className="space-y-4">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appliesToAllEmployees}
                  onChange={(e) => setAppliesToAllEmployees(e.target.checked)}
                  disabled={!isEditable || isSubmitting}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Applies to All Employees across Organization</span>
              </label>

              <PolicyAssignmentForm
                assignments={assignments}
                onChange={setAssignments}
                disabled={!isEditable || isSubmitting}
              />
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="font-mono text-slate-500">
              {visibility.toUpperCase()} • {confidentialityLevel.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {isEditable && (
              <button
                type="submit"
                form="policyForm"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Policy Edits"
                  : "Save Draft Policy"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
