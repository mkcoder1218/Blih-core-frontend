import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CheckCircle2, Clock3, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageLoadingSpinner, StatCard, StatCardGrid } from "@/components/ui/blih";
import { useMyPermissions } from "../../../hooks/usePermissions";
import { ProjectTable } from "../components/ProjectTable";
import { ProjectsToolbar } from "../components/ProjectsToolbar";
import { TaskBoard } from "../components/TaskBoard";
import { TaskFilters } from "../components/TaskFilters";
import { TaskList } from "../components/TaskList";
import { useAllVisibleProjectTasks, useMoveProjectTaskStatus, useMyProjectTasks, useProjects } from "../hooks";
import type { ProjectsTab } from "../types";

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{message}</div>;
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
  const params = useMemo(() => ({ page, size: currentTab === "board" ? 100 : 10, ...(search ? { search } : {}), ...(status ? { status } : {}), ...(currentTab === "mine" ? { mine: "true" } : {}) }), [page, search, status, currentTab]);
  const taskParams = useMemo(() => ({ page: 1, size: 100, ...(taskStatus ? { status: taskStatus } : {}), ...(taskPriority ? { priority: taskPriority } : {}) }), [taskStatus, taskPriority]);
  const projects = useProjects(params);
  const myTasks = useMyProjectTasks(taskParams);
  const boardTasks = useAllVisibleProjectTasks(projects.data?.rows ?? [], currentTab === "board");
  const moveTask = useMoveProjectTaskStatus();

  if (!perms.isLoading && !perms.hasAny("project.read", "project.manage", "project.self")) {
    return <main className="h-full overflow-y-auto bg-[#f8fafc] p-8"><EmptyState title="Projects unavailable" description="Your role does not currently include project access." /></main>;
  }
  if (projects.isLoading || myTasks.isLoading || (currentTab === "board" && boardTasks.isLoading)) return <PageLoadingSpinner label="Loading projects" />;
  if (projects.isError) return <ErrorState message="Could not load projects." />;

  const projectRows = projects.data?.rows ?? [];
  const sourceTasks = currentTab === "board" ? boardTasks.rows : (myTasks.data?.rows ?? []);
  const assignees = Array.from(
    new Map(
      sourceTasks
        .filter((task) => task.assigneeEmployeeId)
        .map((task) => [
          task.assigneeEmployeeId!,
          {
            id: task.assigneeEmployeeId!,
            name: task.employeeAssignee?.user?.fullName || "Unassigned",
            email: task.employeeAssignee?.user?.email || "",
          },
        ])
    ).values()
  );
  const taskRows = sourceTasks.filter((task) => {
    const matchesSearch = !taskSearch || `${task.title} ${task.code || ""} ${task.project?.title || ""}`.toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = !taskStatus || task.status === taskStatus;
    const matchesPriority = !taskPriority || task.priority === taskPriority;
    const matchesDue = !taskDue || task.dueDate === taskDue;
    const matchesAssignee = !assigneeFilter || task.assigneeEmployeeId === assigneeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesDue && matchesAssignee;
  });
  const activeCount = projectRows.filter((p) => p.status === "ACTIVE").length;
  const doneTasks = taskRows.filter((t) => t.status === "DONE").length;
  const avgProgress = projectRows.length
    ? Math.round(projectRows.reduce((sum, p) => sum + (p.progressPercent || 0), 0) / projectRows.length)
    : 0;

  return (
    <main className="h-full overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black tracking-tight text-slate-950">{currentTab === "my-tasks" ? "My Tasks" : currentTab === "board" ? "Task Board" : "Projects"}</h1>
          <p className="text-sm font-medium text-slate-500">{currentTab === "my-tasks" ? "Review your assigned work across projects." : currentTab === "board" ? "Move authorized tasks through the project workflow." : "Plan work, track delivery, and keep project tasks moving."}</p>
        </div>

        {(currentTab === "overview" || currentTab === "all" || currentTab === "mine") && (
          <ProjectsToolbar search={search} status={status} onSearch={(v) => { setSearch(v); setPage(1); }} onStatus={(v) => { setStatus(v); setPage(1); }} />
        )}

        {(currentTab === "overview" || currentTab === "all" || currentTab === "mine") && (
          <StatCardGrid>
            <StatCard label="Total Projects" value={projectRows.length} tone="blue" icon={<BriefcaseBusiness />} />
            <StatCard label="Active" value={activeCount} tone="emerald" icon={<Clock3 />} />
            <StatCard label="Avg Progress" value={`${avgProgress}%`} tone="violet" icon={<CheckCircle2 />} />
            <StatCard label="My Tasks" value={taskRows.length} tone="amber" icon={<ListTodo />} />
          </StatCardGrid>
        )}

        {currentTab === "overview" && (
          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <section>
              <h2 className="mb-3 text-sm font-black text-slate-900">Recent Projects</h2>
              {projectRows.length ? <ProjectTable projects={projectRows.slice(0, 8)} onOpen={(p) => navigate(`/projects/${p.id}`)} /> : <EmptyState title="No projects yet" description="Projects created in the backend will appear here." />}
            </section>
            <section>
              <h2 className="mb-3 text-sm font-black text-slate-900">My Tasks</h2>
              {taskRows.length ? <TaskList tasks={taskRows.slice(0, 8)} /> : <EmptyState title="No tasks assigned" description="Assigned project tasks will appear here." />}
            </section>
          </div>
        )}

        {(currentTab === "all" || currentTab === "mine") && (
          <>
            {projectRows.length ? <ProjectTable projects={projectRows} onOpen={(p) => navigate(`/projects/${p.id}`)} /> : <EmptyState title="No projects found" description="No matching projects are available." />}
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <span className="text-xs font-bold text-slate-500">Page {projects.data?.page ?? page} of {projects.data?.totalPages ?? 1}</span>
              <Button variant="outline" disabled={(projects.data?.page ?? page) >= (projects.data?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </>
        )}

        {currentTab === "my-tasks" && (
          <>
            <TaskFilters search={taskSearch} status={taskStatus} priority={taskPriority} due={taskDue} onSearch={setTaskSearch} onStatus={setTaskStatus} onPriority={setTaskPriority} onDue={setTaskDue} />
            {myTasks.isError ? <ErrorState message="Could not load your tasks." /> :
            taskRows.length ? (
              <>
                <div className="overflow-x-auto pb-2">
                  <TaskBoard
                    tasks={taskRows}
                    canMove={perms.hasAny("project.manage")}
                    onMove={(task, nextStatus) => moveTask.mutate({ projectId: task.projectId, taskId: task.id, status: nextStatus })}
                  />
                </div>
                {!perms.hasAny("project.manage") && <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">You can view your workflow board, but moving tasks requires project management permission.</div>}
              </>
            ) : <EmptyState title="No tasks assigned" description="Your assigned project tasks will appear here." />}
          </>
        )}

        {currentTab === "board" && (
          <>
            <TaskFilters search={taskSearch} status={taskStatus} priority={taskPriority} due={taskDue} onSearch={setTaskSearch} onStatus={setTaskStatus} onPriority={setTaskPriority} onDue={setTaskDue} />
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="mr-1 text-xs font-black uppercase tracking-wide text-slate-400">Assignees</span>
              <button
                onClick={() => setAssigneeFilter("")}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold ${!assigneeFilter ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
              >
                All
              </button>
              {assignees.map((person) => {
                const initials = person.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
                const active = assigneeFilter === person.id;
                return (
                  <button
                    key={person.id}
                    onClick={() => setAssigneeFilter(active ? "" : person.id)}
                    title={person.email || person.name}
                    className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-xs font-bold transition-colors ${active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{initials || "U"}</span>
                    {person.name}
                  </button>
                );
              })}
              {!assignees.length && <span className="text-xs font-semibold text-slate-400">No assignees yet</span>}
            </div>
            {boardTasks.isError && <ErrorState message="Could not load project board tasks." />}
            <div className="overflow-x-auto pb-2">
              {taskRows.length ? (
                <TaskBoard
                  tasks={taskRows}
                  canMove={perms.hasAny("project.manage")}
                  onMove={(task, nextStatus) => moveTask.mutate({ projectId: task.projectId, taskId: task.id, status: nextStatus })}
                />
              ) : <EmptyState title="No board tasks" description="Project tasks that match the current filters will appear here." />}
            </div>
            {!perms.hasAny("project.manage") && <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">You can view the board, but task movement requires project management permission.</div>}
          </>
        )}
      </div>
    </main>
  );
}
