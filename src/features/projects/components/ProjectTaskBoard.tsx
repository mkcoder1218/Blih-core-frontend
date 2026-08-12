import { useEffect, useMemo, useState } from "react";
import { Columns3, Filter, List, MessageCircle, Paperclip, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
const ALL = "__all__";

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
      <Card size="sm" className="gap-0 rounded-md py-0 shadow-none ring-1 ring-border">
        <CardContent className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 text-xs text-muted-foreground">
          <span><span className="tabular-nums text-foreground">{filteredTasks.length}</span> visible</span>
          <span><span className="tabular-nums text-foreground">{activeTasks.length}</span> active</span>
          <span><span className="tabular-nums text-destructive">{blockedTasks.length}</span> blocked</span>
          <span><span className="tabular-nums text-emerald-600">{doneTasks.length}</span> done</span>
          <span className="ml-auto hidden lg:inline">{columns.length} columns</span>
        </CardContent>
      </Card>

      <Card size="sm" className="gap-0 rounded-md py-0 shadow-none ring-1 ring-border">
        <CardContent className="flex flex-wrap items-center gap-2 px-2 py-2">
          <div className="relative min-w-[260px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="Search tasks" className="h-8 rounded-md pl-8 text-xs" />
          </div>

          <div className="hidden items-center gap-1 xl:flex">
            {visibleAssignees.map((person) => {
              const active = assigneeFilter === person.id;
              return (
                <Button key={person.id} type="button" size="sm" variant={active ? "secondary" : "outline"} onClick={() => setAssigneeFilter(active ? "" : person.id)} title={person.email || person.name} className="max-w-36 rounded-md font-normal">
                  <Avatar size="sm"><AvatarFallback className="text-[9px]">{getInitials(person.name) || "U"}</AvatarFallback></Avatar>
                  <span className="truncate">{person.name}</span>
                </Button>
              );
            })}
            {hiddenAssignees > 0 ? <Badge variant="outline" className="h-7 rounded-md px-2 font-normal">+{hiddenAssignees}</Badge> : null}
          </div>

          <Popover>
            <PopoverTrigger render={<Button type="button" variant="outline" size="sm" className="rounded-md" />}>
              <Filter className="size-3.5" /> Filters
              {activeFilterCount ? <Badge variant="secondary" className="ml-1 h-4 rounded-sm px-1 text-[10px] font-normal">{activeFilterCount}</Badge> : null}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 rounded-md">
              <PopoverHeader><PopoverTitle>Filters</PopoverTitle></PopoverHeader>
              <div className="grid gap-2.5">
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Core status</span>
                  <Select value={status || ALL} onValueChange={(value) => setStatus(value === ALL ? "" : String(value ?? ""))}>
                    <SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={ALL}>All statuses</SelectItem>{TASK_STATUSES.map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Priority</span>
                  <Select value={priority || ALL} onValueChange={(value) => setPriority(value === ALL ? "" : String(value ?? ""))}>
                    <SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={ALL}>All priorities</SelectItem>{PRIORITIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Due date</span>
                  <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.currentTarget.value)} className="rounded-md" />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Assignee</span>
                  <Select value={assigneeFilter || ALL} onValueChange={(value) => setAssigneeFilter(value === ALL ? "" : String(value ?? ""))}>
                    <SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={ALL}>All assignees</SelectItem>{assignees.map((person) => <SelectItem key={person.id} value={person.id}>{person.name}</SelectItem>)}</SelectContent>
                  </Select>
                </label>
                <Button type="button" variant="outline" size="sm" onClick={clearFilters} className="rounded-md">Clear filters</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Tabs value={mode} onValueChange={(value) => setMode(value as BoardMode)} className="gap-0">
            <TabsList className="h-8 rounded-md p-0.5">
              <TabsTrigger value="board" className="rounded-sm px-2 text-xs"><Columns3 className="size-3.5" />Board</TabsTrigger>
              <TabsTrigger value="list" className="rounded-sm px-2 text-xs"><List className="size-3.5" />List</TabsTrigger>
            </TabsList>
          </Tabs>

          <KanbanSettingsDialog project={project} canManage={canManage} />
        </CardContent>
      </Card>

      {moveError ? <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">{moveError}</div> : null}

      {filteredTasks.length ? (
        mode === "board" ? (
          <div className="overflow-x-auto pb-1">
            <TaskBoard tasks={filteredTasks} columns={columns} canMove={canMove} attachmentCounts={attachmentCounts} onMoveColumn={(task, column) => void moveTask(task, column)} onOpen={setSelectedTask} onDiscuss={setDiscussionTask} />
          </div>
        ) : (
          <Card className="gap-0 overflow-x-auto rounded-md py-0 shadow-none ring-1 ring-border">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Task</th><th className="px-3 py-2 font-medium">Column</th><th className="px-3 py-2 font-medium">Priority</th><th className="px-3 py-2 font-medium">Assignee</th><th className="px-3 py-2 font-medium">Due</th><th className="px-3 py-2 font-medium">Created</th><th className="w-24 px-3 py-2 font-medium">Activity</th></tr></thead>
              <tbody className="divide-y divide-border">
                {filteredTasks.map((task) => {
                  const column = getTaskKanbanColumn(task, columns);
                  return (
                    <tr key={task.id} onClick={() => setSelectedTask(task)} className="cursor-pointer text-muted-foreground transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2.5"><div className="max-w-[320px] truncate font-medium text-foreground">{task.title}</div><div className="mt-0.5 text-[10px]">{task.code || "Task"}</div></td>
                      <td className="px-3 py-2.5">{column?.name || task.status.replace(/_/g, " ")}</td>
                      <td className="px-3 py-2.5"><ProjectStatusBadge status={task.priority} /></td>
                      <td className="px-3 py-2.5">{getAssigneeName(task)}</td>
                      <td className="px-3 py-2.5">{task.dueDate || "—"}</td>
                      <td className="px-3 py-2.5">{formatCreatedAt(task.createdAt)}</td>
                      <td className="px-3 py-2.5"><div className="flex items-center gap-1">{attachmentCounts[task.id] > 0 ? <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[10px] font-normal"><Paperclip className="size-3" />{attachmentCounts[task.id]}</Badge> : null}<Button type="button" variant="ghost" size="icon-xs" onClick={(event) => { event.stopPropagation(); setDiscussionTask(task); }} aria-label={`Open discussion for ${task.title}`}><MessageCircle className="size-3.5" /></Button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )
      ) : <EmptyState title="No matching tasks" description="Adjust your search or filters, or create a new task for this project." />}

      {!canMove ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">You can view this board, but moving tasks requires project task permission.</div> : null}

      <TaskDetailsModal projectId={project.id} task={selectedTask} columns={columns} open={Boolean(selectedTask)} canEdit={canMove} onOpenChange={(nextOpen) => { if (!nextOpen) setSelectedTask(null); }} />
      <TaskDiscussionDialog projectId={project.id} task={discussionTask} open={Boolean(discussionTask)} onOpenChange={(nextOpen) => { if (!nextOpen) setDiscussionTask(null); }} />
    </div>
  );
}
