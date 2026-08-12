import { useState, type ReactNode } from "react";
import { FileText, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageLoadingSpinner } from "@/components/ui/blih";
import { ProjectStatusBadge } from "../components/ProjectStatusBadge";
import { EmployeeSelect } from "../components/EmployeeSelect";
import type { ProjectWorkflowForm, ProjectWorkflowFormDefinition } from "../types";

const NONE = "__none__";
function FieldLabel({ children }: { children: ReactNode }) { return <span className="mb-1.5 block text-xs text-muted-foreground">{children}</span>; }

export function WorkflowFormsTab({ label, groups, forms, catalog, tasks, canManage, isLoading, onCreate, onUpdate, onStatus }: {
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
    onCreate({ formKey, taskId: selectedDefinition?.entity === "task" ? taskId || null : null, status: "draft", data: draftData, adapters: { crm: { enabled: false }, finance: { enabled: false }, hr: { enabled: false }, performance: { enabled: false }, brain: { enabled: false }, n8n: { enabled: false } } });
    setDraftData({}); setTaskId("");
  };

  return (
    <Card className="rounded-md shadow-none" size="sm">
      <CardHeader className="border-b"><CardTitle>{label}</CardTitle><p className="text-xs text-muted-foreground">Optional client workflow forms linked to this project.</p></CardHeader>
      <CardContent className="space-y-4">
        {canManage ? <Card className="rounded-md bg-muted/20 shadow-none" size="sm"><CardContent className="grid gap-3 md:grid-cols-4">
          <label><FieldLabel>Form</FieldLabel><Select value={formKey || NONE} onValueChange={(value) => setFormKey(value === NONE ? "" : String(value ?? ""))}><SelectTrigger className="w-full" aria-label="Workflow form"><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectItem value={NONE}>Select workflow form</SelectItem>{visibleCatalog.map((form) => <SelectItem key={form.key} value={form.key}>{form.name}</SelectItem>)}</SelectContent></Select></label>
          {selectedDefinition?.entity === "task" ? <label><FieldLabel>Task</FieldLabel><Select value={taskId || NONE} onValueChange={(value) => setTaskId(value === NONE ? "" : String(value ?? ""))}><SelectTrigger className="w-full" aria-label="Linked task"><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectItem value={NONE}>Link task</SelectItem>{tasks.map((task: any) => <SelectItem key={task.id} value={task.id}>{task.code || "Task"} - {task.title}</SelectItem>)}</SelectContent></Select></label> : null}
          {selectedDefinition ? <WorkflowSchemaFields definition={selectedDefinition} data={draftData} onChange={setDraftData} tasks={tasks} /> : null}
          <div className="flex justify-end md:col-span-4"><Button size="sm" disabled={!formKey} onClick={create}><FileText />Add workflow form</Button></div>
        </CardContent></Card> : null}

        {isLoading ? <PageLoadingSpinner label="Loading workflow forms" /> : visibleForms.length ? <div className="divide-y divide-border rounded-md border">{visibleForms.map((form) => <div key={form.id} className="flex flex-col gap-3 p-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium text-foreground">{form.formName}</span><ProjectStatusBadge status={form.status.toUpperCase()} /></div><p className="mt-1 text-xs text-muted-foreground">{String(form.data?.title || form.data?.summary || "No form details added yet.")}</p><p className="mt-1 text-xs text-muted-foreground/80">{form.task ? `Task: ${form.task.code || ""} ${form.task.title}` : form.milestone ? `Milestone: ${form.milestone.name}` : "Project-level form"}</p>
            {canManage && !["approved", "archived"].includes(form.status) ? <Card className="mt-3 rounded-md bg-muted/20 shadow-none" size="sm"><CardContent><div className="grid gap-3 md:grid-cols-4"><WorkflowSchemaFields definition={catalog.find((item) => item.key === form.formKey)} data={editingData[form.id] ?? form.data ?? {}} onChange={(next) => setEditingData((current) => ({ ...current, [form.id]: next }))} tasks={tasks} /></div><div className="mt-3 flex justify-end"><Button size="sm" variant="outline" onClick={() => onUpdate(form.id, { data: editingData[form.id] ?? form.data ?? {} })}><Save />Save</Button></div></CardContent></Card> : null}
          </div>
          {canManage && form.status !== "archived" ? <div className="flex flex-wrap gap-2">{nextWorkflowStatuses(form.status).map((status) => <Button key={status} size="sm" variant="outline" onClick={() => onStatus(form.id, status)}>{status.replace(/-/g, " ")}</Button>)}</div> : null}
        </div>)}</div> : <EmptyState title={`No ${label.toLowerCase()} yet`} description="Optional client workflow forms added to this project will appear here." />}
      </CardContent>
    </Card>
  );
}

function nextWorkflowStatuses(status: string) {
  const transitions: Record<string, string[]> = { draft: ["submitted", "archived"], submitted: ["approved", "rejected", "returned-for-revision", "archived"], approved: ["archived"], rejected: ["returned-for-revision", "archived"], "returned-for-revision": ["draft", "submitted", "archived"] };
  return transitions[status] || [];
}

