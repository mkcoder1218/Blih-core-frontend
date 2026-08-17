import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, PageLoadingSpinner } from "@/components/ui/blih";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { ProjectTable } from "../components/ProjectTable";
import { ProjectsToolbar } from "../components/ProjectsToolbar";
import { TaskBoard } from "../components/TaskBoard";
import { TaskFilters } from "../components/TaskFilters";
import { TaskList } from "../components/TaskList";
import { useAllVisibleProjectTasks, useMoveProjectTaskStatus, useMyProjectTasks, useProjects } from "../hooks";
import { useSendTodayTasksToTelegram } from "../telegramHooks";
import type { ProjectsTab } from "../types";

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{message}</div>;
}

function SummaryItem({ label, value }: { label: string; value: ReactNode }) {
  return <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardContent className="flex items-center justify-between gap-3 px-3"><span className="text-xs text-muted-foreground">{label}</span><span className="text-sm font-medium tabular-nums text-foreground">{value}</span></CardContent></Card>;
}

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function ProjectsPage({ currentTab }: { currentTab: ProjectsTab }) {
  const navigate = useNavigate();
  const perms = useMyPermissions();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatus, setTaskStatus] = useState("");
  const [taskPriority, setTaskPriority] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [syncNotice, setSyncNotice] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const params = useMemo(() => ({ page, size: currentTab === "board" ? 100 : 10, ...(search ? { search } : {}), ...(status ? { status } : {}), ...(currentTab === "mine" ? { mine: "true" } : {}) }), [page, search, status, currentTab]);
  const taskParams = useMemo(() => ({ page: 1, size: 100, ...(taskStatus ? { status: taskStatus } : {}), ...(taskPriority ? { priority: taskPriority } : {}) }), [taskStatus, taskPriority]);
  const projects = useProjects(params);
  const myTasks = useMyProjectTasks(taskParams);
  const boardTasks = useAllVisibleProjectTasks(projects.data?.rows ?? [], currentTab === "board");
  const moveTask = useMoveProjectTaskStatus();
  const sendTodayTasks = useSendTodayTasksToTelegram();
  const canCreateProject = perms.hasAny("project.create", "project.manage");
  const canMoveTasks = perms.hasAny("project.task", "project.manage");
  const canPublishTasks = perms.hasAny("project.task", "project.manage");

  const handleSendTodayTasks = async () => {
    setSyncNotice(null);
    try {
      const result = await sendTodayTasks.mutateAsync();
      if (result.errors.length) {
        setSyncNotice({
          type: "info",
          message: `Sent ${result.sentTasks} task${result.sentTasks === 1 ? "" : "s"}; ${result.errors.length} Telegram deliver${result.errors.length === 1 ? "y" : "ies"} failed.`,
        });
      } else if (result.sentTasks > 0) {
        setSyncNotice({
          type: "success",
          message: `Sent ${result.sentTasks} new task${result.sentTasks === 1 ? "" : "s"} to Telegram in ${result.sentMessages} message${result.sentMessages === 1 ? "" : "s"}.`,
        });
      } else {
        setSyncNotice({
          type: "info",
          message: result.skippedAlreadySent > 0
            ? "No new tasks to send. Today's eligible tasks were already published."
            : "No eligible unfinished tasks were created today.",
        });
      }
    } catch (error: any) {
      setSyncNotice({
        type: "error",
        message: error?.response?.data?.error || error?.response?.data?.message || error?.message || "Could not send today's tasks to Telegram.",
      });
    }
  };

  if (!perms.isLoading && !perms.hasAny("project.read", "project.manage", "project.self", "project.task")) {
    return <main className="h-full overflow-y-auto bg-muted/20 p-6"><EmptyState title="Projects unavailable" description="Your role does not currently include project access." /></main>;
  }
  if (projects.isLoading || myTasks.isLoading || (currentTab === "board" && boardTasks.isLoading)) return <PageLoadingSpinner label="Loading projects" />;
  if (projects.isError) return <ErrorState message="Could not load projects." />;

  const projectRows = projects.data?.rows ?? [];
  const sourceTasks = currentTab === "board" ? boardTasks.rows : myTasks.data?.rows ?? [];
  const assignees = Array.from(new Map(sourceTasks.filter((task) => task.assigneeEmployeeId).map((task) => [task.assigneeEmployeeId!, { id: task.assigneeEmployeeId!, name: task.employeeAssignee?.user?.fullName || "Unassigned", email: task.employeeAssignee?.user?.email || "" }])).values());
  const taskRows = sourceTasks.filter((task) => {
    const matchesSearch = !taskSearch || `${task.title} ${task.code || ""} ${task.project?.title || ""}`.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesSearch && (!taskStatus || task.status === taskStatus) && (!taskPriority || task.priority === taskPriority) && (!taskDue || task.dueDate === taskDue) && (!assigneeFilter || task.assigneeEmployeeId === assigneeFilter);
  });
  const activeCount = projectRows.filter((project) => project.status === "ACTIVE").length;
  const avgProgress = projectRows.length ? Math.round(projectRows.reduce((sum, project) => sum + (project.progressPercent || 0), 0) / projectRows.length) : 0;
  const title = currentTab === "my-tasks" ? "My Tasks" : currentTab === "board" ? "Task Board" : "Projects";
  const description = currentTab === "my-tasks" ? "Review your assigned work across projects." : currentTab === "board" ? "Move authorized tasks through the project workflow." : "Plan work, track delivery, and keep project tasks moving.";

  return (
    <main className="h-full overflow-y-auto bg-muted/20 p-3 lg:p-4">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-medium text-foreground">{title}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          {canPublishTasks ? (
            <Button type="button" size="sm" onClick={handleSendTodayTasks} disabled={sendTodayTasks.isPending} className="shrink-0 rounded-md">
              <Send className="mr-2 h-4 w-4" />
              {sendTodayTasks.isPending ? "Sending..." : "Send Today's Tasks"}
            </Button>
          ) : null}
        </div>

        {syncNotice ? (
          <div className={`rounded-md border px-3 py-2 text-sm ${syncNotice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : syncNotice.type === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
            {syncNotice.message}
          </div>
        ) : null}

        {currentTab === "overview" || currentTab === "all" || currentTab === "mine" ? <ProjectsToolbar search={search} status={status} canCreateProject={canCreateProject} onSearch={(value) => { setSearch(value); setPage(1); }} onStatus={(value) => { setStatus(value); setPage(1); }} /> : null}

        {currentTab === "overview" || currentTab === "all" || currentTab === "mine" ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><SummaryItem label="Total projects" value={projectRows.length} /><SummaryItem label="Active" value={activeCount} /><SummaryItem label="Average progress" value={`${avgProgress}%`} /><SummaryItem label="My tasks" value={taskRows.length} /></div> : null}

        {currentTab === "overview" ? <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>Recent projects</CardTitle></CardHeader><CardContent>{projectRows.length ? <ProjectTable projects={projectRows.slice(0, 8)} onOpen={(project) => navigate(`/projects/${project.id}`)} /> : <EmptyState title="No projects yet" description="Projects created in the backend will appear here." />}</CardContent></Card>
          <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardHeader className="pb-0"><CardTitle>My tasks</CardTitle></CardHeader><CardContent>{taskRows.length ? <TaskList tasks={taskRows.slice(0, 8)} /> : <EmptyState title="No tasks assigned" description="Assigned project tasks will appear here." />}</CardContent></Card>
        </div> : null}

        {currentTab === "all" || currentTab === "mine" ? <>{projectRows.length ? <ProjectTable projects={projectRows} onOpen={(project) => navigate(`/projects/${project.id}`)} /> : <EmptyState title="No projects found" description="No matching projects are available." />}<div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button><span className="text-xs text-muted-foreground">Page {projects.data?.page ?? page} of {projects.data?.totalPages ?? 1}</span><Button variant="outline" size="sm" disabled={(projects.data?.page ?? page) >= (projects.data?.totalPages ?? 1)} onClick={() => setPage((current) => current + 1)}>Next</Button></div></> : null}

        {currentTab === "my-tasks" ? <><TaskFilters search={taskSearch} status={taskStatus} priority={taskPriority} due={taskDue} onSearch={setTaskSearch} onStatus={setTaskStatus} onPriority={setTaskPriority} onDue={setTaskDue} />{myTasks.isError ? <ErrorState message="Could not load your tasks." /> : taskRows.length ? <><div className="overflow-x-auto pb-1"><TaskBoard tasks={taskRows} canMove={canMoveTasks} onMove={(task, nextStatus) => moveTask.mutate({ projectId: task.projectId, taskId: task.id, status: nextStatus })} /></div>{!canMoveTasks ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">You can view your workflow board, but moving tasks requires task permission.</div> : null}</> : <EmptyState title="No tasks assigned" description="Your assigned project tasks will appear here." />}</> : null}

        {currentTab === "board" ? <><TaskFilters search={taskSearch} status={taskStatus} priority={taskPriority} due={taskDue} onSearch={setTaskSearch} onStatus={setTaskStatus} onPriority={setTaskPriority} onDue={setTaskDue} /><Card size="sm" className="gap-0 rounded-md py-0 shadow-none ring-1 ring-border"><CardContent className="flex min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5"><span className="px-1 text-xs text-muted-foreground">Assignees</span><Button type="button" size="sm" variant={!assigneeFilter ? "secondary" : "outline"} onClick={() => setAssigneeFilter("")} className="rounded-md font-normal">All</Button>{assignees.map((person) => { const active = assigneeFilter === person.id; return <Button key={person.id} type="button" size="sm" variant={active ? "secondary" : "outline"} onClick={() => setAssigneeFilter(active ? "" : person.id)} title={person.email || person.name} className="max-w-44 rounded-md font-normal"><Avatar size="sm"><AvatarFallback className="text-[9px]">{getInitials(person.name) || "U"}</AvatarFallback></Avatar><span className="truncate">{person.name}</span></Button>; })}{!assignees.length ? <Badge variant="outline" className="rounded-md font-normal text-muted-foreground">No assignees yet</Badge> : null}</CardContent></Card>{boardTasks.isError ? <ErrorState message="Could not load project board tasks." /> : null}<div className="overflow-x-auto pb-1">{taskRows.length ? <TaskBoard tasks={taskRows} canMove={canMoveTasks} onMove={(task, nextStatus) => moveTask.mutate({ projectId: task.projectId, taskId: task.id, status: nextStatus })} /> : <EmptyState title="No board tasks" description="Project tasks that match the current filters will appear here." />}</div>{!canMoveTasks ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">You can view the board, but task movement requires task permission.</div> : null}</> : null}
      </div>
    </main>
  );
}
