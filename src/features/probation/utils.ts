import type { StatCardTone } from "@/components/ui/blih";
import type { ProbationDashboardRow } from "./types";

export function formatProbationDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getProbationStatusTone(status: string): StatCardTone {
  const normalized = status.toLowerCase();

  if (normalized.includes("pending")) return "rose";
  if (normalized.includes("complete") || normalized.includes("pass")) return "emerald";
  if (normalized.includes("ending") || normalized.includes("extend")) return "amber";
  return "blue";
}

export function getProbationDepartments(rows: ProbationDashboardRow[]) {
  const departments = new Map<string, string>();

  rows.forEach((row) => {
    if (row.department?.id) departments.set(row.department.id, row.department.name);
  });

  return Array.from(departments, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

