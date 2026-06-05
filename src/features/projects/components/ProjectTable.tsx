import { ProjectStatusBadge } from "./ProjectStatusBadge";
import type { Project } from "../types";

export function ProjectTable({ projects, onOpen }: { projects: Project[]; onOpen?: (project: Project) => void }) {
  const progressFor = (project: Project) => project.progressPercent ?? project.metadata?.progress?.progressPercent ?? 0;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Owner</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Timeline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {projects.map((project) => (
            <tr key={project.id} onClick={() => onOpen?.(project)} className={onOpen ? "cursor-pointer hover:bg-slate-50/70" : "hover:bg-slate-50/70"}>
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-900">{project.title}</div>
                <div className="text-xs text-slate-500">{project.code || "No code"}</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{project.owner?.user?.fullName || project.manager?.user?.fullName || "Unassigned"}</td>
              <td className="px-4 py-3"><ProjectStatusBadge status={project.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${progressFor(project)}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{progressFor(project)}%</span>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{project.startDate || "No start"} - {project.endDate || "No end"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
