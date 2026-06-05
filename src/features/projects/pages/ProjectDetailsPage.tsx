import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageLoadingSpinner, StatCard, StatCardGrid } from "@/components/ui/blih";
import { useMyPermissions } from "../../../hooks/usePermissions";
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

type DetailTab = "overview" | "tasks" | "team" | "setup" | "deliverables" | "changes" | "issues" | "closure" | "lessons" | "evaluations" | "activity" | "settings";

const WORKFLOW_TABS: Array<{ tab: DetailTab; label: string; groups: ProjectWorkflowFormDefinition["group"][] }> = [
  { tab: "setup", label: "Setup Forms", groups: ["setup", "milestones", "tasks"] },
  { tab: "deliverables", label: "Deliverables", groups: ["deliverables"] },
  { tab: "changes", label: "Changes", groups: ["change_requests"] },
  { tab: "issues", label: "Issues & Risks", groups: ["issues", "risks"] },
  { tab: "closure", label: "Closure", groups: ["closure"] },
  { tab: "lessons", label: "Lessons", groups: ["lessons"] },
  { tab: "evaluations", label: "Evaluations", groups: ["evaluations"] },
];

export default function ProjectDetailsPage({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [memberEmployeeId, setMemberEmployeeId] = useState("");
  const [settings, setSettings] = useState<any>({});
  const perms = useMyPermissions();
  const project = useProject(projectId);
  const tasks = useProjectTasks(projectId);
  const members = useProjectMembers(projectId);
  const updateProject = useUpdateProject();
  const archiveProject = useArchiveProject();
  const changeStatus = useChangeProjectStatus();
  const addMember = useAddProjectMember(projectId);
  const workflowCatalog = useProjectWorkflowCatalog();
  const workflowForms = useProjectWorkflowForms(projectId);
  const createWorkflowForm = useCreateProjectWorkflowForm(projectId);
  const updateWorkflowForm = useUpdateProjectWorkflowForm(projectId);
  const changeWorkflowStatus = useChangeProjectWorkflowFormStatus(projectId);

  if (!perms.isLoading && !perms.hasAny("project.read", "project.manage", "project.self")) {
    return <main className="h-full overflow-y-auto bg-[#f8fafc] p-8"><EmptyState title="Project unavailable" description="Your role does not currently include project access." /></main>;
  }
  if (project.isLoading) return <PageLoadingSpinner label="Loading project" />;
  if (project.isError || !project.data) return <div className="p-8"><EmptyState title="Project unavailable" description="The project could not be loaded." /></div>;

  const p = project.data;
  const progressPercent = p.progressPercent ?? p.metadata?.progress?.progressPercent ?? 0;
  const taskRows = tasks.data?.rows ?? [];
  const memberRows = members.data ?? p.members ?? [];
  const activeTasks = taskRows.filter((t) => t.status !== "CANCELLED").length;
  const doneTasks = taskRows.filter((t) => t.status === "DONE").length;

  const saveSettings = async () => {
    await updateProject.mutateAsync({ id: projectId, data: settings });
    setSettings({});
  };

  return (
    <main className="h-full overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-950">{p.title}</h1>
                <ProjectStatusBadge status={p.status} />
                <ProjectStatusBadge status={p.priority} />
              </div>
              <p className="mt-1 text-sm font-medium text-slate-500">{p.code || "No code"} · {p.startDate || "No start"} - {p.endDate || "No end"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={p.status} onChange={(e) => changeStatus.mutate({ id: projectId, status: e.target.value })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold">
                {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
              {perms.hasAny("project.manage") && <Button variant="outline" onClick={() => archiveProject.mutate(projectId)}><Archive className="h-4 w-4" /> Archive</Button>}
            </div>
          </div>

          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {(["overview", "tasks", "team", "setup", "deliverables", "changes", "issues", "closure", "lessons", "evaluations", "activity", "settings"] as DetailTab[]).map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${tab === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {WORKFLOW_TABS.find((w) => w.tab === item)?.label || item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" && (
          <>
            <StatCardGrid>
              <StatCard label="Progress" value={`${progressPercent}%`} tone="blue" />
              <StatCard label="Tasks" value={activeTasks} tone="violet" />
              <StatCard label="Done" value={doneTasks} tone="emerald" />
              <StatCard label="Team" value={memberRows.length} tone="amber" />
            </StatCardGrid>
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-black text-slate-900">Project Details</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div><dt className="text-xs font-bold text-slate-400">Owner</dt><dd className="font-semibold text-slate-700">{p.owner?.user?.fullName || "Unassigned"}</dd></div>
                  <div><dt className="text-xs font-bold text-slate-400">Manager</dt><dd className="font-semibold text-slate-700">{p.manager?.user?.fullName || "Unassigned"}</dd></div>
                  <div><dt className="text-xs font-bold text-slate-400">Description</dt><dd className="text-slate-600">{p.description || "No description"}</dd></div>
                </dl>
              </section>
              <section className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-sm font-black text-slate-900">Recent Tasks</h2>
                {taskRows.length ? <TaskList tasks={taskRows.slice(0, 5)} /> : <EmptyState title="No tasks yet" description="Tasks added to this project will appear here." />}
              </section>
            </div>
          </>
        )}

        {tab === "tasks" && (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Tasks</h2>
                <p className="text-xs font-medium text-slate-500">Create and track work for this project.</p>
              </div>
              {perms.hasAny("project.manage") && <CreateTaskModal projectId={projectId} />}
            </div>
            {tasks.isLoading ? <PageLoadingSpinner label="Loading tasks" /> : <ProjectTaskBoard projectId={projectId} tasks={taskRows} canMove={perms.hasAny("project.manage")} />}
          </section>
        )}

        {tab === "team" && (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
              <label className="flex-1">
                <span className="mb-1 block text-xs font-bold text-slate-600">Add member</span>
                <EmployeeSelect value={memberEmployeeId} onChange={setMemberEmployeeId} placeholder="Select team member" />
              </label>
              {perms.hasAny("project.manage") && <Button disabled={!memberEmployeeId || addMember.isPending} onClick={() => addMember.mutate({ employeeId: memberEmployeeId, role: "MEMBER" } as any)}>Add Member</Button>}
            </div>
            <div className="divide-y divide-slate-100">
              {memberRows.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div><div className="text-sm font-bold text-slate-800">{m.employee?.user?.fullName || m.employeeId}</div><div className="text-xs text-slate-500">{m.employee?.user?.email || "Team member"}</div></div>
                  <ProjectStatusBadge status={m.role} />
                </div>
              ))}
              {!memberRows.length && <EmptyState title="No team members" description="Owner, manager, and members will appear here." />}
            </div>
          </section>
        )}

        {WORKFLOW_TABS.map((workflowTab) => tab === workflowTab.tab && (
          <div key={workflowTab.tab}>
            <WorkflowFormsTab
              label={workflowTab.label}
              groups={workflowTab.groups}
              forms={workflowForms.data ?? []}
              catalog={workflowCatalog.data ?? []}
              tasks={taskRows}
              canManage={perms.hasAny("project.manage")}
              isLoading={workflowForms.isLoading || workflowCatalog.isLoading}
              onCreate={(payload) => createWorkflowForm.mutate(payload)}
              onUpdate={(formId, data) => updateWorkflowForm.mutate({ formId, data })}
              onStatus={(formId, status) => changeWorkflowStatus.mutate({ formId, status })}
            />
          </div>
        ))}

        {tab === "activity" && <EmptyState title="No activity yet" description="Project activity will appear here when tasks, comments, and team changes are recorded." />}

        {tab === "settings" && (perms.hasAny("project.manage") ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Name</span><input defaultValue={p.title} onChange={(e) => setSettings((s: any) => ({ ...s, title: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Priority</span><select defaultValue={p.priority || "NORMAL"} onChange={(e) => setSettings((s: any) => ({ ...s, priority: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Owner</span><EmployeeSelect value={settings.ownerEmployeeId ?? p.ownerEmployeeId ?? ""} onChange={(v) => setSettings((s: any) => ({ ...s, ownerEmployeeId: v }))} /></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Manager</span><EmployeeSelect value={settings.managerEmployeeId ?? p.managerEmployeeId ?? ""} onChange={(v) => setSettings((s: any) => ({ ...s, managerEmployeeId: v }))} /></label>
            </div>
            <div className="mt-4"><Button onClick={saveSettings} disabled={updateProject.isPending}><Save className="h-4 w-4" /> Save Changes</Button></div>
          </section>
        ) : <EmptyState title="Settings unavailable" description="Your role can view this project but cannot edit project settings." />)}
      </div>
    </main>
  );
}

function WorkflowFormsTab({
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
            <select value={formKey} onChange={(e) => setFormKey(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
              <option value="">Select workflow form</option>
              {visibleCatalog.map((form) => <option key={form.key} value={form.key}>{form.name}</option>)}
            </select>
          </label>
          {selectedDefinition?.entity === "task" && (
            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Task</span>
              <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
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
                <select value={data[key] || ""} onChange={(e) => onChange({ ...data, [key]: e.target.value || null })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
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
                <select value={data[key] || ""} onChange={(e) => onChange({ ...data, [key]: e.target.value })} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
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
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} min-h-20 py-2`} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} type={type} className={`${inputClass} h-10`} />
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
            <input value={row.name || row.title || ""} onChange={(e) => updateRow(index, kind === "milestone" ? { name: e.target.value } : { title: e.target.value })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" placeholder={kind === "milestone" ? "Milestone name" : "Task title"} />
            {kind === "task" && (
              <select value={row.milestoneId || ""} onChange={(e) => updateRow(index, { milestoneId: e.target.value || null })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm">
                <option value="">No linked milestone</option>
                {tasks.map((task: any) => task.milestoneId && <option key={task.milestoneId} value={task.milestoneId}>{task.milestone?.name || task.milestoneId}</option>)}
              </select>
            )}
            <input value={row.dueDate || ""} onChange={(e) => updateRow(index, { dueDate: e.target.value })} type="date" className="h-9 rounded-lg border border-slate-200 px-3 text-sm" />
            {kind === "milestone" ? (
              <input value={row.billingPercent || ""} onChange={(e) => updateRow(index, { billingPercent: e.target.value })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm" placeholder="Billing %" />
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
