import { Card } from "@/components/ui/card";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { ProjectTask } from "../types";

export function TaskList({ tasks }: { tasks: ProjectTask[] }) {
  return (
    <Card className="gap-0 divide-y divide-border rounded-md py-0 shadow-none ring-1 ring-border">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{task.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {task.project?.title || task.code || "Project task"}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ProjectStatusBadge status={task.status} />
            <span className="w-24 text-right text-xs text-muted-foreground">
              {task.dueDate || "No due date"}
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}
