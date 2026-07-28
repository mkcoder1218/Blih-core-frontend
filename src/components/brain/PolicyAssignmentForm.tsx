import React, { useState } from "react";
import { Plus, Trash2, ShieldAlert, Info, Users, Building2, User, Briefcase, ShieldCheck } from "lucide-react";
import { PolicyAssignmentItem, SubjectType, AssignmentType } from "../../api/policies";

interface PolicyAssignmentFormProps {
  assignments: PolicyAssignmentItem[];
  onChange: (assignments: PolicyAssignmentItem[]) => void;
  disabled?: boolean;
}

export function PolicyAssignmentForm({
  assignments = [],
  onChange,
  disabled = false,
}: PolicyAssignmentFormProps) {
  const [subjectType, setSubjectType] = useState<SubjectType>("COMPANY");
  const [subjectId, setSubjectId] = useState("ALL");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>("INCLUDE");
  const [isRequired, setIsRequired] = useState(true);
  const [requiresAcceptance, setRequiresAcceptance] = useState(true);
  const [requiresSignature, setRequiresSignature] = useState(false);

  const handleAddAssignment = () => {
    if (!subjectId.trim()) return;

    const newItem: PolicyAssignmentItem = {
      subjectType,
      subjectId: subjectType === "COMPANY" ? "ALL" : subjectId.trim(),
      assignmentType,
      isRequired,
      requiresAcceptance,
      requiresSignature,
    };

    // Check if duplicate entry exists
    const exists = assignments.some(
      (item) => item.subjectType === newItem.subjectType && item.subjectId === newItem.subjectId
    );

    if (exists) {
      // Replace existing entry
      onChange(
        assignments.map((item) =>
          item.subjectType === newItem.subjectType && item.subjectId === newItem.subjectId
            ? newItem
            : item
        )
      );
    } else {
      onChange([...assignments, newItem]);
    }

    // Reset inputs
    setSubjectId(subjectType === "COMPANY" ? "ALL" : "");
  };

  const handleRemoveAssignment = (index: number) => {
    onChange(assignments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Scope Precedence Explanation Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Assignment Precedence Rule:</strong> More specific rules override broader rules. At the same level, exclusion wins.
        </div>
      </div>

      {/* Add Assignment Rule Controls */}
      {!disabled && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h4 className="text-xs font-black text-slate-900">Add Target Assignment Rule</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Subject Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Subject</label>
              <select
                value={subjectType}
                onChange={(e) => {
                  const val = e.target.value as SubjectType;
                  setSubjectType(val);
                  if (val === "COMPANY") setSubjectId("ALL");
                  else setSubjectId("");
                }}
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="COMPANY">Company Wide (All)</option>
                <option value="DEPARTMENT">Department</option>
                <option value="POSITION">Position</option>
                <option value="ROLE">Role</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>

            {/* Subject ID */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {subjectType === "COMPANY" ? "Target ID" : "Target Subject Identifier / ID"}
              </label>
              <input
                type="text"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                disabled={subjectType === "COMPANY"}
                placeholder={
                  subjectType === "DEPARTMENT"
                    ? "e.g. dept-engineering"
                    : subjectType === "POSITION"
                    ? "e.g. pos-software-engineer"
                    : subjectType === "ROLE"
                    ? "e.g. role-hr-manager"
                    : subjectType === "EMPLOYEE"
                    ? "e.g. emp-1002"
                    : "ALL"
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>

            {/* Assignment Type */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Rule Type</label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
                className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none"
              >
                <option value="INCLUDE">INCLUDE (Target Included)</option>
                <option value="EXCLUDE">EXCLUDE (Target Excluded)</option>
              </select>
            </div>
          </div>

          {/* Toggle Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700 pt-1">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Is Mandatory</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAcceptance}
                onChange={(e) => setRequiresAcceptance(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Requires Acceptance</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresSignature}
                onChange={(e) => setRequiresSignature(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Requires Digital Signature</span>
            </label>

            <button
              type="button"
              onClick={handleAddAssignment}
              disabled={subjectType !== "COMPANY" && !subjectId.trim()}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>Add Rule</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Rules List */}
      <div className="space-y-2">
        <h4 className="text-xs font-black text-slate-900">Configured Policy Assignments</h4>

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-400 font-medium">
            No specific assignment rules configured yet. (Default applies to company wide).
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden shadow-sm">
            {assignments.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 text-xs">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      item.assignmentType === "INCLUDE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {item.assignmentType}
                  </span>

                  <div>
                    <span className="font-bold text-slate-900">{item.subjectType}:</span>{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-800">
                      {item.subjectId}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    {item.isRequired && <span className="text-blue-700 font-bold">Mandatory</span>}
                    {item.requiresAcceptance && <span>Acceptance</span>}
                    {item.requiresSignature && <span className="text-indigo-700 font-bold">Signature</span>}
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignment(idx)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Remove Rule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
