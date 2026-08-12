import type { Project, ProjectKanbanColumn, ProjectKanbanCoreStatus, ProjectTask } from "./types";

export const KANBAN_CORE_STATUSES: Array<{ value: ProjectKanbanCoreStatus; label: string }> = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "DONE", label: "Done" },
];

export const DEFAULT_PROJECT_KANBAN_COLUMNS: ProjectKanbanColumn[] = [
  { id: "backlog", name: "Backlog", status: "BACKLOG" },
  { id: "todo", name: "Todo", status: "TODO" },
  { id: "in-progress", name: "In Progress", status: "IN_PROGRESS" },
  { id: "in-review", name: "In Review", status: "IN_REVIEW" },
  { id: "blocked", name: "Blocked", status: "BLOCKED" },
  { id: "done", name: "Done", status: "DONE" },
];

const VALID_CORE_STATUSES = new Set(KANBAN_CORE_STATUSES.map((item) => item.value));

function normalizeColumn(value: any): ProjectKanbanColumn | null {
  const id = String(value?.id || "").trim();
  const name = String(value?.name || "").trim();
  const status = String(value?.status || "") as ProjectKanbanCoreStatus;
  if (!id || !name || !VALID_CORE_STATUSES.has(status)) return null;
  return { id, name, status };
}

export function getProjectKanbanColumns(project?: Project | null): ProjectKanbanColumn[] {
  const rawColumns = (project?.metadata as any)?.kanban?.columns;
  if (!Array.isArray(rawColumns)) return DEFAULT_PROJECT_KANBAN_COLUMNS.map((column) => ({ ...column }));

  const seen = new Set<string>();
  const normalized = rawColumns
    .map(normalizeColumn)
    .filter((column): column is ProjectKanbanColumn => Boolean(column))
    .filter((column) => {
      if (seen.has(column.id)) return false;
      seen.add(column.id);
      return true;
    });

  return normalized.length ? normalized : DEFAULT_PROJECT_KANBAN_COLUMNS.map((column) => ({ ...column }));
}

export function getTaskKanbanColumnId(task: ProjectTask, columns: ProjectKanbanColumn[]) {
  const saved = task.metadata?.kanbanColumnId;
  if (saved && columns.some((column) => column.id === saved)) return saved;
  return columns.find((column) => column.status === task.status)?.id || columns[0]?.id || "";
}

export function getTaskKanbanColumn(task: ProjectTask, columns: ProjectKanbanColumn[]) {
  const id = getTaskKanbanColumnId(task, columns);
  return columns.find((column) => column.id === id) || columns[0];
}

export function createKanbanColumnId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "column";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${slug}-${suffix}`;
}
