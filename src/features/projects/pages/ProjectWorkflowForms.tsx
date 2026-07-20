import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageLoadingSpinner, StatCard, StatCardGrid } from "@/components/ui/blih";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { useClients } from "../../../hooks/useClients";
import { ProjectStatusBadge } from "../components/ProjectStatusBadge";
import { TaskList } from "../components/TaskList";
import { EmployeeSelect } from "../components/EmployeeSelect";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { ProjectTaskBoard } from "../components/ProjectTaskBoard";
import {
  useAddProjectMember,
  useArchiveProject,
  useChangeProjectStatus,
  useChangeProjectWorkflowFormStatus,
  useCreateProjectWorkflowForm,
  useProject,
  useProjectMembers,
  useProjectTasks,
  useProjectWorkflowCatalog,
  useProjectWorkflowForms,
  useUpdateProjectWorkflowForm,
  useUpdateProject
} from "../hooks";
import { PROJECT_STATUSES } from "../schemas";
import type { ProjectWorkflowForm, ProjectWorkflowFormDefinition } from "../types";

export function WorkflowFormsTab({
  label,
  groups,
  forms,
  catalog,
  tasks,
  canManage,
  isLoading,
  onCreate,
  onUpdate,
  onStatus,
}: {
  label: string;
  groups: ProjectWorkflowFormDefinition["group"][];
  forms: ProjectWorkflowForm[];
  catalog: ProjectWorkflowFormDefinition[];
  tasks: any[];
  canManage: boolean;
  isLoading: boolean;
  onCreate: (payload: any) => void;
  onUpdate: (formId: string, data: any) => void;
  onStatus: (formId: string, status: string) => void;
}) {
  const [formKey, setFormKey] = useState("");
  const [taskId, setTaskId] = useState("");
  const [draftData, setDraftData] = useState<Record<string, any>>({});
  const [editingData, setEditingData] = useState<Record<string, Record<string, any>>>({});
  const visibleCatalog = catalog.filter((form) => groups.includes(form.group));
  const visibleForms = forms.filter((form) => groups.includes(form.workflowGroup));
  const selectedDefinition = visibleCatalog.find((form) => form.key === formKey);

  const create = () => {
    if (!formKey) return;
    onCreate({
      formKey,
      taskId: selectedDefinition?.entity === "task" ? taskId || null : null,
      status: "draft",
      data: draftData,
      adapters: {
        crm: { enabled: false },
        finance: { enabled: false },
        hr: { enabled: false },
        performance: { enabled: false },
        brain: { enabled: false },
        n8n: { enabled: false },
      },
    });
    setDraftData({});
    setTaskId("");
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-sm font-black text-slate-900">{label}</h2>
          <p className="text-xs font-medium text-slate-500">Optional client workflow forms linked to this existing project record.</p>
        </div>
      </div>

      {canManage && (
        <div className="mb-5 grid gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 md:grid-cols-4">
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Form</span>
            <select value={formKey} onChange={(e) => setFormKey(e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Select workflow form</option>
              {visibleCatalog.map((form) => <option key={form.key} value={form.key}>{form.name}</option>)}
            </select>
          </label>
          {selectedDefinition?.entity === "task" && (
            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Task</span>
              <select value={taskId} onChange={(e) => setTaskId(e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <option value="">Link task</option>
                {tasks.map((task: any) => <option key={task.id} value={task.id}>{task.code || "Task"} - {task.title}</option>)}
              </select>
            </label>
          )}
          {selectedDefinition && <WorkflowSchemaFields definition={selectedDefinition} data={draftData} onChange={setDraftData} tasks={tasks} />}
          <div className="md:col-span-4 flex justify-end">
            <Button disabled={!formKey} onClick={create}><FileText className="h-4 w-4" /> Add Workflow Form</Button>
          </div>
        </div>
      )}

      {isLoading ? <PageLoadingSpinner label="Loading workflow forms" /> : visibleForms.length ? (
        <div className="divide-y divide-slate-100">
          {visibleForms.map((form) => (
            <div key={form.id} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{form.formName}</span>
                  <ProjectStatusBadge status={form.status.toUpperCase()} />
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {String(form.data?.title || form.data?.summary || "No form details added yet.")}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">
                  {form.task ? `Task: ${form.task.code || ""} ${form.task.title}` : form.milestone ? `Milestone: ${form.milestone.name}` : "Project-level form"}
                </p>
                {canManage && !["approved", "archived"].includes(form.status) && (
                  <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                    <WorkflowSchemaFields
                      definition={catalog.find((item) => item.key === form.formKey)}
                      data={editingData[form.id] ?? form.data ?? {}}
                      onChange={(next) => setEditingData((current) => ({ ...current, [form.id]: next }))}
                      tasks={tasks}
                    />
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" onClick={() => onUpdate(form.id, { data: editingData[form.id] ?? form.data ?? {} })}><Save className="h-4 w-4" /> Save</Button>
                    </div>
                  </div>
                )}
              </div>
              {canManage && form.status !== "archived" && (
                <div className="flex flex-wrap gap-2">
                  {nextWorkflowStatuses(form.status).map((status) => (
                    <Button key={status} variant="outline" onClick={() => onStatus(form.id, status)}>
                      {status.replace(/-/g, " ")}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={`No ${label.toLowerCase()} yet`} description="Optional client workflow forms added to this project will appear here." />
      )}
    </section>
  );
}

function nextWorkflowStatuses(status: string) {
  const transitions: Record<string, string[]> = {
    draft: ["submitted", "archived"],
    submitted: ["approved", "rejected", "returned-for-revision", "archived"],
    approved: ["archived"],
    rejected: ["returned-for-revision", "archived"],
    "returned-for-revision": ["draft", "submitted", "archived"],
  };
  return transitions[status] || [];
}

function WorkflowSchemaFields({
  definition,
  data,
  onChange,
  tasks,
}: {
  definition?: ProjectWorkflowFormDefinition;
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  tasks: any[];
}) {
  if (!definition?.schema) {
    return (
      <>
        <SchemaInput label="Title" value={data.title || ""} onChange={(value) => onChange({ ...data, title: value })} />
        <SchemaInput label="Summary" value={data.summary || ""} onChange={(value) => onChange({ ...data, summary: value })} />
      </>
    );
  }

  return (
    <>
      {Object.entries(definition.schema).map(([key, field]) => {
        if (field.type === "milestone-list") {
          const rows = Array.isArray(data[key]) ? data[key] : [];
          return <div key={key} className="md:col-span-4"><RepeatingRows label={field.label} rows={rows} onChange={(rows) => onChange({ ...data, [key]: rows })} kind="milestone" /></div>;
        }
        if (field.type === "task-list") {
          const rows = Array.isArray(data[key]) ? data[key] : [];
          return <div key={key} className="md:col-span-4"><RepeatingRows label={field.label} rows={rows} onChange={(rows) => onChange({ ...data, [key]: rows })} kind="task" tasks={tasks} /></div>;
        }
        if (field.type === "employee") {
          return (
            <div key={key}>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">{field.label}{field.required ? " *" : ""}</span>
                <EmployeeSelect value={data[key] || ""} onChange={(value) => onChange({ ...data, [key]: value || null })} placeholder={field.label} />
              </label>
            </div>
          );
        }
        if (field.type === "task") {
          return (
            <div key={key}>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">{field.label}{field.required ? " *" : ""}</span>
                <select value={data[key] || ""} onChange={(e) => onChange({ ...data, [key]: e.currentTarget.value || null })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                  <option value="">No linked task</option>
                  {tasks.map((task: any) => <option key={task.id} value={task.id}>{task.code || "Task"} - {task.title}</option>)}
                </select>
              </label>
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div key={key}>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">{field.label}{field.required ? " *" : ""}</span>
                <select value={data[key] || ""} onChange={(e) => onChange({ ...data, [key]: e.currentTarget.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                  <option value="">Select</option>
                  {(field.options || []).map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
                </select>
              </label>
            </div>
          );
        }
        return (
          <div key={key}>
            <SchemaInput
              label={`${field.label}${field.required ? " *" : ""}`}
              type={field.type}
              value={data[key] || ""}
              onChange={(value) => onChange({ ...data, [key]: value })}
            />
          </div>
        );
      })}
      {definition.approvalChain?.length ? (
        <div className="md:col-span-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">Approval: {definition.approvalChain.join(" -> ")}</div>
      ) : null}
    </>
  );
}

function SchemaInput({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (value: any) => void; type?: string }) {
  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 text-sm";
  return (
    <label className={type === "textarea" ? "md:col-span-2" : ""}>
      <span className="mb-1 block text-xs font-bold text-slate-600">{label}</span>
      {type === "textarea" ? (
        <textarea value={value} onChange={(e) => onChange(e.currentTarget.value)} className={`${inputClass} min-h-20 py-2`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.currentTarget.value)} type={type} className={`${inputClass} h-10`} />
      )}
    </label>
  );
}

function RepeatingRows({ label, rows, onChange, kind, tasks = [] }: { label: string; rows: any[]; onChange: (rows: any[]) => void; kind: "milestone" | "task"; tasks?: any[] }) {
  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const addRow = () => onChange([...rows, kind === "milestone" ? { name: "", dueDate: "", billingPercent: 0 } : { title: "", priority: "MEDIUM", dueDate: "" }]);
  return (
    <div className="md:col-span-4 rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-700">{label}</span>
        <Button variant="outline" onClick={addRow}>{kind === "milestone" ? "Add Milestone" : "Add Task"}</Button>
      </div>
      <div className="grid gap-2">
        {rows.map((row, index) => (
          <div key={index} className="grid gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-4">
            <input value={row.name || row.title || ""} onChange={(e) => updateRow(index, kind === "milestone" ? { name: e.currentTarget.value } : { title: e.currentTarget.value })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" placeholder={kind === "milestone" ? "Milestone name" : "Task title"} />
            {kind === "task" && (
              <select value={row.milestoneId || ""} onChange={(e) => updateRow(index, { milestoneId: e.currentTarget.value || null })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">No linked milestone</option>
                {tasks.map((task: any) => task.milestoneId && <option key={task.milestoneId} value={task.milestoneId}>{task.milestone?.name || task.milestoneId}</option>)}
              </select>
            )}
            <input value={row.dueDate || ""} onChange={(e) => updateRow(index, { dueDate: e.currentTarget.value })} type="date" className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
            {kind === "milestone" ? (
              <input value={row.billingPercent || ""} onChange={(e) => updateRow(index, { billingPercent: e.currentTarget.value })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Billing %" />
            ) : (
              <EmployeeSelect value={row.assigneeEmployeeId || ""} onChange={(value) => updateRow(index, { assigneeEmployeeId: value || null })} placeholder="Assignee" />
            )}
            <button onClick={() => onChange(rows.filter((_, i) => i !== index))} className="h-9 rounded-lg bg-slate-200 px-3 text-xs font-bold text-slate-700">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

