import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUpdateProject } from "../hooks";
import { createKanbanColumnId, getProjectKanbanColumns, KANBAN_CORE_STATUSES } from "../kanban";
import type { Project, ProjectKanbanColumn, ProjectKanbanCoreStatus } from "../types";

export function KanbanSettingsDialog({ project, canManage }: { project: Project; canManage: boolean }) {
  const updateProject = useUpdateProject();
  const [open, setOpen] = useState(false);
  const [columns, setColumns] = useState<ProjectKanbanColumn[]>(() => getProjectKanbanColumns(project));
  const [error, setError] = useState("");

  if (!canManage) return null;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setColumns(getProjectKanbanColumns(project));
      setError("");
    }
  };

  const updateColumn = (id: string, patch: Partial<ProjectKanbanColumn>) => {
    setColumns((current) => current.map((column) => (column.id === id ? { ...column, ...patch } : column)));
  };

  const moveColumn = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= columns.length) return;
    setColumns((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const addColumn = () => {
    const name = "New column";
    setColumns((current) => [
      ...current,
      { id: createKanbanColumnId(name), name, status: "TODO" },
    ]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) return;
    setColumns((current) => current.filter((column) => column.id !== id));
  };

  const save = async () => {
    const normalized = columns.map((column) => ({ ...column, name: column.name.trim() }));
    if (!normalized.length) {
      setError("Keep at least one board column.");
      return;
    }
    if (normalized.some((column) => !column.name)) {
      setError("Every board column needs a name.");
      return;
    }

    try {
      setError("");
      await updateProject.mutateAsync({
        id: project.id,
        data: {
          metadata: {
            ...(project.metadata || {}),
            kanban: {
              version: 1,
              columns: normalized,
            },
          },
        },
      });
      setOpen(false);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          requestError?.message ||
          "Could not save board columns.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Settings2 className="h-4 w-4" />
        Board settings
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Kanban</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
            Rename and reorder columns for this project. Each column maps to a core ERP task state so progress, blocked, and done reporting continue to work.
          </div>

          <div className="space-y-2">
            {columns.map((column, index) => (
              <div key={column.id} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[32px_minmax(0,1fr)_170px_auto] sm:items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-xs font-black text-slate-500">
                  {index + 1}
                </div>
                <input
                  value={column.name}
                  onChange={(event) => updateColumn(column.id, { name: event.currentTarget.value })}
                  maxLength={50}
                  className="h-9 min-w-0 rounded-md border border-slate-200 px-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500"
                  aria-label={`Column ${index + 1} name`}
                />
                <select
                  value={column.status}
                  onChange={(event) => updateColumn(column.id, { status: event.currentTarget.value as ProjectKanbanCoreStatus })}
                  className="h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 outline-none focus:border-blue-500"
                  aria-label={`${column.name} core status`}
                >
                  {KANBAN_CORE_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-end gap-1">
                  <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => moveColumn(index, -1)} aria-label={`Move ${column.name} left`}>
                    <ArrowUp className="h-4 w-4 sm:-rotate-90" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" disabled={index === columns.length - 1} onClick={() => moveColumn(index, 1)} aria-label={`Move ${column.name} right`}>
                    <ArrowDown className="h-4 w-4 sm:-rotate-90" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" disabled={columns.length <= 1} onClick={() => removeColumn(column.id)} aria-label={`Remove ${column.name}`}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-4 w-4" /> Add column
          </Button>

          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={updateProject.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void save()} disabled={updateProject.isPending}>
            {updateProject.isPending ? "Saving..." : "Save board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
