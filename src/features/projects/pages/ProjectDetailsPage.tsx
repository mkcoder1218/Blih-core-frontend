import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, ArrowLeft, MoreHorizontal, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageLoadingSpinner } from "@/components/ui/blih";
import { useMe } from "../../../hooks/useMe";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { useClients } from "../../../hooks/useClients";
import { useDepartments } from "../../../hooks/useDepartments";
import { ProjectStatusBadge } from "../components/ProjectStatusBadge";
import { TaskList } from "../components/TaskList";
import { EmployeeSelect } from "../components/EmployeeSelect";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { ProjectTaskBoard } from "../components/ProjectTaskBoard";
import { ProjectSettingsCard } from "../components/ProjectSettingsCard";
import {
  useAddProjectMember, useArchiveProject, useChangeProjectStatus, useChangeProjectWorkflowFormStatus,
  useCreateProjectWorkflowForm, useProject, useProjectMembers, useProjectTasks, useProjectWorkflowCatalog,
  useProjectWorkflowForms, useUpdateProjectWorkflowForm, useUpdateProject,
} from "../hooks";
import { useSendTodayTasksToTelegram } from "../telegramHooks";
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
  { tab: "overview", label: "Overview" }, { tab: "tasks", label: "Tasks" }, { tab: "team", label: "Team" }, { tab: "activity", label: "Activity" },
];
const MORE_TABS = [...WORKFLOW_TABS.map((item) => ({ tab: item.tab, label: item.label })), { tab: "settings" as DetailTab, label: "Settings" }];

function FieldLabel({ children }: { children: ReactNode }) { return <span className="text-xs text-muted-foreground">{children}</span>; }
function StatItem({ label, value }: { label: string; value: ReactNode }) {
  return <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardContent className="flex items-center justify-between gap-3 px-3"><span className="text-xs text-muted-foreground">{label}</span><span className="text-sm font-medium tabular-nums text-foreground">{value}</span></CardContent></Card>;
}

