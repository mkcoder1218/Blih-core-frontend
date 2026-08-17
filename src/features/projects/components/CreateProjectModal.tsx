import { useMemo, useState, type ReactNode } from "react";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmployeeSelect } from "./EmployeeSelect";
import { PROJECT_STATUSES, assertNonEmpty } from "../schemas";
import { useCreateProject } from "../hooks";
import { useClients } from "../../../hooks/useClients";
import { useDepartments } from "../../../hooks/useDepartments";
import { useMe } from "../../../hooks/useMe";

const NONE = "__none__";
const COMPANY_WIDE = "__company_wide__";

const EMPTY_FORM = {
  title: "",
  code: "",
  departmentId: "",
  ownerEmployeeId: "",
  managerEmployeeId: "",
  status: "DRAFT",
  priority: "NORMAL",
  startDate: "",
  endDate: "",
  clientId: "",
  clientEmail: "",
  clientPhone: "",
  issueClientLogin: false,
  clientPassword: "",
};

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

export function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [issuedCredentials, setIssuedCredentials] = useState<{
    email: string;
    password: string | null;
    portalUrl: string;
  } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const createProject = useCreateProject();
  const departments = useDepartments({ page: 1, size: 200 });
  const me = useMe();
  const roles: string[] = (me.data?.data?.roles || []) as string[];
  const canUseClients = roles.includes("BUSINESS_ADMIN") || roles.includes("PROJECT_MANAGER");
  const clients = useClients(canUseClients);

  const selectedClient = useMemo(
    () => clients.data?.find((client) => client.id === form.clientId) || null,
    [clients.data, form.clientId],
  );

  const departmentRows = useMemo(
    () => (departments.data?.departments ?? []).filter((department) => department.status !== "inactive"),
    [departments.data?.departments],
  );

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const changeDepartment = (departmentId: string) => {
    setForm((previous) => ({
      ...previous,
      departmentId,
      ownerEmployeeId: "",
      managerEmployeeId: "",
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError("");
  };

  const submit = async () => {
    try {
      setError("");
      assertNonEmpty(form.title, "Project name");

      const project: any = await createProject.mutateAsync({
        title: form.title.trim(),
        code: form.code.trim() || undefined,
        departmentId: form.departmentId || null,
        ownerEmployeeId: form.ownerEmployeeId || undefined,
        managerEmployeeId: form.managerEmployeeId || undefined,
        status: form.status as any,
        priority: form.priority as any,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        clientId: canUseClients && form.clientId ? form.clientId : undefined,
        clientPortalUser:
          canUseClients && form.clientId && form.issueClientLogin
            ? {
                fullName: selectedClient?.contactName || selectedClient?.companyName || undefined,
                email: form.clientEmail.trim() || selectedClient?.email || undefined,
                phone: form.clientPhone.trim() || selectedClient?.phone || undefined,
                password: form.clientPassword || undefined,
              }
            : undefined,
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

      resetForm();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.response?.data?.error ||
          requestError?.message ||
          "Could not create project.",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setIssuedCredentials(null);
          resetForm();
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-3.5" />
        New project
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
        </DialogHeader>

        {issuedCredentials ? (
          <div className="space-y-2.5">
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Client portal login created. Share these credentials with the client.
            </div>

            <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <FieldLabel>Email</FieldLabel>
                  <Input readOnly value={issuedCredentials.email} className="rounded-md bg-muted/30" />
                </label>
                <label className="grid gap-1">
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    readOnly
                    value={issuedCredentials.password || "Use the existing password for this email"}
                    className="rounded-md bg-muted/30"
                  />
                </label>
                <label className="grid gap-1 sm:col-span-2">
                  <FieldLabel>Login URL</FieldLabel>
                  <Input readOnly value={issuedCredentials.portalUrl} className="rounded-md bg-muted/30" />
                </label>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-2.5">
            <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
              <CardHeader className="pb-0">
                <CardTitle>Project details</CardTitle>
              </CardHeader>

              <CardContent className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 sm:col-span-2">
                  <FieldLabel>Project name</FieldLabel>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm("title", event.currentTarget.value)}
                    className="rounded-md"
                  />
                </label>

                <label className="grid gap-1">
                  <FieldLabel>Code</FieldLabel>
                  <Input
                    value={form.code}
                    onChange={(event) => updateForm("code", event.currentTarget.value)}
                    className="rounded-md"
                  />
                </label>

                <label className="grid gap-1">
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={form.status}
                    onValueChange={(value) => updateForm("status", String(value ?? "DRAFT"))}
                  >
                    <SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.filter((status) => status !== "ARCHIVED").map((status) => (
                        <SelectItem key={status} value={status}>{status.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="grid gap-1 sm:col-span-2">
                  <FieldLabel>Department</FieldLabel>
                  <Select
                    value={form.departmentId || COMPANY_WIDE}
                    onValueChange={(value) => changeDepartment(value === COMPANY_WIDE ? "" : String(value ?? ""))}
                  >
                    <SelectTrigger className="w-full rounded-md"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={COMPANY_WIDE}>Whole company</SelectItem>
                      {departmentRows.map((department) => (
                        <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-muted-foreground">
                    Choose a department to restrict owners, managers, members and task assignees to that department. Leave it company-wide to allow everyone.
                  </span>
                </label>

                <label className="grid gap-1">
                  <FieldLabel>Owner</FieldLabel>
                  <EmployeeSelect
                    value={form.ownerEmployeeId}
                    onChange={(value) => updateForm("ownerEmployeeId", value)}
                    placeholder="Select owner"
                    departmentId={form.departmentId || null}
                  />
                </label>

                <label className="grid gap-1">
                  <FieldLabel>Manager</FieldLabel>
                  <EmployeeSelect
                    value={form.managerEmployeeId}
                    onChange={(value) => updateForm("managerEmployeeId", value)}
                    placeholder="Select manager"
                    departmentId={form.departmentId || null}
                  />
                </label>

                <label className="grid gap-1">
                  <FieldLabel>Start date</FieldLabel>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(event) => updateForm("startDate", event.currentTarget.value)}
                    className="rounded-md"
                  />
                </label>

                <label className="grid gap-1">
                  <FieldLabel>End date</FieldLabel>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(event) => updateForm("endDate", event.currentTarget.value)}
                    className="rounded-md"
                  />
                </label>
              </CardContent>
            </Card>

            {canUseClients ? (
              <Card size="sm" className="rounded-md bg-muted/20 shadow-none ring-1 ring-border">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Client
                      </CardTitle>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Clients are managed from Brain → Clients and are shared with Project Manager.
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <label className="grid gap-1">
                    <FieldLabel>Linked client</FieldLabel>
                    <Select
                      value={form.clientId || NONE}
                      onValueChange={(value) => {
                        const clientId = value === NONE ? "" : String(value ?? "");
                        updateForm("clientId", clientId);
                        updateForm("issueClientLogin", false);
                        updateForm("clientEmail", "");
                        updateForm("clientPhone", "");
                        updateForm("clientPassword", "");
                      }}
                    >
                      <SelectTrigger className="w-full rounded-md bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>No client linked</SelectItem>
                        {(clients.data ?? []).map((client) => (
                          <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  {clients.isError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      Could not load clients. Open Brain → Clients and try again.
                    </div>
                  ) : null}

                  {selectedClient ? (
                    <div className="rounded-md border border-border bg-background px-3 py-2.5 text-xs">
                      <p className="font-semibold text-foreground">{selectedClient.companyName}</p>
                      <p className="mt-1 text-muted-foreground">
                        {selectedClient.contactName || "No contact person"}
                        {selectedClient.email ? ` · ${selectedClient.email}` : ""}
                      </p>
                    </div>
                  ) : null}

                  {form.clientId ? (
                    <>
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={form.issueClientLogin}
                          onChange={(event) => updateForm("issueClientLogin", event.currentTarget.checked)}
                          className="size-4 rounded border-border"
                        />
                        Create or update client portal login
                      </label>

                      {form.issueClientLogin ? (
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Input
                            placeholder={selectedClient?.email || "Client email"}
                            value={form.clientEmail}
                            onChange={(event) => updateForm("clientEmail", event.currentTarget.value)}
                            className="rounded-md bg-background"
                          />
                          <Input
                            placeholder={selectedClient?.phone || "Client phone"}
                            value={form.clientPhone}
                            onChange={(event) => updateForm("clientPhone", event.currentTarget.value)}
                            className="rounded-md bg-background"
                          />
                          <Input
                            placeholder="Password (optional)"
                            value={form.clientPassword}
                            onChange={(event) => updateForm("clientPassword", event.currentTarget.value)}
                            className="rounded-md bg-background"
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}

        {error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {issuedCredentials ? "Close" : "Cancel"}
          </Button>
          {!issuedCredentials ? (
            <Button onClick={() => void submit()} disabled={createProject.isPending}>
              Create
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
