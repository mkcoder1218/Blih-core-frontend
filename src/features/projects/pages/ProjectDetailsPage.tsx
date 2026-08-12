import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Archive, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageLoadingSpinner } from "@/components/ui/blih";
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
  useUpdateProject,
} from "../hooks";
import { PROJECT_STATUSES } from "../schemas";
import { getProjectKanbanColumns } from "../kanban";
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

const CORE_TABS: Array<{ tab: DetailTab; label: string }> = [
  { tab: "overview", label: "Overview" },
  { tab: "tasks", label: "Tasks" },
  { tab: "team", label: "Team" },
  { tab: "activity", label: "Activity" },
];

const MORE_TABS: Array<{ tab: DetailTab; label: string }> = [
  ...WORKFLOW_TABS.map((item) => ({ tab: item.tab, label: item.label })),
  { tab: "settings", label: "Settings" },
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
    return <main className="h-full overflow-y-auto bg-[#f8fafc] p-6"><EmptyState title="Project unavailable" description="Your role does not currently include project access." /></main>;
  }
  if (project.isLoading) return <PageLoadingSpinner label="Loading project" />;
  if (project.isError || !project.data) return <div className="p-6"><EmptyState title="Project unavailable" description="The project could not be loaded." /></div>;

  const p = project.data;
  const progressPercent = p.progressPercent ?? p.metadata?.progress?.progressPercent ?? 0;
  const taskRows = tasks.data?.rows ?? [];
  const memberRows = members.data ?? p.members ?? [];
  const activeTasks = taskRows.filter((task) => task.status !== "CANCELLED" && task.status !== "DONE").length;
  const doneTasks = taskRows.filter((task) => task.status === "DONE").length;
  const blockedTasks = taskRows.filter((task) => task.status === "BLOCKED").length;
  const kanbanColumns = getProjectKanbanColumns(p);
  const selectedMoreTab = MORE_TABS.some((item) => item.tab === tab) ? tab : "";

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
    <main className="h-full overflow-y-auto bg-[#f8fafc] p-3 lg:p-4">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <header className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            <button onClick={() => navigate(-1)} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-[220px] flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className="max-w-[520px] truncate text-base font-black text-slate-950" title={p.title}>{p.title}</h1>
                <ProjectStatusBadge status={p.status} />
                <ProjectStatusBadge status={p.priority} />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-semibold text-slate-400">
                <span>{p.code || "No code"}</span><span>•</span><span>{p.startDate || "No start"} → {p.endDate || "No end"}</span>
              </div>
            </div>

            <div className="hidden min-w-[150px] items-center gap-2 lg:flex">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} /></div>
              <span className="w-8 text-right text-[10px] font-black text-slate-500">{progressPercent}%</span>
            </div>

            {canManageProjects && (
              <select value={p.status} onChange={(event) => changeStatus.mutate({ id: projectId, status: event.currentTarget.value })} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700">
                {PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
              </select>
            )}
            {canManageProjects && <Button variant="outline" size="sm" onClick={() => archiveProject.mutate(projectId)}><Archive className="h-4 w-4" /> Archive</Button>}
          </div>

          <nav className="mt-2 flex items-center gap-1 border-t border-slate-100 pt-2" aria-label="Project sections">
            {CORE_TABS.map((item) => (
              <button key={item.tab} type="button" onClick={() => setTab(item.tab)} className={`h-8 rounded-md px-3 text-[11px] font-bold transition ${tab === item.tab ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                {item.label}
              </button>
            ))}
            <select
              aria-label="More project sections"
              value={selectedMoreTab}
              onChange={(event) => event.currentTarget.value && setTab(event.currentTarget.value as DetailTab)}
              className={`h-8 rounded-md border px-2 text-[11px] font-bold outline-none ${selectedMoreTab ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600"}`}
            >
              <option value="">More</option>
              {MORE_TABS.map((item) => <option key={item.tab} value={item.tab}>{item.label}</option>)}
            </select>
          </nav>
        </header>

        {tab === "overview" && (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Progress", `${progressPercent}%`],
                ["Active tasks", activeTasks],
                ["Blocked", blockedTasks],
                ["Team", memberRows.length],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-md border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</div>
                  <div className="mt-0.5 text-lg font-black text-slate-950">{value}</div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              <section className="rounded-lg border border-slate-200 bg-white p-3">
                <h2 className="text-xs font-black text-slate-900">Project Details</h2>
                <dl className="mt-3 grid gap-2.5 text-sm">
                  <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Owner</dt><dd className="font-semibold text-slate-700">{p.owner?.user?.fullName || "Unassigned"}</dd></div>
                  <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Manager</dt><dd className="font-semibold text-slate-700">{p.manager?.user?.fullName || "Unassigned"}</dd></div>
                  <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Description</dt><dd className="text-sm leading-5 text-slate-600">{p.description || "No description"}</dd></div>
                </dl>
              </section>
              <section className="rounded-lg border border-slate-200 bg-white p-3">
                <h2 className="mb-2 text-xs font-black text-slate-900">Recent Tasks</h2>
                {taskRows.length ? <TaskList tasks={taskRows.slice(0, 5)} /> : <EmptyState title="No tasks yet" description="Tasks added to this project will appear here." />}
              </section>
            </div>
          </>
        )}

        {tab === "tasks" && (
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Tasks</h2>
                <p className="text-[11px] font-medium text-slate-500">Create, discuss and move work through this project&apos;s workflow.</p>
              </div>
              {canWorkTasks && <CreateTaskModal projectId={projectId} columns={kanbanColumns} />}
            </div>
            {tasks.isLoading ? <PageLoadingSpinner label="Loading tasks" /> : <ProjectTaskBoard project={p} tasks={taskRows} canMove={canWorkTasks} canManage={canManageProjects} />}
          </section>
        )}

        {tab === "team" && (
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end">
              <label className="flex-1">
                <span className="mb-1 block text-xs font-bold text-slate-600">Add member</span>
                <EmployeeSelect value={memberEmployeeId} onChange={setMemberEmployeeId} placeholder="Select team member" />
              </label>
              {canManageProjects && <Button size="sm" disabled={!memberEmployeeId || addMember.isPending} onClick={() => addMember.mutate({ employeeId: memberEmployeeId, role: "MEMBER" } as any)}>Add Member</Button>}
            </div>
            <div className="divide-y divide-slate-100">
              {memberRows.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between py-2.5">
                  <div><div className="text-sm font-bold text-slate-800">{member.employee?.user?.fullName || member.employeeId}</div><div className="text-[11px] text-slate-500">{member.employee?.user?.email || "Team member"}</div></div>
                  <ProjectStatusBadge status={member.role} />
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

        {tab === "activity" && <div className="rounded-lg border border-slate-200 bg-white p-3"><EmptyState title="No activity yet" description="Project activity will appear here when tasks, comments, and team changes are recorded." /></div>}

        {tab === "settings" && (canManageProjects ? (
          <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Name</span><input defaultValue={p.title} onChange={(event) => updateSetting("title", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm" /></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Priority</span><select defaultValue={p.priority || "NORMAL"} onChange={(event) => updateSetting("priority", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Owner</span><EmployeeSelect value={settings.ownerEmployeeId ?? p.ownerEmployeeId ?? ""} onChange={(value) => updateSetting("ownerEmployeeId", value)} /></label>
              <label><span className="mb-1 block text-xs font-bold text-slate-600">Manager</span><EmployeeSelect value={settings.managerEmployeeId ?? p.managerEmployeeId ?? ""} onChange={(value) => updateSetting("managerEmployeeId", value)} /></label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-500">Client portal</span>
                  <button type="button" onClick={() => setSettings((state: any) => ({ ...state, clientMode: "existing", newClient: undefined }))} className={`rounded-md px-3 py-1.5 text-xs font-bold ${(settings.clientMode || "existing") === "existing" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>Existing client</button>
                  <button type="button" onClick={() => setSettings((state: any) => ({ ...state, clientMode: "new", clientId: undefined }))} className={`rounded-md px-3 py-1.5 text-xs font-bold ${settings.clientMode === "new" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>New client</button>
                </div>
                {(settings.clientMode || "existing") === "existing" ? (
                  <label>
                    <span className="mb-1 block text-xs font-bold text-slate-600">Linked client</span>
                    <select value={settings.clientId ?? p.clientId ?? ""} onChange={(event) => updateSetting("clientId", event.currentTarget.value || null)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                      <option value="">No client linked</option>
                      {(clients.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}
                    </select>
                  </label>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label><span className="mb-1 block text-xs font-bold text-slate-600">Company</span><input value={settings.clientCompanyName || ""} onChange={(event) => updateNewClientField("clientCompanyName", "companyName", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" /></label>
                    <label><span className="mb-1 block text-xs font-bold text-slate-600">Contact</span><input value={settings.clientContactName || ""} onChange={(event) => updateNewClientField("clientContactName", "contactName", event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" /></label>
                  </div>
                )}
                <label className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={Boolean(settings.issueClientLogin)} onChange={(event) => updateSetting("issueClientLogin", event.currentTarget.checked)} />
                  Create or reset client portal login
                </label>
                {settings.issueClientLogin && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <input placeholder="Client email" value={settings.clientEmail || ""} onChange={(event) => updateNewClientField("clientEmail", "email", event.currentTarget.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm" />
                    <input placeholder="Client phone" value={settings.clientPhone || ""} onChange={(event) => updateNewClientField("clientPhone", "phone", event.currentTarget.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm" />
                    <input placeholder="New password" value={settings.clientPassword || ""} onChange={(event) => updateSetting("clientPassword", event.currentTarget.value)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm" />
                  </div>
                )}
                {issuedCredentials && (
                  <div className="mt-3 grid gap-3 rounded-md border border-emerald-100 bg-emerald-50 p-3 text-sm sm:grid-cols-3">
                    <div><span className="block text-xs font-black text-emerald-700">Email</span><span className="font-semibold text-emerald-900">{issuedCredentials.email}</span></div>
                    <div><span className="block text-xs font-black text-emerald-700">Password</span><span className="font-semibold text-emerald-900">{issuedCredentials.password || "Existing password"}</span></div>
                    <div><span className="block text-xs font-black text-emerald-700">Login URL</span><span className="font-semibold text-emerald-900">{issuedCredentials.portalUrl}</span></div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3"><Button size="sm" onClick={() => void saveSettings()} disabled={updateProject.isPending}><Save className="h-4 w-4" /> Save Changes</Button></div>
          </section>
        ) : <EmptyState title="Settings unavailable" description="Your role can view this project but cannot edit project settings." />)}
      </div>
    </main>
  );
}
