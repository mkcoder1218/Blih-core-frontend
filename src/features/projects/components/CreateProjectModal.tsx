import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeSelect } from "./EmployeeSelect";
import { PROJECT_STATUSES, assertNonEmpty } from "../schemas";
import { useCreateProject } from "../hooks";

export function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    code: "",
    ownerEmployeeId: "",
    managerEmployeeId: "",
    status: "DRAFT",
    priority: "NORMAL",
    startDate: "",
    endDate: "",
  });
  const createProject = useCreateProject();

  const submit = async () => {
    try {
      setError("");
      assertNonEmpty(form.title, "Project name");
      await createProject.mutateAsync({
        ...form,
        code: form.code || undefined,
        ownerEmployeeId: form.ownerEmployeeId || undefined,
        managerEmployeeId: form.managerEmployeeId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      } as any);
      setOpen(false);
      setForm({ title: "", code: "", ownerEmployeeId: "", managerEmployeeId: "", status: "DRAFT", priority: "NORMAL", startDate: "", endDate: "" });
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Could not create project.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        New Project
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-600">Project name</span>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Code</span>
            <input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Status</span>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
              {PROJECT_STATUSES.filter((s) => s !== "ARCHIVED").map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Owner</span>
            <EmployeeSelect value={form.ownerEmployeeId} onChange={(v) => setForm((p) => ({ ...p, ownerEmployeeId: v }))} placeholder="Select owner" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Manager</span>
            <EmployeeSelect value={form.managerEmployeeId} onChange={(v) => setForm((p) => ({ ...p, managerEmployeeId: v }))} placeholder="Select manager" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Start date</span>
            <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">End date</span>
            <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
        </div>
        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={createProject.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
