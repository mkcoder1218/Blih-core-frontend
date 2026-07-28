import React, { useState, useEffect } from "react";
import { X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
  KnowledgeCategory,
  CreateKnowledgeCategoryInput,
  UpdateKnowledgeCategoryInput,
} from "../../../api/brain";

import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateKnowledgeCategoryInput | UpdateKnowledgeCategoryInput) => Promise<void>;
  initialData?: KnowledgeCategory | null;
  availableCategories: KnowledgeCategory[];
  isSubmitting?: boolean;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  availableCategories,
  isSubmitting = false,
}: CategoryFormModalProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [showAdvancedKey, setShowAdvancedKey] = useState(false);
  const [description, setDescription] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [visibility, setVisibility] = useState<"company" | "department" | "private">("company");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setKey(initialData.key || "");
      setDescription(initialData.description || "");
      setParentCategoryId(initialData.parentCategoryId || "");
      setVisibility(initialData.visibility || "company");
      setStatus(initialData.status || "active");
      setShowAdvancedKey(Boolean(initialData.key));
    } else {
      setName("");
      setKey("");
      setDescription("");
      setParentCategoryId("");
      setVisibility("company");
      setStatus("active");
      setShowAdvancedKey(false);
    }
    setErrorMessage(null);
  }, [initialData, isOpen]);

  const isEditing = Boolean(initialData?.id);
  const currentId = initialData?.id;

  // Helper to collect all descendant category IDs recursively
  const descendants = React.useMemo(() => {
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
  const validParents = availableCategories.filter((cat) => {
    // Exclude self
    if (isEditing && cat.id === currentId) return false;
    // Exclude recursive descendants (circular parent prevention)
    if (isEditing && descendants.has(cat.id)) return false;
    // Exclude soft-deleted
    if (cat.deletedAt) return false;
    // Exclude archived parent if setting active status
    if (status === "active" && cat.status === "archived") return false;
    return true;
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }

    const payload: CreateKnowledgeCategoryInput = {
      name: name.trim(),
      description: description.trim() || null,
      parentCategoryId: parentCategoryId || null,
      visibility,
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
        "An unexpected error occurred while saving the category.";
      setErrorMessage(serverMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all antialiased">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              {isEditing ? "Edit Knowledge Category" : "Create Knowledge Category"}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {isEditing
                ? "Update category details and hierarchy settings."
                : "Add a new category to structure company knowledge."}
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
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Employee Onboarding"
              required
              maxLength={255}
              className="h-8 rounded-lg text-xs font-medium text-slate-900 border border-slate-200"
            />
          </div>

          {/* Parent Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parent Category</label>
            <Select
              value={parentCategoryId || "none"}
              onValueChange={(val) => setParentCategoryId(val === "none" ? "" : val)}
            >
              <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200">
                <SelectValue>
                  {parentCategoryId
                    ? (validParents.find((c) => c.id === parentCategoryId)?.name || "None (Top-Level Category)")
                    : "None (Top-Level Category)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top-Level Category)</SelectItem>
                {validParents.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.visibility}) {cat.status === "archived" ? "[Archived]" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Visibility</label>
              <Select
                value={visibility}
                onValueChange={(val) => setVisibility(val as any)}
              >
                <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200">
                  <SelectValue>
                    {visibility === "company"
                      ? "Company Wide"
                      : visibility === "department"
                      ? "Department Only"
                      : "Private (Admins Only)"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Company Wide</SelectItem>
                  <SelectItem value="department">Department Only</SelectItem>
                  <SelectItem value="private">Private (Admins Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as any)}
              >
                <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200">
                  <SelectValue>
                    {status === "active" ? "Active" : "Archived"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of articles contained in this category..."
              rows={3}
              className="w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200 resize-none"
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
                <Input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="auto-generated-if-empty"
                  maxLength={120}
                  className="h-8 rounded-lg text-xs font-mono text-slate-800 border border-slate-200 bg-white"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Unique identifier used in system references. If left empty, auto-generated from category name.
                </p>
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
