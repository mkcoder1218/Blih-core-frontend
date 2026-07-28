import React, { useState, useEffect, useMemo } from "react";
import { X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  PolicyCategory,
  CreatePolicyCategoryInput,
  UpdatePolicyCategoryInput,
} from "../../../api/policies";

interface PolicyCategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePolicyCategoryInput | UpdatePolicyCategoryInput) => Promise<void>;
  initialData?: PolicyCategory | null;
  availableCategories: PolicyCategory[];
  isSubmitting?: boolean;
}

export function PolicyCategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  availableCategories = [],
  isSubmitting = false,
}: PolicyCategoryFormModalProps) {
  const isEditing = Boolean(initialData?.id);
  const currentId = initialData?.id;

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [showAdvancedKey, setShowAdvancedKey] = useState(false);
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setKey(initialData.key || "");
      setDescription(initialData.description || "");
      setParentCategoryId(initialData.parentCategoryId || "");
      setStatus(initialData.status || "active");
      setShowAdvancedKey(Boolean(initialData.key));
    } else {
      setName("");
      setKey("");
      setDescription("");
      setParentCategoryId("");
      setStatus("active");
      setShowAdvancedKey(false);
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  // Helper to collect all descendant category IDs recursively
  const descendants = useMemo(() => {
    if (!isEditing || !currentId) return new Set<string>();
    const set = new Set<string>();
    function collect(pid: string) {
      availableCategories.forEach((cat) => {
        if (cat.parentCategoryId === pid && !set.has(cat.id)) {
          set.add(cat.id);
          collect(cat.id);
        }
      });
    }
    collect(currentId);
    return set;
  }, [isEditing, currentId, availableCategories]);

  // Filter out current category, descendants, deleted, and archived parents
  const validParents = useMemo(() => {
    return availableCategories.filter((cat) => {
      if (isEditing && cat.id === currentId) return false;
      if (isEditing && descendants.has(cat.id)) return false;
      if (cat.deletedAt) return false;
      if (status === "active" && cat.status === "archived") return false;
      return true;
    });
  }, [availableCategories, isEditing, currentId, descendants, status]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }

    const payload: CreatePolicyCategoryInput = {
      name: name.trim(),
      description: description.trim() || null,
      parentCategoryId: parentCategoryId || null,
      status,
    };

    if (key.trim()) {
      payload.key = key.trim().toLowerCase();
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred while saving the policy category.";
      setErrorMessage(serverMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {isEditing ? "Edit Policy Category" : "Create Policy Category"}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {isEditing
                ? "Update category details and hierarchy settings."
                : "Add a new category to group company policy documents."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Information Security Policies"
              required
              maxLength={255}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parent Category</label>
            <select
              value={parentCategoryId}
              onChange={(e) => setParentCategoryId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">None (Top-Level Policy Category)</option>
              {validParents.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.status === "archived" ? "[Archived]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of policies grouped in this category..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* Advanced Key Section */}
          <div className="border-t border-slate-100 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvancedKey(!showAdvancedKey)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              {showAdvancedKey ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span>Advanced: Custom Category Key</span>
            </button>

            {showAdvancedKey && (
              <div className="mt-2 rounded-2xl bg-slate-50 p-3">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Custom Key (slug)
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="auto-generated-if-empty"
                  maxLength={120}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                ? "Update Category"
                : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
