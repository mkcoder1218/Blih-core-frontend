import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, MailPlus, Plus, Trash2 } from "lucide-react";
import { smtpApi, type SmtpProvider } from "../../api/smtp";

type Props = { showAlert: (msg: string, type?: "success" | "info" | "error") => void };

const blank = {
  name: "",
  smtpHost: "",
  smtpPort: 587,
  encryptionType: "STARTTLS",
  secureConnection: false,
  isActive: true,
  appPasswordRequired: false,
  instructions: "",
};

export default function SmtpProvidersTab({ showAlert }: Props) {
  const qc = useQueryClient();
  const providers = useQuery({ queryKey: ["smtp-providers-all"], queryFn: () => smtpApi.providers(true) });
  const [draft, setDraft] = React.useState<typeof blank & { id?: string }>(blank);

  const save = useMutation({
    mutationFn: () => draft.id ? smtpApi.updateProvider({ id: draft.id, payload: draft }) : smtpApi.createProvider(draft),
    onSuccess: async () => {
      showAlert("SMTP provider saved.", "success");
      setDraft(blank);
      await qc.invalidateQueries({ queryKey: ["smtp-providers-all"] });
      await qc.invalidateQueries({ queryKey: ["smtp-providers-active"] });
    },
    onError: (e: any) => showAlert(e?.response?.data?.message || "Failed to save SMTP provider.", "error"),
  });

  const remove = useMutation({
    mutationFn: smtpApi.deleteProvider,
    onSuccess: async () => {
      showAlert("SMTP provider deleted.", "success");
      await qc.invalidateQueries({ queryKey: ["smtp-providers-all"] });
      await qc.invalidateQueries({ queryKey: ["smtp-providers-active"] });
    },
    onError: (e: any) => showAlert(e?.response?.data?.message || "Failed to delete SMTP provider.", "error"),
  });

  const update = (key: keyof typeof blank, value: any) => setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Platform email</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-950">SMTP Providers</h1>
        <p className="mt-1 text-sm text-slate-500">Create reusable provider configurations for every business tenant.</p>
      </div>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-950">{draft.id ? "Edit Provider" : "New Provider"}</h2>
            {draft.id && <button type="button" onClick={() => setDraft(blank)} className="text-xs font-bold text-blue-600">New</button>}
          </div>
          <Field label="Provider name" value={draft.name} onChange={(v) => update("name", v)} placeholder="Hostinger" required />
          <Field label="SMTP host" value={draft.smtpHost} onChange={(v) => update("smtpHost", v)} placeholder="smtp.hostinger.com" required />
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Port</span>
              <input type="number" value={draft.smtpPort} onChange={(e) => update("smtpPort", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Encryption</span>
              <select value={draft.encryptionType} onChange={(e) => update("encryptionType", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white">
                <option>STARTTLS</option>
                <option>SSL/TLS</option>
                <option>NONE</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-700">
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.secureConnection} onChange={(e) => update("secureConnection", e.target.checked)} /> Secure connection</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={draft.isActive} onChange={(e) => update("isActive", e.target.checked)} /> Active</label>
            <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={draft.appPasswordRequired} onChange={(e) => update("appPasswordRequired", e.target.checked)} /> Application password required</label>
          </div>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Provider instructions</span>
            <textarea value={draft.instructions || ""} onChange={(e) => update("instructions", e.target.value)} rows={4} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white" />
          </label>
          <button disabled={save.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {draft.id ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {save.isPending ? "Saving..." : "Save Provider"}
          </button>
        </form>

        <div className="space-y-3">
          {providers.isLoading && <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Loading providers...</div>}
          {(providers.data || []).map((provider: SmtpProvider) => (
            <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><MailPlus className="h-4 w-4 text-blue-600" /><h3 className="font-bold text-slate-950">{provider.name}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${provider.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{provider.isActive ? "Active" : "Inactive"}</span></div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{provider.smtpHost}:{provider.smtpPort} / {provider.encryptionType} / secure {provider.secureConnection ? "on" : "off"}</p>
                  {provider.instructions && <p className="mt-3 whitespace-pre-line text-xs leading-5 text-slate-500">{provider.instructions}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDraft(provider)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><Edit2 className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove.mutate(provider.id)} className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </article>
          ))}
          {!providers.isLoading && !providers.data?.length && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No SMTP providers configured yet.</div>}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return <label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span><input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white" /></label>;
}
