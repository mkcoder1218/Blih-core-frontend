import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmployeeSelect } from "./EmployeeSelect";
import { PROJECT_STATUSES, assertNonEmpty } from "../schemas";
import { useCreateProject } from "../hooks";
import { useClients } from "../../../hooks/useClients";

export function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [issuedCredentials, setIssuedCredentials] = useState<{ email: string; password: string | null; portalUrl: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    code: "",
    ownerEmployeeId: "",
    managerEmployeeId: "",
    status: "DRAFT",
    priority: "NORMAL",
    startDate: "",
    endDate: "",
    clientMode: "existing",
    clientId: "",
    clientCompanyName: "",
    clientContactName: "",
    clientEmail: "",
    clientPhone: "",
    issueClientLogin: false,
    clientPassword: "",
  });
  const createProject = useCreateProject();
  const clients = useClients();

  const updateForm = (key: keyof typeof form, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const submit = async () => {
    try {
      setError("");
      assertNonEmpty(form.title, "Project name");
      const project: any = await createProject.mutateAsync({
        ...form,
        code: form.code || undefined,
        ownerEmployeeId: form.ownerEmployeeId || undefined,
        managerEmployeeId: form.managerEmployeeId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        clientId: form.clientMode === "existing" && form.clientId ? form.clientId : undefined,
        newClient: form.clientMode === "new" ? {
          companyName: form.clientCompanyName,
          contactName: form.clientContactName || undefined,
          email: form.clientEmail || undefined,
          phone: form.clientPhone || undefined,
        } : undefined,
        clientPortalUser: form.issueClientLogin ? {
          fullName: form.clientContactName || form.clientCompanyName || undefined,
          email: form.clientEmail || clients.data?.find((client) => client.id === form.clientId)?.email || undefined,
          phone: form.clientPhone || undefined,
          password: form.clientPassword || undefined,
        } : undefined,
      } as any);
      if (project?.clientPortalUser?.email) {
        setIssuedCredentials({
          email: project.clientPortalUser.email,
          password: project.clientPortalUser.temporaryPassword || form.clientPassword || null,
          portalUrl: `${window.location.origin}/client-portal`,
        });
      } else {
        setOpen(false);
      }
      setForm({ title: "", code: "", ownerEmployeeId: "", managerEmployeeId: "", status: "DRAFT", priority: "NORMAL", startDate: "", endDate: "", clientMode: "existing", clientId: "", clientCompanyName: "", clientContactName: "", clientEmail: "", clientPhone: "", issueClientLogin: false, clientPassword: "" });
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Could not create project.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setIssuedCredentials(null); }}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        New Project
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
        </DialogHeader>
        {issuedCredentials ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <h3 className="text-sm font-black text-emerald-800">Client portal login created</h3>
              <p className="mt-1 text-sm font-semibold text-emerald-700">Share these credentials with the client so they can sign in at /client-portal.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">Email</span>
                <input readOnly value={issuedCredentials.email} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">Password</span>
                <input readOnly value={issuedCredentials.password || "Use the existing password for this email"} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold" />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-bold text-slate-600">Login URL</span>
                <input readOnly value={issuedCredentials.portalUrl} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold" />
              </label>
            </div>
          </div>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-bold text-slate-600">Project name</span>
            <input value={form.title} onChange={(e) => updateForm("title", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Code</span>
            <input value={form.code} onChange={(e) => updateForm("code", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-blue-500" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Status</span>
            <select value={form.status} onChange={(e) => updateForm("status", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm">
              {PROJECT_STATUSES.filter((s) => s !== "ARCHIVED").map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Owner</span>
            <EmployeeSelect value={form.ownerEmployeeId} onChange={(v) => updateForm("ownerEmployeeId", v)} placeholder="Select owner" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Manager</span>
            <EmployeeSelect value={form.managerEmployeeId} onChange={(v) => updateForm("managerEmployeeId", v)} placeholder="Select manager" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">Start date</span>
            <input type="date" value={form.startDate} onChange={(e) => updateForm("startDate", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-bold text-slate-600">End date</span>
            <input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </label>
          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500">Client access</span>
              <button type="button" onClick={() => updateForm("clientMode", "existing")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${form.clientMode === "existing" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>Existing</button>
              <button type="button" onClick={() => updateForm("clientMode", "new")} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${form.clientMode === "new" ? "bg-blue-600 text-white" : "bg-white text-slate-600"}`}>New</button>
            </div>
            {form.clientMode === "existing" ? (
              <label>
                <span className="mb-1 block text-xs font-bold text-slate-600">Client</span>
                <select value={form.clientId} onChange={(e) => updateForm("clientId", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                  <option value="">No client linked</option>
                  {(clients.data ?? []).map((client) => <option key={client.id} value={client.id}>{client.companyName}</option>)}
                </select>
              </label>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-600">Company</span>
                  <input value={form.clientCompanyName} onChange={(e) => updateForm("clientCompanyName", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-slate-600">Contact</span>
                  <input value={form.clientContactName} onChange={(e) => updateForm("clientContactName", e.currentTarget.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                </label>
              </div>
            )}
            <label className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={form.issueClientLogin} onChange={(e) => updateForm("issueClientLogin", e.currentTarget.checked)} />
              Create or update client portal login
            </label>
            {form.issueClientLogin && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input placeholder="Client email" value={form.clientEmail} onChange={(e) => updateForm("clientEmail", e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                <input placeholder="Client phone" value={form.clientPhone} onChange={(e) => updateForm("clientPhone", e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" />
                <input placeholder="Password (optional)" value={form.clientPassword} onChange={(e) => updateForm("clientPassword", e.currentTarget.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" />
              </div>
            )}
          </div>
        </div>
        )}
        {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{issuedCredentials ? "Close" : "Cancel"}</Button>
          {!issuedCredentials && <Button onClick={submit} disabled={createProject.isPending}>Create</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
