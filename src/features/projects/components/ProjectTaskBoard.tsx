import { useMemo, useState } from "react";
import { ListTodo, Search } from "lucide-react";
import { EmptyState, StatCard, StatCardGrid } from "@/components/ui/blih";
import { TASK_STATUSES } from "../schemas";
import { useChangeProjectTaskStatus } from "../hooks";
import type { ProjectTask } from "../types";
import { TaskBoard } from "./TaskBoard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskDiscussionDialog } from "./TaskDiscussionDialog";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function ProjectTaskBoard({
  projectId,
  tasks,
  canMove,
}: {
  projectId: string;
  tasks: ProjectTask[];
  canMove: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [discussionTask, setDiscussionTask] = useState<ProjectTask | null>(null);
  const changeTaskStatus = useChangeProjectTaskStatus(projectId);

  const assignees = useMemo(() => {
    return Array.from(
      new Map(
        tasks
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
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const query = `${task.title} ${task.code || ""} ${task.description || ""}`.toLowerCase();
      const matchesSearch = !search || query.includes(search.toLowerCase());
      const matchesStatus = !status || task.status === status;
      const matchesPriority = !priority || task.priority === priority;
      const matchesDue = !dueDate || task.dueDate === dueDate;
      const matchesAssignee = !assigneeFilter || task.assigneeEmployeeId === assigneeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesDue && matchesAssignee;
    });
  }, [tasks, search, status, priority, dueDate, assigneeFilter]);

  const activeTasks = filteredTasks.filter((task) => task.status !== "CANCELLED");
  const doneTasks = filteredTasks.filter((task) => task.status === "DONE");
  const blockedTasks = filteredTasks.filter((task) => task.status === "BLOCKED");

  return (
    <div className="flex flex-col gap-4">
      <StatCardGrid>
        <StatCard label="Visible Tasks" value={filteredTasks.length} tone="blue" icon={<ListTodo />} />
        <StatCard label="Active" value={activeTasks.length} tone="violet" />
        <StatCard label="Blocked" value={blockedTasks.length} tone="rose" />
        <StatCard label="Done" value={doneTasks.length} tone="emerald" />
      </StatCardGrid>

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 xl:flex-row">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search this project board"
            className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600" />
      </div>

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

      {filteredTasks.length ? (
        <div className="overflow-x-auto pb-2">
          <TaskBoard
            tasks={filteredTasks}
            canMove={canMove}
            onMove={(task, nextStatus) => changeTaskStatus.mutate({ taskId: task.id, status: nextStatus })}
            onOpen={setSelectedTask}
            onDiscuss={setDiscussionTask}
          />
        </div>
      ) : (
        <EmptyState title="No board tasks" description="Tasks created for this project will appear in the workflow board." />
      )}

      {!canMove && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          You can view this board, but moving tasks requires project management permission.
        </div>
      )}

      <TaskDetailsModal
        projectId={projectId}
        task={selectedTask}
        open={Boolean(selectedTask)}
        canEdit={canMove}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />

      <TaskDiscussionDialog
        projectId={projectId}
        task={discussionTask}
        open={Boolean(discussionTask)}
        onOpenChange={(open) => {
          if (!open) setDiscussionTask(null);
        }}
      />
    </div>
  );
}