function WorkflowSchemaFields({ definition, data, onChange, tasks }: { definition?: ProjectWorkflowFormDefinition; data: Record<string, any>; onChange: (data: Record<string, any>) => void; tasks: any[] }) {
  if (!definition?.schema) return <><SchemaInput label="Title" value={data.title || ""} onChange={(value) => onChange({ ...data, title: value })} /><SchemaInput label="Summary" value={data.summary || ""} onChange={(value) => onChange({ ...data, summary: value })} /></>;
  return <>{Object.entries(definition.schema).map(([key, field]) => {
    if (field.type === "milestone-list") { const rows = Array.isArray(data[key]) ? data[key] : []; return <div key={key} className="md:col-span-4"><RepeatingRows label={field.label} rows={rows} onChange={(nextRows) => onChange({ ...data, [key]: nextRows })} kind="milestone" /></div>; }
    if (field.type === "task-list") { const rows = Array.isArray(data[key]) ? data[key] : []; return <div key={key} className="md:col-span-4"><RepeatingRows label={field.label} rows={rows} onChange={(nextRows) => onChange({ ...data, [key]: nextRows })} kind="task" tasks={tasks} /></div>; }
    if (field.type === "employee") return <label key={key}><FieldLabel>{field.label}{field.required ? " *" : ""}</FieldLabel><EmployeeSelect value={data[key] || ""} onChange={(value) => onChange({ ...data, [key]: value || null })} placeholder={field.label} /></label>;
    if (field.type === "task") return <label key={key}><FieldLabel>{field.label}{field.required ? " *" : ""}</FieldLabel><Select value={data[key] || NONE} onValueChange={(value) => onChange({ ...data, [key]: value === NONE ? null : value })}><SelectTrigger className="w-full" aria-label={field.label}><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectItem value={NONE}>No linked task</SelectItem>{tasks.map((task: any) => <SelectItem key={task.id} value={task.id}>{task.code || "Task"} - {task.title}</SelectItem>)}</SelectContent></Select></label>;
    if (field.type === "select") return <label key={key}><FieldLabel>{field.label}{field.required ? " *" : ""}</FieldLabel><Select value={data[key] || NONE} onValueChange={(value) => onChange({ ...data, [key]: value === NONE ? "" : value })}><SelectTrigger className="w-full" aria-label={field.label}><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectItem value={NONE}>Select</SelectItem>{(field.options || []).map((option) => <SelectItem key={option} value={option}>{option.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></label>;
    return <SchemaInput key={key} label={`${field.label}${field.required ? " *" : ""}`} type={field.type} value={data[key] || ""} onChange={(value) => onChange({ ...data, [key]: value })} />;
  })}{definition.approvalChain?.length ? <div className="text-xs text-muted-foreground md:col-span-4">Approval: {definition.approvalChain.join(" → ")}</div> : null}</>;
}

function SchemaInput({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (value: any) => void; type?: string }) {
  return <label className={type === "textarea" ? "md:col-span-2" : ""}><FieldLabel>{label}</FieldLabel>{type === "textarea" ? <Textarea value={value} onChange={(event) => onChange(event.currentTarget.value)} className="min-h-20" /> : <Input value={value} onChange={(event) => onChange(event.currentTarget.value)} type={type} />}</label>;
}

function RepeatingRows({ label, rows, onChange, kind, tasks = [] }: { label: string; rows: any[]; onChange: (rows: any[]) => void; kind: "milestone" | "task"; tasks?: any[] }) {
  const updateRow = (index: number, patch: Record<string, any>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  const addRow = () => onChange([...rows, kind === "milestone" ? { name: "", dueDate: "", billingPercent: 0 } : { title: "", priority: "MEDIUM", dueDate: "" }]);
  const milestoneOptions = Array.from(new Map(tasks.filter((task: any) => task.milestoneId).map((task: any) => [task.milestoneId, task.milestone?.name || task.milestoneId])).entries());
  return <Card className="rounded-md bg-background shadow-none" size="sm"><CardHeader className="border-b"><CardTitle>{label}</CardTitle><div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end"><Button size="sm" variant="outline" onClick={addRow}>{kind === "milestone" ? "Add milestone" : "Add task"}</Button></div></CardHeader><CardContent className="space-y-2">{rows.map((row, index) => <div key={index} className="grid gap-2 rounded-md border bg-muted/20 p-2 md:grid-cols-4">
    <Input value={row.name || row.title || ""} onChange={(event) => updateRow(index, kind === "milestone" ? { name: event.currentTarget.value } : { title: event.currentTarget.value })} placeholder={kind === "milestone" ? "Milestone name" : "Task title"} />
    {kind === "task" ? <Select value={row.milestoneId || NONE} onValueChange={(value) => updateRow(index, { milestoneId: value === NONE ? null : value })}><SelectTrigger className="w-full" aria-label="Linked milestone"><SelectValue /></SelectTrigger><SelectContent alignItemWithTrigger={false}><SelectItem value={NONE}>No linked milestone</SelectItem>{milestoneOptions.map(([id, name]) => <SelectItem key={String(id)} value={String(id)}>{String(name)}</SelectItem>)}</SelectContent></Select> : null}
    <Input value={row.dueDate || ""} onChange={(event) => updateRow(index, { dueDate: event.currentTarget.value })} type="date" />
    {kind === "milestone" ? <Input value={row.billingPercent || ""} onChange={(event) => updateRow(index, { billingPercent: event.currentTarget.value })} placeholder="Billing %" /> : <EmployeeSelect value={row.assigneeEmployeeId || ""} onChange={(value) => updateRow(index, { assigneeEmployeeId: value || null })} placeholder="Assignee" />}
    <Button size="sm" variant="ghost" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} className="justify-self-start text-destructive hover:text-destructive md:justify-self-end"><Trash2 />Remove</Button>
  </div>)}</CardContent></Card>;
}
