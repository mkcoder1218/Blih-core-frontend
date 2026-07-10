import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, KeyRound, Mail, PlugZap, ShieldCheck } from "lucide-react";
import { smtpApi, type BusinessSmtpPayload, type SmtpProvider } from "../../api/smtp";

type Props = {
  businessId?: string;
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

const emptyDraft: BusinessSmtpPayload = {
  providerId: "",
  senderEmail: "",
  smtpUsername: "",
  smtpPassword: "",
  appPassword: "",
  senderName: "",
  isActive: false,
  testRecipientEmail: "",
};

export default function BusinessSmtpSettingsPanel({ businessId, showAlert }: Props) {
  const qc = useQueryClient();
  const providersQuery = useQuery({ queryKey: ["smtp-providers-active"], queryFn: () => smtpApi.providers(false) });
  const settingsQuery = useQuery({ queryKey: ["business-smtp-settings", businessId || "me"], queryFn: () => smtpApi.businessSettings(businessId) });
  const [draft, setDraft] = React.useState<BusinessSmtpPayload>(emptyDraft);

  React.useEffect(() => {
    const s = settingsQuery.data;
    if (!s) return;
    setDraft((prev) => ({
      ...prev,
      providerId: s.providerId || "",
      senderName: s.senderName || "",
      isActive: Boolean(s.isActive),
      senderEmail: "",
      smtpUsername: "",
      smtpPassword: "",
      appPassword: "",
      testRecipientEmail: "",
    }));
  }, [settingsQuery.data?.id, settingsQuery.data?.updatedAt]);

  const selectedProvider = providersQuery.data?.find((p) => p.id === draft.providerId) || settingsQuery.data?.provider || null;
  const passwordLabel = selectedProvider?.appPasswordRequired ? "Application Password" : "SMTP Password";
  const passwordValue = selectedProvider?.appPasswordRequired ? draft.appPassword : draft.smtpPassword;
  const canSave = Boolean(draft.providerId && draft.senderEmail && draft.senderName && draft.smtpUsername && passwordValue);
  const canTest = Boolean(canSave && draft.testRecipientEmail);
  const isHostinger = Boolean(selectedProvider?.name?.toLowerCase().includes("hostinger") || selectedProvider?.smtpHost?.toLowerCase().includes("hostinger"));

  const save = useMutation({
    mutationFn: () => smtpApi.saveBusinessSettings(draft, businessId),
    onSuccess: async () => {
      showAlert("SMTP settings saved.", "success");
      await qc.invalidateQueries({ queryKey: ["business-smtp-settings", businessId || "me"] });
    },
    onError: (e: any) => showAlert(e?.response?.data?.message || "Failed to save SMTP settings.", "error"),
  });

  const test = useMutation({
    mutationFn: () => smtpApi.testBusinessSettings(draft, businessId),
    onSuccess: () => showAlert("SMTP test email sent.", "success"),
    onError: (e: any) => showAlert(e?.response?.data?.message || "SMTP connection test failed.", "error"),
  });

  const update = (key: keyof BusinessSmtpPayload, value: any) => setDraft((prev) => {
    const next = { ...prev, [key]: value };
    if (key === "senderEmail" && !prev.smtpUsername) next.smtpUsername = value;
    return next;
  });

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="p-5 pb-0">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Email delivery</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">SMTP Settings</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Choose a platform-approved provider and enter only this business account's credentials.</p>
        </div>
        {settingsQuery.data?.lastTestStatus === "success" && (
          <span className="m-5 mb-0 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle className="h-3.5 w-3.5" /> Tested
          </span>
        )}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {(save.isError || test.isError) && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {(save.error as any)?.response?.data?.message || (test.error as any)?.response?.data?.message || "SMTP action failed."}
            </div>
          )}
          {(save.isSuccess || test.isSuccess) && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              {test.isSuccess ? "SMTP test email sent." : "SMTP settings saved."}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <InputField label="Sender email" type="email" value={draft.senderEmail} onChange={(value) => update("senderEmail", value)} placeholder={settingsQuery.data?.maskedSenderEmail || "admin@business.com"} />
            <InputField label="Sender name" value={draft.senderName} onChange={(value) => update("senderName", value)} placeholder="HR Team" />
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email provider</span>
              <select value={draft.providerId} onChange={(e) => update("providerId", e.currentTarget.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <option value="">Select provider...</option>
                {(providersQuery.data || []).map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
              </select>
            </label>
            <InputField label="SMTP username" value={draft.smtpUsername} onChange={(value) => update("smtpUsername", value)} placeholder={settingsQuery.data?.maskedSmtpUsername || "Usually the email address"} />
            {isHostinger && (
              <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
                For Hostinger, use the full mailbox email address as the SMTP username and the mailbox password from Hostinger Email Accounts.
              </div>
            )}
            <div className="sm:col-span-2">
              <InputField label={passwordLabel} type="password" value={passwordValue || ""} onChange={(value) => update(selectedProvider?.appPasswordRequired ? "appPassword" : "smtpPassword", value)} placeholder={settingsQuery.data?.hasPassword ? "Enter new password to replace" : "Required"} />
            </div>
            <div className="sm:col-span-2">
              <InputField label="Send test email to" type="email" value={draft.testRecipientEmail || ""} onChange={(value) => update("testRecipientEmail", value)} placeholder="you@example.com" />
              <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">The test button sends a real email to this address using the settings above.</p>
            </div>
          </div>

          <label className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-4 text-xs font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <span>
              <span className="block">Activate SMTP configuration</span>
              <span className="mt-1 block font-medium leading-5 text-slate-500 dark:text-slate-400">Use this business account when sending interview, onboarding and offer emails.</span>
            </span>
            <input type="checkbox" checked={draft.isActive} onChange={(e) => update("isActive", e.currentTarget.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
          </label>
        </div>

        {selectedProvider ? <ProviderSummary provider={selectedProvider} /> : null}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
        <button type="button" disabled={test.isPending || !canTest} onClick={() => test.mutate()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900">
          <PlugZap className="h-4 w-4" /> {test.isPending ? "Sending..." : "Send Test Email"}
        </button>
        <button type="button" disabled={save.isPending || !canSave} onClick={() => save.mutate()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
          <ShieldCheck className="h-4 w-4" /> {save.isPending ? "Saving..." : "Save SMTP Settings"}
        </button>
      </div>
    </section>
  );
}

function ProviderSummary({ provider }: { provider: SmtpProvider | null }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><Mail className="h-4 w-4 text-blue-600" /> {provider.name}</div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Info label="Host" value={provider.smtpHost} />
        <Info label="Port" value={String(provider.smtpPort)} />
        <Info label="Encryption" value={provider.encryptionType} />
        <Info label="Secure" value={provider.secureConnection ? "Yes" : "No"} />
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <KeyRound className="h-4 w-4 text-amber-600" />
        {provider.appPasswordRequired ? "Application password required" : "Standard SMTP password allowed"}
      </div>
      {provider.instructions && <p className="whitespace-pre-line text-xs leading-5 text-slate-500 dark:text-slate-400">{provider.instructions}</p>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white p-3 dark:bg-slate-950"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-words font-bold text-slate-800 dark:text-slate-100">{value}</p></div>;
}

function InputField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.currentTarget.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
    </label>
  );
}
