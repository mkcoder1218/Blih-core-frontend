import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmployeeSelect } from "./EmployeeSelect";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { ProjectTask } from "../types";
import { useDeleteProjectTask, useUpdateProjectTask } from "../hooks";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function TaskDetailsModal({
  projectId,
  task,
  open,
  canEdit,
  onOpenChange,
}: {
  projectId: string;
  task: ProjectTask | null;
  open: boolean;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateTask = useUpdateProjectTask(projectId);
  const deleteTask = useDeleteProjectTask(projectId);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeEmployeeId: "",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    weight: "",
  });

  useEffect(() => {
    if (!task) return;
    setError("");
    setForm({
      title: task.title || "",
      description: task.description || "",
      assigneeEmployeeId: task.assigneeEmployeeId || "",
      priority: task.priority || "MEDIUM",
      startDate: task.startDate || "",
      dueDate: task.dueDate || "",
      estimatedHours: String((task as any).estimatedHours ?? ""),
      actualHours: String((task as any).actualHours ?? ""),
      weight: String((task as any).weight ?? ""),
    });
  }, [task]);

  const save = async () => {
    if (!task) return;
    if (form.title.trim().length < 2) {
      setError("Task title is required.");
      return;
    }

    try {
      setError("");
      await updateTask.mutateAsync({
        taskId: task.id,
        data: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          assigneeEmployeeId: form.assigneeEmployeeId || null,
          priority: form.priority,
          startDate: form.startDate || null,
          dueDate: form.dueDate || null,
          estimatedHours: form.estimatedHours === "" ? undefined : Number(form.estimatedHours),
          actualHours: form.actualHours === "" ? undefined : Number(form.actualHours),
          weight: form.weight === "" ? undefined : Number(form.weight),
        },
      });
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not update task.");
    }
  };

  const remove = async () => {
    if (!task) return;
    const confirmed = window.confirm(`Delete "${task.title}"? This removes the task from the project.`);
    if (!confirmed) return;

    try {
      setError("");
      await deleteTask.mutateAsync(task.id);
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || "Could not delete task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{canEdit ? "Edit Task" : "Task Details"}</DialogTitle>
        </DialogHeader>

        {task && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={task.status} />
              <ProjectStatusBadge status={task.priority} />
              <span className="text-xs font-bold text-slate-400">{task.code || "Task"}</span>
            </div>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-600">Task title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.currentTarget.value }))}
                disabled={!canEdit}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-slate-600">Description</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.currentTarget.value }))}
                disabled={!canEdit}
                className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Assignee</span>
              <EmployeeSelect value={form.assigneeEmployeeId} onChange={(v) => setForm((p) => ({ ...p, assigneeEmployeeId: v }))} placeholder="Select assignee" disabled={!canEdit} />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Priority</span>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.currentTarget.value }))}
                disabled={!canEdit}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50"
              >
                {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Start date</span>
              <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.currentTarget.value }))} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Due date</span>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.currentTarget.value }))} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Estimated hours</span>
              <input type="number" min="0" value={form.estimatedHours} onChange={(e) => setForm((p) => ({ ...p, estimatedHours: e.currentTarget.value }))} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Actual hours</span>
              <input type="number" min="0" value={form.actualHours} onChange={(e) => setForm((p) => ({ ...p, actualHours: e.currentTarget.value }))} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>

            <label>
              <span className="mb-1 block text-xs font-bold text-slate-600">Weight</span>
              <input type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => setForm((p) => ({ ...p, weight: e.currentTarget.value }))} disabled={!canEdit} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm disabled:bg-slate-50" />
            </label>
          </div>
        )}

        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}

        <DialogFooter className="gap-2 sm:justify-between">
          {canEdit && (
            <Button variant="destructive" onClick={remove} disabled={deleteTask.isPending}>
              <Trash2 className="h-4 w-4" /> {deleteTask.isPending ? "Deleting..." : "Delete"}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {canEdit && <Button onClick={save} disabled={updateTask.isPending}>{updateTask.isPending ? "Saving..." : "Save Task"}</Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