export default function ProjectDetailsPage({ projectId }: { projectId: string }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [memberEmployeeId, setMemberEmployeeId] = useState("");
  const [settings, setSettings] = useState<any>({});
  const [issuedCredentials, setIssuedCredentials] = useState<{ email: string; password: string | null; portalUrl: string } | null>(null);
  const me = useMe();
  const perms = useMyPermissions();
  const roles: string[] = (me.data?.data?.roles || []) as string[];
  const canUseClients = roles.includes("BUSINESS_ADMIN") || roles.includes("PROJECT_MANAGER");
  const clients = useClients(canUseClients);
  const departments = useDepartments({ page: 1, size: 200 });
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
  const sendTodayTasks = useSendTodayTasksToTelegram();
  const canManageProjects = perms.hasAny("project.manage");
  const canWorkTasks = perms.hasAny("project.task", "project.manage");
  const departmentRows = useMemo(() => (departments.data?.departments ?? []).filter((department) => department.status !== "inactive"), [departments.data?.departments]);

  const updateSetting = (key: string, value: unknown) => setSettings((previous: any) => ({ ...previous, [key]: value }));
  const changeSettingsDepartment = (departmentId: string | null) => {
    setSettings((previous: any) => ({ ...previous, departmentId, ownerEmployeeId: null, managerEmployeeId: null }));
  };
  const updateNewClientField = (stateKey: "clientCompanyName" | "clientContactName" | "clientEmail" | "clientPhone", clientKey: "companyName" | "contactName" | "email" | "phone", value: string) => {
    setSettings((previous: any) => ({
      ...previous,
      [stateKey]: value,
      newClient: previous.clientMode === "new" || stateKey === "clientCompanyName" || stateKey === "clientContactName"
        ? { ...(previous.newClient || {}), [clientKey]: value }
        : previous.newClient,
    }));
  };

  if (!perms.isLoading && !perms.hasAny("project.read", "project.manage", "project.self", "project.task")) return <main className="h-full overflow-y-auto bg-muted/20 p-6"><EmptyState title="Project unavailable" description="Your role does not currently include project access." /></main>;
  if (project.isLoading) return <PageLoadingSpinner label="Loading project" />;
  if (project.isError || !project.data) return <div className="p-6"><EmptyState title="Project unavailable" description="The project could not be loaded." /></div>;

  const p = project.data;
  const progressPercent = p.progressPercent ?? p.metadata?.progress?.progressPercent ?? 0;
  const taskRows = tasks.data?.rows ?? [];
  const memberRows = members.data ?? p.members ?? [];
  const activeTasks = taskRows.filter((task) => task.status !== "CANCELLED" && task.status !== "DONE").length;
  const blockedTasks = taskRows.filter((task) => task.status === "BLOCKED").length;
  const kanbanColumns = getProjectKanbanColumns(p);
  const coreTab = CORE_TABS.some((item) => item.tab === tab) ? tab : "";
  const projectDepartmentName = p.department?.name || departmentRows.find((department) => department.id === p.departmentId)?.name || "Whole company";

  const saveSettings = async () => {
    const selectedClient = canUseClients ? clients.data?.find((client) => client.id === (settings.clientId ?? p.clientId)) : null;
    const payload: any = {
      ...settings,
      clientPortalUser: canUseClients && settings.issueClientLogin ? {
        fullName: settings.clientContactName || settings.clientCompanyName || selectedClient?.contactName || selectedClient?.companyName || undefined,
        email: settings.clientEmail || selectedClient?.email || undefined,
        phone: settings.clientPhone || selectedClient?.phone || undefined,
        password: settings.clientPassword || undefined,
      } : undefined,
    };
    for (const key of ["clientMode", "clientCompanyName", "clientContactName", "clientEmail", "clientPhone", "clientPassword", "issueClientLogin"]) delete payload[key];
    if (!canUseClients) {
      delete payload.clientId; delete payload.newClient; delete payload.clientPortalUser;
    } else {
      if (settings.clientMode !== "new") delete payload.newClient;
      if (settings.clientMode === "new") delete payload.clientId;
      if (!settings.issueClientLogin) delete payload.clientPortalUser;
    }
    const updated: any = await updateProject.mutateAsync({ id: projectId, data: payload });
    if (updated?.clientPortalUser?.email) {
      setIssuedCredentials({ email: updated.clientPortalUser.email, password: updated.clientPortalUser.temporaryPassword || settings.clientPassword || null, portalUrl: `${window.location.origin}/client-portal` });
    }
    setSettings({});
    setMemberEmployeeId("");
  };

  const telegramSendError = sendTodayTasks.error as any;
  const telegramErrorMessage = telegramSendError?.response?.data?.error || telegramSendError?.response?.data?.message || telegramSendError?.message || "Could not send today's tasks to Telegram.";

  return (
    <main className="h-full overflow-y-auto bg-muted/20 p-3 lg:p-4">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <Card size="sm" className="gap-0 rounded-md py-0 shadow-none ring-1 ring-border">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center gap-2 border-b border-border px-2.5 py-2">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeft /></Button>
              <div className="min-w-[220px] flex-1">
                <div className="flex flex-wrap items-center gap-1.5"><h1 className="max-w-[520px] truncate text-base font-medium text-foreground" title={p.title}>{p.title}</h1><ProjectStatusBadge status={p.status} /><ProjectStatusBadge status={p.priority} /></div>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.code || "No code"} · {projectDepartmentName} · {p.startDate || "No start"} → {p.endDate || "No end"}</p>
              </div>
              <div className="hidden min-w-[170px] items-center gap-2 lg:flex"><div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} /></div><span className="text-xs tabular-nums text-muted-foreground">{progressPercent}%</span></div>
              {canManageProjects ? <Select value={p.status} onValueChange={(value) => changeStatus.mutate({ id: projectId, status: String(value ?? p.status) })}><SelectTrigger className="w-40 rounded-md" aria-label="Project status"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map((status) => <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select> : null}
              {canManageProjects ? <Button variant="outline" size="sm" onClick={() => archiveProject.mutate(projectId)}><Archive />Archive</Button> : null}
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5">
              <Tabs value={coreTab} onValueChange={(value) => setTab(value as DetailTab)} className="gap-0"><TabsList className="h-8 rounded-md bg-transparent p-0">{CORE_TABS.map((item) => <TabsTrigger key={item.tab} value={item.tab} className="rounded-md px-3 text-xs">{item.label}</TabsTrigger>)}</TabsList></Tabs>
              <DropdownMenu><DropdownMenuTrigger render={<Button variant={coreTab ? "ghost" : "secondary"} size="sm" />}><MoreHorizontal />More</DropdownMenuTrigger><DropdownMenuContent align="start" className="w-48">{MORE_TABS.map((item) => <DropdownMenuItem key={item.tab} onClick={() => setTab(item.tab)}>{item.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {tab === "overview" ? <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><StatItem label="Progress" value={`${progressPercent}%`} /><StatItem label="Active tasks" value={activeTasks} /><StatItem label="Blocked" value={blockedTasks} /><StatItem label="Team" value={memberRows.length} /></div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>Project details</CardTitle></CardHeader><CardContent><dl className="grid gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Department scope</dt><dd className="mt-0.5 text-foreground">{projectDepartmentName}</dd></div><div><dt className="text-xs text-muted-foreground">Owner</dt><dd className="mt-0.5 text-foreground">{p.owner?.user?.fullName || "Unassigned"}</dd></div><div><dt className="text-xs text-muted-foreground">Manager</dt><dd className="mt-0.5 text-foreground">{p.manager?.user?.fullName || "Unassigned"}</dd></div>{canUseClients ? <div><dt className="text-xs text-muted-foreground">Client</dt><dd className="mt-0.5 text-foreground">{p.Client?.companyName || "No client linked"}</dd></div> : null}<div><dt className="text-xs text-muted-foreground">Description</dt><dd className="mt-0.5 leading-5 text-foreground">{p.description || "No description"}</dd></div></dl></CardContent></Card>
            <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>Recent tasks</CardTitle></CardHeader><CardContent>{taskRows.length ? <TaskList tasks={taskRows.slice(0, 5)} /> : <EmptyState title="No tasks yet" description="Tasks added to this project will appear here." />}</CardContent></Card>
          </div>
        </> : null}

        {tab === "tasks" ? <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
          <CardHeader className="border-b"><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Tasks</CardTitle><p className="mt-0.5 text-xs text-muted-foreground">Create, discuss and move work through this project&apos;s workflow.</p></div>{canWorkTasks ? <div className="flex flex-wrap items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={sendTodayTasks.isPending} onClick={() => sendTodayTasks.mutate()}><Send />{sendTodayTasks.isPending ? "Sending..." : "Send Today's Tasks"}</Button><CreateTaskModal projectId={projectId} columns={kanbanColumns} /></div> : null}</div></CardHeader>
          <CardContent className="space-y-3">
            {sendTodayTasks.isSuccess ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{sendTodayTasks.data.sentTasks > 0 ? `Sent ${sendTodayTasks.data.sentTasks} new task${sendTodayTasks.data.sentTasks === 1 ? "" : "s"} in ${sendTodayTasks.data.sentMessages} Telegram message${sendTodayTasks.data.sentMessages === 1 ? "" : "s"}.` : sendTodayTasks.data.skippedAlreadySent > 0 ? `No new tasks to send. ${sendTodayTasks.data.skippedAlreadySent} task deliver${sendTodayTasks.data.skippedAlreadySent === 1 ? "y was" : "ies were"} already published today.` : "No eligible tasks created today are waiting to be published."}{sendTodayTasks.data.errors.length ? ` ${sendTodayTasks.data.errors.length} Telegram delivery error${sendTodayTasks.data.errors.length === 1 ? "" : "s"} occurred.` : ""}</div> : null}
            {sendTodayTasks.isError ? <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{telegramErrorMessage}</div> : null}
            {tasks.isLoading ? <PageLoadingSpinner label="Loading tasks" /> : <ProjectTaskBoard project={p} tasks={taskRows} canMove={canWorkTasks} canManage={canManageProjects} />}
          </CardContent>
        </Card> : null}

        {tab === "team" ? <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="border-b"><CardTitle>Team</CardTitle></CardHeader><CardContent>
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end"><label className="grid flex-1 gap-1"><FieldLabel>Add member</FieldLabel><EmployeeSelect value={memberEmployeeId} onChange={setMemberEmployeeId} placeholder="Select team member" departmentId={p.departmentId || null} /></label>{canManageProjects ? <Button size="sm" disabled={!memberEmployeeId || addMember.isPending} onClick={() => addMember.mutate({ employeeId: memberEmployeeId, role: "MEMBER" } as any)}>Add member</Button> : null}</div>
          <div className="divide-y divide-border rounded-md border">{memberRows.map((member: any) => <div key={member.id} className="flex items-center justify-between px-3 py-2.5"><div><div className="text-sm font-medium text-foreground">{member.employee?.user?.fullName || member.employeeId}</div><div className="text-xs text-muted-foreground">{member.employee?.user?.email || "Team member"}</div></div><ProjectStatusBadge status={member.role} /></div>)}{!memberRows.length ? <EmptyState title="No team members" description="Owner, manager, and members will appear here." /> : null}</div>
        </CardContent></Card> : null}

        {WORKFLOW_TABS.map((workflowTab) => tab === workflowTab.tab ? <WorkflowFormsTab key={workflowTab.tab} label={workflowTab.label} groups={workflowTab.groups} forms={workflowForms.data ?? []} catalog={workflowCatalog.data ?? []} tasks={taskRows} canManage={canManageProjects} isLoading={workflowForms.isLoading || workflowCatalog.isLoading} onCreate={(payload) => createWorkflowForm.mutate(payload)} onUpdate={(formId, data) => updateWorkflowForm.mutate({ formId, data })} onStatus={(formId, status) => changeWorkflowStatus.mutate({ formId, status })} /> : null)}

        {tab === "activity" ? <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="border-b"><CardTitle>Activity</CardTitle></CardHeader><CardContent><EmptyState title="No activity yet" description="Project activity will appear here when tasks, comments, and team changes are recorded." /></CardContent></Card> : null}

        {tab === "settings" ? canManageProjects ? <ProjectSettingsCard project={p} settings={settings} departments={departmentRows} clients={clients.data ?? []} canUseClients={canUseClients} issuedCredentials={issuedCredentials} updateSetting={updateSetting} changeDepartment={changeSettingsDepartment} updateNewClientField={updateNewClientField} save={() => void saveSettings()} saving={updateProject.isPending} /> : <EmptyState title="Settings unavailable" description="Your role can view this project but cannot edit project settings." /> : null}
      </div>
    </main>
  );
}
