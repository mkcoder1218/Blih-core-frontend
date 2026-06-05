import { StatusBadge } from "@/components/ui/blih";

const statusMap = {
  DRAFT: { label: "Draft", tone: "slate" as const },
  PLANNED: { label: "Planned", tone: "blue" as const },
  ACTIVE: { label: "Active", tone: "emerald" as const },
  ON_HOLD: { label: "On Hold", tone: "amber" as const },
  COMPLETED: { label: "Completed", tone: "emerald" as const },
  CANCELLED: { label: "Cancelled", tone: "rose" as const },
  ARCHIVED: { label: "Archived", tone: "slate" as const },
  BACKLOG: { label: "Backlog", tone: "slate" as const },
  TODO: { label: "To Do", tone: "blue" as const },
  IN_PROGRESS: { label: "In Progress", tone: "blue" as const },
  IN_REVIEW: { label: "In Review", tone: "violet" as const },
  BLOCKED: { label: "Blocked", tone: "rose" as const },
  DONE: { label: "Done", tone: "emerald" as const },
};

export function ProjectStatusBadge({ status }: { status?: string }) {
  return <StatusBadge status={status || "DRAFT"} map={statusMap} />;
}
