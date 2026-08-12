import { useRef } from "react";
import { Clock3, Eye, MessageCircle, Paperclip } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
    <article
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
      className={`group relative rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm outline-none transition hover:border-blue-300 hover:shadow-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${canMove ? "cursor-grab active:cursor-grabbing" : onOpen ? "cursor-pointer" : ""}`}
    >
      {onOpen && (
        <span className="pointer-events-none absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-50 text-slate-400 opacity-0 transition group-hover:opacity-100">
          <Eye className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="pr-7 text-[12px] font-extrabold leading-[17px] text-slate-900 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
        {task.title}
      </div>
      <div className="mt-1 truncate text-[10px] font-semibold text-slate-400">{task.code || "Task"}</div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <ProjectStatusBadge status={task.priority} />
        <span className="truncate text-[10px] font-semibold text-slate-400">{task.dueDate || "No due date"}</span>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[9px] font-semibold text-slate-400">
        <Clock3 className="h-3 w-3 shrink-0" />
        <span className="truncate">{formatCreatedAt(task.createdAt)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="flex min-w-0 items-center gap-2">
          {attachmentCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500" title={`${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"}`}>
              <Paperclip className="h-3 w-3" /> {attachmentCount}
            </span>
          )}
          <span className="truncate text-[9px] font-semibold text-slate-400" title={assignee}>{assignee}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onDiscuss && (
            <button
              type="button"
              draggable={false}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDiscuss(task);
              }}
              onKeyDown={(event) => event.stopPropagation()}
              title="Open task discussion"
              aria-label={`Open discussion for ${task.title}`}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          )}
          <span
            title={assignee}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-blue-600 text-[9px] font-black text-white shadow-sm"
          >
            {getInitials(assignee) || "U"}
          </span>
        </div>
      </div>
    </article>
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
    estimateSize: () => 142,
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
      className="flex h-[min(66vh,650px)] min-h-[350px] w-[224px] shrink-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-50/80 xl:w-[236px]"
    >
      <div className="flex h-9 items-center justify-between border-b border-slate-200 bg-white px-2.5">
        <span className="truncate text-[11px] font-extrabold text-slate-700" title={column.name}>{column.name}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500">{tasks.length}</span>
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
          <div className="rounded-md border border-dashed border-slate-200 px-2 py-5 text-center text-[10px] font-semibold text-slate-400">No tasks</div>
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
