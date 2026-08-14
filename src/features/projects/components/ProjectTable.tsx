import { Card } from "@/components/ui/card";
import { useMe } from "../../../hooks/useMe";
import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { Project } from "../types";

export function ProjectTable({
  projects,
  onOpen,
}: {
  projects: Project[];
  onOpen?: (project: Project) => void;
}) {
  const me = useMe();
  const roles: string[] = (me.data?.data?.roles || []) as string[];
  const canSeeClients =
    roles.includes("BUSINESS_ADMIN") || roles.includes("PROJECT_MANAGER");

  const progressFor = (project: Project) =>
    project.progressPercent ?? project.metadata?.progress?.progressPercent ?? 0;

  return (
    <Card className="gap-0 overflow-x-auto rounded-md py-0 shadow-none ring-1 ring-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Project</th>
            {canSeeClients ? (
              <th className="px-3 py-2 font-medium">Client</th>
            ) : null}
            <th className="px-3 py-2 font-medium">Owner</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Progress</th>
            <th className="px-3 py-2 font-medium">Timeline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {projects.map((project) => {
            const progress = Math.max(0, Math.min(100, progressFor(project)));

            return (
              <tr
                key={project.id}
                onClick={() => onOpen?.(project)}
                className={`transition-colors hover:bg-muted/30 ${
                  onOpen ? "cursor-pointer" : ""
                }`}
              >
                <td className="px-3 py-2.5">
                  <div className="font-medium text-foreground">{project.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {project.code || "No code"}
                  </div>
                </td>
                {canSeeClients ? (
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {project.Client?.companyName || "No client"}
                  </td>
                ) : null}
                <td className="px-3 py-2.5 text-muted-foreground">
                  {project.owner?.user?.fullName ||
                    project.manager?.user?.fullName ||
                    "Unassigned"}
                </td>
                <td className="px-3 py-2.5">
                  <ProjectStatusBadge status={project.status} />
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-sm bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {project.startDate || "No start"} → {project.endDate || "No end"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
