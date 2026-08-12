import { useEffect, useMemo, useState } from "react";
import { Columns3, Filter, List, MessageCircle, Paperclip, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/blih";
import { api } from "@/api/client";
import { TASK_STATUSES } from "../schemas";
import { getProjectKanbanColumns, getTaskKanbanColumn } from "../kanban";
import { useChangeProjectTaskStatus, useUpdateProjectTask } from "../hooks";
import type { Project, ProjectKanbanColumn, ProjectTask } from "../types";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { TaskBoard } from "./TaskBoard";
import { TaskDetailsModal } from "./TaskDetailsModal";
import { TaskDiscussionDialog } from "./TaskDiscussionDialog";
import { KanbanSettingsDialog } from "./KanbanSettingsDialog";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

type BoardMode = "board" | "list";

type AttachmentRow = {
  entityId?: string;
  attachmentType?: string | null;
};

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getAssigneeName(task: ProjectTask) {
  return task.employeeAssignee?.user?.fullName || "Unassigned";
}

export function ProjectTaskBoard({
  project,
  tasks,
  canMove,
  canManage,
}: {
  project: Project;
  tasks: ProjectTask[];
  canMove: boolean;
  canManage: boolean;
}) {
  const [mode, setMode] = useState<BoardMode>("board");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [discussionTask, setDiscussionTask] = useState<ProjectTask | null>(null);
  const [attachmentCounts, setAttachmentCounts] = useState<Record<string, number>>({});
  const [moveError, setMoveError] = useState("");

  const changeTaskStatus = useChangeProjectTaskStatus(project.id);
  const updateTask = useUpdateProjectTask(project.id);
  const columns = useMemo(() => getProjectKanbanColumns(project), [project]);

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
          ]),
      ).values(),
    );
  }, [tasks]);

  useEffect(() => {
    const taskIds = new Set(tasks.map((task) => task.id));
    if (!taskIds.size) {
      setAttachmentCounts({});
      return;
    }

    let cancelled = false;
    api
      .get("/api/v1/attachments", { params: { entityType: "project_task", page: 1, size: 1000 } })
      .then((response) => {
        if (cancelled) return;
        const payload = response.data?.data ?? response.data;
        const rows = (Array.isArray(payload?.rows) ? payload.rows : []) as AttachmentRow[];
        const next: Record<string, number> = {};
        for (const row of rows) {
          if (!row.entityId || !taskIds.has(row.entityId)) continue;
          next[row.entityId] = (next[row.entityId] || 0) + 1;
        }
        setAttachmentCounts(next);
      })
      .catch(() => {
        if (!cancelled) setAttachmentCounts({});
      });

    return () => {
      cancelled = true;
    };
  }, [project.id, tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const query = `${task.title} ${task.code || ""} ${task.description || ""} ${getAssigneeName(task)}`.toLowerCase();
      const matchesSearch = !search || query.includes(search.toLowerCase());
      const matchesStatus = !status || task.status === status;
      const matchesPriority = !priority || task.priority === priority;
      const matchesDue = !dueDate || task.dueDate === dueDate;
      const matchesAssignee = !assigneeFilter || task.assigneeEmployeeId === assigneeFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesDue && matchesAssignee;
    });
  }, [tasks, search, status, priority, dueDate, assigneeFilter]);

  const activeTasks = filteredTasks.filter((task) => task.status !== "CANCELLED" && task.status !== "DONE");
  const doneTasks = filteredTasks.filter((task) => task.status === "DONE");
  const blockedTasks = filteredTasks.filter((task) => task.status === "BLOCKED");
  const activeFilterCount = [status, priority, dueDate, assigneeFilter].filter(Boolean).length;
  const visibleAssignees = assignees.slice(0, 3);
  const hiddenAssignees = Math.max(0, assignees.length - visibleAssignees.length);

  const clearFilters = () => {
    setStatus("");
    setPriority("");
    setDueDate("");
    setAssigneeFilter("");
  };

  const moveTask = async (task: ProjectTask, column: ProjectKanbanColumn) => {
    if (!canMove) return;
    try {
      setMoveError("");
      if (task.status !== column.status) {
        await changeTaskStatus.mutateAsync({ taskId: task.id, status: column.status });
      }
      if (task.metadata?.kanbanColumnId !== column.id) {
        await updateTask.mutateAsync({
          taskId: task.id,
          data: {
            metadata: {
              ...(task.metadata || {}),
              kanbanColumnId: column.id,
            },
          },
        });
      }
    } catch (requestError: any) {
      setMoveError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          requestError?.message ||
          "Could not move the task.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">
        <span><strong className="text-slate-900">{filteredTasks.length}</strong> visible</span>
        <span><strong className="text-slate-900">{activeTasks.length}</strong> active</span>
        <span><strong className="text-rose-600">{blockedTasks.length}</strong> blocked</span>
        <span><strong className="text-emerald-600">{doneTasks.length}</strong> done</span>
        <span className="ml-auto hidden text-slate-400 lg:inline">{columns.length} board columns</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            placeholder="Search tasks"
            className="h-8 w-full rounded-md border border-slate-200 pl-8 pr-2.5 text-xs outline-none focus:border-blue-500"
          />
        </div>

        <div className="hidden items-center gap-1.5 xl:flex">
          {visibleAssignees.map((person) => {
            const active = assigneeFilter === person.id;
            const initials = person.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setAssigneeFilter(active ? "" : person.id)}
                title={person.email || person.name}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-[10px] font-bold ${active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-black ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>{initials || "U"}</span>
                <span className="max-w-24 truncate">{person.name}</span>
              </button>
            );
          })}
          {hiddenAssignees > 0 && (
            <button type="button" onClick={() => setFiltersOpen(true)} className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-50">
              +{hiddenAssignees}
            </button>
          )}
        </div>

        <div className="relative">
          <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((value) => !value)}>
            <Filter className="h-4 w-4" /> Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </Button>
          {filtersOpen && (
            <div className="absolute right-0 top-10 z-30 w-[320px] rounded-lg border border-slate-200 bg-white p-3 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">Filters</span>
                <button type="button" onClick={() => setFiltersOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid gap-3">
                <label>
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Core status</span>
                  <select value={status} onChange={(event) => setStatus(event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600">
                    <option value="">All statuses</option>
                    {TASK_STATUSES.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Priority</span>
                  <select value={priority} onChange={(event) => setPriority(event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600">
                    <option value="">All priorities</option>
                    {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Due date</span>
                  <input type="date" value={dueDate} onChange={(event) => setDueDate(event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600" />
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-400">Assignee</span>
                  <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.currentTarget.value)} className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600">
                    <option value="">All assignees</option>
                    {assignees.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                  </select>
                </label>
                <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
              </div>
            </div>
          )}
        </div>

        <div className="inline-flex h-8 rounded-md border border-slate-200 bg-slate-50 p-0.5">
          <button type="button" onClick={() => setMode("board")} className={`inline-flex items-center gap-1 rounded px-2 text-[10px] font-bold ${mode === "board" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
            <Columns3 className="h-3.5 w-3.5" /> Board
          </button>
          <button type="button" onClick={() => setMode("list")} className={`inline-flex items-center gap-1 rounded px-2 text-[10px] font-bold ${mode === "list" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>

        <KanbanSettingsDialog project={project} canManage={canManage} />
      </div>

      {moveError && <div className="rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{moveError}</div>}

      {filteredTasks.length ? (
        mode === "board" ? (
          <div className="overflow-x-auto pb-1">
            <TaskBoard
              tasks={filteredTasks}
              columns={columns}
              canMove={canMove}
              attachmentCounts={attachmentCounts}
              onMoveColumn={(task, column) => void moveTask(task, column)}
              onOpen={setSelectedTask}
              onDiscuss={setDiscussionTask}
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">Task</th>
                  <th className="px-3 py-2">Column</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Assignee</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="w-24 px-3 py-2">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((task) => {
                  const column = getTaskKanbanColumn(task, columns);
                  return (
                    <tr key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer text-xs text-slate-600 hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <div className="max-w-[320px] truncate font-bold text-slate-900">{task.title}</div>
                        <div className="mt-0.5 text-[10px] font-semibold text-slate-400">{task.code || "Task"}</div>
                      </td>
                      <td className="px-3 py-2.5 font-semibold">{column?.name || task.status.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2.5"><ProjectStatusBadge status={task.priority} /></td>
                      <td className="px-3 py-2.5 font-semibold">{getAssigneeName(task)}</td>
                      <td className="px-3 py-2.5 text-slate-500">{task.dueDate || "—"}</td>
                      <td className="px-3 py-2.5 text-slate-500">{formatCreatedAt(task.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {attachmentCounts[task.id] > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500"><Paperclip className="h-3.5 w-3.5" />{attachmentCounts[task.id]}</span>}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDiscussionTask(task);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                            aria-label={`Open discussion for ${task.title}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <EmptyState title="No matching tasks" description="Adjust your search or filters, or create a new task for this project." />
      )}

      {!canMove && (
        <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          You can view this board, but moving tasks requires project task permission.
        </div>
      )}

      <TaskDetailsModal
        projectId={project.id}
        task={selectedTask}
        columns={columns}
        open={Boolean(selectedTask)}
        canEdit={canMove}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />

      <TaskDiscussionDialog
        projectId={project.id}
        task={discussionTask}
        open={Boolean(discussionTask)}
        onOpenChange={(open) => {
          if (!open) setDiscussionTask(null);
        }}
      />
    </div>
  );
}
