import { useMemo, useState } from "react";
import {
  Building2,
  Clock3,
  Copy,
  Crown,
  FlaskConical,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateMasterTesterAccount,
  usePlatformMasterTesterAccounts,
  usePlatformTesterOptions,
} from "../hooks/useTesterControl";

interface Props {
  showAlert?: (message: string, type?: "success" | "info" | "error") => void;
}

type MasterForm = {
  fullName: string;
  email: string;
  phone: string;
  businessId: string;
  password: string;
  notes: string;
};

const EMPTY_FORM: MasterForm = {
  fullName: "",
  email: "",
  phone: "",
  businessId: "",
  password: "",
  notes: "",
};

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

export default function PlatformMasterTesterPage({ showAlert }: Props) {
  const masters = usePlatformMasterTesterAccounts(true);
  const options = usePlatformTesterOptions(true);
  const createMaster = useCreateMasterTesterAccount();

  const [createOpen, setCreateOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState("");
  const [credentialPassword, setCredentialPassword] = useState("");
  const [form, setForm] = useState<MasterForm>(EMPTY_FORM);

  const businesses = useMemo(
    () => options.data?.businesses || [],
    [options.data?.businesses],
  );

  const notify = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    if (showAlert) showAlert(message, type);
    else if (type === "error") window.alert(message);
  };

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      businessId: businesses[0]?.id || "",
    });
    setCreateOpen(true);
  };

  const submit = async () => {
    if (form.fullName.trim().length < 2) {
      notify("Master Tester name is required.", "error");
      return;
    }
    if (!form.email.includes("@")) {
      notify("A valid Master Tester email is required.", "error");
      return;
    }
    if (!form.businessId) {
      notify("Select a business.", "error");
      return;
    }
    if (form.password && form.password.length < 10) {
      notify("Custom password must be at least 10 characters, or leave it blank to generate one.", "error");
      return;
    }

    try {
      const result: any = await createMaster.mutateAsync({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        businessId: form.businessId,
        password: form.password.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });

      setCreateOpen(false);
      setCredentialEmail(result?.tester?.user?.email || form.email.trim());
      setCredentialPassword(result?.temporaryPassword || form.password.trim());
      setCredentialsOpen(true);
      notify("Master Tester created.", "success");
    } catch (error: any) {
      notify(
        error?.response?.data?.message || "Could not create Master Tester.",
        "error",
      );
    }
  };

  const copyCredentials = async () => {
    const text = `Email: ${credentialEmail}\nPassword: ${credentialPassword}`;
    try {
      await navigator.clipboard.writeText(text);
      notify("Credentials copied.", "success");
    } catch {
      notify("Could not copy credentials automatically.", "error");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-black text-slate-950">
              Master Tester Management
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
              Platform Admin Only
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
            Create Master Tester identities for any active business. Master Testers
            can then create and manage Standard Tester accounts from Tester Control.
          </p>
        </div>

        <Button
          onClick={openCreate}
          disabled={options.isLoading || !businesses.length}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Create Master Tester
        </Button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
        <strong>Authority boundary:</strong> only a real Platform Super Admin can create
        Master Testers. Master Tester authority cannot call this endpoint. New Master
        Testers receive the selected business&apos;s normal Business Admin role for UI
        navigation, while their tester authority stays separate from normal RBAC.
      </div>

      {masters.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : masters.isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Could not load Master Tester accounts.
        </div>
      ) : (masters.data || []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <FlaskConical className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-700">No Master Testers yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Create the first Master Tester for an active business.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(masters.data || []).map((tester) => (
            <article
              key={tester.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                    <p className="truncate text-sm font-black text-slate-900">
                      {tester.user.fullName}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-slate-500">
                    {tester.user.email}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                    tester.user.status === "active"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tester.user.status}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                      Business
                    </p>
                    <p className="truncate text-xs font-bold text-slate-700">
                      {tester.user.business?.name || tester.user.businessId}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                      Authority
                    </p>
                    <p className="text-xs font-bold text-slate-700">Master Tester</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                      Last login
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {formatDate(tester.user.lastLoginAt)}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Master Tester</DialogTitle>
            <DialogDescription>
              The account gets Master Tester authority plus Business Admin navigation
              inside the selected business.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Full Name
              </label>
              <Input
                value={form.fullName}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setForm((current) => ({ ...current, fullName: value }));
                }}
                placeholder="Blih Master Tester"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Email
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setForm((current) => ({ ...current, email: value }));
                }}
                placeholder="master.tester@example.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Business
                </label>
                <Select
                  value={form.businessId}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, businessId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Phone (optional)
                </label>
                <Input
                  value={form.phone}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setForm((current) => ({ ...current, phone: value }));
                  }}
                  placeholder="+251..."
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Password (optional)
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setForm((current) => ({ ...current, password: value }));
                }}
                placeholder="Leave blank to generate a secure password"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                If blank, Blih generates a strong temporary password and shows it once.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">
                Notes (optional)
              </label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setForm((current) => ({ ...current, notes: value }));
                }}
                placeholder="Purpose of this Master Tester account"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void submit()}
                disabled={createMaster.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createMaster.isPending && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Create Master Tester
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Master Tester credentials</DialogTitle>
            <DialogDescription>
              Save these credentials now. The generated password is only returned at
              creation time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Email
              </p>
              <p className="mt-1 break-all text-sm font-bold text-slate-800">
                {credentialEmail}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Password
              </p>
              <p className="mt-1 break-all font-mono text-sm font-bold text-slate-800">
                {credentialPassword}
              </p>
            </div>

            <Button onClick={() => void copyCredentials()} className="w-full gap-2">
              <Copy className="h-4 w-4" /> Copy credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
