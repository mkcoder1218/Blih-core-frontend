import { useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { TASK_STATUSES, projectStatusLabel } from "../schemas";
import type { ProjectTask, ProjectTaskStatus } from "../types";

const BOARD_STATUSES = TASK_STATUSES.filter((status) => status !== "CANCELLED");

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

function TaskCard({
  task,
  canMove,
  onOpen,
  onDiscuss,
}: {
  task: ProjectTask;
  canMove: boolean;
  onOpen?: (task: ProjectTask) => void;
  onDiscuss?: (task: ProjectTask) => void;
}) {
  return (
    <article
      draggable={canMove}
      onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
      onClick={() => onOpen?.(task)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onOpen) {
          e.preventDefault();
          onOpen(task);
        }
      }}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm outline-none transition hover:border-blue-200 hover:shadow-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${canMove ? "cursor-grab active:cursor-grabbing" : onOpen ? "cursor-pointer" : ""}`}
    >
      <div className="text-xs font-bold text-slate-900">{task.title}</div>
      <div className="mt-1 text-[11px] text-slate-500">{task.project?.title || task.code || "Task"}</div>
      <div className="mt-3 flex items-center justify-between">
        <ProjectStatusBadge status={task.priority} />
        <span className="text-[10px] text-slate-400">{task.dueDate || "No due date"}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <span className="text-[10px] font-semibold text-slate-400">{task.code || "Task"}</span>
        <div className="flex items-center gap-1.5">
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
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          )}
          <span
            title={getAssigneeName(task)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-blue-600 text-[10px] font-black text-white shadow-sm"
          >
            {getInitials(getAssigneeName(task)) || "U"}
          </span>
        </div>
      </div>
    </article>
  );
}

function TaskColumn({
  status,
  tasks,
  allTasks,
  canMove,
  onMove,
  onOpen,
  onDiscuss,
}: {
  status: ProjectTaskStatus;
  tasks: ProjectTask[];
  allTasks: ProjectTask[];
  canMove: boolean;
  onMove?: (task: ProjectTask, status: string) => void;
  onOpen?: (task: ProjectTask) => void;
  onDiscuss?: (task: ProjectTask) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 158,
    overscan: 6,
  });

  return (
    <section
      onDragOver={(e) => canMove && e.preventDefault()}
      onDrop={(e) => {
        if (!canMove) return;
        const taskId = e.dataTransfer.getData("text/plain");
        const task = allTasks.find((item) => item.id === taskId);
        if (task && task.status !== status) onMove?.(task, status);
      }}
      className="flex max-h-[70vh] min-h-[320px] flex-col rounded-lg border border-slate-200 bg-slate-50"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-3 py-2">
        <span className="text-xs font-bold text-slate-700">{projectStatusLabel(status)}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{tasks.length}</span>
      </div>
      {tasks.length ? (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const task = tasks[virtualItem.index];
              return (
                <div
                  key={task.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  className="absolute left-0 top-0 w-full pb-2"
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
                >
                  <TaskCard task={task} canMove={canMove} onOpen={onOpen} onDiscuss={onDiscuss} />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-2">
          <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-[11px] text-slate-400">No tasks</div>
        </div>
      )}
    </section>
  );
}

export function TaskBoard({
  tasks,
  canMove = false,
  onMove,
  onOpen,
  onDiscuss,
}: {
  tasks: ProjectTask[];
  canMove?: boolean;
  onMove?: (task: ProjectTask, status: string) => void;
  onOpen?: (task: ProjectTask) => void;
  onDiscuss?: (task: ProjectTask) => void;
}) {
  return (
    <div className="grid min-w-[960px] grid-cols-6 gap-3">
      {BOARD_STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section key={status}>
            <TaskColumn
              status={status}
              tasks={columnTasks}
              allTasks={tasks}
              canMove={canMove}
              onMove={onMove}
              onOpen={onOpen}
              onDiscuss={onDiscuss}
            />
          </section>
        );
      })}
    </div>
  );
}
