import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { ProjectTask } from "../types";

export function TaskList({ tasks }: { tasks: ProjectTask[] }) {
  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{task.title}</div>
            <div className="mt-0.5 text-xs text-slate-500">{task.project?.title || task.code || "Project task"}</div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <ProjectStatusBadge status={task.status} />
            <span className="w-24 text-right text-xs text-slate-500">{task.dueDate || "No due date"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
