import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeSelect } from "./EmployeeSelect";
import { TASK_STATUSES, assertNonEmpty } from "../schemas";
import { useCreateProjectTask } from "../hooks";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function CreateTaskModal({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    assigneeEmployeeId: "",
    status: "TODO",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
  });
  const createTask = useCreateProjectTask(projectId);

  const submit = async () => {
    try {
      setError("");
      assertNonEmpty(form.title, "Task title");
      await createTask.mutateAsync({
        ...form,
        description: form.description || undefined,
        assigneeEmployeeId: form.assigneeEmployeeId || undefined,
        startDate: form.startDate || undefined,
        dueDate: form.dueDate || undefined,
      });
      setOpen(false);
      setForm({ title: "", description: "", assigneeEmployeeId: "", status: "TODO", priority: "MEDIUM", startDate: "", dueDate: "" });
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Could not create task.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        New Task
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-600">Task title</span>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-600">Description</span>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Assignee</span>
            <EmployeeSelect value={form.assigneeEmployeeId} onChange={(v) => setForm((p) => ({ ...p, assigneeEmployeeId: v }))} placeholder="Select assignee" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Status</span>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Priority</span>
            <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Start date</span>
            <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Due date</span>
            <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
        </div>
        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createTask.isPending}>Create Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
