import { useState } from "react";
import { Building2, Globe2, Save, ShieldCheck } from "lucide-react";

type Props = {
  showAlert: (msg: string, type?: "success" | "info" | "error") => void;
};

export default function GeneralSettingsTab({ showAlert }: Props) {
  const [companyName, setCompanyName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [publicRegistration, setPublicRegistration] = useState(false);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_.75fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-950 dark:text-white">Business Profile</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Company name" value={companyName} onChange={setCompanyName} placeholder="Your business name" />
          <Field label="Reply-to email" type="email" value={replyTo} onChange={setReplyTo} placeholder="hr@business.com" />
          <label className="space-y-1 sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Default timezone</span>
            <select value={timezone} onChange={(e) => setTimezone(e.currentTarget.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="Africa/Nairobi">Africa/Nairobi</option>
              <option value="Africa/Addis_Ababa">Africa/Addis Ababa</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" onClick={() => showAlert("General settings saved.", "success")} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700">
            <Save className="h-4 w-4" /> Save General Settings
          </button>
        </div>
      </section>

      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">Access</h2>
          </div>
          <label className="mt-5 flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
            <span>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-100">Public registration</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">Allow candidates or employees to register from public links.</span>
            </span>
            <input type="checkbox" checked={publicRegistration} onChange={(e) => setPublicRegistration(e.currentTarget.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-950 dark:text-white">Regional Defaults</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <Info label="Timezone" value={timezone} />
            <Info label="Language" value="English" />
          </div>
        </section>

      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="space-y-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.currentTarget.value)} placeholder={placeholder} className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-800 dark:text-slate-100">{value}</p></div>;
}
