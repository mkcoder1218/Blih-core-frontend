import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeSelect } from "./EmployeeSelect";
import { PROJECT_STATUSES, assertNonEmpty } from "../schemas";
import { useCreateProject } from "../hooks";
import { useClients } from "../../../hooks/useClients";

const NONE = "__none__";

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

export function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [issuedCredentials, setIssuedCredentials] = useState<{ email: string; password: string | null; portalUrl: string } | null>(null);
  const [form, setForm] = useState({ title: "", code: "", ownerEmployeeId: "", managerEmployeeId: "", status: "DRAFT", priority: "NORMAL", startDate: "", endDate: "", clientMode: "existing", clientId: "", clientCompanyName: "", clientContactName: "", clientEmail: "", clientPhone: "", issueClientLogin: false, clientPassword: "" });
  const createProject = useCreateProject();
  const clients = useClients();
  const updateForm = (key: keyof typeof form, value: string | boolean) => setForm((previous) => ({ ...previous, [key]: value }));

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
        newClient: form.clientMode === "new" ? { companyName: form.clientCompanyName, contactName: form.clientContactName || undefined, email: form.clientEmail || undefined, phone: form.clientPhone || undefined } : undefined,
        clientPortalUser: form.issueClientLogin ? { fullName: form.clientContactName || form.clientCompanyName || undefined, email: form.clientEmail || clients.data?.find((client) => client.id === form.clientId)?.email || undefined, phone: form.clientPhone || undefined, password: form.clientPassword || undefined } : undefined,
      } as any);
      if (project?.clientPortalUser?.email) setIssuedCredentials({ email: project.clientPortalUser.email, password: project.clientPortalUser.temporaryPassword || form.clientPassword || null, portalUrl: `${window.location.origin}/client-portal` });
      else setOpen(false);
      setForm({ title: "", code: "", ownerEmployeeId: "", managerEmployeeId: "", status: "DRAFT", priority: "NORMAL", startDate: "", endDate: "", clientMode: "existing", clientId: "", clientCompanyName: "", clientContactName: "", clientEmail: "", clientPhone: "", issueClientLogin: false, clientPassword: "" });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError?.message || "Could not create project.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setIssuedCredentials(null); }}>
      <DialogTrigger render={<Button size="sm" />}><Plus className="size-3.5" />New project</DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Create project</DialogTitle></DialogHeader>

        {issuedCredentials ? (
          <div className="space-y-2.5">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Client portal login created. Share these credentials with the client.</div>
            <Card size="sm" className="rounded-md shadow-none ring-1 ring-border"><CardContent className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1"><FieldLabel>Email</FieldLabel><Input readOnly value={issuedCredentials.email} className="rounded-md bg-muted/30" /></label>
              <label className="grid gap-1"><FieldLabel>Password</FieldLabel><Input readOnly value={issuedCredentials.password || "Use the existing password for this email"} className="rounded-md bg-muted/30" /></label>
              <label className="grid gap-1 sm:col-span-2"><FieldLabel>Login URL</FieldLabel><Input readOnly value={issuedCredentials.portalUrl} className="rounded-md bg-muted/30" /></label>
            </CardContent></Card>
          </div>
        ) : (
          <div className="space-y-2.5">
            <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
              <CardHeader className="pb-0"><CardTitle>Project details</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 sm:col-span-2"><FieldLabel>Project name</FieldLabel><Input value={form.title} onChange={(event) => updateForm("title", event.currentTarget.value)} className="rounded-md" /></label>
                <label className="grid gap-1"><FieldLabel>Code</FieldLabel><Input value={form.code} onChange={(event) => updateForm("code", event.currentTarget.value)} className="rounded-md" /></label>
                <label className="grid gap-1"><FieldLabel>Status</FieldLabel><Select value={form.status} onValueChange={(value) => updateForm("status", String(value ?? "DRAFT"))}><SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STATUSES.filter((status) => status !== "ARCHIVED").map((status) => <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></label>
                <label className="grid gap-1"><FieldLabel>Owner</FieldLabel><EmployeeSelect value={form.ownerEmployeeId} onChange={(value) => updateForm("ownerEmployeeId", value)} placeholder="Select owner" /></label>
                <label className="grid gap-1"><FieldLabel>Manager</FieldLabel><EmployeeSelect value={form.managerEmployeeId} onChange={(value) => updateForm("managerEmployeeId", value)} placeholder="Select manager" /></label>
                <label className="grid gap-1"><FieldLabel>Start date</FieldLabel><Input type="date" value={form.startDate} onChange={(event) => updateForm("startDate", event.currentTarget.value)} className="rounded-md" /></label>
                <label className="grid gap-1"><FieldLabel>End date</FieldLabel><Input type="date" value={form.endDate} onChange={(event) => updateForm("endDate", event.currentTarget.value)} className="rounded-md" /></label>
              </CardContent>
            </Card>

            <Card size="sm" className="rounded-md bg-muted/20 shadow-none ring-1 ring-border">
              <CardHeader className="pb-0"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Client access</CardTitle><Tabs value={form.clientMode} onValueChange={(value) => updateForm("clientMode", String(value ?? "existing"))} className="gap-0"><TabsList className="h-7 rounded-md"><TabsTrigger value="existing" className="rounded-sm px-2 text-xs">Existing</TabsTrigger><TabsTrigger value="new" className="rounded-sm px-2 text-xs">New</TabsTrigger></TabsList></Tabs></div></CardHeader>
              <CardContent className="space-y-3">
                {form.clientMode === "existing" ? <label className="grid gap-1"><FieldLabel>Client</FieldLabel><Select value={form.clientId || NONE} onValueChange={(value) => updateForm("clientId", value === NONE ? "" : String(value ?? ""))}><SelectTrigger className="w-full rounded-md bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={NONE}>No client linked</SelectItem>{(clients.data ?? []).map((client) => <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>)}</SelectContent></Select></label> : <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1"><FieldLabel>Company</FieldLabel><Input value={form.clientCompanyName} onChange={(event) => updateForm("clientCompanyName", event.currentTarget.value)} className="rounded-md bg-background" /></label><label className="grid gap-1"><FieldLabel>Contact</FieldLabel><Input value={form.clientContactName} onChange={(event) => updateForm("clientContactName", event.currentTarget.value)} className="rounded-md bg-background" /></label></div>}
                <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={form.issueClientLogin} onChange={(event) => updateForm("issueClientLogin", event.currentTarget.checked)} className="size-4 rounded border-border" />Create or update client portal login</label>
                {form.issueClientLogin ? <div className="grid gap-3 sm:grid-cols-3"><Input placeholder="Client email" value={form.clientEmail} onChange={(event) => updateForm("clientEmail", event.currentTarget.value)} className="rounded-md bg-background" /><Input placeholder="Client phone" value={form.clientPhone} onChange={(event) => updateForm("clientPhone", event.currentTarget.value)} className="rounded-md bg-background" /><Input placeholder="Password (optional)" value={form.clientPassword} onChange={(event) => updateForm("clientPassword", event.currentTarget.value)} className="rounded-md bg-background" /></div> : null}
              </CardContent>
            </Card>
          </div>
        )}

        {error ? <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{issuedCredentials ? "Close" : "Cancel"}</Button>{!issuedCredentials ? <Button onClick={() => void submit()} disabled={createProject.isPending}>Create</Button> : null}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
