import { ProjectStatusBadge } from "./ProjectStatusBadge";
import { TASK_STATUSES, projectStatusLabel } from "../schemas";
import type { ProjectTask } from "../types";

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

export function TaskBoard({
  tasks,
  canMove = false,
  onMove,
}: {
  tasks: ProjectTask[];
  canMove?: boolean;
  onMove?: (task: ProjectTask, status: string) => void;
}) {
  return (
    <div className="grid min-w-[960px] grid-cols-6 gap-3">
      {BOARD_STATUSES.map((status) => {
        const columnTasks = tasks.filter((task) => task.status === status);
        return (
          <section
            key={status}
            onDragOver={(e) => canMove && e.preventDefault()}
            onDrop={(e) => {
              if (!canMove) return;
              const taskId = e.dataTransfer.getData("text/plain");
              const task = tasks.find((item) => item.id === taskId);
              if (task && task.status !== status) onMove?.(task, status);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-white/60 px-3 py-2">
              <span className="text-xs font-bold text-slate-700">{projectStatusLabel(status)}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">{columnTasks.length}</span>
            </div>
            <div className="space-y-2 p-2">
              {columnTasks.map((task) => (
                <article
                  key={task.id}
                  draggable={canMove}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  className={`rounded-lg border border-slate-200 bg-white p-3 shadow-sm ${canMove ? "cursor-grab active:cursor-grabbing" : ""}`}
                >
                  <div className="text-xs font-bold text-slate-900">{task.title}</div>
                  <div className="mt-1 text-[11px] text-slate-500">{task.project?.title || task.code || "Task"}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <ProjectStatusBadge status={task.priority} />
                    <span className="text-[10px] text-slate-400">{task.dueDate || "No due date"}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-[10px] font-semibold text-slate-400">{task.code || "Task"}</span>
                    <span
                      title={getAssigneeName(task)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-blue-600 text-[10px] font-black text-white shadow-sm"
                    >
                      {getInitials(getAssigneeName(task)) || "U"}
                    </span>
                  </div>
                </article>
              ))}
              {columnTasks.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-[11px] text-slate-400">No tasks</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
