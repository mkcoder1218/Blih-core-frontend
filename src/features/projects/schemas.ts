import type { ProjectStatus, ProjectTaskStatus } from "./types";

export const PROJECT_STATUSES: ProjectStatus[] = ["DRAFT", "PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED", "ARCHIVED"];
export const TASK_STATUSES: ProjectTaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED", "DONE", "CANCELLED"];

export function projectStatusLabel(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} is required`);
}
