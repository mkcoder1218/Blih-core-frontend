import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    setColumns((current) => [...current, { id: createKanbanColumnId(name), name, status: "TODO" }]);
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
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" className="rounded-md" />}>
        <Settings2 className="size-3.5" />
        Board settings
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Project Kanban</DialogTitle>
        </DialogHeader>

        <div className="space-y-2.5">
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs leading-5 text-muted-foreground">
            Rename and reorder columns for this project. Each column still maps to a core ERP task state so reporting remains consistent.
          </div>

          <div className="space-y-1.5">
            {columns.map((column, index) => (
              <Card key={column.id} size="sm" className="rounded-md py-2 shadow-none ring-1 ring-border">
                <CardContent className="grid gap-2 px-2 sm:grid-cols-[28px_minmax(0,1fr)_180px_auto] sm:items-center">
                  <div className="flex size-7 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    {index + 1}
                  </div>

                  <Input
                    value={column.name}
                    onChange={(event) => updateColumn(column.id, { name: event.currentTarget.value })}
                    maxLength={50}
                    className="rounded-md"
                    aria-label={`Column ${index + 1} name`}
                  />

                  <Select
                    value={column.status}
                    onValueChange={(value) =>
                      updateColumn(column.id, { status: String(value ?? "TODO") as ProjectKanbanCoreStatus })
                    }
                  >
                    <SelectTrigger className="w-full rounded-md" aria-label={`${column.name} core status`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KANBAN_CORE_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === 0}
                      onClick={() => moveColumn(index, -1)}
                      aria-label={`Move ${column.name} left`}
                    >
                      <ArrowUp className="size-3.5 sm:-rotate-90" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={index === columns.length - 1}
                      onClick={() => moveColumn(index, 1)}
                      aria-label={`Move ${column.name} right`}
                    >
                      <ArrowDown className="size-3.5 sm:-rotate-90" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={columns.length <= 1}
                      onClick={() => removeColumn(column.id)}
                      aria-label={`Remove ${column.name}`}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addColumn} className="rounded-md">
            <Plus className="size-3.5" />
            Add column
          </Button>

          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
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
