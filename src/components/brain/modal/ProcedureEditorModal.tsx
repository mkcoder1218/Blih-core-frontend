import React, { useState, useEffect, useMemo } from "react";
import { X, AlertCircle, AlertTriangle, FileText, Building2, Lock, Globe, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import RichTextEditor from "../../shared/RichTextEditor";
import { useDepartments } from "../../../hooks/useDepartments";
import { useMe } from "../../../hooks/useMe";
import {
  Procedure,
  CreateProcedureInput,
  UpdateProcedureInput,
  ProcedureStep,
} from "../../../api/procedures";
import { KnowledgeCategory } from "../../../api/brain";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface ProcedureEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateProcedureInput | UpdateProcedureInput) => Promise<void>;
  initialData?: Procedure | null;
  categories: KnowledgeCategory[];
  isSubmitting?: boolean;
}

export function ProcedureEditorModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories = [],
  isSubmitting = false,
}: ProcedureEditorModalProps) {
  const isEditing = Boolean(initialData?.id);
  const isEditable = !isEditing || ["draft", "changes_requested"].includes(initialData?.status || "");

  const [activeTab, setActiveTab] = useState<"general" | "sections" | "steps">("general");

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [responsibleDepartmentId, setResponsibleDepartmentId] = useState("");
  const [visibility, setVisibility] = useState<"company" | "department" | "private">("company");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reviewDueDate, setReviewDueDate] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  // Rich Text sections
  const [purpose, setPurpose] = useState("");
  const [scope, setScope] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [expectedResult, setExpectedResult] = useState("");

  // Dynamic steps array
  const [steps, setSteps] = useState<ProcedureStep[]>([]);
  const [newStepInstruction, setNewStepInstruction] = useState("");
  const [newStepExpectedResult, setNewStepExpectedResult] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const { data: meRes } = useMe();
  const loggedInUserId = meRes?.data?.user?.id || "";

  const { data: departmentData } = useDepartments({ size: 1000 });
  const departments = departmentData?.departments || [];

  // Track initial values to check if form is dirty
  const [initialFormSnapshot, setInitialFormSnapshot] = useState("");

  useEffect(() => {
    if (initialData) {
      const initTitle = initialData.title || "";
      const initCat = initialData.categoryId || "";
      const initOwner = initialData.ownerUserId || "";
      const initDept = initialData.responsibleDepartmentId || "";
      const initVis = initialData.visibility || "company";
      const initEff = initialData.effectiveDate ? initialData.effectiveDate.split("T")[0] : "";
      const initRev = initialData.reviewDueDate ? initialData.reviewDueDate.split("T")[0] : "";

      const initPurp = initialData.purpose || "";
      const initScope = initialData.scope || "";
      const initResp = initialData.responsibilities || "";
      const initPrereq = initialData.prerequisites || "";
      const initExpected = initialData.expectedResult || "";
      const initSteps = initialData.steps || [];

      setTitle(initTitle);
      setCategoryId(initCat);
      setOwnerUserId(initOwner);
      setResponsibleDepartmentId(initDept);
      setVisibility(initVis);
      setEffectiveDate(initEff);
      setReviewDueDate(initRev);
      setChangeSummary("");

      setPurpose(initPurp);
      setScope(initScope);
      setResponsibilities(initResp);
      setPrerequisites(initPrereq);
      setExpectedResult(initExpected);
      setSteps(initSteps);

      setInitialFormSnapshot(
        JSON.stringify({
          title: initTitle,
          categoryId: initCat,
          ownerUserId: initOwner,
          responsibleDepartmentId: initDept,
          visibility: initVis,
          effectiveDate: initEff,
          reviewDueDate: initRev,
          purpose: initPurp,
          scope: initScope,
          responsibilities: initResp,
          prerequisites: initPrereq,
          expectedResult: initExpected,
          steps: initSteps,
        })
      );
    } else {
      setTitle("");
      setCategoryId("");
      setOwnerUserId("");
      setResponsibleDepartmentId("");
      setVisibility("company");
      setEffectiveDate("");
      setReviewDueDate("");
      setChangeSummary("");

      setPurpose("");
      setScope("");
      setResponsibilities("");
      setPrerequisites("");
      setExpectedResult("");
      setSteps([]);

      setInitialFormSnapshot(
        JSON.stringify({
          title: "",
          categoryId: "",
          ownerUserId: "",
          responsibleDepartmentId: "",
          visibility: "company",
          effectiveDate: "",
          reviewDueDate: "",
          purpose: "",
          scope: "",
          responsibilities: "",
          prerequisites: "",
          expectedResult: "",
          steps: [],
        })
      );
    }
    setErrorMessage(null);
    setShowUnsavedWarning(false);
    setActiveTab("general");
    setNewStepInstruction("");
    setNewStepExpectedResult("");
  }, [initialData, isOpen]);

  const currentFormSnapshot = useMemo(() => {
    return JSON.stringify({
      title,
      categoryId,
      ownerUserId,
      responsibleDepartmentId,
      visibility,
      effectiveDate,
      reviewDueDate,
      purpose,
      scope,
      responsibilities,
      prerequisites,
      expectedResult,
      steps,
    });
  }, [
    title,
    categoryId,
    ownerUserId,
    responsibleDepartmentId,
    visibility,
    effectiveDate,
    reviewDueDate,
    purpose,
    scope,
    responsibilities,
    prerequisites,
    expectedResult,
    steps,
  ]);

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

  const handleAddStep = () => {
    if (!newStepInstruction.trim()) return;
    const nextSteps = [...steps, { instruction: newStepInstruction.trim(), expectedResult: newStepExpectedResult.trim() || undefined }];
    setSteps(nextSteps);
    setNewStepInstruction("");
    setNewStepExpectedResult("");
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    const nextSteps = [...steps];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const temp = nextSteps[idx];
    nextSteps[idx] = nextSteps[targetIdx];
    nextSteps[targetIdx] = temp;
    setSteps(nextSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Procedure title is required.");
      return;
    }

    if (!isEditable) {
      setErrorMessage(`Procedures in "${initialData?.status}" status cannot be edited directly.`);
      return;
    }

    if (effectiveDate && reviewDueDate && new Date(reviewDueDate) <= new Date(effectiveDate)) {
      setErrorMessage("Review due date must be after effective date.");
      return;
    }

    const payload: any = {
      title: title.trim(),
      categoryId: categoryId || null,
      ownerUserId: ownerUserId || loggedInUserId,
      responsibleDepartmentId: responsibleDepartmentId || null,
      visibility,
      effectiveDate: effectiveDate ? new Date(effectiveDate).toISOString() : null,
      reviewDueDate: reviewDueDate ? new Date(reviewDueDate).toISOString() : null,
      purpose: purpose.trim() || null,
      scope: scope.trim() || null,
      responsibilities: responsibilities.trim() || null,
      prerequisites: prerequisites.trim() || null,
      expectedResult: expectedResult.trim() || null,
      steps,
    };

    if (isEditing) {
      payload.changeSummary = changeSummary.trim() || undefined;
    }

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to save procedure.";
      setErrorMessage(serverMsg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all max-h-[95vh] flex flex-col antialiased">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                {isEditing ? "Edit Procedure" : "Create Company Procedure"}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                {isEditing
                  ? `Modifying draft version v${initialData?.version || 1}`
                  : "Draft a new standard operating procedure"}
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

        {/* Form Tabs */}
        <div className="flex border-b border-slate-100 shrink-0 mt-2">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
              activeTab === "general"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            General Metadata
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sections")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
              activeTab === "sections"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Purpose & Scope
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("steps")}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all ${
              activeTab === "steps"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Step-by-Step Instructions ({steps.length})
          </button>
        </div>

        {/* Warnings */}
        {!isEditable && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800 shrink-0">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold">Procedure is read-only.</span> Current status is{" "}
              <strong className="uppercase">{initialData?.status}</strong>. Only procedures in{" "}
              <strong className="lowercase">draft</strong> or{" "}
              <strong className="lowercase">changes_requested</strong> status can be edited directly.
            </div>
          </div>
        )}

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

        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form Body */}
        <form id="procedureForm" onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
          {activeTab === "general" && (
            <div className="space-y-4">
              {/* Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Procedure Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    placeholder="e.g. Server Maintenance and Daily Database Backup"
                    required
                    maxLength={255}
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
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsible Department</label>
                <Select
                  value={responsibleDepartmentId || "none"}
                  onValueChange={(val) => setResponsibleDepartmentId(val === "none" ? "" : val)}
                  disabled={!isEditable || isSubmitting}
                >
                  <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200">
                    <SelectValue>
                      {responsibleDepartmentId ? (departments.find((d: any) => d.id === responsibleDepartmentId)?.name || "No department restriction...") : "No department restriction..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department restriction...</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Visibility Scope</label>
                  <Select
                    value={visibility}
                    onValueChange={(val) => setVisibility(val as any)}
                    disabled={!isEditable || isSubmitting}
                  >
                    <SelectTrigger className="h-8 w-full rounded-lg text-xs font-medium text-slate-900 border border-slate-200">
                      <SelectValue>
                        {visibility === "company" ? "Company Wide (All Employees)" : visibility === "department" ? "Department Restricted" : "Private (Owner & Admins Only)"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company Wide (All Employees)</SelectItem>
                      <SelectItem value="department">Department Restricted</SelectItem>
                      <SelectItem value="private">Private (Owner & Admins Only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Effective Date</label>
                  <Input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    className="h-8 rounded-lg text-xs font-medium text-slate-900 border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Review Due Date</label>
                  <Input
                    type="date"
                    value={reviewDueDate}
                    onChange={(e) => setReviewDueDate(e.target.value)}
                    disabled={!isEditable || isSubmitting}
                    className="h-8 rounded-lg text-xs font-medium text-slate-900 border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "sections" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Purpose</label>
                  <RichTextEditor
                    value={purpose}
                    onChange={setPurpose}
                    disabled={!isEditable || isSubmitting}
                    placeholder="Describe the main objective of this procedure..."
                    minHeight={120}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Scope</label>
                  <RichTextEditor
                    value={scope}
                    onChange={setScope}
                    disabled={!isEditable || isSubmitting}
                    placeholder="Specify target departments, personnel, systems, or boundaries..."
                    minHeight={120}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Responsibilities</label>
                  <RichTextEditor
                    value={responsibilities}
                    onChange={setResponsibilities}
                    disabled={!isEditable || isSubmitting}
                    placeholder="Detail who is responsible for performing and enforcing steps..."
                    minHeight={120}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prerequisites</label>
                  <RichTextEditor
                    value={prerequisites}
                    onChange={setPrerequisites}
                    disabled={!isEditable || isSubmitting}
                    placeholder="Required tools, credentials, conditions, or access rights..."
                    minHeight={120}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Overall Expected Result (Summary)</label>
                <RichTextEditor
                  value={expectedResult}
                  onChange={setExpectedResult}
                  disabled={!isEditable || isSubmitting}
                  placeholder="Verification signs indicating successful execution..."
                  minHeight={100}
                />
              </div>
            </div>
          )}

          {activeTab === "steps" && (
            <div className="space-y-4">
              {/* Add Step inputs */}
              {isEditable && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <h4 className="text-xs font-black text-slate-900">Add Procedure Step</h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Instruction *</label>
                    <RichTextEditor
                      value={newStepInstruction}
                      onChange={setNewStepInstruction}
                      disabled={!isEditable || isSubmitting}
                      placeholder="e.g. Execute backups script via powershell console"
                      minHeight={100}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Expected Result of Step (Optional)</label>
                    <RichTextEditor
                      value={newStepExpectedResult}
                      onChange={setNewStepExpectedResult}
                      disabled={!isEditable || isSubmitting}
                      placeholder="e.g. Success exit code 0 should display in screen logs"
                      minHeight={100}
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddStep}
                      disabled={!newStepInstruction.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      Add Step
                    </button>
                  </div>
                </div>
              )}

              {/* Steps List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-900">Steps Checklist</h4>
                {steps.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-white">
                    No steps added yet. Add at least one step to this checklist.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-slate-100 bg-white p-4 flex gap-4 items-start shadow-xs hover:border-slate-200"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-black text-indigo-700 border border-indigo-100">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div 
                            className="text-xs font-bold text-slate-900 break-words prose prose-slate"
                            dangerouslySetInnerHTML={{ __html: step.instruction }}
                          />
                          {step.expectedResult && (
                            <div className="text-[11px] text-slate-500 font-medium break-words prose prose-slate flex gap-1.5 items-start">
                              <span className="font-bold text-slate-400 shrink-0">Result:</span>
                              <div dangerouslySetInnerHTML={{ __html: step.expectedResult }} />
                            </div>
                          )}
                        </div>
                        {isEditable && (
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleMoveStep(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveStep(idx, "down")}
                              disabled={idx === steps.length - 1}
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 ml-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Change Summary (Required when editing) */}
          {isEditing && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-1 mt-2">
              <label className="block text-xs font-bold text-blue-900">
                Change Summary / Revision Notes
              </label>
              <Input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                disabled={!isEditable || isSubmitting}
                placeholder="Describe what changed in this revision (e.g. Updated backup commands)"
                maxLength={1000}
                className="h-8 rounded-lg text-xs font-medium text-slate-900 border border-slate-200 bg-white"
              />
              <p className="text-[10.5px] text-blue-700 font-medium">
                Revision notes will be logged in the immutable revision history.
              </p>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            {visibility === "company" ? (
              <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5 text-blue-600" /> Company Wide</span>
            ) : visibility === "department" ? (
              <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-amber-600" /> Department Restricted</span>
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
                form="procedureForm"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : isEditing
                  ? "Save Procedure Edits"
                  : "Save Draft Procedure"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
