import React, { useState, useEffect, useMemo } from "react";
import { X, AlertCircle, AlertTriangle, FileText, Building2, Lock, Globe } from "lucide-react";
import RichTextEditor from "../../shared/RichTextEditor";
import {
  KnowledgeArticle,
  KnowledgeCategory,
  CreateKnowledgeArticleInput,
  UpdateKnowledgeArticleInput,
} from "../../../api/brain";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface ArticleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateKnowledgeArticleInput | UpdateKnowledgeArticleInput) => Promise<void>;
  initialData?: KnowledgeArticle | null;
  categories: KnowledgeCategory[];
  isSubmitting?: boolean;
}

export function ArticleEditorModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  isSubmitting = false,
}: ArticleEditorModalProps) {
  const isEditing = Boolean(initialData?.id);
  const isEditable = !isEditing || ["draft", "changes_requested"].includes(initialData?.status || "");

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"company" | "department" | "private">("company");
  const [departmentIdsText, setDepartmentIdsText] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Track initial values to check if form is dirty
  const [initialFormSnapshot, setInitialFormSnapshot] = useState("");

  useEffect(() => {
    if (initialData) {
      const initTitle = initialData.title || "";
      const initCat = initialData.categoryId || "";
      const initSumm = initialData.summary || "";
      const initCont = initialData.content || "";
      const initVis = initialData.visibility || "company";
      const depts = initialData.metadata?.departmentIds || [];
      const initDeptsText = depts.join(", ");

      setTitle(initTitle);
      setCategoryId(initCat);
      setSummary(initSumm);
      setContent(initCont);
      setVisibility(initVis);
      setDepartmentIdsText(initDeptsText);
      setChangeSummary("");

      setInitialFormSnapshot(
        JSON.stringify({
          title: initTitle,
          categoryId: initCat,
          summary: initSumm,
          content: initCont,
          visibility: initVis,
          departmentIdsText: initDeptsText,
        })
      );
    } else {
      setTitle("");
      setCategoryId("");
      setSummary("");
      setContent("");
      setVisibility("company");
      setDepartmentIdsText("");
      setChangeSummary("");

      setInitialFormSnapshot(
        JSON.stringify({
          title: "",
          categoryId: "",
          summary: "",
          content: "",
          visibility: "company",
          departmentIdsText: "",
        })
      );
    }
    setErrorMessage(null);
    setShowUnsavedWarning(false);
  }, [initialData, isOpen]);

  const currentFormSnapshot = useMemo(() => {
    return JSON.stringify({
      title,
      categoryId,
      summary,
      content,
      visibility,
      departmentIdsText,
    });
  }, [title, categoryId, summary, content, visibility, departmentIdsText]);

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    return currentFormSnapshot !== initialFormSnapshot || (isEditing && Boolean(changeSummary.trim()));
  }, [isOpen, currentFormSnapshot, initialFormSnapshot, isEditing, changeSummary]);

  if (!isOpen) return null;

  const handleSafeClose = () => {
    if (isDirty && !showUnsavedWarning) {
      setShowUnsavedWarning(true);
      return;
    }
    onClose();
  };

  const confirmCloseUnsaved = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Article title is required.");
      return;
    }

    if (!isEditable) {
      setErrorMessage(`Articles in "${initialData?.status}" status cannot be edited directly.`);
      return;
    }

    // Parse department IDs if visibility is department
    let departmentIds: string[] | undefined = undefined;
    if (visibility === "department" && departmentIdsText.trim()) {
      departmentIds = departmentIdsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const metadataPayload = {
      ...(initialData?.metadata || {}),
      ...(departmentIds ? { departmentIds } : {}),
    };

    if (isEditing) {
      const payload: UpdateKnowledgeArticleInput = {
        title: title.trim(),
        categoryId: categoryId || null,
        summary: summary.trim() || null,
        content,
        visibility,
        metadata: metadataPayload,
        changeSummary: changeSummary.trim() || undefined,
      };

      try {
        await onSubmit(payload);
        onClose();
      } catch (err: any) {
        const serverMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update knowledge article.";
        setErrorMessage(serverMsg);
      }
    } else {
      const payload: CreateKnowledgeArticleInput = {
        title: title.trim(),
        categoryId: categoryId || null,
        summary: summary.trim() || null,
        content,
        visibility,
        metadata: metadataPayload,
      };

      try {
        await onSubmit(payload);
        onClose();
      } catch (err: any) {
        const serverMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create knowledge article.";
        setErrorMessage(serverMsg);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all max-h-[90vh] flex flex-col antialiased">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isEditing ? "Edit Knowledge Article" : "Create Knowledge Article"}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                {isEditing
                  ? `Modifying draft version v${initialData?.version || 1}`
                  : "Draft a new article for the central knowledge base"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSafeClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Warning if trying to edit non-editable status */}
        {!isEditable && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold">Article is read-only.</span> Current status is{" "}
              <strong className="uppercase">{initialData?.status}</strong>. Only articles in{" "}
              <strong className="lowercase">draft</strong> or{" "}
              <strong className="lowercase">changes_requested</strong> status can be edited directly.
            </div>
          </div>
        )}

        {/* Unsaved Changes Confirmation Banner */}
        {showUnsavedWarning && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-900 shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="font-bold">You have unsaved changes. Discard changes and close?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUnsavedWarning(false)}
                className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={confirmCloseUnsaved}
                className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
              >
                Discard & Close
              </button>
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

        {/* Scrollable Form Body */}
        <form id="articleForm" onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Title & Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Article Title <span className="text-rose-500">*</span>
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!isEditable || isSubmitting}
                placeholder="e.g. Engineering Onboarding & Environment Setup"
                required
                maxLength={500}
                className="h-8 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <Select
                value={categoryId || "uncategorized"}
                onValueChange={(val) => setCategoryId(val === "uncategorized" ? "" : val)}
                disabled={!isEditable || isSubmitting}
              >
                <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200">
                  <SelectValue>
                    {categoryId ? (categories.find(c => c.id === categoryId)?.name || "Uncategorized") : "Uncategorized"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.visibility})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility & Department Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Visibility Scope</label>
              <Select
                value={visibility}
                onValueChange={(val) => setVisibility(val as any)}
                disabled={!isEditable || isSubmitting}
              >
                <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200">
                  <SelectValue>
                    {visibility === "company" ? "Company Wide (All Employees)" : visibility === "department" ? "Department Restricted" : "Private (Author & Elevated Admins Only)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company Wide (All Employees)</SelectItem>
                  <SelectItem value="department">Department Restricted</SelectItem>
                  <SelectItem value="private">Private (Author & Elevated Admins Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibility === "department" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Department IDs (comma-separated)
                </label>
                <Input
                  type="text"
                  value={departmentIdsText}
                  onChange={(e) => setDepartmentIdsText(e.target.value)}
                  disabled={!isEditable || isSubmitting}
                  placeholder="e.g. dept-engineering, dept-product"
                  className="h-8 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 border border-slate-200"
                />
              </div>
            )}
          </div>

          {/* Article Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Short Summary / Abstract
            </label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={!isEditable || isSubmitting}
              placeholder="Brief summary displayed in search results and article list cards..."
              rows={2}
              className="w-full rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 border border-slate-200 resize-none"
            />
          </div>

          {/* Rich-Text Content Editor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Article Body Content</label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              disabled={!isEditable || isSubmitting}
              placeholder="Write comprehensive knowledge documentation, step-by-step guidelines, and references..."
              minHeight={260}
              maxHeight={400}
            />
          </div>

          {/* Change Summary (Required when editing an existing article) */}
          {isEditing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-1">
              <label className="block text-xs font-bold text-blue-900">
                Change Summary / Revision Notes
              </label>
              <Input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                disabled={!isEditable || isSubmitting}
                placeholder="Describe what changed in this revision (e.g. Updated guidelines for 2026)"
                maxLength={1000}
                className="h-8 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 bg-white"
              />
              <p className="text-[10.5px] text-blue-700 font-medium">
                Revision notes will be logged in the immutable article revision history.
              </p>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            {visibility === "company" ? (
              <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-blue-600" /> Company Visibility</span>
            ) : visibility === "department" ? (
              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-amber-600" /> Department Visibility</span>
            ) : (
              <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-slate-600" /> Private Visibility</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSafeClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            {isEditable && (
              <button
                type="submit"
                form="articleForm"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Article Edits"
                  : "Save Draft Article"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
