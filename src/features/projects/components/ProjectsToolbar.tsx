import { Search } from "lucide-react";
import { PROJECT_STATUSES } from "../schemas";
import { CreateProjectModal } from "./CreateProjectModal";

export function ProjectsToolbar({
  search,
  status,
  onSearch,
  onStatus,
  canCreateProject = false,
}: {
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  canCreateProject?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => onSearch(e.currentTarget.value)} placeholder="Search projects" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
        </div>
        <select value={status} onChange={(e) => onStatus(e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      {canCreateProject && <CreateProjectModal />}
    </div>
  );
}
