import { useRef } from "react";
import { Clock3, Eye, MessageCircle, Paperclip } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { DEFAULT_PROJECT_KANBAN_COLUMNS, getTaskKanbanColumnId } from "../kanban";
import type { ProjectKanbanColumn, ProjectTask } from "../types";

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

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Created —";
  return `Created ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

function TaskCard({
  task,
  canMove,
  attachmentCount,
  onOpen,
  onDiscuss,
}: {
  task: ProjectTask;
  canMove: boolean;
  attachmentCount: number;
  onOpen?: (task: ProjectTask) => void;
  onDiscuss?: (task: ProjectTask) => void;
}) {
  const assignee = getAssigneeName(task);

  return (
    <Card
      size="sm"
      draggable={canMove}
      onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
      onClick={() => onOpen?.(task)}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && onOpen) {
          event.preventDefault();
          onOpen(task);
        }
      }}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      className={`group relative gap-2 rounded-md py-2 shadow-none ring-1 ring-border transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        canMove ? "cursor-grab active:cursor-grabbing" : onOpen ? "cursor-pointer" : ""
      }`}
    >
      {onOpen ? (
        <span className="pointer-events-none absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <Eye className="size-3.5" />
        </span>
      ) : null}

      <CardContent className="space-y-2 px-2.5">
        <div>
          <p className="pr-7 text-xs font-medium leading-4 text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {task.title}
          </p>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">{task.code || "Task"}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ProjectStatusBadge status={task.priority} />
          <span className="truncate text-[10px] text-muted-foreground">{task.dueDate || "No due date"}</span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock3 className="size-3 shrink-0" />
          <span className="truncate">{formatCreatedAt(task.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {attachmentCount > 0 ? (
              <Badge
                variant="outline"
                className="h-5 rounded-md px-1.5 text-[10px] font-normal text-muted-foreground"
                title={`${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`}
              >
                <Paperclip className="size-3" />
                {attachmentCount}
              </Badge>
            ) : null}
            <span className="truncate text-[10px] text-muted-foreground" title={assignee}>
              {assignee}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {onDiscuss ? (
              <Button
                type="button"
                draggable={false}
                variant="ghost"
                size="icon-xs"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onDiscuss(task);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                title="Open task discussion"
                aria-label={`Open discussion for ${task.title}`}
              >
                <MessageCircle className="size-3.5" />
              </Button>
            ) : null}

            <Avatar size="sm" title={assignee}>
              <AvatarFallback className="text-[9px]">{getInitials(assignee) || "U"}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskColumn({
  column,
  tasks,
  allTasks,
  canMove,
  attachmentCounts,
  onMove,
  onOpen,
  onDiscuss,
}: {
  column: ProjectKanbanColumn;
  tasks: ProjectTask[];
  allTasks: ProjectTask[];
  canMove: boolean;
  attachmentCounts: Record<string, number>;
  onMove?: (task: ProjectTask, column: ProjectKanbanColumn) => void;
  onOpen?: (task: ProjectTask) => void;
  onDiscuss?: (task: ProjectTask) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 140,
    overscan: 6,
  });

  return (
    <section
      onDragOver={(event) => canMove && event.preventDefault()}
      onDrop={(event) => {
        if (!canMove) return;
        const taskId = event.dataTransfer.getData("text/plain");
        const task = allTasks.find((item) => item.id === taskId);
        if (task) onMove?.(task, column);
      }}
      className="flex h-[min(66vh,650px)] min-h-[350px] w-[224px] shrink-0 flex-col overflow-hidden rounded-md bg-muted/20 ring-1 ring-border xl:w-[236px]"
    >
      <div className="flex h-9 items-center justify-between border-b border-border bg-background px-2.5">
        <span className="truncate text-xs font-medium text-foreground" title={column.name}>
          {column.name}
        </span>
        <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-[10px] font-normal">
          {tasks.length}
        </Badge>
      </div>

      {tasks.length ? (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-1.5">
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const task = tasks[virtualItem.index];
              return (
                <div
                  key={task.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  className="absolute left-0 top-0 w-full pb-1.5"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  <TaskCard
                    task={task}
                    canMove={canMove}
                    attachmentCount={attachmentCounts[task.id] || 0}
                    onOpen={onOpen}
                    onDiscuss={onDiscuss}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-1.5">
          <div className="rounded-md border border-dashed border-border px-2 py-5 text-center text-[10px] text-muted-foreground">
            No tasks
          </div>
        </div>
      )}
    </section>
  );
}

export function TaskBoard({
  tasks,
  columns = DEFAULT_PROJECT_KANBAN_COLUMNS,
  canMove = false,
  attachmentCounts = {},
  onMove,
  onMoveColumn,
  onOpen,
  onDiscuss,
}: {
  tasks: ProjectTask[];
  columns?: ProjectKanbanColumn[];
  canMove?: boolean;
  attachmentCounts?: Record<string, number>;
  onMove?: (task: ProjectTask, status: string) => void;
  onMoveColumn?: (task: ProjectTask, column: ProjectKanbanColumn) => void;
  onOpen?: (task: ProjectTask) => void;
  onDiscuss?: (task: ProjectTask) => void;
}) {
  const visibleTasks = tasks.filter((task) => task.status !== "CANCELLED");

  return (
    <div className="flex min-w-max gap-2">
      {columns.map((column) => {
        const columnTasks = visibleTasks.filter((task) => getTaskKanbanColumnId(task, columns) === column.id);
        return (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={columnTasks}
            allTasks={visibleTasks}
            canMove={canMove}
            attachmentCounts={attachmentCounts}
            onMove={(task, targetColumn) => {
              if (onMoveColumn) onMoveColumn(task, targetColumn);
              else onMove?.(task, targetColumn.status);
            }}
            onOpen={onOpen}
            onDiscuss={onDiscuss}
          />
        );
      })}
    </div>
  );
}
