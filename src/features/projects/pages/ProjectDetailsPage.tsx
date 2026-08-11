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
import type { ProjectWorkflowFormDefinition } from "../types";
import { WorkflowFormsTab } from "./ProjectWorkflowForms";

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
  const [issuedCredentials, setIssuedCredentials] = useState<{ email: string; password: string | null; portalUrl: string } | null>(null);
  const perms = useMyPermissions();
  const clients = useClients();
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

  const canManageProjects = perms.hasAny("project.manage");
  const canWorkTasks = perms.hasAny("project.task", "project.manage");

  const updateSetting = (key: string, value: unknown) => {
    setSettings((previous: any) => ({ ...previous, [key]: value }));
  };

  const updateNewClientField = (
    stateKey: "clientCompanyName" | "clientContactName" | "clientEmail" | "clientPhone",
    clientKey: "companyName" | "contactName" | "email" | "phone",
    value: string,
  ) => {
    setSettings((previous: any) => ({
      ...previous,
      [stateKey]: value,
      newClient:
        previous.clientMode === "new" || stateKey === "clientCompanyName" || stateKey === "clientContactName"
          ? { ...(previous.newClient || {}), [clientKey]: value }
          : previous.newClient,
    }));
  };

  if (!perms.isLoading && !perms.hasAny("project.read", "project.manage", "project.self", "project.task")) {
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
    const selectedClient = clients.data?.find((client) => client.id === (settings.clientId ?? p.clientId));
    const payload = {
      ...settings,
      clientPortalUser: settings.issueClientLogin ? {
        fullName: settings.clientContactName || settings.clientCompanyName || selectedClient?.contactName || selectedClient?.companyName || undefined,
        email: settings.clientEmail || selectedClient?.email || undefined,
        phone: settings.clientPhone || selectedClient?.phone || undefined,
        password: settings.clientPassword || undefined,
      } : undefined,
    };
    delete (payload as any).clientMode;
    delete (payload as any).clientCompanyName;
    delete (payload as any).clientContactName;
    delete (payload as any).clientEmail;
    delete (payload as any).clientPhone;
    delete (payload as any).clientPassword;
    delete (payload as any).issueClientLogin;
    if (settings.clientMode !== "new") delete (payload as any).newClient;
    if (settings.clientMode === "new") delete (payload as any).clientId;
    if (!settings.issueClientLogin) delete (payload as any).clientPortalUser;
    const updated: any = await updateProject.mutateAsync({ id: projectId, data: payload });
    if (updated?.clientPortalUser?.email) {
      setIssuedCredentials({
        email: updated.clientPortalUser.email,
        password: updated.clientPortalUser.temporaryPassword || settings.clientPassword || null,
        portalUrl: `${window.location.origin}/client-portal`,
      });
    }
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
              {canManageProjects && (
                <select value={p.status} onChange={(e) => changeStatus.mutate({ id: projectId, status: e.currentTarget.value })} className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold">
                  {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                </select>
              )}
              {canManageProjects && <Button variant="outline" onClick={() => archiveProject.mutate(projectId)}><Archive className="h-4 w-4" /> Archive</Button>}
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
              {canWorkTasks && <CreateTaskModal projectId={projectId} />}
            </div>
            {tasks.isLoading ? <PageLoadingSpinner label="Loading tasks" /> : <ProjectTaskBoard projectId={projectId} tasks={taskRows} canMove={canWorkTasks} />}
          </section>
        )}

        {tab === "team" && (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
              <label className="flex-1">
                <span className="mb-1 block text-xs font-bold text-slate-600">Add member</span>
                <EmployeeSelect value={memberEmployeeId} onChange={setMemberEmployeeId} placeholder="Select team member" />
              </label>
              {canManageProjects && <Button disabled={!memberEmployeeId || addMember.isPending} onClick={() => addMember.mutate({ employeeId: memberEmployeeId, role: "MEMBER" } as any)}>Add Member</Button>}
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
              canManage={canManageProjects}
              isLoading={workflowForms.isLoading || workflowCatalog.isLoading}
              onCreate={(payload) => createWorkflowForm.mutate(payload)}
              onUpdate={(formId, data) => updateWorkflowForm.mutate({ formId, data })}
              onStatus={(formId, status) => changeWorkflowStatus.mutate({ formId, status })}
            />
          </div>
        ))}

        {tab === "activity" && <EmptyState title="No activity yet" description="Project activity will appear here when tasks, comments, and team changes are recorded." />}

        {tab === "settings" && (canManageProjects ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Name</span><input defaultValue={p.title} onChange={(e) => updateSetting("title", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Priority</span><select defaultValue={p.priority || "NORMAL"} onChange={(e) => updateSetting("priority", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Owner</span><EmployeeSelect value={settings.ownerEmployeeId ?? p.ownerEmployeeId ?? ""} onChange={(v) => updateSetting("ownerEmployeeId", v)} /></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Manager</span><EmployeeSelect value={settings.managerEmployeeId ?? p.managerEmployeeId ?? ""} onChange={(v) => updateSetting("managerEmployeeId", v)} /></label>
              <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-500">Client portal</span>
                  <button type="button" onClick={() => setSettings((s: any) => ({ ...s, clientMode: "existing", newClient: undefined }))} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${(settings.clientMode || "existing") === "existing" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>Existing client</button>
                  <button type="button" onClick={() => setSettings((s: any) => ({ ...s, clientMode: "new", clientId: undefined }))} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${settings.clientMode === "new" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>New client</button>
                </div>
                {(settings.clientMode || "existing") === "existing" ? (
                  <label>
                    <span className="mb-1 block text-xs font-bold text-slate-600">Linked client</span>
                    <select value={settings.clientId ?? p.clientId ?? ""} onChange={(e) => updateSetting("clientId", e.currentTarget.value || null)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                      <option value="">No client linked</option>
                      {(clients.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}
                    </select>
                  </label>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="mb-1 block text-xs font-bold text-slate-600">Company</span>
                      <input value={settings.clientCompanyName || ""} onChange={(e) => updateNewClientField("clientCompanyName", "companyName", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs font-bold text-slate-600">Contact</span>
                      <input value={settings.clientContactName || ""} onChange={(e) => updateNewClientField("clientContactName", "contactName", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                    </label>
                  </div>
                )}
                <label className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={Boolean(settings.issueClientLogin)} onChange={(e) => updateSetting("issueClientLogin", e.currentTarget.checked)} />
                  Create or reset client portal login
                </label>
                {settings.issueClientLogin && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <input placeholder="Client email" value={settings.clientEmail || ""} onChange={(e) => updateNewClientField("clientEmail", "email", e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                    <input placeholder="Client phone" value={settings.clientPhone || ""} onChange={(e) => updateNewClientField("clientPhone", "phone", e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                    <input placeholder="New password" value={settings.clientPassword || ""} onChange={(e) => updateSetting("clientPassword", e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                  </div>
                )}
                {issuedCredentials && (
                  <div className="mt-3 grid gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm sm:grid-cols-3">
                    <div><span className="block text-xs font-black text-emerald-700">Email</span><span className="font-semibold text-emerald-900">{issuedCredentials.email}</span></div>
                    <div><span className="block text-xs font-black text-emerald-700">Password</span><span className="font-semibold text-emerald-900">{issuedCredentials.password || "Existing password"}</span></div>
                    <div><span className="block text-xs font-black text-emerald-700">Login URL</span><span className="font-semibold text-emerald-900">{issuedCredentials.portalUrl}</span></div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4"><Button onClick={saveSettings} disabled={updateProject.isPending}><Save className="h-4 w-4" /> Save Changes</Button></div>
          </section>
        ) : <EmptyState title="Settings unavailable" description="Your role can view this project but cannot edit project settings." />)}
      </div>
    </main>
  );
}
