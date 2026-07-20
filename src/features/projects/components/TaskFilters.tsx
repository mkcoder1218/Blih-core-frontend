import { Search } from "lucide-react";
import { TASK_STATUSES } from "../schemas";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function TaskFilters({
  search,
  status,
  priority,
  due,
  onSearch,
  onStatus,
  onPriority,
  onDue,
}: {
  search: string;
  status: string;
  priority: string;
  due: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onPriority: (value: string) => void;
  onDue: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:flex-row">
      <div className="relative min-w-[220px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => onSearch(e.currentTarget.value)} placeholder="Search tasks" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500" />
      </div>
      <select value={status} onChange={(e) => onStatus(e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
      </select>
      <select value={priority} onChange={(e) => onPriority(e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600">
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <input type="date" value={due} onChange={(e) => onDue(e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600" />
    </div>
  );
}
