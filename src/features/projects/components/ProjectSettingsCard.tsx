import type { ReactNode } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeSelect } from "./EmployeeSelect";

const NONE = "No client linked";
const COMPANY_WIDE = "Whole company";

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

type Props = {
  project: any;
  settings: any;
  departments: any[];
  clients: any[];
  canUseClients: boolean;
  issuedCredentials: { email: string; password: string | null; portalUrl: string } | null;
  updateSetting: (key: string, value: unknown) => void;
  changeDepartment: (departmentId: string | null) => void;
  updateNewClientField: (
    stateKey: "clientCompanyName" | "clientContactName" | "clientEmail" | "clientPhone",
    clientKey: "companyName" | "contactName" | "email" | "phone",
    value: string,
  ) => void;
  save: () => void;
  saving: boolean;
};

export function ProjectSettingsCard({
  project,
  settings,
  departments,
  clients,
  canUseClients,
  issuedCredentials,
  updateSetting,
  changeDepartment,
  updateNewClientField,
  save,
  saving,
}: Props) {
  const departmentId = settings.departmentId !== undefined
    ? settings.departmentId
    : project.departmentId || null;

  return (
    <Card size="sm" className="rounded-md shadow-none ring-1 ring-border">
      <CardHeader className="border-b"><CardTitle>Settings</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <FieldLabel>Name</FieldLabel>
            <Input
              defaultValue={project.title}
              onChange={(event) => updateSetting("title", event.currentTarget.value)}
            />
          </label>

          <label className="grid gap-1">
            <FieldLabel>Priority</FieldLabel>
            <Select
              value={settings.priority ?? project.priority ?? "NORMAL"}
              onValueChange={(value) => updateSetting("priority", String(value ?? "NORMAL"))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["LOW", "NORMAL", "HIGH", "URGENT"].map((priority) => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-1 md:col-span-2">
            <FieldLabel>Department</FieldLabel>
            <Select
              value={departmentId || COMPANY_WIDE}
              onValueChange={(value) => changeDepartment(value === COMPANY_WIDE ? null : String(value ?? ""))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={COMPANY_WIDE}>Whole company</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>{department.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-[11px] text-muted-foreground">
              Department-scoped projects can only assign owners, managers, team members and task assignees from that department. Whole-company projects can use anyone.
            </span>
          </label>

          <label className="grid gap-1">
            <FieldLabel>Owner</FieldLabel>
            <EmployeeSelect
              value={settings.ownerEmployeeId ?? project.ownerEmployeeId ?? ""}
              onChange={(value) => updateSetting("ownerEmployeeId", value || null)}
              departmentId={departmentId}
              placeholder="Select owner"
            />
          </label>

          <label className="grid gap-1">
            <FieldLabel>Manager</FieldLabel>
            <EmployeeSelect
              value={settings.managerEmployeeId ?? project.managerEmployeeId ?? ""}
              onChange={(value) => updateSetting("managerEmployeeId", value || null)}
              departmentId={departmentId}
              placeholder="Select manager"
            />
          </label>
        </div>

        {canUseClients ? (
          <Card size="sm" className="rounded-md bg-muted/20 shadow-none ring-1 ring-border">
            <CardHeader className="pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>Client portal</CardTitle>
                  <p className="mt-1 text-[11px] text-muted-foreground">Shared with Brain → Clients</p>
                </div>
                <Tabs
                  value={settings.clientMode || "existing"}
                  onValueChange={(value) => updateSetting("clientMode", String(value ?? "existing"))}
                  className="gap-0"
                >
                  <TabsList className="h-7 rounded-md">
                    <TabsTrigger value="existing" className="rounded-sm px-2 text-xs">Existing client</TabsTrigger>
                    <TabsTrigger value="new" className="rounded-sm px-2 text-xs">New client</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {(settings.clientMode || "existing") === "existing" ? (
                <label className="grid gap-1">
                  <FieldLabel>Linked client</FieldLabel>
                  <Select
                    value={settings.clientId ?? project.clientId ?? NONE}
                    onValueChange={(value) => updateSetting("clientId", value === NONE ? null : value)}
                  >
                    <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No client linked</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.companyName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <FieldLabel>Company</FieldLabel>
                    <Input
                      value={settings.clientCompanyName || ""}
                      onChange={(event) => updateNewClientField("clientCompanyName", "companyName", event.currentTarget.value)}
                      className="bg-background"
                    />
                  </label>
                  <label className="grid gap-1">
                    <FieldLabel>Contact</FieldLabel>
                    <Input
                      value={settings.clientContactName || ""}
                      onChange={(event) => updateNewClientField("clientContactName", "contactName", event.currentTarget.value)}
                      className="bg-background"
                    />
                  </label>
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={Boolean(settings.issueClientLogin)}
                  onChange={(event) => updateSetting("issueClientLogin", event.currentTarget.checked)}
                  className="size-4 rounded border-border"
                />
                Create or reset client portal login
              </label>

              {settings.issueClientLogin ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    placeholder="Client email"
                    value={settings.clientEmail || ""}
                    onChange={(event) => updateNewClientField("clientEmail", "email", event.currentTarget.value)}
                    className="bg-background"
                  />
                  <Input
                    placeholder="Client phone"
                    value={settings.clientPhone || ""}
                    onChange={(event) => updateNewClientField("clientPhone", "phone", event.currentTarget.value)}
                    className="bg-background"
                  />
                  <Input
                    placeholder="New password"
                    value={settings.clientPassword || ""}
                    onChange={(event) => updateSetting("clientPassword", event.currentTarget.value)}
                    className="bg-background"
                  />
                </div>
              ) : null}

              {issuedCredentials ? (
                <div className="grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm sm:grid-cols-3">
                  <div><span className="text-xs text-emerald-700">Email</span><div className="text-emerald-900">{issuedCredentials.email}</div></div>
                  <div><span className="text-xs text-emerald-700">Password</span><div className="text-emerald-900">{issuedCredentials.password || "Existing password"}</div></div>
                  <div><span className="text-xs text-emerald-700">Login URL</span><div className="truncate text-emerald-900">{issuedCredentials.portalUrl}</div></div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="flex justify-end">
          <Button size="sm" onClick={save} disabled={saving}><Save />Save changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}
