import { useMemo, useState } from "react";
import {
  Building2,
  Clock3,
  FlaskConical,
  KeyRound,
  Loader2,
  Plus,
  ShieldCheck,
  TestTube2,
  UserCog,
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
import { Textarea } from "@/components/ui/textarea";
import type { TesterAccountView, TesterRole } from "../api/tester";
import {
  useCreateTesterAccount,
  useResetTesterPassword,
  useTesterAccounts,
  useTesterOptions,
  useTesterSession,
  useUpdateTesterAccount,
} from "../hooks/useTesterControl";

interface Props {
  showAlert?: (message: string, type?: "success" | "info" | "error") => void;
}

type TesterForm = {
  fullName: string;
  email: string;
  phone: string;
  businessId: string;
  roleKeys: string[];
  notes: string;
};

const EMPTY_FORM: TesterForm = {
  fullName: "",
  email: "",
  phone: "",
  businessId: "",
  roleKeys: [],
  notes: "",
};

function roleLabel(role: TesterRole) {
  return role.name || role.key.replace(/_/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

function StatusPill({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
}

function TestBadge({ master = false }: { master?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
      <TestTube2 className="h-3 w-3" />
      {master ? "Master Test Account" : "Test Account"}
    </span>
  );
}

export default function TesterControlPage({ showAlert }: Props) {
  const session = useTesterSession();
  const isTester = Boolean(session.data?.isTestAccount);
  const isMaster = Boolean(session.data?.isMasterTester);

  const accounts = useTesterAccounts(isTester);
  const options = useTesterOptions(isTester);
  const createTester = useCreateTesterAccount();
  const updateTester = useUpdateTesterAccount();
  const resetPassword = useResetTesterPassword();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TesterAccountView | null>(null);
  const [form, setForm] = useState<TesterForm>(EMPTY_FORM);
  const [credentialOpen, setCredentialOpen] = useState(false);
  const [credentialEmail, setCredentialEmail] = useState("");
  const [credentialPassword, setCredentialPassword] = useState("");

  const notify = (message: string, type: "success" | "info" | "error" = "success") => {
    if (showAlert) showAlert(message, type);
    else if (type === "error") window.alert(message);
  };

  const availableRoles = useMemo(() => {
    if (!form.businessId) return [];
    return (options.data?.roles || []).filter(
      (role) => !role.businessId || role.businessId === form.businessId,
    );
  }, [form.businessId, options.data?.roles]);

  const openCreate = () => {
    const firstBusiness = options.data?.businesses?.[0];
    setForm({
      ...EMPTY_FORM,
      businessId: firstBusiness?.id || "",
    });
    setCreateOpen(true);
  };

  const openEdit = (tester: TesterAccountView) => {
    setForm({
      fullName: tester.user.fullName,
      email: tester.user.email,
      phone: tester.user.phone || "",
      businessId: tester.user.businessId,
      roleKeys: tester.user.roles.map((role) => role.key),
      notes: tester.notes || "",
    });
    setEditTarget(tester);
  };

  const toggleRole = (key: string) => {
    setForm((current) => ({
      ...current,
      roleKeys: current.roleKeys.includes(key)
        ? current.roleKeys.filter((item) => item !== key)
        : [...current.roleKeys, key],
    }));
  };

  const validate = () => {
    if (form.fullName.trim().length < 2) return "Tester name is required.";
    if (!form.email.includes("@")) return "A valid tester email is required.";
    if (!form.businessId) return "Select a business.";
    if (!form.roleKeys.length) return "Assign at least one role.";
    return null;
  };

  const submitCreate = async () => {
    const error = validate();
    if (error) {
      notify(error, "error");
      return;
    }

    try {
      const result: any = await createTester.mutateAsync({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        businessId: form.businessId,
        roleKeys: form.roleKeys,
        notes: form.notes.trim() || undefined,
      });
      const created = result?.tester;
      setCreateOpen(false);
      setCredentialEmail(created?.user?.email || form.email.trim());
      setCredentialPassword(result?.temporaryPassword || "");
      setCredentialOpen(Boolean(result?.temporaryPassword));
      notify("Tester account created.", "success");
    } catch (error: any) {
      notify(error?.response?.data?.message || "Could not create tester account.", "error");
    }
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    const error = validate();
    if (error) {
      notify(error, "error");
      return;
    }

    try {
      await updateTester.mutateAsync({
        userId: editTarget.userId,
        payload: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          businessId: form.businessId,
          roleKeys: form.roleKeys,
          notes: form.notes.trim(),
        },
      });
      setEditTarget(null);
      notify("Tester account updated.", "success");
    } catch (error: any) {
      notify(error?.response?.data?.message || "Could not update tester account.", "error");
    }
  };

  const toggleStatus = async (tester: TesterAccountView) => {
    try {
      await updateTester.mutateAsync({
        userId: tester.userId,
        payload: {
          status: tester.user.status === "active" ? "disabled" : "active",
        },
      });
      notify(
        tester.user.status === "active"
          ? "Tester account disabled."
          : "Tester account activated.",
        "success",
      );
    } catch (error: any) {
      notify(error?.response?.data?.message || "Could not change tester status.", "error");
    }
  };

  const resetTesterPassword = async (tester: TesterAccountView) => {
    if (!window.confirm(`Generate a new password for ${tester.user.fullName}?`)) return;
    try {
      const result: any = await resetPassword.mutateAsync({ userId: tester.userId });
      setCredentialEmail(tester.user.email);
      setCredentialPassword(result?.temporaryPassword || "");
      setCredentialOpen(Boolean(result?.temporaryPassword));
      notify("Tester password reset.", "success");
    } catch (error: any) {
      notify(error?.response?.data?.message || "Could not reset tester password.", "error");
    }
  };

  if (session.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-2 text-sm font-semibold text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Checking tester access...
      </div>
    );
  }

  if (!isTester) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-9 w-9 text-slate-300" />
        <h1 className="mt-3 text-lg font-black text-slate-900">Tester access only</h1>
        <p className="mt-1 text-sm text-slate-500">
          This page is intentionally hidden from normal Blih users.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <FlaskConical className="h-5 w-5 text-blue-600" />
            <h1 className="text-xl font-black text-slate-950">Tester Control Center</h1>
            <TestBadge master={isMaster} />
          </div>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {isMaster
              ? "Create tester identities and switch their business and real Blih roles without changing normal RBAC."
              : "Your current tester configuration is read-only. The Master Tester controls business and role assignment."}
          </p>
        </div>

        {isMaster && (
          <Button onClick={openCreate} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Create Tester
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
        <strong>Production safety:</strong> tester activity is audit-flagged. Destructive and high-risk production operations are blocked for TEST ACCOUNT identities, while normal workflow testing remains available.
      </div>

      {accounts.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : accounts.isError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Could not load tester accounts.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {(accounts.data || []).map((tester) => {
            const master = tester.testerLevel === "MASTER";
            return (
              <article key={tester.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-black text-slate-900">{tester.user.fullName}</p>
                      <TestBadge master={master} />
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">{tester.user.email}</p>
                  </div>
                  <StatusPill status={tester.user.status} />
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Business</p>
                      <p className="truncate text-xs font-bold text-slate-700">
                        {tester.user.business?.name || tester.user.businessId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <UserCog className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Roles</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {tester.user.roles.length ? (
                          tester.user.roles.map((role) => (
                            <span key={role.id} className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                              {roleLabel(role)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">No normal role assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Last login</p>
                      <p className="text-xs font-bold text-slate-700">{formatDate(tester.user.lastLoginAt)}</p>
                    </div>
                  </div>
                </div>

                {isMaster && !master && (
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                    <Button size="sm" variant="outline" onClick={() => openEdit(tester)}>
                      Edit roles
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void resetTesterPassword(tester)}>
                      <KeyRound className="mr-1 h-3.5 w-3.5" /> Reset password
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`col-span-2 ${tester.user.status === "active" ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"}`}
                      onClick={() => void toggleStatus(tester)}
                    >
                      {tester.user.status === "active" ? "Disable tester" : "Activate tester"}
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <TesterFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create tester account"
        description="The tester receives a real Blih role inside the selected business, but remains excluded from normal employee directories and reporting."
        form={form}
        setForm={setForm}
        businesses={options.data?.businesses || []}
        roles={availableRoles}
        toggleRole={toggleRole}
        submitLabel="Create Tester"
        pending={createTester.isPending}
        onSubmit={() => void submitCreate()}
      />

      <TesterFormDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title="Edit tester assignment"
        description="Changing business clears the tester's old department/position assignment. Select roles valid for the new business."
        form={form}
        setForm={setForm}
        businesses={options.data?.businesses || []}
        roles={availableRoles}
        toggleRole={toggleRole}
        submitLabel="Save Changes"
        pending={updateTester.isPending}
        onSubmit={() => void submitEdit()}
      />

      <Dialog open={credentialOpen} onOpenChange={setCredentialOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tester credentials</DialogTitle>
            <DialogDescription>
              This generated password is returned for the Master Tester to share securely with the tester.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Email</label>
              <Input readOnly value={credentialEmail} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Temporary password</label>
              <Input readOnly value={credentialPassword} className="font-mono" />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                void navigator.clipboard?.writeText(`${credentialEmail}\n${credentialPassword}`);
                notify("Tester credentials copied.", "success");
              }}
            >
              Copy credentials
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TesterFormDialog({
  open,
  onOpenChange,
  title,
  description,
  form,
  setForm,
  businesses,
  roles,
  toggleRole,
  submitLabel,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  form: TesterForm;
  setForm: React.Dispatch<React.SetStateAction<TesterForm>>;
  businesses: Array<{ id: string; name: string }>;
  roles: TesterRole[];
  toggleRole: (key: string) => void;
  submitLabel: string;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Name</label>
              <Input
                value={form.fullName}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setForm((current) => ({ ...current, fullName: value }));
                }}
                placeholder="Tester name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  setForm((current) => ({ ...current, email: value }));
                }}
                placeholder="tester@example.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Phone (optional)</label>
            <Input
              value={form.phone}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setForm((current) => ({ ...current, phone: value }));
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Business</label>
            <select
              value={form.businessId}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setForm((current) => ({ ...current, businessId: value, roleKeys: [] }));
              }}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Select business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Roles</label>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {roles.length ? (
                roles.map((role) => (
                  <label
                    key={`${role.businessId || "system"}:${role.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.roleKeys.includes(role.key)}
                      onChange={() => toggleRole(role.key)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700">{roleLabel(role)}</p>
                      <p className="truncate text-[10px] text-slate-400">{role.key}</p>
                    </div>
                  </label>
                ))
              ) : (
                <p className="px-3 py-5 text-center text-xs font-semibold text-slate-400">
                  Select a business to load available roles.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">Notes (optional)</label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setForm((current) => ({ ...current, notes: value }));
              }}
              placeholder="What this tester account is intended to test..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={pending} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
