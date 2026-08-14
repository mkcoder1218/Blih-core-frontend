import {
  useDeferredValue,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  createCompanyClient,
  listCompanyClientsPage,
  type ClientStatus,
  type CreateCompanyClientInput,
} from "../../api/clients";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 20;
const ALL_STATUSES = "__all__";

const EMPTY_FORM: CreateCompanyClientInput = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  industry: "",
  status: "active",
};

function requestErrorMessage(error: unknown) {
  return (
    (error as any)?.response?.data?.message ||
    (error as Error | undefined)?.message ||
    "Could not complete the client request."
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold text-muted-foreground">
      {children}
    </span>
  );
}

function ClientStatusBadge({ status }: { status?: string | null }) {
  const active = status !== "inactive";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-slate-500/10 text-slate-500"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function BrainClientsTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientStatus | typeof ALL_STATUSES>(
    ALL_STATUSES,
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateCompanyClientInput>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  const clientsQuery = useQuery({
    queryKey: ["brain-clients", page, deferredSearch, status],
    queryFn: () =>
      listCompanyClientsPage({
        page,
        size: PAGE_SIZE,
        search: deferredSearch || undefined,
        status: status === ALL_STATUSES ? undefined : status,
      }),
  });

  const createMutation = useMutation({
    mutationFn: createCompanyClient,
    onSuccess: async () => {
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setFormError("");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["brain-clients"] }),
        queryClient.invalidateQueries({ queryKey: ["shared-clients"] }),
      ]);
    },
  });

  const rows = clientsQuery.data?.rows || [];
  const count = clientsQuery.data?.count || 0;
  const pages = Math.max(clientsQuery.data?.pages || 1, 1);

  const updateForm = (key: keyof CreateCompanyClientInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitClient = async () => {
    const companyName = String(form.companyName || "").trim();

    if (companyName.length < 2) {
      setFormError("Company name must contain at least 2 characters.");
      return;
    }

    setFormError("");

    try {
      await createMutation.mutateAsync({
        companyName,
        contactName: form.contactName?.trim() || undefined,
        email: form.email?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        industry: form.industry?.trim() || undefined,
        status: form.status || "active",
      });
    } catch (error) {
      setFormError(requestErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5 text-foreground">
      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">
                  Clients
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  Business Admin & Project Manager
                </span>
              </div>

              <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-muted-foreground">
                Keep one company client directory and reuse the same clients when creating projects.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Clients
              </p>
              <p className="text-sm font-extrabold">{count}</p>
            </div>

            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setForm(EMPTY_FORM);
                setFormError("");
                setCreateOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New client
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <label className="relative block min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search company, contact, email, phone or industry..."
              className="h-10 rounded-xl pl-9"
            />
          </label>

          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(
                String(value || ALL_STATUSES) as
                  | ClientStatus
                  | typeof ALL_STATUSES,
              )
            }
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {clientsQuery.isLoading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs font-semibold">Loading clients...</p>
          </div>
        ) : clientsQuery.isError ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs font-medium text-destructive">
              {requestErrorMessage(clientsQuery.error)}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-sm font-extrabold">
              {deferredSearch ? "No matching clients" : "No clients yet"}
            </h2>
            <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
              {deferredSearch
                ? "Try another search term or status."
                : "Create the first client here. It will immediately become available in Project Manager."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 sm:px-6">Company</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Industry</th>
                  <th className="px-4 py-3">Account manager</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((client) => (
                  <tr key={client.id} className="transition hover:bg-muted/25">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-foreground">
                            {client.companyName}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                            {client.email ? (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </span>
                            ) : null}
                            {client.phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5" />
                        {client.contactName || "Not set"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <BriefcaseBusiness className="h-3.5 w-3.5" />
                        {client.industry || "Not set"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {client.accountManager?.fullName || "Not assigned"}
                    </td>
                    <td className="px-4 py-4">
                      <ClientStatusBadge status={client.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 ? (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 sm:px-6">
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <span className="text-[10px] font-bold text-muted-foreground">
              Page {page} of {pages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              disabled={page >= pages}
              onClick={() => setPage((current) => Math.min(current + 1, pages))}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : null}
      </section>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setFormError("");
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Create client</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-1 sm:grid-cols-2">
            <label className="grid gap-1.5 sm:col-span-2">
              <FieldLabel>Company name *</FieldLabel>
              <Input
                autoFocus
                value={form.companyName}
                onChange={(event) =>
                  updateForm("companyName", event.currentTarget.value)
                }
                placeholder="Acme PLC"
                className="rounded-xl"
              />
            </label>

            <label className="grid gap-1.5">
              <FieldLabel>Contact person</FieldLabel>
              <Input
                value={form.contactName || ""}
                onChange={(event) =>
                  updateForm("contactName", event.currentTarget.value)
                }
                placeholder="Full name"
                className="rounded-xl"
              />
            </label>

            <label className="grid gap-1.5">
              <FieldLabel>Industry</FieldLabel>
              <Input
                value={form.industry || ""}
                onChange={(event) =>
                  updateForm("industry", event.currentTarget.value)
                }
                placeholder="Technology"
                className="rounded-xl"
              />
            </label>

            <label className="grid gap-1.5">
              <FieldLabel>Email</FieldLabel>
              <Input
                type="email"
                value={form.email || ""}
                onChange={(event) => updateForm("email", event.currentTarget.value)}
                placeholder="contact@company.com"
                className="rounded-xl"
              />
            </label>

            <label className="grid gap-1.5">
              <FieldLabel>Phone</FieldLabel>
              <Input
                value={form.phone || ""}
                onChange={(event) => updateForm("phone", event.currentTarget.value)}
                placeholder="+251..."
                className="rounded-xl"
              />
            </label>
          </div>

          {formError ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs font-medium text-destructive">
              {formError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void submitClient()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
